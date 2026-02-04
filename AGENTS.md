# Repository Guidelines

## Project Structure & Module Organization
- `docs/` contains the current product/design documentation (e.g., `docs/mvp_plan.md`, `docs/app_design.md`).
- There is no application source code yet. When implementation starts, keep source under a top-level directory such as `app/` or `src/`, and add `tests/` for automated tests.
- Keep generated artifacts out of the repo unless explicitly required.

## Build, Test, and Development Commands
- No build/test commands are defined yet. Once a Node/Next.js app is added, document key commands in this file and in a `README.md` (e.g., `npm run dev`, `npm run build`, `npm test`).
- If you add scripts, prefer `package.json` scripts over ad-hoc shell commands.

## Coding Style & Naming Conventions
- No formatting or linting tools are configured yet.
- When code is added, adopt a consistent formatter (e.g., Prettier for JS/TS) and document it here.
- Suggested naming: use `kebab-case` for filenames and folders, `camelCase` for variables/functions, and `PascalCase` for React components.

## Testing Guidelines
- There are no tests yet.
- When tests are introduced, define the test framework (e.g., Jest, Vitest) and place tests alongside source (`*.test.ts`) or under `tests/`.
- Add a minimum expectation for new features (e.g., at least one unit test per new module).

## Commit & Pull Request Guidelines
- The repository has no commit history yet, so no conventions are established.
- Use clear, imperative commit subjects (e.g., “Add ingestion API skeleton”). If you adopt a standard like Conventional Commits, note it here.
- PRs should include a brief summary, key changes, and any screenshots for UI updates.

## Security & Configuration Tips
- Keep secrets out of the repo. Use `.env` files and document required variables in a future `README.md`.
- For any Supabase/LiteLLM keys, store them only in server-side environments.

## Agent-Specific Instructions
- When dealing with Supabase (auth, storage, SQL, or schema changes), use the Supabase MCP tooling first instead of guessing.
