/**
 * Stack Perfeita MCP — Skills tools
 * list_skills and get_skill MCP tool registrations.
 */

import { z } from "zod";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { SKILLS_DIR } from "./config.js";
import { safeResolvePath, readFile } from "./helpers.js";

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

function listSkillFiles() {
  try {
    return readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => ({ dir: d.name, path: join(SKILLS_DIR, d.name, "SKILL.md") }))
      .filter(s => existsSync(s.path));
  } catch {
    return [];
  }
}

export function registerSkillsTools(server) {
  // Tool: list_skills
  server.tool(
    "list_skills",
    "Lists all available agent skills (SKILL.md files in .claude/skills/). Skills are composable, discoverable task playbooks that the agent invokes before responding.",
    {},
    async () => {
      const skills = listSkillFiles();

      if (skills.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No skills found in: ${SKILLS_DIR}\nCreate .claude/skills/<name>/SKILL.md with YAML frontmatter (name, description).`,
          }],
        };
      }

      const lines = skills.map(s => {
        const content = readFile(s.path);
        const fm = content ? parseSkillFrontmatter(content) : {};
        const name = fm.name || s.dir;
        const desc = fm.description || "No description";
        const compat = fm.compatibility || "";
        return `- **${name}** — ${desc}${compat ? ` [${compat}]` : ""}`;
      });

      return {
        content: [{
          type: "text",
          text: `## Available skills in: ${SKILLS_DIR}\n\n${lines.join("\n")}\n\nUse get_skill(name) to read a skill's full content.`,
        }],
      };
    }
  );

  // Tool: get_skill
  server.tool(
    "get_skill",
    "Returns the full content of a specific skill. Use skill name or directory name. Skills guide the agent through specialized workflows.",
    { name: z.string().describe("Skill name or directory name. Examples: build-test-verify, git-commit, core-conventions") },
    async ({ name }) => {
      const safeName = name.replace(/\.\./g, "").replace(/[\\/]/g, "");
      const skillPath = safeResolvePath(SKILLS_DIR, join(safeName, "SKILL.md"));

      if (!existsSync(skillPath)) {
        const available = listSkillFiles().map(s => s.dir);
        return {
          content: [{
            type: "text",
            text: `Skill not found: "${name}"\n\nAvailable skills:\n${available.map(a => `- ${a}`).join("\n")}`,
          }],
        };
      }

      const content = readFile(skillPath);
      return {
        content: [{
          type: "text",
          text: `## Skill: ${safeName}\n\n${content}`,
        }],
      };
    }
  );
}
