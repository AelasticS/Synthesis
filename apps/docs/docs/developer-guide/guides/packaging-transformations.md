---
sidebar_position: 7
---

# Packaging Transformations

This page explains how to take a transformation you have written (see
[Writing Transformations](./writing-transformations.md)) and turn it
into a package others can install with `synth transformation install`.

A transformation package is npm-compatible — `transformation install`
accepts npm names, git URLs, local directories, and `.tgz` tarballs — plus a
Synthesis **manifest** that declares everything the CLI needs to discover,
type-check, and run the transformation without loading code.

## The manifest

The manifest is a JSON object. Here is the manifest of an EER-to-relational
model-to-model transformation, as installed by the CLI's own test suite:

```json
{
  "kind": "m2m",
  "entry": "./lib/transformation.js",
  "exportName": "EER2RelDomainWithDecisionTransformation",
  "source": {
    "metamodel": "@synthesis/standard-metamodels/eer"
  },
  "target": {
    "metamodel": "@synthesis/standard-metamodels/relational",
    "components": "@synthesis/standard-metamodels/relational/components-legacy"
  },
  "parts": {
    "metamodels": [
      { "module": "@synthesis/examples/lib/eer-to-rel-small/er-metamodel.js", "exportName": "EERModel" }
    ],
    "decisionModel": {
      "module": "@synthesis/examples/lib/eer-to-rel-small/02-decision-model.js",
      "exportName": "RelationSchemaDesignIssues"
    },
    "bindingModel": {
      "module": "@synthesis/examples/lib/eer-to-rel-small/03-binding-model.js",
      "exportName": "ER_Bindings"
    }
  }
}
```

### Field reference

| Field | Type | Purpose |
|---|---|---|
| `kind` | `"m2m"` or `"m2t"` | Model-to-model or model-to-text. Decides the whole run shape (`--out` vs `--out-dir`); never guessed from the command name. |
| `entry` | module specifier | The module exporting the transformation class — package-relative (`./lib/transformation.js`) or a bare package specifier. |
| `exportName` | string | Named export of the transformation class inside `entry`. |
| `source.metamodel` | string | Metamodel the input model must instantiate; checked against the input's `$synth` header before running, and used for chain type-checking and completion filtering. |
| `target.metamodel` | string | Metamodel of the result (`"text"` for m2t). |
| `target.components` | module specifier | m2m only: the JSX component module used to write the result model back as a workspace `.tsx` file. Required for an m2m result to be written. |
| `parts.metamodels` | array of `{ module, exportName }` | The package's own metamodel module(s), registered before rendering. |
| `parts.decisionModel` | `{ module, exportName }` | The decision model declaring the transformation's open issues, options, and defaults. |
| `parts.bindingModel` | `{ module, exportName }` | The binding model attaching those issues to source-model element types. |
| `name` | string | Optional override; otherwise the package.json `name` is the transformation's name. |

The package's `name` and `version` come from `package.json` (`name` may be
overridden in the manifest). A transformation is **decision-based** exactly
when it declares both `parts.decisionModel` and `parts.bindingModel` — there
is no separate issue list in the manifest. The decision and binding models
are the single source of truth: `synth transformation show` loads the
decision model to display the issues, options, and defaults, and
`synth config init` / `--default-configs` generate configurations from them
(see [Configurations](../../user-guide/guides/configurations.md)). The parts ship **with** the
transformation package; they are not workspace models.

### Manifest location

The manifest is a **`synth.json` file at the package root** — it is what
`synth transformation init` scaffolds, and its presence identifies a
directory as a transformation package at a glance. If you publish to npm,
remember to include it in `package.json`'s `files` list.

`transformation install` validates the manifest with precise per-field
errors and refuses packages without a valid one. The modules the manifest
names (`entry`, `parts.*`) are resolved and imported when the transformation
actually runs.

## Project layout

`synth transformation init <name>` scaffolds an installable project:

```text
my-transformation/
├── package.json          # npm metadata: name, version, build script
├── synth.json            # the manifest (see above)
├── tsconfig.json
└── src/
    └── index.ts          # exports the class named by 'exportName'
```

The class exported from `entry` under `exportName` is what
`transformation run` loads and executes; for m2m it produces the output
model in the shared store, for m2t it drives the engine's text generation.

## Author workflow

```bash
# 1. Scaffold
synth transformation init my-transformation
cd my-transformation
npm install

# 2. Implement src/index.ts and fill in the synth.json placeholders
#    (source/target metamodels, exportName; parts for decision-based tx)

# 3. Build — runs the package's build script (or tsc directly)
synth transformation build

# 4. Run the project's test fixtures
synth transformation test

# 5. Try it in your own workspace, straight from the project directory
synth transformation install .
synth transformation run my-transformation --in com.example/some-model \
  --out com.example/some-model-out

# 6. Distribute: tarball, or publish to npm
synth transformation pack
synth transformation publish
```

`transformation publish` shells out to `npm publish` (`--access`, `--tag`,
`--dry-run` pass through).

## Install resolution

`synth transformation install <package>` accepts any of:

| Source | Example |
|---|---|
| Published npm package | `synth transformation install @aelastics/eer-to-relational` |
| Git URL | `synth transformation install git+https://github.com/user/tx.git` |
| Local directory | `synth transformation install ./my-transformation` |
| Local tarball | `synth transformation install ./my-transformation-0.1.0.tgz` |

After install, the package lands under `<workspace>/transformations/<name>/`
with its bundled dependencies; the workspace `config.json` records the
install (name, version, kind, variability). A workspace holds **one**
installed version per transformation name — installing another version
replaces it, and `synth transformation ls` shows what is current.
Uninstalling is guarded: `synth transformation uninstall` refuses while a
saved pipeline lists the transformation as a step (see
[Pipelines](../../user-guide/guides/pipelines.md#guards-and-health)).
