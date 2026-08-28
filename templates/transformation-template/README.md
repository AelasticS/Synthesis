# Synthesis transformation template

A batteries-included starting point for a new Synthesis transformation
package. Unlike a blank scaffold, it works on day zero: the starter
transformation builds, installs, runs against the bundled sample model,
and is smoke tested, so every change you make is a step from a working
state to a working state.

`synth transformation init` gives you the same layout as a minimal
generator; this template adds a working transformation, a sample model,
a smoke test, and CI.

## What is inside

```
transformation-template/
├── package.json          npm metadata; build (tsc) and test (smoke) scripts
├── synth.json            the transformation manifest
├── tsconfig.json
├── src/
│   └── index.ts          starter transformation (relational copy)
├── sample/
│   └── example-model.tsx sample input model
├── scripts/
│   └── smoke.mjs         installs and runs the package in an isolated workspace
└── .github/workflows/
    └── ci.yml            build + smoke on push and pull request
```

## Getting started

While the `@synthesis/*` packages are unpublished, copy this folder
within the Synthesis repository and register your package in
`rush.json`; the `workspace:*` ranges resolve from the monorepo. Once
the packages are on npm, this template becomes a standalone GitHub
template repository ("Use this template"), with the same content and
version ranges instead of `workspace:*`.

Then make it yours:

1. In `package.json`: set `name`, `description`, and `author`.
2. In `synth.json`: point `source.metamodel` and `target.metamodel` at
   your metamodels, and set `exportName` to your class name. For m2m,
   keep `target.components` in sync with the target metamodel.
3. In `src/index.ts`: rename the class and implement `template()`.
4. Replace `sample/example-model.tsx` with a model of your source
   metamodel, so the smoke test exercises the real thing.

## The loop

```bash
npm run build        # or: synth transformation build
npm test             # smoke: install + run in an isolated workspace

synth transformation install .
synth transformation run <your-name> --in <ref> --out <ref>
```

## Where to learn

The transformation tutorial walks through exactly this package shape,
first without variability and then with decision, binding, and
configuration models. The `examples/` catalog of the Synthesis
repository holds finished packages, from the minimal rel-copy to the
decision-based eer-to-relational; make yours look like those.
