/**
 * Stack Perfeita MCP — Project Activation
 * activate_project MCP tool registration.
 * Builds a complete project manifest: stack, rules, skills, state, fingerprint.
 */

import { z } from "zod";
import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { RULES_DIR, RULE_DESCRIPTIONS, SKILLS_DIR } from "./config.js";
import { loadState } from "./project-state.js";
import { rateLimiter } from "./rate-limiter.js";
import { readFile } from "./helpers.js";

/**
 * Generate a simple fingerprint hash from key project files.
 */
function generateFingerprint(projectRoot) {
  const parts = [];

  // Hash package.json
  const pkgPath = resolve(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      parts.push(pkg.name || "", pkg.version || "");
      if (pkg.dependencies) parts.push(Object.keys(pkg.dependencies).sort().join(","));
    } catch { /* ignore */ }
  }

  // Hash rules list
  if (existsSync(RULES_DIR)) {
    try {
      const rules = readdirSync(RULES_DIR).filter(f => f.endsWith(".md")).sort();
      parts.push(rules.join(","));
    } catch { /* ignore */ }
  }

  // Simple hash
  const str = parts.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 6);
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
  const fm = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    fm[key] = val;
  }
  return fm;
}

export function registerActivationTools(server) {
  server.tool(
    "activate_project",
    "Activates a project by building a complete manifest: stack info, available rules, skills, current state, and a project fingerprint. Use at session start for full project context in one call.",
    {
      project_root: z.string().optional().describe("Absolute path to project root. Defaults to current working directory."),
    },
    async ({ project_root }) => {
      const rateLimitHit = rateLimiter.check("activate_project");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const root = project_root ? resolve(project_root) : process.cwd();
      const pkg = readPackageJson(root);
      const fingerprint = generateFingerprint(root);

      // Stack info
      let stackLines = [];
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

      // Rules
      let rulesLines = [];
      if (existsSync(RULES_DIR)) {
        try {
          const ruleFiles = readdirSync(RULES_DIR).filter(f => f.endsWith(".md")).sort();
          for (const file of ruleFiles) {
            const desc = RULE_DESCRIPTIONS[file] || "Custom rule file";
            rulesLines.push(`- ${file}: ${desc}`);
          }
        } catch {
          rulesLines.push("- Could not read rules directory");
        }
      } else {
        rulesLines.push("- No ai-rules/ directory found");
      }

      // Skills
      let skillsLines = [];
      if (existsSync(SKILLS_DIR)) {
        try {
          const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
          for (const dir of dirs) {
            const skillPath = join(SKILLS_DIR, dir, "SKILL.md");
            if (existsSync(skillPath)) {
              const content = readFile(skillPath);
              const fm = content ? parseSkillFrontmatter(content) : {};
              const name = fm.name || dir;
              const desc = fm.description || "No description";
              skillsLines.push(`- ${name}: ${desc}`);
            }
          }
        } catch {
          skillsLines.push("- Could not read skills directory");
        }
      } else {
        skillsLines.push("- No .claude/skills/ directory found");
      }

      // State
      const state = loadState();
      let stateLines = [];
      stateLines.push(`- Objective: ${state.objective || "(not set)"}`);
      if (state.next_steps?.length > 0) {
        stateLines.push(`- Next steps: ${state.next_steps.join(", ")}`);
      }
      if (state.decisions?.length > 0) {
        stateLines.push(`- Decisions (${state.decisions.length}): ${state.decisions.slice(-3).join(", ")}`);
      }
      if (state.open_questions?.length > 0) {
        stateLines.push(`- Open questions: ${state.open_questions.length}`);
      }
      const cpCount = state.checkpoints?.length || 0;
      stateLines.push(`- Checkpoints: ${cpCount}`);

      // Assemble manifest
      const manifest = [
        `## Project Activated: ${pkg?.name || root}`,
        `Fingerprint: ${fingerprint} (package.json + ${rulesLines.length} rules + ${skillsLines.length} skills)`,
        "",
        "### Stack",
        ...stackLines,
        "",
        `### Rules (${rulesLines.length} files)`,
        ...rulesLines,
        "",
        `### Skills (${skillsLines.length} available)`,
        ...skillsLines,
        "",
        "### State",
        ...stateLines,
        "",
        "### Cache Strategy",
        "- Call get_rules_bundle('index') first for stable prefix",
        "- Load individual rules on-demand via get_rules(topic)",
        "- Static: rule files rarely change (cache-friendly)",
        "- Volatile: project_state, observations (reload each session)",
        "",
        "Use get_project_state() for full state, get_rules(topic) for rule details.",
      ];

      return {
        content: [{ type: "text", text: manifest.join("\n") }],
      };
    }
  );
}
