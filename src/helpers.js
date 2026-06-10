/**
 * Stack Perfeita MCP — Helper utilities
 * File reading, path safety, token minification, rule file listing.
 */

import { readFileSync, readdirSync, existsSync, realpathSync } from "fs";
import { dirname, isAbsolute, relative, resolve } from "path";
import { RULES_DIR, RULE_DESCRIPTIONS } from "./config.js";

function getExistingRealpath(inputPath) {
  if (existsSync(inputPath)) {
    return realpathSync(inputPath);
  }

  const parent = dirname(inputPath);
  if (parent === inputPath) {
    return resolve(inputPath);
  }

  if (existsSync(parent)) {
    return resolve(realpathSync(parent), inputPath.slice(parent.length + 1));
  }

  return resolve(inputPath);
}

export function safeResolvePath(base, filename) {
  const baseResolved = existsSync(base) ? realpathSync(resolve(base)) : resolve(base);
  const targetResolved = resolve(baseResolved, filename);
  const targetCanonical = getExistingRealpath(targetResolved);
  const rel = relative(baseResolved, targetCanonical);

  if (rel === "") {
    return targetCanonical;
  }

  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path traversal detected: ${filename}`);
  }

  return targetCanonical;
}

export function readFile(filePath) {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Minifies markdown/text output to save tokens:
 * - Removes markdown comments <!-- -->
 * - Collapses multiple blank lines to a single blank line
 * - Trims trailing whitespaces
 */
export function minifyTokens(text) {
  if (!text) return text;
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function listRuleFiles() {
  try {
    return readdirSync(RULES_DIR)
      .filter(f => f.endsWith(".md"))
      .sort();
  } catch {
    return [];
  }
}

export function getRuleByTopic(topic) {
  const files = listRuleFiles();

  const exact = files.find(f => f === topic || f === `${topic}.md`);
  if (exact) return { file: exact, content: readFile(resolve(RULES_DIR, exact)) };

  const fuzzy = files.find(f => f.toLowerCase().includes(topic.toLowerCase()));
  if (fuzzy) return { file: fuzzy, content: readFile(resolve(RULES_DIR, fuzzy)) };

  return null;
}

export function formatRuleList(files) {
  return files.map(f => {
    const desc = RULE_DESCRIPTIONS[f] || "Custom rule file";
    return `- **${f}** — ${desc}`;
  }).join("\n");
}
