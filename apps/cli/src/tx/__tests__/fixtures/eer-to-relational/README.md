# eer-to-relational (fixture)

Installable transformation package used by the CLI test suite. It doubles
as the authoring reference for the transformation package layout.

## Layout

```
eer-to-relational/
├── package.json        name, version, author (standard npm metadata)
├── synth.json          the transformation manifest (takes precedence over
│                       a `synth` block in package.json)
├── README.md
└── lib/
    └── transformation.js   compiled entry module named by `entry`
```

## Manifest (`synth.json`)

- `kind`: `m2m` (model-to-model) or `m2t` (model-to-text). Decides how
  `tx run` treats the output; it is never inferred from the code.
- `entry` + `exportName`: the module and named export of the
  transformation class. `entry` is resolved relative to the package root
  (or, like every module specifier here, may be a bare package specifier
  resolved through the package's own dependencies at execution time).
- `source.metamodel` / `target.metamodel`: metamodel identifiers used
  for validation and chain type-checking without loading any code.
- `target.components`: import specifier of the JSX component module of
  the target metamodel. The CLI needs it to wrap M2M output into a
  workspace model file.
- `parts`: modules shipped with the package that must be rendered into
  the model store before execution, in this order: `metamodels` (functions
  `(store) => ExprNode`), then `decisionModel`, then `bindingModel`.
  Declaring both `decisionModel` and `bindingModel` marks the
  transformation as decision-based (variability); the manifest never
  duplicates the issue list; the decision model module is the single
  source of truth.

## Note on dependencies

`lib/transformation.js` and the `parts` modules re-export compiled code
from `@synthesis/examples`, which works here because the CLI itself
depends on that package. A standalone transformation package would ship
its own compiled modules and declare its dependencies in `package.json`;
the layout and the manifest stay exactly the same.
