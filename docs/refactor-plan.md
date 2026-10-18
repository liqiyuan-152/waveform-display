# Refactor implementation and verification

The completed OpenSpec change is archived at `openspec/changes/archive/2026-10-18-refactor-framework-independent-waveform/`. Its checked task list and acceptance map record the completed work. The five capability specifications were merged into `openspec/specs/` after implementation and verification.

Implementation sequence: preserve the original SVG and API baseline; split library and Demo builds; extract committed models and domain/tick/layout logic; establish owned views and lifecycle; add atomic updates/events/actions; migrate the Demo to Vue; implement opt-in instance animation; verify packed consumers, deployment, browser visuals and resources.

The original revision is `dc651edd2137ee3ac15bde0a6cf321f587fc0bba`. Static chart screenshots are compared against that revision. Performance comparisons include a workload where every update changes data; identical-input short-circuiting is measured separately and is not used to conceal changed-data regressions.

The waveform-analysis reference revision is `e8985d7027b37036247cc2d9069a17297bde889b`. Its own reuse license was not established, so implementation is independent and uses only the specified behavior as reference. No source, pagination or annotation functionality was copied. The reference audit is retained with the evidence.

Run Node 20 and pnpm 9. `pnpm check` covers TypeScript, Vue SFC checks, all tests, library bundles/declarations and the Demo production build. Browser fixtures cover visual compatibility and deterministic animation states. Release verification additionally installs an actual `pnpm pack` tarball in a clean consumer and checks root/subpath Demo builds and Docker deployment.
