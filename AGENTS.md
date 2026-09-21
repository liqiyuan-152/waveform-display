# Repository Guidelines

## Project Structure & Module Organization

The library source lives in `src/`. `src/core/` owns data normalization, domain calculation, and the `Waveform` lifecycle. SVG drawing is split by concern under `src/renderer/`, configuration defaults and merging live in `src/config/`, and public TypeScript contracts are in `src/types/`. Keep exports centralized in `src/index.ts`.

The interactive Vite example is under `src/demo/`; its JSON and CSS are demo assets, not library runtime dependencies. Tests live under the root-level `tests/` directory and mirror the source structure. GitHub Actions configuration is in `.github/workflows/ci.yml`. `dist/` and `node_modules/` are generated and ignored.

## Build, Test, and Development Commands

Use Node.js 20 and pnpm 9 to match CI.

- `pnpm install`: install dependencies from `pnpm-lock.yaml`.
- `pnpm dev`: start the Vite development server and demo.
- `pnpm typecheck`: run strict TypeScript checks without emitting files.
- `pnpm test`: run the Vitest suite once.
- `pnpm test -- tests/core/Waveform.axes.test.ts`: run one test file.
- `pnpm build`: emit declarations and build ES/UMD library bundles.
- `pnpm check`: run type checking, all tests, and the production build; use this before submitting changes.

## Coding Style & Naming Conventions

Write strict TypeScript using ES modules. Match the existing style: two-space indentation, single quotes, no semicolons, and trailing commas in multiline structures. Use `PascalCase` for classes and interfaces, `camelCase` for functions and variables, and descriptive kebab-free filenames such as `normalize.ts` or `Waveform.axes.test.ts`. Keep rendering modules focused and prefer typed configuration helpers over untyped object manipulation.

No formatter or linter is configured, so review style consistency manually and rely on `pnpm typecheck` for static validation.

## Testing Guidelines

Tests use Vitest; DOM rendering tests declare the `jsdom` environment at the top of the file. Add focused unit tests under the matching `tests/` subdirectory and assert observable SVG output for rendering behavior. Cover invalid data, explicit configuration overrides, empty or degenerate domains, and runtime updates when relevant. There is no numeric coverage threshold, but every behavior change should include a regression test.

## Commit & Pull Request Guidelines

History generally uses short, imperative Conventional Commit prefixes such as `feat:`, `docs:`, `demo:`, and `ci:`. Keep each commit scoped to one coherent change.

Pull requests should explain the behavior and motivation, list validation performed, and link related issues. Include before/after screenshots for demo or visible SVG changes. Ensure `pnpm check` passes and avoid committing generated `dist/` output.
