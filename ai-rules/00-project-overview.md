# 00 - Project Overview & Stack Manifest (O Mapa do Domínio)

> **META:** Este arquivo é a **Fonte da Verdade** sobre o ecossistema atual. O LLM deve ler este arquivo para calibrar sua linguagem, frameworks, bibliotecas e arquitetura. **Nunca** sugira dependências fora deste escopo sem aprovação prévia.

## 1. Tech Stack (Preencha conforme o projeto)
- **Linguagem Principal:** [Ex: TypeScript 5.x / Python 3.12 / Go 1.22]
- **Frontend Framework:** [Ex: Next.js 14 (App Router) / React + Vite / Vue]
- **Backend Framework:** [Ex: NestJS / FastAPI / Express / Gin]
- **Database / ORM:** [Ex: PostgreSQL + Prisma / MongoDB + Mongoose / SQLAlchemy]
- **Testes:** [Ex: Jest + Testing Library / Pytest / Vitest]
- **Gerenciador de Pacotes:** [Ex: pnpm / npm / uv / poetry]

## 2. Padrão Arquitetural (Architecture Pattern)
- **Estilo:** [Ex: Hexagonal (Ports & Adapters) / MVC / Feature-Sliced Design (FSD)]
- **Separação de Responsabilidades:** 
  - Controllers/Routers: Apenas recebem a requisição e validam o input HTTP. Não possuem regra de negócio.
  - Services/Use Cases: Contêm a lógica de negócio pura. Não conhecem o contexto HTTP (req/res).
  - Repositories/DAL: Única camada que conversa com o Banco de Dados ou APIs externas.

## 3. Contrato de Nomenclatura (Naming Conventions)
- **Arquivos:** [Ex: kebab-case para arquivos (`user-controller.ts`), PascalCase para componentes React (`Button.tsx`)]
- **Variáveis/Funções:** [Ex: camelCase]
- **Classes/Interfaces:** [Ex: PascalCase]

## 4. Variáveis de Ambiente e Configuração (Setup)
- O projeto utiliza validação estrita de `.env`? [Ex: Sim, via `zod` no arquivo `env.ts`]
- Como iniciar o projeto localmente: `[Comando de dev, ex: pnpm dev]`
