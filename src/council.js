/**
 * Stack Perfeita MCP — Council deliberation runtime
 * Real multi-perspective workflow with persisted sessions, peer review, and deterministic synthesis.
 */

import { z } from "zod";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { COUNCIL_STATE_FILE } from "./config.js";
import { rateLimiter } from "./rate-limiter.js";

const COUNCIL_BOT_ORDER = ["first_principles", "expansionist", "outsider", "executor"];
const FAILURE_COST_VALUES = ["low", "medium", "high"];
const BLAST_RADIUS_VALUES = ["local", "module", "system"];
const MODE_VALUES = ["auto", "off", "standard", "full"];
const REVIEW_VERDICTS = ["support", "mixed", "reject"];

const COUNCIL_BOT_BRIEFS = {
  first_principles: {
    label: "The First Principles Thinker",
    mandate: "Rebuild the solution from zero and separate fundamentals from inherited assumptions.",
    focus: [
      "State the real problem in invariant terms",
      "Call out assumptions that should be re-earned",
      "Prefer minimum coherent architecture before optimization",
    ],
    avoid: [
      "Do not assume the current codebase shape is correct",
      "Do not optimize for novelty over correctness",
    ],
    required_output: [
      "problem_frame",
      "thesis",
      "assumptions[]",
      "risks[]",
      "next_steps[]",
    ],
  },
  expansionist: {
    label: "The Expansionist",
    mandate: "Find useful opportunities, leverage points, and adjacent gains that may be getting ignored.",
    focus: [
      "Surface DX, performance, security, reuse, and automation opportunities",
      "Propose optional upside without exploding scope",
      "Name quick wins and strategic wins separately",
    ],
    avoid: [
      "Do not turn the task into an unrelated roadmap",
      "Do not hide scope creep risk",
    ],
    required_output: [
      "thesis",
      "opportunities[]",
      "risks[]",
      "tags[]",
      "next_steps[]",
    ],
  },
  outsider: {
    label: "The Outsider",
    mandate: "Attack the framing with minimal prior bias and question whether the task is being asked correctly.",
    focus: [
      "Challenge the problem framing",
      "Offer a materially different interpretation if warranted",
      "Expose blind spots, sunk-cost bias, and false constraints",
    ],
    avoid: [
      "Do not nitpick stylistically",
      "Do not preserve assumptions just because they are popular",
    ],
    required_output: [
      "problem_frame",
      "thesis",
      "assumptions[]",
      "risks[]",
      "tags[]",
    ],
  },
  executor: {
    label: "The Executor",
    mandate: "Translate the best direction into an implementation-ready plan with order, evidence, and rollback.",
    focus: [
      "Provide concrete next steps in execution order",
      "Define acceptance and rollback expectations",
      "Keep the plan incremental and testable",
    ],
    avoid: [
      "Do not hand-wave verification",
      "Do not collapse architecture trade-offs into implementation detail",
    ],
    required_output: [
      "thesis",
      "next_steps[]",
      "risks[]",
      "evidence",
      "confidence",
    ],
  },
};

function defaultCouncilState() {
  return {
    sessions: [],
    updated_at: new Date().toISOString(),
  };
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeList(values) {
  if (!Array.isArray(values)) return [];
  const unique = [];
  const seen = new Set();
  for (const value of values) {
    const normalized = normalizeText(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }
  return unique;
}

function toTitleCaseBot(bot) {
  return COUNCIL_BOT_BRIEFS[bot]?.label || bot;
}

function defaultReviewCounts(mode) {
  return mode === "full" ? 8 : 4;
}

function seedFromString(input) {
  let seed = 0;
  for (let i = 0; i < input.length; i += 1) {
    seed = (seed * 31 + input.charCodeAt(i)) >>> 0;
  }
  return seed || 1;
}

function nextSeed(seed) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function seededShuffle(items, seedText) {
  const arr = items.slice();
  let seed = seedFromString(seedText);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    seed = nextSeed(seed);
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildPeerReviewMatrix(mode, sessionId) {
  const standard = [
    { reviewer_bot: "first_principles", target_bot: "expansionist" },
    { reviewer_bot: "expansionist", target_bot: "outsider" },
    { reviewer_bot: "outsider", target_bot: "executor" },
    { reviewer_bot: "executor", target_bot: "first_principles" },
  ];

  const full = [
    { reviewer_bot: "first_principles", target_bot: "expansionist" },
    { reviewer_bot: "first_principles", target_bot: "executor" },
    { reviewer_bot: "expansionist", target_bot: "first_principles" },
    { reviewer_bot: "expansionist", target_bot: "outsider" },
    { reviewer_bot: "outsider", target_bot: "first_principles" },
    { reviewer_bot: "outsider", target_bot: "executor" },
    { reviewer_bot: "executor", target_bot: "expansionist" },
    { reviewer_bot: "executor", target_bot: "outsider" },
  ];

  return seededShuffle(mode === "full" ? full : standard, sessionId);
}

function evaluateCouncilNeed({
  objective,
  task_type = "",
  blast_radius = "local",
  ambiguity = 0,
  tradeoff_intensity = 0,
  touches_multiple_modules = false,
  safety_critical = false,
  failure_cost = "low",
}) {
  let score = 0;
  const reasons = [];

  if (blast_radius === "module") {
    score += 2;
    reasons.push("module blast radius");
  }
  if (blast_radius === "system") {
    score += 4;
    reasons.push("system-wide blast radius");
  }

  score += Number(ambiguity || 0);
  if (ambiguity >= 3) reasons.push(`ambiguity ${ambiguity}/5`);

  score += Number(tradeoff_intensity || 0);
  if (tradeoff_intensity >= 3) reasons.push(`trade-offs ${tradeoff_intensity}/5`);

  if (touches_multiple_modules) {
    score += 2;
    reasons.push("cross-module impact");
  }

  if (safety_critical) {
    score += 4;
    reasons.push("safety/security sensitivity");
  }

  if (failure_cost === "medium") {
    score += 2;
    reasons.push("medium failure cost");
  }
  if (failure_cost === "high") {
    score += 4;
    reasons.push("high failure cost");
  }

  const taskSignal = `${objective} ${task_type}`.toLowerCase();
  if (/(architecture|architect|migration|security|refactor|performance|multi-agent|debug|design|protocol|api)/.test(taskSignal)) {
    score += 2;
    reasons.push("complex task signal");
  }

  let recommendation = "skip";
  let maximum_rounds = 0;

  if (score >= 10) {
    recommendation = "full";
    maximum_rounds = 2;
  } else if (score >= 5) {
    recommendation = "standard";
    maximum_rounds = 1;
  }

  if (reasons.length === 0) reasons.push("low coordination overhead preferred");

  return {
    score,
    recommendation,
    maximum_rounds,
    reasons,
  };
}

function createSessionId() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `council-${stamp}-${rand}`;
}

function buildCouncilSession({
  objective,
  context,
  desired_output,
  constraints,
  task_type,
  blast_radius,
  mode,
  maximum_rounds,
  gate,
}) {
  const session_id = createSessionId();
  const activated_mode = mode === "auto"
    ? gate.recommendation
    : mode === "off"
      ? "skip"
      : mode;

  const bounded_rounds = activated_mode === "full"
    ? Math.min(Math.max(Number(maximum_rounds || gate.maximum_rounds || 2), 1), 2)
    : activated_mode === "standard"
      ? 1
      : 0;

  const review_queue = activated_mode === "skip"
    ? []
    : buildPeerReviewMatrix(activated_mode, session_id);

  return {
    session_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: activated_mode === "skip" ? "gated_out" : "awaiting_positions",
    objective: normalizeText(objective),
    context: normalizeText(context),
    desired_output: normalizeText(desired_output),
    constraints: normalizeList(constraints),
    task_type: normalizeText(task_type || "generic"),
    blast_radius,
    requested_mode: mode,
    activated_mode,
    maximum_rounds: bounded_rounds,
    gate,
    role_order: COUNCIL_BOT_ORDER.slice(),
    bot_briefs: COUNCIL_BOT_BRIEFS,
    peer_review_queue: review_queue,
    required_review_count: review_queue.length,
    stop_rules: [
      "Maximum two rounds total; no open-ended debate",
      "Same objection twice without new evidence -> halt escalation",
      "Synthesis must expose disagreements instead of flattening them",
      "Executor cannot overwrite unresolved structural risks",
    ],
    scoring_rubric: [
      "correctness: 1-5",
      "novelty: 1-5",
      "feasibility: 1-5",
      "risk_awareness: 1-5",
    ],
    positions: {},
    reviews: [],
    synthesis: null,
  };
}

function loadCouncilState(filePath = COUNCIL_STATE_FILE) {
  if (!existsSync(filePath)) return defaultCouncilState();
  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    return {
      ...defaultCouncilState(),
      ...data,
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
    };
  } catch {
    return defaultCouncilState();
  }
}

function saveCouncilState(state, filePath = COUNCIL_STATE_FILE) {
  const dir = dirname(resolve(filePath));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const sanitized = {
    ...defaultCouncilState(),
    ...state,
    sessions: Array.isArray(state.sessions) ? state.sessions.slice(-30) : [],
    updated_at: new Date().toISOString(),
  };
  writeFileSync(filePath, JSON.stringify(sanitized, null, 2), "utf-8");
}

function findSession(state, sessionId) {
  return state.sessions.find((session) => session.session_id === sessionId) || null;
}

function ensureSession(state, sessionId) {
  const session = findSession(state, sessionId);
  if (!session) throw new Error(`Council session not found: ${sessionId}`);
  return session;
}

function countCompletedPositions(session) {
  return COUNCIL_BOT_ORDER.filter((bot) => session.positions?.[bot]).length;
}

function countCompletedReviews(session) {
  return Array.isArray(session.reviews) ? session.reviews.length : 0;
}

function refreshSessionStatus(session) {
  const positionCount = countCompletedPositions(session);
  const reviewCount = countCompletedReviews(session);

  if (session.activated_mode === "skip") {
    session.status = "gated_out";
    return session;
  }

  if (positionCount < COUNCIL_BOT_ORDER.length) {
    session.status = "awaiting_positions";
    return session;
  }

  if (reviewCount < session.required_review_count) {
    session.status = "awaiting_reviews";
    return session;
  }

  if (session.synthesis) {
    session.status = "synthesized";
    return session;
  }

  session.status = "ready_for_synthesis";
  return session;
}

function upsertCouncilPosition(session, payload) {
  session.positions[payload.bot] = {
    bot: payload.bot,
    label: toTitleCaseBot(payload.bot),
    problem_frame: normalizeText(payload.problem_frame),
    thesis: normalizeText(payload.thesis),
    assumptions: normalizeList(payload.assumptions),
    opportunities: normalizeList(payload.opportunities),
    risks: normalizeList(payload.risks),
    next_steps: normalizeList(payload.next_steps),
    evidence: normalizeText(payload.evidence),
    confidence: Number(payload.confidence),
    tags: normalizeList(payload.tags),
    updated_at: new Date().toISOString(),
  };
  session.updated_at = new Date().toISOString();
  return refreshSessionStatus(session);
}

function upsertCouncilReview(session, payload) {
  const review = {
    reviewer_bot: payload.reviewer_bot,
    target_bot: payload.target_bot,
    correctness_score: Number(payload.correctness_score),
    novelty_score: Number(payload.novelty_score),
    feasibility_score: Number(payload.feasibility_score),
    risk_awareness_score: Number(payload.risk_awareness_score),
    verdict: payload.verdict,
    critique: normalizeText(payload.critique),
    adopted_ideas: normalizeList(payload.adopted_ideas),
    major_concerns: normalizeList(payload.major_concerns),
    updated_at: new Date().toISOString(),
  };

  const index = session.reviews.findIndex((entry) => entry.reviewer_bot === review.reviewer_bot && entry.target_bot === review.target_bot);
  if (index >= 0) session.reviews[index] = review;
  else session.reviews.push(review);

  session.updated_at = new Date().toISOString();
  return refreshSessionStatus(session);
}

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function collectConsensusTags(session) {
  const counts = new Map();
  for (const bot of COUNCIL_BOT_ORDER) {
    const position = session.positions?.[bot];
    if (!position) continue;
    for (const tag of position.tags || []) {
      const key = tag.toLowerCase();
      const record = counts.get(key) || { label: tag, count: 0, bots: [] };
      record.count += 1;
      record.bots.push(bot);
      counts.set(key, record);
    }
  }

  return [...counts.values()]
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map((entry) => `${entry.label} (${entry.count}/4)`)
    .slice(0, 6);
}

function buildPositionScorecard(session) {
  return COUNCIL_BOT_ORDER
    .filter((bot) => session.positions?.[bot])
    .map((bot) => {
      const position = session.positions[bot];
      const reviews = session.reviews.filter((entry) => entry.target_bot === bot);
      const correctness = average(reviews.map((entry) => entry.correctness_score));
      const novelty = average(reviews.map((entry) => entry.novelty_score));
      const feasibility = average(reviews.map((entry) => entry.feasibility_score));
      const risk_awareness = average(reviews.map((entry) => entry.risk_awareness_score));
      const support_count = reviews.filter((entry) => entry.verdict === "support").length;
      const mixed_count = reviews.filter((entry) => entry.verdict === "mixed").length;
      const reject_count = reviews.filter((entry) => entry.verdict === "reject").length;
      const weighted_score = Number((correctness * 0.35 + novelty * 0.2 + feasibility * 0.25 + risk_awareness * 0.2).toFixed(2));
      const concerns = normalizeList(reviews.flatMap((entry) => entry.major_concerns || [])).slice(0, 4);

      return {
        bot,
        label: position.label,
        thesis: position.thesis,
        weighted_score,
        correctness: Number(correctness.toFixed(2)),
        novelty: Number(novelty.toFixed(2)),
        feasibility: Number(feasibility.toFixed(2)),
        risk_awareness: Number(risk_awareness.toFixed(2)),
        support_count,
        mixed_count,
        reject_count,
        next_steps: position.next_steps,
        opportunities: position.opportunities,
        risks: position.risks,
        confidence: position.confidence,
        concerns,
      };
    })
    .sort((a, b) => b.weighted_score - a.weighted_score || b.support_count - a.support_count);
}

function deriveDisagreements(scorecard) {
  return scorecard
    .filter((entry) => entry.reject_count > 0 || entry.mixed_count > entry.support_count)
    .map((entry) => `${entry.label}: ${entry.reject_count} reject / ${entry.mixed_count} mixed — concerns: ${entry.concerns.join('; ') || 'none logged'}`)
    .slice(0, 6);
}

function deriveDiscardedIdeas(scorecard) {
  return scorecard
    .filter((entry) => entry.weighted_score < 3 || entry.reject_count > entry.support_count)
    .map((entry) => `${entry.label}: ${entry.thesis}`)
    .slice(0, 6);
}

function deriveConfidence(scorecard, session) {
  const top = scorecard[0];
  if (!top) return "low";

  const reviewCoverage = session.required_review_count === 0
    ? 1
    : countCompletedReviews(session) / session.required_review_count;

  if (reviewCoverage >= 1 && top.weighted_score >= 4 && top.support_count >= Math.max(1, top.reject_count + 1)) {
    return "high";
  }
  if (reviewCoverage >= 0.75 && top.weighted_score >= 3.25) {
    return "medium";
  }
  return "low";
}

function synthesizeCouncilSession(session) {
  const missingBots = COUNCIL_BOT_ORDER.filter((bot) => !session.positions?.[bot]);
  if (missingBots.length) {
    throw new Error(`Cannot synthesize. Missing positions from: ${missingBots.join(', ')}`);
  }
  if (countCompletedReviews(session) < session.required_review_count) {
    throw new Error(`Cannot synthesize. Missing peer reviews: ${session.required_review_count - countCompletedReviews(session)}`);
  }

  const scorecard = buildPositionScorecard(session);
  const leader = scorecard[0];
  const consensus_tags = collectConsensusTags(session);
  const disagreements = deriveDisagreements(scorecard);
  const discarded_ideas = deriveDiscardedIdeas(scorecard);
  const recommended_next_step = leader?.next_steps?.[0] || "No next step proposed";
  const synthesis = {
    session_id: session.session_id,
    synthesized_at: new Date().toISOString(),
    confidence: deriveConfidence(scorecard, session),
    consensus: consensus_tags.length ? consensus_tags : ["No strong tag-level consensus; inspect scorecard"],
    disagreements: disagreements.length ? disagreements : ["No major disagreement spikes recorded in peer review"],
    discarded_ideas: discarded_ideas.length ? discarded_ideas : ["No ideas were discarded by score threshold"],
    risk_ranking: scorecard.map((entry) => `${entry.label}: score=${entry.weighted_score}, support=${entry.support_count}, reject=${entry.reject_count}`),
    recommended_next_step,
    leading_bot: leader?.label || "n/a",
    scorecard,
    evidence_missing: [],
  };

  session.synthesis = synthesis;
  session.updated_at = new Date().toISOString();
  refreshSessionStatus(session);
  return synthesis;
}

function formatGateResult(result) {
  return [
    `- Score: ${result.score}`,
    `- Recommendation: ${result.recommendation}`,
    `- Suggested rounds: ${result.maximum_rounds}`,
    `- Reasons: ${result.reasons.join(', ')}`,
  ].join("\n");
}

function formatSessionList(sessions) {
  if (!sessions.length) return "No council sessions found.";
  return sessions
    .slice()
    .reverse()
    .map((session) => `- ${session.session_id} | ${session.status} | mode=${session.activated_mode} | objective=${session.objective}`)
    .join("\n");
}

function formatSession(session) {
  const completedPositions = countCompletedPositions(session);
  const completedReviews = countCompletedReviews(session);
  const roleLines = COUNCIL_BOT_ORDER.map((bot) => {
    const brief = COUNCIL_BOT_BRIEFS[bot];
    return `- ${brief.label}: ${brief.mandate}`;
  });

  const reviewLines = session.peer_review_queue.map((item, index) => `${index + 1}. ${toTitleCaseBot(item.reviewer_bot)} -> ${toTitleCaseBot(item.target_bot)}`);

  return [
    `## Council Session: ${session.session_id}`,
    `- Status: ${session.status}`,
    `- Requested mode: ${session.requested_mode}`,
    `- Activated mode: ${session.activated_mode}`,
    `- Maximum rounds: ${session.maximum_rounds}`,
    `- Objective: ${session.objective}`,
    `- Desired output: ${session.desired_output}`,
    `- Constraints: ${session.constraints.join('; ') || '(none)'}`,
    `- Positions: ${completedPositions}/${COUNCIL_BOT_ORDER.length}`,
    `- Reviews: ${completedReviews}/${session.required_review_count}`,
    "",
    "### Gate",
    formatGateResult(session.gate),
    "",
    "### Bots",
    ...roleLines,
    "",
    "### Peer review queue",
    ...(reviewLines.length ? reviewLines : ["(not activated)"]),
    "",
    "### Stop rules",
    ...session.stop_rules.map((rule) => `- ${rule}`),
  ].join("\n");
}

function formatSynthesis(synthesis) {
  return [
    `## Council Synthesis: ${synthesis.session_id}`,
    `- Confidence: ${synthesis.confidence}`,
    `- Leading bot: ${synthesis.leading_bot}`,
    `- Recommended next step: ${synthesis.recommended_next_step}`,
    "",
    "### Consensus",
    ...synthesis.consensus.map((item) => `- ${item}`),
    "",
    "### Disagreements",
    ...synthesis.disagreements.map((item) => `- ${item}`),
    "",
    "### Discarded ideas",
    ...synthesis.discarded_ideas.map((item) => `- ${item}`),
    "",
    "### Risk ranking",
    ...synthesis.risk_ranking.map((item) => `- ${item}`),
    "",
    "### Scorecard",
    ...synthesis.scorecard.map((entry, index) => `${index + 1}. ${entry.label} — score=${entry.weighted_score}; support=${entry.support_count}; mixed=${entry.mixed_count}; reject=${entry.reject_count}`),
  ].join("\n");
}

export function registerCouncilTools(server) {
  server.tool(
    "council_gate",
    "Scores whether a task deserves Council deliberation. Use before paying coordination cost on simple work.",
    {
      objective: z.string().describe("Short description of the task or decision."),
      task_type: z.string().optional().describe("Task label such as architecture, bugfix, refactor, security-review."),
      blast_radius: z.enum(BLAST_RADIUS_VALUES).optional().describe("How far a bad decision would spread."),
      ambiguity: z.number().int().min(0).max(5).optional().describe("How ambiguous the task framing is from 0-5."),
      tradeoff_intensity: z.number().int().min(0).max(5).optional().describe("How strong the trade-offs are from 0-5."),
      touches_multiple_modules: z.boolean().optional().describe("Whether the work spans multiple modules/services."),
      safety_critical: z.boolean().optional().describe("Whether security, safety, or compliance risk is material."),
      failure_cost: z.enum(FAILURE_COST_VALUES).optional().describe("Cost of a wrong decision."),
    },
    async ({ objective, task_type, blast_radius, ambiguity, tradeoff_intensity, touches_multiple_modules, safety_critical, failure_cost }) => {
      const rateLimitHit = rateLimiter.check("council_gate");
      if (rateLimitHit) return { content: [{ type: "text", text: rateLimitHit }] };

      const result = evaluateCouncilNeed({
        objective,
        task_type,
        blast_radius: blast_radius || "local",
        ambiguity: ambiguity || 0,
        tradeoff_intensity: tradeoff_intensity || 0,
        touches_multiple_modules: touches_multiple_modules || false,
        safety_critical: safety_critical || false,
        failure_cost: failure_cost || "low",
      });

      return { content: [{ type: "text", text: `## Council Gate\n\n${formatGateResult(result)}` }] };
    }
  );

  server.tool(
    "start_council_session",
    "Creates a persisted Council session with four bot briefs, shuffled peer-review queue, stop rules, and scoring rubric.",
    {
      objective: z.string().describe("The decision or implementation objective under deliberation."),
      context: z.string().describe("Relevant repo, architecture, bug, or product context."),
      desired_output: z.string().describe("What the final deliverable from deliberation should unlock."),
      constraints: z.array(z.string()).optional().describe("Scope, time, stack, quality, or policy constraints."),
      task_type: z.string().optional().describe("Task label such as architecture, refactor, migration, debugging."),
      blast_radius: z.enum(BLAST_RADIUS_VALUES).optional().describe("How far a bad decision would spread."),
      mode: z.enum(MODE_VALUES).optional().describe("auto uses the gate heuristic; off bypasses activation."),
      ambiguity: z.number().int().min(0).max(5).optional().describe("How ambiguous the framing is from 0-5."),
      tradeoff_intensity: z.number().int().min(0).max(5).optional().describe("How strong the trade-offs are from 0-5."),
      touches_multiple_modules: z.boolean().optional().describe("Whether the work spans multiple modules/services."),
      safety_critical: z.boolean().optional().describe("Whether security, safety, or compliance risk is material."),
      failure_cost: z.enum(FAILURE_COST_VALUES).optional().describe("Cost of a wrong decision."),
      maximum_rounds: z.number().int().min(0).max(2).optional().describe("Upper bound for deliberation rounds. Full mode caps at 2."),
    },
    async ({ objective, context, desired_output, constraints, task_type, blast_radius, mode, ambiguity, tradeoff_intensity, touches_multiple_modules, safety_critical, failure_cost, maximum_rounds }) => {
      const rateLimitHit = rateLimiter.check("start_council_session");
      if (rateLimitHit) return { content: [{ type: "text", text: rateLimitHit }] };

      const gate = evaluateCouncilNeed({
        objective,
        task_type,
        blast_radius: blast_radius || "local",
        ambiguity: ambiguity || 0,
        tradeoff_intensity: tradeoff_intensity || 0,
        touches_multiple_modules: touches_multiple_modules || false,
        safety_critical: safety_critical || false,
        failure_cost: failure_cost || "low",
      });

      const session = buildCouncilSession({
        objective,
        context,
        desired_output,
        constraints: constraints || [],
        task_type,
        blast_radius: blast_radius || "local",
        mode: mode || "auto",
        maximum_rounds: maximum_rounds ?? gate.maximum_rounds,
        gate,
      });

      const state = loadCouncilState();
      state.sessions.push(session);
      saveCouncilState(state);

      return { content: [{ type: "text", text: formatSession(session) }] };
    }
  );

  server.tool(
    "get_council_session",
    "Lists Council sessions or returns one specific session with progress counters and peer-review queue.",
    {
      session_id: z.string().optional().describe("Council session id. Omit to list recent sessions."),
    },
    async ({ session_id }) => {
      const rateLimitHit = rateLimiter.check("get_council_session");
      if (rateLimitHit) return { content: [{ type: "text", text: rateLimitHit }] };

      const state = loadCouncilState();
      if (!session_id) {
        return { content: [{ type: "text", text: `## Council Sessions\n\n${formatSessionList(state.sessions)}` }] };
      }

      const session = findSession(state, session_id);
      if (!session) {
        return { content: [{ type: "text", text: `Council session not found: ${session_id}` }] };
      }

      return { content: [{ type: "text", text: formatSession(session) }] };
    }
  );

  server.tool(
    "record_council_position",
    "Stores or updates one bot position in a Council session. Requires structured claims so synthesis is auditable, not theatrical.",
    {
      session_id: z.string().describe("Council session id."),
      bot: z.enum(COUNCIL_BOT_ORDER).describe("Which Council bot is submitting the position."),
      problem_frame: z.string().describe("How this bot frames the task before solving it."),
      thesis: z.string().describe("Core recommendation or viewpoint from this bot."),
      assumptions: z.array(z.string()).describe("Assumptions that shape the recommendation."),
      opportunities: z.array(z.string()).describe("Additional opportunities or leverage points."),
      risks: z.array(z.string()).describe("Primary risks, failure modes, or objections."),
      next_steps: z.array(z.string()).describe("Concrete proposed next steps in priority order."),
      evidence: z.string().describe("Evidence used so far: files, tests, benchmarks, incidents, or constraints."),
      confidence: z.number().int().min(0).max(100).describe("How confident the bot is in the position."),
      tags: z.array(z.string()).describe("Short reusable tags like safety, refactor, dx, latency, testing."),
    },
    async ({ session_id, bot, problem_frame, thesis, assumptions, opportunities, risks, next_steps, evidence, confidence, tags }) => {
      const rateLimitHit = rateLimiter.check("record_council_position");
      if (rateLimitHit) return { content: [{ type: "text", text: rateLimitHit }] };

      const state = loadCouncilState();
      try {
        const session = ensureSession(state, session_id);
        upsertCouncilPosition(session, {
          bot,
          problem_frame,
          thesis,
          assumptions,
          opportunities,
          risks,
          next_steps,
          evidence,
          confidence,
          tags,
        });
        saveCouncilState(state);
        return {
          content: [{
            type: "text",
            text: `Council position recorded for ${toTitleCaseBot(bot)}.\n\n${formatSession(session)}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: error.message }] };
      }
    }
  );

  server.tool(
    "record_council_review",
    "Stores one peer review between Council bots. Self-review is blocked. Reviews are upserted per reviewer-target pair.",
    {
      session_id: z.string().describe("Council session id."),
      reviewer_bot: z.enum(COUNCIL_BOT_ORDER).describe("Bot performing the review."),
      target_bot: z.enum(COUNCIL_BOT_ORDER).describe("Bot being reviewed."),
      correctness_score: z.number().int().min(1).max(5).describe("How correct the reviewer judges the target position."),
      novelty_score: z.number().int().min(1).max(5).describe("How much useful novelty the target position adds."),
      feasibility_score: z.number().int().min(1).max(5).describe("How implementable the target position is."),
      risk_awareness_score: z.number().int().min(1).max(5).describe("How well the target position handles downside and failure modes."),
      verdict: z.enum(REVIEW_VERDICTS).describe("Overall stance from the reviewer."),
      critique: z.string().describe("Concise justification for the verdict."),
      adopted_ideas: z.array(z.string()).describe("Ideas from the target position the reviewer adopts."),
      major_concerns: z.array(z.string()).describe("Key concerns that the Chairman should preserve in synthesis."),
    },
    async ({ session_id, reviewer_bot, target_bot, correctness_score, novelty_score, feasibility_score, risk_awareness_score, verdict, critique, adopted_ideas, major_concerns }) => {
      const rateLimitHit = rateLimiter.check("record_council_review");
      if (rateLimitHit) return { content: [{ type: "text", text: rateLimitHit }] };
      if (reviewer_bot === target_bot) {
        return { content: [{ type: "text", text: "Council review rejected: reviewer_bot cannot equal target_bot." }] };
      }

      const state = loadCouncilState();
      try {
        const session = ensureSession(state, session_id);
        const allowedPair = session.peer_review_queue.some((item) => item.reviewer_bot === reviewer_bot && item.target_bot === target_bot);
        if (!allowedPair) {
          return {
            content: [{ type: "text", text: `Council review pair not in queue: ${reviewer_bot} -> ${target_bot}` }],
          };
        }

        upsertCouncilReview(session, {
          reviewer_bot,
          target_bot,
          correctness_score,
          novelty_score,
          feasibility_score,
          risk_awareness_score,
          verdict,
          critique,
          adopted_ideas,
          major_concerns,
        });
        saveCouncilState(state);
        return {
          content: [{
            type: "text",
            text: `Council review recorded: ${toTitleCaseBot(reviewer_bot)} -> ${toTitleCaseBot(target_bot)}.\n\n${formatSession(session)}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: error.message }] };
      }
    }
  );

  server.tool(
    "synthesize_council",
    "Runs deterministic Council synthesis from stored positions and peer reviews. Produces consensus, disagreements, discarded ideas, risk ranking, and recommended next step.",
    {
      session_id: z.string().describe("Council session id."),
    },
    async ({ session_id }) => {
      const rateLimitHit = rateLimiter.check("synthesize_council");
      if (rateLimitHit) return { content: [{ type: "text", text: rateLimitHit }] };

      const state = loadCouncilState();
      try {
        const session = ensureSession(state, session_id);
        const synthesis = synthesizeCouncilSession(session);
        saveCouncilState(state);
        return { content: [{ type: "text", text: formatSynthesis(synthesis) }] };
      } catch (error) {
        return { content: [{ type: "text", text: error.message }] };
      }
    }
  );
}

export {
  COUNCIL_BOT_ORDER,
  COUNCIL_BOT_BRIEFS,
  defaultCouncilState,
  loadCouncilState,
  saveCouncilState,
  evaluateCouncilNeed,
  buildPeerReviewMatrix,
  buildCouncilSession,
  upsertCouncilPosition,
  upsertCouncilReview,
  synthesizeCouncilSession,
};
