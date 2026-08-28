# rel-copy

The minimal Synthesis transformation: an endogenous m2m copy where the
source and the target metamodel are the same relational metamodel. With
no mapping logic to distract, everything on display is the mechanics
every transformation package shares:

- [src/transformation.ts](./src/transformation.ts): a transformation
  class extending `abstractM2M`; its `template()` maps the source model
  onto a JSX expression tree over the target metamodel's components.
  Written without JSX syntax or decorators, so the only moving part is
  the `createExprNode` factory itself.
- [synth.json](./synth.json): the manifest, declaring kind, entry module
  and export, and source/target metamodels. This is everything the CLI
  needs to install and run the package without loading its code.
- [package.json](./package.json): plain npm metadata; `files` ships
  `dist` and `synth.json`.
- [sample/library-db.tsx](./sample/library-db.tsx): a small relational
  model to run the transformation on.

## Try it

```bash
# Build the package (from the repository root: rush build -t rel-copy)
npm run build

# Set up a workspace and import the sample model
synth init
synth namespace mk demo
synth model import sample/library-db.tsx --as demo/library-db

# Install and run the transformation
synth transformation install .
synth transformation run rel-copy --in demo/library-db --out demo/library-db-copy

# Inspect the result
synth model show demo/library-db-copy
```

The output model `demo/library-db-copy` contains the same tables and
columns as the input, under the schema name `LibraryDb_copy`, plus a
provenance header recording which transformation produced it from what.

## What to look at next

[eer-to-relational](../eer-to-relational/) applies the same package
mechanics to a real mapping with decision-based variability.
