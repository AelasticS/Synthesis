# rel-to-sql-ddl

Text generation (m2t): a relational schema becomes a SQL DDL file. In
Synthesis, generating text is a transformation like any other; the
target is the engine's text-document metamodel (documents, sections,
paragraphs), and the CLI serializes the resulting documents to files
under `--out-dir`.

The transformation is decision-based with a single global issue,
IdentifierQuoting: emit SQL identifiers verbatim (Unquoted, the
default) or wrapped in double quotes (DoubleQuoted).

## The package anatomy

- [src/transformation.tsx](./src/transformation.tsx): the template maps
  the schema onto an `<M2T>` document tree. Each table becomes a section
  of `CREATE TABLE` paragraphs; `quoteIdentifier` is the `@VarPoint`
  the IdentifierQuoting issue controls.
- [src/decision-model.tsx](./src/decision-model.tsx): the design space,
  here a single `GlobalIssue` (model-wide, no per-element bindings).
- [src/binding-model.tsx](./src/binding-model.tsx): connects the
  decision model to the relational metamodel; global issues need no
  per-element bindings, so the body is empty.
- [src/rel-metamodel.tsx](./src/rel-metamodel.tsx): a minimal relational
  metamodel model for the binding model to reference.
- [sample/library-db.tsx](./sample/library-db.tsx): a small relational
  schema to generate DDL from.

## Try it

```bash
# Build the package (from the repository root: rush build -t rel-to-sql-ddl)
npm run build

# Set up a workspace and import the sample model
synth init
synth namespace mk demo
synth model import sample/library-db.tsx --as demo/library-db

# Install and generate
synth transformation install .
synth transformation run rel-to-sql-ddl --in demo/library-db --default-configs --out-dir ./generated

cat generated/LibraryDb.sql
```

The generated file contains one `CREATE TABLE` statement per table, with
key, autoincrement, references, and nullability clauses derived from the
column properties.

## Chaining

This transformation composes with [eer-to-relational](../eer-to-relational/):
run that one first to produce a relational model from an EER schema, then
feed its output here to get DDL for it. The catalog's planned
eer-to-sql-pipeline example will package exactly that chain as a
pipeline file.

## What to look at next

[eer-to-relational](../eer-to-relational/) shows per-element decisions
and a binding condition; this example is the m2t counterpart.
