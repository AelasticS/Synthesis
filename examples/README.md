# Synthesis examples

Complete, installable transformation packages. Each example is shaped
exactly like a package a transformation author would publish: its own
`package.json`, a `synth.json` manifest, TypeScript sources built with
plain `tsc`, and a README explaining what it demonstrates and how to run
it with the `synth` CLI.

The examples are Rush projects (CI builds them against the workspace),
but deliberately carry no monorepo tooling beyond that — no heft, no
rigs — so any example directory can be read, copied, or extracted as a
standalone starting point.

## Catalog

Fundamentals

| Example | Kind | Shows | Status |
| --- | --- | --- | --- |
| [rel-copy](./rel-copy/) | m2m | The minimal transformation: class, manifest, install, run | available |
| tasklist-to-html | m2t | Authoring your own metamodel + simple text generation | planned |
| eer-to-relational-basic | m2m | The classic EER→relational mapping, one fixed strategy | planned |

Text generation (m2t)

| Example | Kind | Shows | Status |
| --- | --- | --- | --- |
| rel-to-sql-ddl | m2t | Decision-based SQL DDL generation | planned (graduating from CLI fixture) |
| eer-to-markdown-docs | m2t | Markdown documentation from any EER model | planned |
| eer-to-mermaid-er | m2t | Mermaid `erDiagram` source from an EER model | planned |
| types-to-typescript | m2t | types-metamodel → TypeScript declarations | planned |

Variability (decision-based)

| Example | Kind | Shows | Status |
| --- | --- | --- | --- |
| eer-to-relational | m2m | The flagship: decision model, binding model, `parts` | planned (graduating from CLI fixture) |
| bpm-to-mermaid | m2t | BPM process model → Mermaid flowchart | planned |
| one-source-many-configs | — | Same source, several configurations, different outputs | planned |

Composition

| Example | Kind | Shows | Status |
| --- | --- | --- | --- |
| eer-to-sql-pipeline | pipeline | Chaining eer-to-relational → rel-to-sql-ddl | planned |

The catalog grows incrementally; each example is self-contained, so new
domains can be added at any time.

## Conventions

- `synth.json` at the package root is the transformation manifest — the
  only supported location.
- `entry` points into `dist/` (the `tsc` output); `files` lists `dist`
  and `synth.json` so a published package stays installable.
- Dependencies on `@synthesis/*` packages use `workspace:*` ranges; on
  extraction to a standalone repository these become version ranges.
- An example that needs an input model ships one under `sample/`,
  importable via `synth model import`.
