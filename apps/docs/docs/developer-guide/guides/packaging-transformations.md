---
sidebar_position: 7
---

# Packaging Transformations

This page explains how to take a transformation you have written (see
[Writing Transformations](./writing-transformations.md)) and turn it
into a package others can install with `synth transformation install`.

A transformation package is an ordinary npm-compatible package
(`transformation install` takes a local package directory) plus a
Synthesis **manifest** that declares everything the CLI needs to discover,
type-check, and run the transformation without loading code.

## The manifest

The manifest is a JSON object. Here is the manifest of the
`eer-to-relational` example (`examples/eer-to-sql/eer-to-relational`),
a configuration-based EER-to-relational model-to-model transformation:

```json
{
  "kind": "m2m",
  "entry": "./dist/transformation.js",
  "exportName": "EER2RelDomainWithDecisionTransformation",
  "source": {
    "metamodel": "eer-metamodel"
  },
  "target": {
    "metamodel": "relational-metamodel",
    "components": "relational-metamodel"
  },
  "parts": {
    "metamodels": [
      {
        "module": "eer-metamodel/as-model",
        "exportName": "EERModel"
      }
    ],
    "decisionModel": {
      "module": "./dist/decision-model.js",
      "exportName": "RelationSchemaDesignIssues"
    },
    "bindingModel": {
      "module": "./dist/binding-model.js",
      "exportName": "ER_Bindings"
    }
  }
}
```

### Field reference

| Field | Type | Purpose |
|---|---|---|
| `kind` | `"m2m"` or `"m2t"` | Model-to-model or model-to-text. Decides the whole run shape (`--out` vs `--out-dir`); never guessed from the command name. |
| `entry` | module specifier | The module exporting the transformation class, package-relative (`./dist/transformation.js`) or a bare package specifier. |
| `exportName` | string | Named export of the transformation class inside `entry`. |
| `source.metamodel` | string | The source metamodel package's specifier. The input model must instantiate it; checked against the input's `$synth` header before running, and used for chain type-checking and completion filtering. |
| `target.metamodel` | string | The target metamodel package's specifier (`"text"` for m2t). |
| `target.components` | module specifier | m2m only: the JSX component module used to write the result model back as a workspace `.tsx` file. By convention this is the target metamodel package itself, whose bare specifier exports the components flat. Required for an m2m result to be written. |
| `parts.metamodels` | array of `{ module, exportName }` | The metamodel-as-model module(s), rendered into the store before the decision and binding models. By convention a metamodel package exports its own under the `as-model` subpath (`eer-metamodel/as-model`). |
| `parts.decisionModel` | `{ module, exportName }` | The decision model declaring the transformation's open issues, options, and defaults. |
| `parts.bindingModel` | `{ module, exportName }` | The binding model attaching those issues to source-model element types. |
| `name` | string | Optional override; otherwise the package.json `name` is the transformation's name. |

The package's `name` and `version` come from `package.json` (`name` may be
overridden in the manifest). A transformation is **configuration-based** exactly
when it declares both `parts.decisionModel` and `parts.bindingModel`; there
is no separate issue list in the manifest. The decision and binding models
are the single source of truth: `synth transformation show` loads the
decision model to display the issues, options, and defaults, and
`synth config init` / `--default-configs` generate configurations from them
(see [Configurations](../../user-guide/guides/configurations.md)). The parts ship **with** the
transformation package; they are not workspace models.

### Manifest location

The manifest is a **`synth.json` file at the package root**; it is what
`synth transformation init` scaffolds, and its presence identifies a
directory as a transformation package at a glance. If you publish to npm,
remember to include it in `package.json`'s `files` list.

`transformation install` validates the manifest with precise per-field
errors and refuses packages without a valid one. The modules the manifest
names (`entry`, `parts.*`) are resolved and imported when the transformation
actually runs: package-relative paths against the installed package
directory, bare specifiers through the CLI's resolver.

## Metamodels are dependencies

Every metamodel a transformation names, in its manifest or in its code,
must be an importable package; the tutorial's
[source metamodel page](../tutorial/model-to-model/part-1-basic/1-source-metamodel.md#why-a-metamodel-must-be-an-importable-package)
explains why. When the CLI runs an installed transformation, it
resolves each bare specifier against its own installation first, so
framework packages keep their single module instance, and falls back
to the installed transformation packages' own dependencies. Shipping
the metamodel package as an ordinary dependency of the transformation
is therefore the normal way to distribute one: installing the
transformation brings the metamodel with it, and every importer in a
run shares one module instance, which is what keeps aelastics type
identity intact.

The manifest's metamodel strings (`source.metamodel`,
`target.metamodel`, `parts.metamodels[].module`) are those package
specifiers. They are also the identities the chain type-check
compares, which is why two transformations chain only when one's
target names the same metamodel package as the other's source.

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
#    (source/target metamodels, exportName; parts for configuration-based tx)

# 3. Build: runs the package's build script (or tsc directly)
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

`synth transformation install <dir>` takes a **local package
directory**, built and ready to load:

```bash
synth transformation install ./my-transformation
```

After install, the package lands under `<workspace>/transformations/<name>/`
with its bundled dependencies; the workspace `config.json` records the
install (name, version, kind, variability). A workspace holds **one**
installed version per transformation name; installing another version
replaces it, and `synth transformation ls` shows what is current.
Uninstalling is guarded: `synth transformation uninstall` refuses while a
saved pipeline lists the transformation as a step (see
[Pipelines](../../user-guide/guides/pipelines.md#guards-and-health)).
