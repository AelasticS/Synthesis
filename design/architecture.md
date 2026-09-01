# Monorepo Architecture

> Internal architecture documentation for contributors to Synthesis itself.
> User and developer documentation lives on the
> [documentation site](https://AelasticS.github.io/aelastics/).

Synthesis is organized as a Rush monorepo with a deliberately small number
of packages. The three aelastics libraries are standalone; the whole
Synthesis runtime is one library; the CLI is one application; everything
domain-shaped lives with the examples.

## Packages

| Home | Package | Role |
| --- | --- | --- |
| libraries/aelastics-result | `@aelastics/result` | Result monad for error-typed returns (standalone) |
| libraries/aelastics-types | `@aelastics/types` | runtime type schema framework (standalone) |
| libraries/aelastics-store | `@aelastics/store` | observable store (standalone) |
| libraries/synthesis | `@aelastics/synthesis` | the Synthesis library: JSX runtime, core metamodel, model store, m2m and m2t engines, configuration-based variability |
| apps/cli | `@aelastics/synthesis-cli` | the `synth` CLI |
| apps/docs | `@synthesis/docs` | Docusaurus site, not in the build graph |
| examples/tutorial | seven tutorial companions plus `metamodels/` | the tutorial suite |
| examples/eer-to-sql | two full examples plus `metamodels/` | the full-example suite |
| templates/transformation-template | `transformation-template` | starter package |

Dependency direction is strictly downward in this list: the aelastics
libraries know nothing about Synthesis, `@aelastics/synthesis` depends only
on them, the CLI depends on the library, and example packages depend on the
library, on their suite's metamodel packages, and (as a devDependency, for
the smoke harness) on the CLI. No cycles.

## The @aelastics/synthesis export surface

The root of the package exports nothing. Consumers import from namespaced
subpaths; use sites stay unqualified because JSX tags, decorators, and the
default jsxFactory all expect bare identifiers in scope:

| Subpath | Contents |
| --- | --- |
| `./jsx` | `createExprNode`, `ExprNode`, `Template`, `CpxTemplate`, `Context`, the `Element` and `Model` JSX wrappers |
| `./metamodel` | M3 core schemas: `Model`, `ModelElement`, `Namespace`, basic types |
| `./store` | `ModelStore` |
| `./m2m` | `abstractM2M`, `M2M`, `E2E`, `SpecPoint`, `SpecOption`, trace runtime |
| `./m2t` | `M2T`, `Doc`, `Sec`, `P`, `SecParent`, text-document model types, `generate` |
| `./variability` | `DecisionAwareM2M`, `VarPoint`, `VarOption`, `Default`, `Option`, the default-configuration generator |
| `./metamodels/decision`, `./binding`, `./configuration` | internal metamodels, JSX components flat, type schemas under `/model` |
| `./metamodels/trace`, `./metamodels/trace-extensions` | the trace metamodel and its decision-aware extensions |
| `./metamodels/types/...` | the aelastics-types-aware type metamodel (framework infrastructure: the decision metamodel builds on it) |

The `./metamodel` subpath exists because the schema `Model` and the JSX
wrapper `Model` collide at any flat root. Internally the package keeps its
history as folders (`src/jsx-runtime/`, `src/metamodel-core/`,
`src/engine/`, `src/decision-framework/`, `src/metamodels/types/`) with
the namespace modules re-exporting from them; the folders are private.

The bpm metamodel lives in the engine test tree as a fixture; it is not
exported.

## Metamodels are packages owned by their example suites

There is no shared metamodel package. A metamodel is a small package owned
by the suite whose examples share it:

- `eer-tutorial-metamodel` and `rel-tutorial-metamodel` under
  examples/tutorial/metamodels: the teaching metamodels. rel-tutorial is
  the tutorial's pivot, target of the three m2m parts and source of the
  three m2t parts.
- `eer-metamodel` and `relational-metamodel` under
  examples/eer-to-sql/metamodels: the full-example suite's own metamodels;
  the two full examples are a chain pair over them.

Every metamodel package owns all its facets under one uniform convention:
the bare package exports the JSX components, `/model` exports the type
schemas, `/as-model` exports the metamodel-as-model factory that manifests
reference in `parts`. Manifest `source`/`target.metamodel` strings are the
package specifiers, which is also the identity the CLI's chain type-check
compares.

## Type identity and module resolution

Everything in Synthesis compares aelastics type instances (`isTypeOf`), so
a model, the transformation that consumes it, and the engine must share
one set of module instances. The CLI enforces this when it loads workspace
models and manifest modules: bare imports are resolved centrally and
externalized to absolute paths, never bundled. Resolution tries the CLI
installation first (framework packages are always the CLI's own
instances), then falls back to the installed transformation packages'
own dependencies, memoizing one absolute path per specifier per process
(`apps/cli/src/models/resolution.ts`). That fallback is what lets a
transformation ship its metamodel as an ordinary dependency instead of
requiring metamodels to be part of the CLI installation.

## Why this structure?

The previous ten-package decomposition imposed dependency wiring, deep
import paths that leaked packaging into domain code, and version coupling,
without buying independence anyone used. One library with namespaced
subpaths keeps responsibilities legible without the costs. Metamodels
belong to the example world because they are domain artifacts: examples
can be read, copied, or extracted whole, together with the metamodels they
conform to, and nothing domain-shaped hides inside the framework. The
full decision record is in [consolidation.md](./consolidation.md).
