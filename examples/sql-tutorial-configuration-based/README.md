# sql-tutorial-configuration-based

Companion package of the model-to-text tutorial, Part 3. The layout of
the generated text becomes a decision.

Parts 1 and 2 each committed to one file structure, and both were right
for some project and wrong for another. Nothing in a relational schema
says whether its DDL should ship as one script, as tables plus
constraints, or as one file per table: that is a property of the project
the script is deployed into, not of the model. A question the source
model cannot answer is exactly what a variation point is for.

## The design space

Two global issues, so a configuration model holds two choices no matter
how large the schema is:

| Issue | Options | Default |
| --- | --- | --- |
| `OutputLayout` | `SingleFile`, `TablesAndConstraints`, `FilePerTable` | `TablesAndConstraints` |
| `IdentifierQuoting` | `Unquoted`, `DoubleQuoted` | `Unquoted` |

`OutputLayout` is a `@VarPoint` whose options each return a complete
`<M2T>` expression: the decision is taken before anything is generated,
and it decides which documents exist at all. `IdentifierQuoting` is a
second, much smaller variation point over the same mechanism, showing
that the two do not have to be the same size to be the same kind of
thing.

## The package anatomy

- [src/transformation.tsx](./src/transformation.tsx): the template hands
  straight over to the `OutputLayout` variation point; the three options
  compose their documents from the same section-building rules.
- [src/decision-model.tsx](./src/decision-model.tsx): the design space,
  two `GlobalIssue`s (model-wide, no per-element bindings).
- [src/binding-model.tsx](./src/binding-model.tsx): connects the
  decision model to the relational metamodel; both issues are global, so
  the body is empty.
- [src/rel-metamodel.tsx](./src/rel-metamodel.tsx): the tutorial
  relational metamodel as a types-metamodel model, so the binding model
  has a real `sourceModel` to reference.
- [sample/library-rel.tsx](./sample/library-rel.tsx): the schema
  [eer-tutorial-basic](../eer-tutorial-basic/) generates.

## Try it

```bash
# Build the package (from the repository root: rush build -t sql-tutorial-configuration-based)
npm run build

synth init
synth namespace mk demo
synth model import sample/library-rel.tsx --as demo/schema
synth transformation install .

# Run on the defaults: TablesAndConstraints, Unquoted
synth transformation run sql-tutorial-configuration-based --in demo/schema \
  --default-configs --out-dir ./generated

# Create a configuration to edit, then run on it
synth config init sql-tutorial-configuration-based --for demo/schema
synth transformation run sql-tutorial-configuration-based --in demo/schema \
  --config demo/schema-cfg --out-dir ./generated
```

`synth config init` writes `demo/schema-cfg`, a configuration model with
one `GlobalChoice` per issue, each preselected to the default. To choose
a different option, point the choice's `selectedOption` at it:

```tsx
<Choice
  name="gc_OutputLayout_FilePerTable"
  issue={<GlobalIssue $refByName="//www.aelastics.org/SqlGenerationDesign/OutputLayout" />}
  selectedOption={<Option $refByName="//www.aelastics.org/SqlGenerationDesign/FilePerTable" />}
/>
```

Every run announces what it decided, so the choice is visible without
reading the output:

```
decision OutputLayout -> FilePerTable
decision IdentifierQuoting -> Unquoted
```

## What each layout produces

From the sample schema, with `Unquoted`:

- `SingleFile`: `Library_rel.sql`, with inline `REFERENCES` clauses.
- `TablesAndConstraints`: `Library_rel.sql` and
  `Library_rel-constraints.sql`.
- `FilePerTable`: `Book.sql`, `Author.sql`, `Category.sql`,
  `categorizedAs.sql`, and `Library_rel-constraints.sql`.

`DoubleQuoted` wraps every emitted identifier, including constraint
names, so `ALTER TABLE Book` becomes `ALTER TABLE "Book"`.

## What to look at next

[rel-to-sql-ddl](../rel-to-sql-ddl/) is the same idea over the full
relational metamodel, with identifier quoting as its only issue.
[eer-tutorial-configuration-based](../eer-tutorial-configuration-based/)
shows the model-to-model counterpart, where the issue is per element
rather than global.
