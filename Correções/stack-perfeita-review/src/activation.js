/**
 * Stack Perfeita MCP — Project Activation
 * activate_project MCP tool registration.
 * Builds a complete project manifest: stack, rules, skills, state, fingerprint.
 */

import { z } from "zod";
import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { RULES_DIR, RULE_DESCRIPTIONS } from "./config.js";
import { loadState } from "./project-state.js";
import { rateLimiter } from "./rate-limiter.js";
import { readFile } from "./helpers.js";

function generateFingerprint(projectRoot, rulesDir, skillsDir) {
  const parts = [];

  const pkgPath = resolve(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      parts.push(pkg.name || "", pkg.version || "");
      if (pkg.dependencies) parts.push(Object.keys(pkg.dependencies).sort().join(","));
      if (pkg.devDependencies) parts.push(Object.keys(pkg.devDependencies).sort().join(","));
    } catch {
      // ignore malformed package.json
    }
  }

  if (existsSync(rulesDir)) {
    try {
      const rules = readdirSync(rulesDir).filter((file) => file.endsWith(".md")).sort();
      parts.push(rules.join(","));
    } catch {
      // ignore rule listing errors
    }
  }

  if (existsSync(skillsDir)) {
    try {
      const skills = readdirSync(skillsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
      parts.push(skills.join(","));
    } catch {
      // ignore skill listing errors
    }
  }

  const raw = parts.join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

function readPackageJson(projectRoot) {
  const pkgPath = resolve(projectRoot, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return null;
  }
}

function parseSkillFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    frontmatter[key] = value;
  }
  return frontmatter;
}

export function registerActivationTools(server) {
  server.tool(
    "activate_project",
    "Builds a project manifest in one call: stack summary, available rules, skills, state snapshot, and cache strategy. Use at session start.",
    {
      project_root: z.string().optional().describe("Absolute path to the project root. Defaults to current working directory."),
    },
    async ({ project_root }) => {
      const rateLimitHit = rateLimiter.check("activate_project");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const root = project_root ? resolve(project_root) : process.cwd();
      const rulesDir = project_root ? resolve(root, "ai-rules") : RULES_DIR;
      const skillsDir = resolve(root, ".claude", "skills");
      const stateFile = resolve(root, ".claude", "project_state.json");

      const pkg = readPackageJson(root);
      const fingerprint = generateFingerprint(root, rulesDir, skillsDir);

      const stackLines = [];
      if (pkg) {
        const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
        const devDeps = pkg.devDependencies ? Object.keys(pkg.devDependencies) : [];
        const scripts = pkg.scripts ? Object.keys(pkg.scripts) : [];

        stackLines.push(`- Name: ${pkg.name || "(unnamed)"}`);
        stackLines.push(`- Version: ${pkg.version || "0.0.0"}`);
        if (deps.length) stackLines.push(`- Dependencies (${deps.length}): ${deps.slice(0, 10).join(", ")}${deps.length > 10 ? "..." : ""}`);
        if (devDeps.length) stackLines.push(`- DevDependencies (${devDeps.length}): ${devDeps.slice(0, 8).join(", ")}${devDeps.length > 8 ? "..." : ""}`);
        if (scripts.length) stackLines.push(`- Scripts: ${scripts.join(", ")}`);
      } else {
        stackLines.push("- No package.json found");
      }

      const rulesLines = [];
      if (existsSync(rulesDir)) {
        try {
          const ruleFiles = readdirSync(rulesDir).filter((file) => file.endsWith(".md")).sort();
          for (const file of ruleFiles) {
            const description = RULE_DESCRIPTIONS[file] || "Custom rule file";
            rulesLines.push(`- ${file}: ${description}`);
          }
        } catch {
          rulesLines.push("- Could not read ai-rules directory");
        }
      } else {
        rulesLines.push("- No ai-rules/ directory found");
      }

      const skillsLines = [];
      if (existsSync(skillsDir)) {
        try {
          const dirs = readdirSync(skillsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort();

          for (const dir of dirs) {
            const skillPath = join(skillsDir, dir, "SKILL.md");
            if (!existsSync(skillPath)) continue;
            const content = readFile(skillPath);
            const frontmatter = content ? parseSkillFrontmatter(content) : {};
            skillsLines.push(`- ${frontmatter.name || dir}: ${frontmatter.description || "No description"}`);
          }
        } catch {
          skillsLines.push("- Could not read .claude/skills directory");
        }
      } else {
        skillsLines.push("- No .claude/skills/ directory found");
      }

      const state = loadState(stateFile);
      const stateLines = [
        `- Objective: ${state.objective || "(not set)"}`,
        `- Checkpoints: ${state.checkpoints?.length || 0}`,
      ];
      if (state.next_steps?.length) stateLines.push(`- Next steps: ${state.next_steps.join(", ")}`);
      if (state.decisions?.length) stateLines.push(`- Recent decisions: ${state.decisions.slice(-3).join(", ")}`);
      if (state.open_questions?.length) stateLines.push(`- Open questions: ${state.open_questions.length}`);
      if (state.risks?.length) stateLines.push(`- Risks: ${state.risks.length}`);

      const manifest = [
        `## Project Activated: ${pkg?.name || root}`,
        `- Root: ${root}`,
        `- Fingerprint: ${fingerprint}`,
        "",
        "### Stack",
        ...stackLines,
        "",
        `### Rules (${rulesLines.length})`,
        ...rulesLines,
        "",
        `### Skills (${skillsLines.length})`,
        ...skillsLines,
        "",
        "### State",
        ...stateLines,
        "",
        "### Recommended sequence",
        "- Call get_model_profile(<provider>) once",
        "- Call get_rules_bundle('index') as stable prefix",
        "- Load only the rule needed with get_rules(topic)",
        "- Use list_checkpoints() before resume_task(label) when resuming older work",
        "- Before final code: validate_bad_code; before final prose: validate_response_style",
        "",
        "### Cache strategy",
        "- Static: rules bundle, model profile, stable project manifest",
        "- Volatile: project state, observations, diffs, logs",
        "- Prefer compaction for logs/diffs instead of carrying raw output forward",
      ];

      return {
        content: [{ type: "text", text: manifest.join("\n") }],
      };
    }
  );
}
