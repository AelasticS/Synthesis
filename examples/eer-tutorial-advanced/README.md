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
- `weakToTable` is the `@SpecOption` for `Weak`. It adds a foreign key
  to the owner entity's key, marked as part of the primary key, so the
  weak entity's partial key and its owner together identify a row.
- The relationship logic is still the plain conditional of Part 1: M:N
  becomes a join table, everything else becomes a foreign key on the N
  side. A relationship variant is a design choice, not a subtype of the
  source element, so specialization cannot express it. Part 3 turns that
  conditional into a configuration-based rule.

The base rule and the selected option are merged: the option's props win
over the skeleton's, and the option's children are appended to the
skeleton's. Options therefore declare only what is different.

The source metamodel is the advanced tutorial metamodel
(`@synthesis/standard-metamodels/eer-tutorial/advanced`): the basic
stage plus the `Kernel` and `Weak` entity subtypes, where a weak entity
carries an `owner` link to the entity that completes its key.

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

## What to look at next

Part 3's companion leaves the relationship mapping open and closes it
per run with a configuration model.
