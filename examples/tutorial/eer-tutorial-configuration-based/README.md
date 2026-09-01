# eer-tutorial-configuration-based

Companion package of the model-to-model tutorial, Part 3. The Part 2
transformation with one change: the relationship mapping is no longer
decided by the transformation at all. It is decided per run by a
configuration model.

## Which half of the conditional is really a choice

Part 1 mapped relationships with a plain conditional: M:N becomes a join
table, everything else becomes a foreign key on the N side. Part 2 left
that conditional alone, because a relationship variant is not a subtype
of the source element and specialization cannot express it. Part 3 takes
the conditional apart, and the first job is to see that its two branches
are not the same kind of thing.

- M:N has no alternative. Neither side can hold a single foreign key
  value, so a table of its own is structurally forced. Nothing to
  decide, so the branch stays plain code.
- 1:N has two honest answers. A foreign key on the N side is the compact
  one; a join table of its own costs a join on every read but keeps the
  N side free of the reference and lets the link be added or dropped
  without touching either table. No property of the source model settles
  which is right.

That second branch is what a configuration decides. It appears here as a
`@VarPoint` with two `@VarOption` methods:

- `relationshipToStructure` still branches on M:N, and calls
  `relationshipAsJoinTable` directly when it finds one.
- Everything else it hands to `oneToManyMapping`, the variation point.
  Its body never runs: the engine looks up the option selected for that
  relationship and calls the corresponding method instead.
- `oneToManyAsForeignKey` is the `@Default()` option, matching
  `isDefault` on `ForeignKey` in the decision model. Without a
  configuration, or for a relationship the configuration says nothing
  about, this is what runs.
- `oneToManyAsJoinTable` is the alternative. It delegates to the same
  `relationshipAsJoinTable` the M:N branch uses: the structure is
  identical, what differs is whether it was forced or chosen.

The entity rule is untouched from Part 2, still a `@SpecPoint` with
`kernelToTable` and `weakToTable` options. The two mechanisms coexist in
one class, on different methods: specialization dispatches on what the
source element *is*, variability on what the configuration *says*.

The target is the tutorial's simplified relational metamodel
(`rel-tutorial-metamodel`), unchanged from Parts 1
and 2: tables of columns, where a column's optional `references` link
points at the primary key column it refers to. There is no
`isForeignKey` flag, because a column is a foreign key exactly when it
references another column. Both options below build such columns, and
they differ only in which table the column lands on.

## The three models beside the transformation

A configuration-based package ships more than a transformation class.
The manifest's `parts` block lists three further modules, rendered into
the store before every run:

- The decision model declares the design space: one `ElementIssue`
  named `OneToManyStrategy` with the options `ForeignKey` (the default)
  and `JoinTable`. An element issue is answered once per source element,
  so two 1:N relationships in one schema can be implemented differently.
- The binding model says which metamodel concept the issue applies to,
  and narrows it with a condition. `OneToManyStrategy` binds to
  `Relationship`, but the condition keeps only relationships with two
  roles whose upper bounds are `1` and `M`. The M:N relationship never
  reaches a configuration at all, which is the same distinction the
  transformation draws, stated once more as data.
- The metamodel model gives the binding model a vocabulary to point at.
  It is a small types-metamodel model naming `Entity`, `Attribute`,
  `Domain`, `Role` and `Relationship`, not a second definition of the
  language: the transformation itself still works against
  `eer-tutorial-metamodel/advanced`.

## Package anatomy

| Path | What it is |
| --- | --- |
| `synth.json` | The manifest: kind `m2m`, entry point, exported class, source and target metamodels, and the `parts` block with the three modules below. |
| `src/transformation.tsx` | The transformation class, `EER2RelConfigurableTransformation`, extending `DecisionAwareM2M`. |
| `src/decision-model.tsx` | The design space: the `OneToManyStrategy` issue and its two options. |
| `src/binding-model.tsx` | The issue bound to `Relationship`, narrowed by a condition to 1:N. |
| `src/eer-metamodel.tsx` | The concepts the binding model references, as a types-metamodel model. |
| `sample/library.tsx` | The Part 2 sample unchanged: kernel entities `Book`, `Author`, `Publisher`, weak entity `BookCopy`, one 1:N relationship (`publishedBy`) and one M:N relationship (`writtenBy`). |
| `tsconfig.json` | Compiles `src` to `dist`. Note `experimentalDecorators`, which the decorators need. |

## Try it

```bash
# Build the package (from the repository root: rush build -t eer-tutorial-configuration-based)
npm run build

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation show eer-tutorial-configuration-based
```

`show` reports `variability: yes` and lists the three parts, so you can
see the package is configuration-based before running anything.

### The default run

```bash
synth transformation run eer-tutorial-configuration-based \
  --in demo/library --default-configs --out demo/library-rel
synth model show demo/library-rel
```

The run prints the decision it took:

```text
decision for element publishedBy: OneToManyStrategy -> ForeignKey (default)
```

Only `publishedBy` appears, because the binding condition let only the
1:N relationship through. The output is the Part 2 output: `Book`,
`Author` and `Publisher` tables, a `BookCopy` table carrying
`BookCopy_BookId_FK` from the weak option, a `PublisherId_FK` column
grafted onto `Book` by the foreign key option, and a `writtenBy` join
table for the M:N relationship. `Book` ends with the reference the
foreign key option put there:

```tsx
<Table $refByName="Book">
  <Column name="PublisherId_FK" type="INTEGER" isKey={false} isNullable={true} isAutoincrement={false} references={<Column $refByName="publisherId" />} />
</Table>
```

### Choosing differently

Generate an editable configuration, flip the one decision in it, and run
again:

```bash
synth config init eer-tutorial-configuration-based \
  --for demo/library --out demo/library-cfg
```

The generated model holds a single `ElementChoice`, for `publishedBy`.
Change its selected option to `JoinTable`:

```tsx
<Choice
  name="ec_publishedBy_JoinTable"
  issue={<ElementIssue $refByName="//www.aelastics.org/RelationshipDesign/OneToManyStrategy" />}
  selectedOption={<Option $refByName="//www.aelastics.org/RelationshipDesign/JoinTable" />}
/>
```

Then run with it:

```bash
synth transformation run eer-tutorial-configuration-based \
  --in demo/library --config demo/library-cfg --out demo/library-rel-jt
synth model show demo/library-rel-jt
```

`Book` loses its `PublisherId_FK` column and a `publishedBy` table
appears instead:

```tsx
<Table name="publishedBy">
  <Column name="publishedBy_PublisherId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="publisherId" />} />
  <Column name="publishedBy_BookId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
</Table>
```

The link to `Book` was implicit in the foreign key version, carried by
the fact that the column sat on the `Book` table; here it is a column
and a `references` link like any other. The M:N `writtenBy` table is
untouched: it was never up for discussion. Same source model, same
transformation code, a different relational architecture.

Join table columns are qualified with the relationship name for a
reason. Once a 1:N relationship may also become a join table, one schema
can hold two join tables that both reference `Book`, and column names
are unique per schema. The weak entity rule qualifies its owner key the
same way, with the entity name.

## What to look at next

Part 4's companion, `eer-tutorial-higher-order`, generates rules instead
of selecting between them: the template itself becomes the thing that
varies.
