---
sidebar_position: 4
---

# Examples

The repository ships a catalog of complete, installable transformation
packages under `examples/`. Each one is shaped exactly like a package a
transformation author would publish: its own `package.json`, a
`synth.json` manifest, TypeScript sources built with plain `tsc`, a
sample input model, and a README that walks through what it
demonstrates and how to run it. Every example is smoke tested through
the real CLI in CI, so the catalog stays executable truth rather than
prose.

## Available examples

| Example | Kind | What it shows |
| --- | --- | --- |
| `examples/rel-copy` | m2m | The minimal transformation: manifest, class, install, run. Companion to Tutorial Part I. |
| `examples/eer-to-relational` | m2m | The decision-based flagship: decision model, binding model, manifest `parts`, configurations. Companion to Tutorial Part II. |
| `examples/rel-to-sql-ddl` | m2t | Text generation: a relational schema becomes a SQL DDL file, with one global decision (identifier quoting). |

## Running an example

Every example follows the same loop, spelled out in its README. For
rel-copy:

```bash
cd examples/rel-copy

synth init
synth namespace mk demo
synth model import sample/library-db.tsx --as demo/library-db

synth transformation install .
synth transformation run rel-copy --in demo/library-db --out demo/library-db-copy
synth model show demo/library-db-copy
```

## Conventions

- `synth.json` at the package root is the transformation manifest, the
  only supported location.
- Manifest `entry` and `parts` point into `dist/` (the `tsc` output)
  with package-relative paths; `files` ships `dist` and `synth.json`.
- Sample input models live under `sample/`, importable with
  `synth model import`.
- Each example's `test` script runs the shared smoke harness
  (`examples/smoke.mjs`), which installs the package into an isolated
  workspace and executes a real run.

The catalog grows incrementally; the `examples/README.md` file in the
repository lists both the available packages and the planned ones. For
starting a package of your own, the repository also provides
`templates/transformation-template`, a working starter with the same
shape as these examples, complementing `synth transformation init`.
