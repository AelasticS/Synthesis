# eer-tutorial-name-scopes

Companion package of the model-to-model tutorial, Part 4. Part 1's
fixed-logic transformation moved onto the name-scopes stages of both
tutorial metamodels: the mapping rules are unchanged, the naming world
is not.

- `Entity` and `Table` are declared name scopes in the stage
  metamodels, so attribute and column names are unique per entity or
  table rather than per model.
- The sample carries natural names: all three keys are `id`, and both
  `Author` and `Category` have a `name`.
- Foreign key columns take the referenced entity's name as their
  prefix (`authorId`), and references into another table's scope are
  paths (`Author/id`).

The source metamodel is `eer-tutorial-metamodel/name-scopes`, the
target `rel-tutorial-metamodel/name-scopes`, each its base stage plus
one `declareNamespace` line.

## Try it

```bash
# Build the package (from the repository root: rush build -t eer-tutorial-name-scopes)
npm run build

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation run eer-tutorial-name-scopes --in demo/library --out demo/library-rel
synth model show demo/library-rel
```

The output contains the same five table declarations as Part 1's, but
every table has its own `id` column, the grafted foreign key is named
`authorId`, and the `references` props carry paths such as
`Author/id`.

## What to look at next

The full-featured suite [eer-to-relational](../../eer-to-sql/eer-to-relational/)
combines everything the tutorial taught: specialization,
configurations, higher-order templates, and scoped naming over a rich
relational metamodel with composite foreign keys.
