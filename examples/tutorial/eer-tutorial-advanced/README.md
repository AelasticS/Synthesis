# eer-tutorial-advanced

Companion package of the model-to-model tutorial, Part 2. The Part 1
transformation with one change: the entity rule is a specialization
point, so the source metamodel's subtype hierarchy drives dispatch
instead of a type check inside the rule.

- `entityToTable` is marked `@SpecPoint()` and returns only the skeleton
  every table shares: the table name plus one column per attribute,
  typed by the attribute's domain.
- `kernelToTable` is the `@SpecOption` for `Kernel`. A kernel entity is
  independent, so it adds nothing to the skeleton. It still has to
  exist: dispatch is total, and an entity with no matching option is an
  error rather than a fall back to the base rule.
- `weakToTable` is the `@SpecOption` for `Weak`. It adds a column that
  references the owner entity's primary key column, marked as part of
  the primary key, so the weak entity's partial key and its owner
  together identify a row.
- The relationship logic is still the plain conditional of Part 1: M:N
  becomes a join table, everything else becomes a foreign key on the N
  side. A relationship variant is a design choice, not a subtype of the
  source element, so specialization cannot express it. Part 3 turns that
  conditional into a configuration-based rule.

The base rule and the selected option are merged: the option's props win
over the skeleton's, and the option's children are appended to the
skeleton's. Options therefore declare only what is different.

The source metamodel is the advanced tutorial metamodel
(`eer-tutorial-metamodel/advanced`): the basic
stage plus the `Kernel` and `Weak` entity subtypes, where a weak entity
carries an `owner` link to the entity that completes its key.

The target is the tutorial's simplified relational metamodel
(`rel-tutorial-metamodel`), the same one Part 1
writes to: tables of columns, where a column's optional `references`
link points at the primary key column it refers to. There is no
`isForeignKey` flag, because a column is a foreign key exactly when it
references another column.

## Package anatomy

| Path | What it is |
| --- | --- |
| `synth.json` | The transformation manifest: kind `m2m`, entry point, exported class, source and target metamodels. |
| `src/transformation.tsx` | The transformation class, `EER2RelAdvancedTransformation`. |
| `sample/library.tsx` | An EER model in the advanced metamodel: kernel entities `Book`, `Author`, `Publisher`, weak entity `BookCopy` owned by `Book`, one 1:N and one M:N relationship. |
| `tsconfig.json` | Compiles `src` to `dist`. Note `experimentalDecorators`, which `@SpecPoint` and `@SpecOption` need. |

## Try it

```bash
# Build the package (from the repository root: rush build -t eer-tutorial-advanced)
npm run build

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation run eer-tutorial-advanced --in demo/library --out demo/library-rel
synth model show demo/library-rel
```

The output contains `Book`, `Author`, and `Publisher` tables from the
kernel option, a `BookCopy` table whose columns are its own
`copyNumber` partial key plus the `BookCopy_BookId_FK` key column from
the weak option, a `PublisherId_FK` foreign key on `Book` from the 1:N
relationship, and a `writtenBy` join table from the M:N relationship.
Every one of those foreign key columns carries a `references` link to
the primary key column it points at, `BookCopy_BookId_FK` to `bookId`
and `PublisherId_FK` to `publisherId`:

```tsx
<Table name="BookCopy">
  <Column name="copyNumber" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
  <Column name="copyShelf" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  <Column name="BookCopy_BookId_FK" type="INTEGER" isKey={true} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
</Table>
```

A `references` link resolves against what is already in the store, so
the column it points at has to be created first. Entities are emitted
before relationships, which settles the relationship rules, and a weak
entity's owner has to appear before the weak entity itself in the source
model, which `sample/library.tsx` does by listing `Book` before
`BookCopy`.

## What to look at next

Part 3's companion leaves the relationship mapping open and closes it
per run with a configuration model.
