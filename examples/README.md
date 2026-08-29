# Synthesis examples

Complete, installable transformation packages. Each example is shaped
exactly like a package a transformation author would publish: its own
`package.json`, a `synth.json` manifest, TypeScript sources built with
plain `tsc`, and a README explaining what it demonstrates and how to run
it with the `synth` CLI.

The examples are Rush projects (CI builds them against the workspace),
but they deliberately carry no monorepo tooling beyond that: no heft,
no rigs. Any example directory can be read, copied, or extracted as a
standalone starting point.

## Catalog

### Tutorial companions

Every part of the model-to-model tutorial has its own complete,
independent package. Each one is the finished state of that part, so it
doubles as the answer key while you follow along.

| Example | Kind | Shows | Status |
| --- | --- | --- | --- |
| [eer-tutorial-basic](./eer-tutorial-basic/) | m2m | Part 1: simple EER to relational with fixed logic | available |
| [eer-tutorial-advanced](./eer-tutorial-advanced/) | m2m | Part 2: entity rule specialization with `@SpecPoint` and `@SpecOption` | available |
| eer-tutorial-configuration-based | m2m | Part 3: relationship mapping decided by a configuration model | in preparation |
| eer-tutorial-higher-order | m2m | Part 4: higher-order templates | in preparation |

### Full examples

Larger packages that stand on their own rather than teaching one concept
at a time.

| Example | Kind | Shows | Status |
| --- | --- | --- | --- |
| [eer-to-relational](./eer-to-relational/) | m2m | Configuration-based transformation over the full EER metamodel: decision model, binding model, manifest `parts` | available |
| [rel-to-sql-ddl](./rel-to-sql-ddl/) | m2t | Text generation with one global configuration issue (identifier quoting) | available |

Further examples (text generation from EER models, Mermaid diagrams,
TypeScript declarations, pipeline composition) are under discussion and
will be added to this table as they are agreed.

The catalog grows incrementally; each example is self-contained, so new
domains can be added at any time.

## Conventions

- `synth.json` at the package root is the transformation manifest, the
  only supported location.
- `entry` points into `dist/` (the `tsc` output); `files` lists `dist`
  and `synth.json` so a published package stays installable.
- Dependencies on `@synthesis/*` packages use `workspace:*` ranges; on
  extraction to a standalone repository these become version ranges.
- An example that needs an input model ships one under `sample/`,
  importable via `synth model import`.
- Every example is smoke tested through the real CLI: its `test` script
  runs [smoke.mjs](./smoke.mjs), which installs the package into an
  isolated workspace, imports the sample models, and executes one run
  (with default configurations when the package is configuration-based). CI
  runs this for every example on every pull request
  (`.github/workflows/examples.yml`), so the catalog stays executable
  truth rather than prose.
