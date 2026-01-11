# Design System Extractor

> Extract design systems from any website and generate type-safe component tokens.

## What This Does

1. **Enter a URL** → Screenshot and analyze the website
2. **AI identifies components** → Buttons, cards, inputs, text styles
3. **Extract styles from DOM** → Colors, typography, spacing, effects
4. **Generate styled components** → Compare against original until 95%+ match
5. **User approves/rejects** → Human verification of each extraction
6. **Export design system** → TypeScript package with full type safety

## Architecture

```
@extracted/types      → Type definitions (the contract)
@extracted/tokens     → Token values (the implementation)
@extracted/primitives → Style-locked base components
@extracted/extractor  → Extraction logic
apps/web              → Next.js UI
```

### Core Principles

1. **Type Safety as Enforcement** — If `className` isn't in the type, it can't be passed
2. **Primitives Are Style-Locked** — Only `variant` controls appearance
3. **Types Define Contract, Tokens Implement** — Separation of concerns
4. **Extract Reality, Don't Normalize** — Capture what exists, label by usage
5. **95%+ Match Before User Review** — Automated comparison threshold
6. **Human Verification Required** — Final accept/reject is always human

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Gemini API key (from [Google AI Studio](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/Eyobdd/design-system-extractor.git
cd design-system-extractor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your GEMINI_API_KEY

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## Project Structure

```
design-system-extractor/
├── apps/
│   └── web/                    # Next.js application
├── packages/
│   ├── types/                  # Type definitions
│   ├── tokens/                 # Token values
│   ├── primitives/             # Style-locked components
│   ├── extractor/              # Extraction logic
│   └── tsconfig/               # Shared TypeScript configs
├── .windsurf/
│   └── rules/                  # Architecture & testing guidelines
├── turbo.json                  # Turborepo configuration
├── render.yaml                 # Render deployment
└── ROADMAP.md                  # Implementation roadmap
```

## Development

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run test         # Run tests
npm run typecheck    # Type check all packages
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `NEXT_PUBLIC_BASE_URL` | No | Application URL |

## Tech Stack

- **Turborepo** — Monorepo management
- **Next.js 14** — React framework with App Router
- **TypeScript** — Strict type safety
- **Vitest** — Testing framework
- **Puppeteer** — Screenshot capture
- **Gemini 2.5 Flash** — Vision AI for component identification
- **LangChain** — LLM orchestration

## Documentation

- [ROADMAP.md](./ROADMAP.md) — Step-by-step implementation guide
- [WINDSURF_PROMPT.md](./WINDSURF_PROMPT.md) — Prompt to initialize Windsurf
- [.windsurf/rules/architecture.md](./.windsurf/rules/architecture.md) — Core principles
- [.windsurf/rules/testing.md](./.windsurf/rules/testing.md) — Testing philosophy
- [.windsurf/rules/ci-cd.md](./.windsurf/rules/ci-cd.md) — CI/CD configuration

## Deployment

This project is configured for deployment on [Render](https://render.com).

1. Connect your GitHub repository to Render
2. Set `GEMINI_API_KEY` in Render dashboard
3. Deploy automatically on push to `main`

## License

MIT
