import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

function readLines(stream, onLine) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    while (buffer.includes('\n')) {
      const idx = buffer.indexOf('\n');
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        onLine(JSON.parse(line));
      } catch {
        // ignore non-json lines
      }
    }
  });
}

async function main() {
  const child = spawn(process.execPath, [resolve(process.cwd(), 'src/index.js'), '--rules-dir', './ai-rules'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const responses = [];
  const stderr = [];
  readLines(child.stdout, (msg) => responses.push(msg));
  child.stderr.on('data', (chunk) => stderr.push(chunk.toString('utf8')));

  const send = (message) => child.stdin.write(JSON.stringify(message) + '\n');
  const waitForId = async (id, label) => {
    const started = Date.now();
    while (Date.now() - started < 10000) {
      const hit = responses.find((msg) => msg.id === id);
      if (hit) return hit;
      await new Promise((r) => setTimeout(r, 25));
    }
    throw new Error(`Timeout waiting for ${label}. stderr=${stderr.join(' ')}`);
  };

  let id = 1;
  const callTool = async (name, argumentsPayload) => {
    const requestId = ++id;
    send({
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: { name, arguments: argumentsPayload },
    });
    return waitForId(requestId, name);
  };

  send({
    jsonrpc: '2.0',
    id,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'smoke-test', version: '1.0.0' },
    },
  });
  await waitForId(id, 'initialize');
  send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

  const start = await callTool('start_council_session', {
    objective: 'Adicionar council deliberation no MCP com implementação real e sem teatro',
    context: 'Repo Stack Perfeita MCP com state, validation e role activation já existentes',
    desired_output: 'Sistema testado com gate, sessão, peer review e síntese',
    constraints: ['Sem loop infinito', 'Persistência local', 'Síntese auditável'],
    task_type: 'architecture-refactor',
    blast_radius: 'system',
    mode: 'full',
    ambiguity: 4,
    tradeoff_intensity: 4,
    touches_multiple_modules: true,
    safety_critical: false,
    failure_cost: 'high',
    maximum_rounds: 2,
  });

  const startText = start.result.content[0].text;
  const match = startText.match(/Council Session: (council-[^\n]+)/);
  if (!match) throw new Error(`Could not extract session id. Response=${startText}`);
  const sessionId = match[1].trim();

  const positions = {
    first_principles: {
      problem_frame: 'Precisamos de deliberação real, não personas decorativas.',
      thesis: 'Persistir sessões e exigir estrutura mínima por bot.',
      assumptions: ['O MCP continuará como camada de tooling'],
      opportunities: ['Maior auditabilidade'],
      risks: ['Schema excessivo pode gerar fricção'],
      next_steps: ['Criar src/council.js', 'Registrar ferramentas no index'],
      evidence: 'O projeto já possui padrões de state e tool registration.',
      confidence: 90,
      tags: ['auditabilidade', 'deliberation', 'state'],
    },
    expansionist: {
      problem_frame: 'A camada de council também pode melhorar a qualidade de decisões futuras.',
      thesis: 'Adicionar gate heurístico, skill dedicada e documentação operacional.',
      assumptions: ['Council deve ser opcional'],
      opportunities: ['Auto-gate', 'Playbook reutilizável'],
      risks: ['Virar default e pesar tarefas simples'],
      next_steps: ['Criar council_gate', 'Adicionar skill'],
      evidence: 'Há ativação por roles e regras sob demanda.',
      confidence: 84,
      tags: ['deliberation', 'auto-gate', 'docs'],
    },
    outsider: {
      problem_frame: 'O maior erro seria dizer que existe council sem evidência verificável.',
      thesis: 'Bloquear síntese antes de peer review completo e ranquear posições por score.',
      assumptions: ['Resumo livre não basta'],
      opportunities: ['Dificultar alucinação de consenso'],
      risks: ['Mais rigidez na operação'],
      next_steps: ['Exigir review queue', 'Gerar scorecard'],
      evidence: 'O pedido exige evitar teatro explicitamente.',
      confidence: 92,
      tags: ['auditabilidade', 'peer-review', 'anti-theater'],
    },
    executor: {
      problem_frame: 'A mudança precisa ser mínima e validada por teste real.',
      thesis: 'Entregar módulo novo, testes, smoke test e pacote final.',
      assumptions: ['O padrão atual de módulos deve permanecer'],
      opportunities: ['Validação E2E'],
      risks: ['Quebra no startup do MCP'],
      next_steps: ['Rodar npm test', 'Executar smoke test via stdio'],
      evidence: 'src/index.js centraliza o registro das tools.',
      confidence: 95,
      tags: ['implementation', 'testing', 'deliberation'],
    },
  };

  for (const [bot, payload] of Object.entries(positions)) {
    await callTool('record_council_position', { session_id: sessionId, bot, ...payload });
  }

  const reviews = [
    ['first_principles', 'expansionist', 4, 4, 4, 4, 'support', 'Bom upside sem explodir escopo', ['auto-gate'], ['Documentar limites']],
    ['first_principles', 'executor', 5, 3, 5, 4, 'support', 'Plano concreto e verificável', ['smoke test'], ['Incluir rollback']],
    ['expansionist', 'first_principles', 5, 4, 4, 4, 'support', 'Base sólida e enxuta', ['persistência'], ['Pode destacar skill cedo']],
    ['expansionist', 'outsider', 4, 5, 4, 5, 'support', 'Ótimo anti-teatro', ['scorecard'], ['Schema pode pesar']],
    ['outsider', 'first_principles', 5, 4, 5, 4, 'support', 'Boa separação entre fundamentos e execução', ['evidência estruturada'], ['Mostrar conflitos']],
    ['outsider', 'executor', 4, 3, 5, 4, 'mixed', 'Execução boa, mas depende da transparência do ranking', ['testes'], ['Scorecard transparente']],
    ['executor', 'expansionist', 4, 4, 4, 3, 'support', 'Boa alavanca futura', ['skill'], ['Evitar always-on']],
    ['executor', 'outsider', 5, 5, 4, 5, 'support', 'Mais alinhado ao pedido de evitar teatro', ['peer review'], ['Nenhuma']],
  ];

  for (const [reviewer_bot, target_bot, correctness_score, novelty_score, feasibility_score, risk_awareness_score, verdict, critique, adopted_ideas, major_concerns] of reviews) {
    await callTool('record_council_review', {
      session_id: sessionId,
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
  }

  const synthesis = await callTool('synthesize_council', { session_id: sessionId });
  const synthesisText = synthesis.result.content[0].text;

  console.log(JSON.stringify({
    sessionId,
    synthesisPreview: synthesisText.split('\n').slice(0, 14),
  }, null, 2));

  child.kill('SIGTERM');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
