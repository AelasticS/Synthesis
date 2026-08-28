# Engine and CLI follow-ups

Carried over from the CLI-execution effort (Aug 2026) when its working
folder (`design/cli-execution/`) was retired. Each item should become a
tracked issue when the repository is pushed. The CLI ships with working
workarounds for all of them; none blocks the cli-v0.1.0 release.

## Engine-side (libraries) — real fixes belong here

- **`ModelStore.exportToJSX` output does not round-trip** (inverse links as
  broken sub-elements, stringified booleans, flattened element refs). tx run
  prefers the transformation's own `context.output.jsx` — an undocumented
  field. The engine should offer a supported `serializeModel(root)` API
  returning `{ jsx, usedComponents }` so the CLI stops regex-scanning JSX
  text for tags.
- **Option→Issue containment is not materialized** in the rendered decision
  model (`issue.options` empty, option's parent unset). The CLI reconstructs
  ownership from `elements[]` document order (with cross-issue option-name
  collision warnings) — fragile. The store's inverse-property machinery
  should materialize the link; then delete the document-order heuristic in
  `apps/cli/src/tx/decisions.ts`.
- **M2T `generate` flattens directory nesting**: `ItemResult.itemPath` is
  only the bare doc name, so `<Dir>` structure is lost and same-named docs
  collide (the CLI detects collisions and fails instead of silently
  overwriting). `generate` should report the accumulated path.
- **Configuration models round-trip through neither engine serialization**:
  `context.output.jsx` prints object props as bare identifiers
  (`selectedOption={SnakeCase}`) and `exportToJSX` inlines referenced
  graphs — the CLI serializes configuration models itself
  (`apps/cli/src/tx/config-model.ts`). An engine `serializeModel` API
  should cover configuration models too (emit `$refByName` references for
  cross-model links instead of inlining).
- **Typed DanglingReferenceError in `@synthesis/jsx-runtime`**: the CLI
  classifies missing-dependency render failures by matching the engine's
  error message text; a typed error carrying the missing name as data
  would make that robust.

## CLI-side, consciously postponed

- **Header fast path via TS AST** — the hand-rolled `$synth` literal parser
  anchors on the first textual `export const $synth =`; that string inside a
  comment/template literal would confuse it. A `ts.createSourceFile` parse
  would be robust and delete the writer's second string-scanner. Revisit if
  headers ever misparse in practice (typescript would become a runtime dep).
- **Metamodel derivation from the rendered store** — derive
  `header.metamodel` authoritatively from the rendered root element's schema
  instead of the import-scan heuristic (removes the benign validate warning
  on generated models).
- **esbuild transpile cache** — key by content hash in a stable cache dir to
  skip repeat transpiles of unchanged models.
- **Concurrent file reads** in doctor and model ls; subtree-rooted walk for
  `model ls --ns`; both matter only for large workspaces.

## Resolved decisions

- **Transformation manifest location** — resolved 2026-08-28: `synth.json`
  at the package root is the ONLY manifest location. The fallback that
  read a `synth` object from `package.json` (a remnant of the first
  tx-management implementation; the docs' spec always said `synth.json`)
  is removed from the reader; a package still carrying a `synth` block
  gets a migration hint in the manifest-not-found error. Decided ahead of
  the tutorial and template-repository work, which freezes the convention
  publicly.

## Release caveat (cli-v0.1.0)

- **Cross-platform tarballs and esbuild**: `oclif pack` installs
  production dependencies once on the build machine and copies them into
  every platform tarball. esbuild ships a platform-specific binary, so
  only tarballs matching the build platform (ubuntu runner → linux) are
  fully functional; darwin/win32 tarballs carry the linux esbuild binary
  and model loading would fail there. Before advertising non-Linux
  tarballs, make the pack step install the per-target esbuild binary
  (esbuild's `@esbuild/<platform>` optional packages) into each target
  workspace, and smoke-test on the target OS.
