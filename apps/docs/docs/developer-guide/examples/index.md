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

## Tutorial companions

Each part of the [model-to-model tutorial](../tutorial/model-to-model/index.md)
has its own complete package, which is the finished state of that part.

| Example | Kind | What it shows |
| --- | --- | --- |
| `examples/eer-tutorial-basic` | m2m | Part 1: a simple EER to relational transformation with fixed logic. |
| `examples/eer-tutorial-advanced` | m2m | Part 2: the entity rule specialized per entity subtype with `@SpecPoint` and `@SpecOption`. |

## Full examples

| Example | Kind | What it shows |
| --- | --- | --- |
| `examples/eer-to-relational` | m2m | A configuration-based transformation over the full EER metamodel: decision model, binding model, manifest `parts`, and configurations. |
| `examples/rel-to-sql-ddl` | m2t | Text generation: a relational schema becomes a SQL DDL file, with one global issue (identifier quoting). |

## Running an example

Every example follows the same loop, spelled out in its README. For the
Part 1 companion:

```bash
cd examples/eer-tutorial-basic

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation run eer-tutorial-basic --in demo/library --out demo/library-rel
synth model show demo/library-rel
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

The catalog grows incrementally, and `examples/README.md` in the
repository is its index. For starting a package of your own, the
repository also provides `templates/transformation-template`, a working
starter with the same shape as these examples, complementing
`synth transformation init`.
