---
sidebar_position: 4
---

# 4. Running with configurations

The package is complete: a transformation whose relationship rule asks
rather than decides, a decision model saying what may be asked, and a
binding model saying when. This page runs it twice, on the same source
model, and gets two different relational schemas.

The build and install loop is Parts 1 and 2's, unchanged:

```bash
npm run build

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library
synth transformation install .
```

```text
Imported demo/library
Installed transformation 'eer-tutorial-configuration-based@0.1.0' (m2m) to ~/.synth/transformations/eer-tutorial-configuration-based
```

## What the CLI sees in the package

```bash
synth transformation show eer-tutorial-configuration-based
```

```text
Transformation: eer-tutorial-configuration-based
  version: 0.1.0
  description: Tutorial Part 3 companion: EER to relational transformation whose 1:N relationship mapping is a configured decision
  kind: m2m
  source metamodel: @synthesis/standard-metamodels/eer-tutorial/advanced
  target metamodel: @synthesis/standard-metamodels/rel-tutorial
  target components: @synthesis/standard-metamodels/rel-tutorial/components
  variability: yes
  entry: ./dist/transformation.js (export: EER2RelConfigurableTransformation)
  parts:
    metamodel: ./dist/eer-metamodel.js (export: EERTutorialMetamodel)
    decision model: ./dist/decision-model.js (export: RelationshipDesignIssues)
    binding model: ./dist/binding-model.js (export: EERTutorialBindings)
  author: Sinisa Neskovic
  license: Apache-2.0
  path: ~/.synth/transformations/eer-tutorial-configuration-based
```

`variability: yes` is derived, not declared. It is the manifest's
`parts` block, read back: a decision model and a binding model are
present, so the transformation is configuration-based, and the run
behaves differently because of it.

What `show` reports is the manifest, not its contents. It names the
three part modules; it does not open them, so it does not list the
issues, the options, or which one is the default. Those names come from
elsewhere: `config init` writes them into a configuration model,
`config show` prints them back, and a run announces every decision it
takes. All three appear below.

## A decision is never applied silently

Run it the way Part 2 taught you, with no mention of configuration at
all:

```bash
synth transformation run eer-tutorial-configuration-based --in demo/library --out demo/library-rel
```

```text
Error: Transformation 'eer-tutorial-configuration-based' is
configuration-based. Provide --config <ref> (create one with: synth
config init eer-tutorial-configuration-based --for demo/library) or
accept generated defaults explicitly with --default-configs.
```

The run stops with exit code 2, before any engine work. Nothing was
loaded, nothing was transformed, and no model was written.

That refusal is a design position, not a missing feature. A default is
still a design decision, and a decision applied because nobody said
anything is a decision nobody reviewed. The generated schema would
depend on a choice its author never saw, and the difference between
`ForeignKey` and `JoinTable` is not the kind of thing to discover in
production. So the run demands consent, in exactly one of two forms:
name a configuration you wrote, or say explicitly that generated
defaults are acceptable this time.

In an interactive terminal the same policy appears as a prompt offering
those two paths and an abort. Choosing in the picker is the consent.
Scripts and CI have no picker, so they pass the flag.

## Running on generated defaults

```bash
synth transformation run eer-tutorial-configuration-based \
  --in demo/library --default-configs --out demo/library-rel
```

```text
Running eer-tutorial-configuration-based@0.1.0 (m2m) on demo/library
decision for element publishedBy: OneToManyStrategy -> ForeignKey (default)
Wrote demo/library-rel (~/.synth/models/demo/library-rel.tsx)
```

The middle line is the consent being honoured. Every choice the run
applied is announced, with the element it applied to, the issue it
answered, the option it selected, and `(default)` marking that nobody
chose it explicitly.

Read the line for what is *not* in it. There is one decision, for
`publishedBy`. The sample model has two relationships, and `writtenBy`
never appears, because the binding condition from page 2 rejected it:
an M:N relationship raises no issue, so there is nothing to announce
and nothing to configure. The condition is not an optimization; it is
the reason this output has one line instead of two, one of them
offering a choice that could not be honoured.

## The generated schema

`~/.synth/models/demo/library-rel.tsx`, below its `$synth` header:

```tsx
<RelSchema store={store} name="Library_rel" content="" MDA_level="M1">
  <Table name="Book">
    <Column name="bookId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="bookTitle" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table name="Author">
    <Column name="authorId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="authorName" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table name="Publisher">
    <Column name="publisherId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="publisherName" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table name="BookCopy">
    <Column name="copyNumber" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="copyShelf" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
    <Column name="BookCopy_BookId_FK" type="INTEGER" isKey={true} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
  </Table>
  <Table $refByName="Book">
    <Column name="PublisherId_FK" type="INTEGER" isKey={false} isNullable={true} isAutoincrement={false} references={<Column $refByName="publisherId" />} />
  </Table>
  <Table name="writtenBy">
    <Column name="writtenBy_AuthorId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="authorId" />} />
    <Column name="writtenBy_BookId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
  </Table>
</RelSchema>
```

Four of the six tables are Part 2's, produced by the untouched entity
rule: three kernel entities as pure skeletons, and `BookCopy` carrying
`BookCopy_BookId_FK` from `weakToTable`. What follows them is the
relationship rule.

`<Table $refByName="Book">` is `oneToManyAsForeignKey`, running as the
`@Default()` option. It grafts a nullable `PublisherId_FK` into the
`Book` table declared above rather than creating a table of its own,
and links it to `Publisher`'s key column, `publisherId`.

`<Table name="writtenBy">` is the M:N branch, which never consulted a
configuration. Its columns are `writtenBy_AuthorId_FK` and
`writtenBy_BookId_FK`, qualified with the relationship name. Page 3
explained the qualification, and the next run is what it exists for.

## An editable configuration

`--default-configs` accepted a configuration the run built in memory
and discarded. `config init` builds the same one and saves it:

```bash
synth config init eer-tutorial-configuration-based \
  --for demo/library --out demo/library-cfg
```

```text
decision for element publishedBy: OneToManyStrategy -> ForeignKey (default)
Wrote demo/library-cfg (~/.synth/models/demo/library-cfg.tsx)
```

Same line, because it is the same generation. Without `--out` the
result lands at `<namespace>/<name>-cfg`, which here would have been
the same reference.

A configuration model is a workspace model like any other, a `.tsx`
file with a `$synth` header, and its kind is `configuration-model`.
Here is what was written, below the header:

```tsx
export default (store) => (
  <ConfigurationModel
    name="LibraryDefaultConfigurationModel"
    sourceModel={<Model $refByName="//www.aelastics.org/Library" />}
    bindingModel={<BindingModel $refByName="//www.aelastics.org/EERTutorialBindings" />}
    store={store}
  >
    <ElementChoice
      name="ec_publishedBy"
      element={<Element $refByName="//www.aelastics.org/Library/publishedBy" />}
      choices={[
        <Choice
          name="ec_publishedBy_ForeignKey"
          issue={<ElementIssue $refByName="//www.aelastics.org/RelationshipDesign/OneToManyStrategy" />}
          selectedOption={<Option $refByName="//www.aelastics.org/RelationshipDesign/ForeignKey" />}
        />,
      ]}
    />
  </ConfigurationModel>
)
```

Every path in it was introduced on an earlier page.
`//www.aelastics.org/Library/publishedBy` is the source element, from
the sample model. `//www.aelastics.org/EERTutorialBindings` is page 2's
binding model, named so that a configuration can only be used with the
transformation it was generated for.
`//www.aelastics.org/RelationshipDesign/OneToManyStrategy` and its
option are page 1's decision model. The three models are all present at
once, which is what makes this file readable on its own.

Note the shape of the containment. An `<ElementChoice>` is one source
element's decisions, and it holds a list of `<Choice>` elements, one
per issue that element raises. This element raises one, so there is one
choice. The nesting is what "element issue" meant on page 1, made
concrete.

`config show` prints the same content as decisions:

```bash
synth config show demo/library-cfg
```

```text
Ref:          demo/library-cfg
Path:         ~/.synth/models/demo/library-cfg.tsx
Tx:           eer-tutorial-configuration-based
Source model: demo/library
Generated:    by eer-tutorial-configuration-based@0.1.0 on 2026-08-29T00:59:08.241Z
Decisions:
  decision for element publishedBy: OneToManyStrategy -> ForeignKey (default)
```

## Flipping the choice

The edit is two replacements in `~/.synth/models/demo/library-cfg.tsx`,
and `synth config edit demo/library-cfg` opens the file in `$EDITOR` if
you prefer. Change the choice's name:

```tsx
  name="ec_publishedBy_JoinTable"
```

and the option it selects:

```tsx
  selectedOption={<Option $refByName="//www.aelastics.org/RelationshipDesign/JoinTable" />}
```

The second replacement is the decision. The first only keeps the
element's name honest, since the generator names a choice after the
option it holds; nothing breaks if you leave it, but a file that says
`ForeignKey` while selecting `JoinTable` is a file that will mislead
somebody later.

Check that the file still renders before running it:

```bash
synth model validate demo/library-cfg --tx eer-tutorial-configuration-based
```

```text
[ok] file transpiles and imports
[ok] default export renders (with 'eer-tutorial-configuration-based' context)
[ok] $synth header present
Model demo/library-cfg is valid
```

```bash
synth config show demo/library-cfg
```

The header is the same; the last two lines are not:

```text
Decisions:
  decision for element publishedBy: OneToManyStrategy -> JoinTable
```

The same line as before, with `JoinTable` in place of `ForeignKey` and
without `(default)`. The parenthesis is how a fallback is distinguished
from a choice somebody made.

## Running with the configuration

```bash
synth transformation run eer-tutorial-configuration-based \
  --in demo/library --config demo/library-cfg --out demo/library-rel-jt
```

```text
Running eer-tutorial-configuration-based@0.1.0 (m2m) on demo/library
decision for element publishedBy: OneToManyStrategy -> JoinTable
Wrote demo/library-rel-jt (~/.synth/models/demo/library-rel-jt.tsx)
```

Before executing, the configuration is checked twice over. Nominally:
the transformation and version stamped in its header, its binding
model, and its source model must all match this run, so a configuration
generated for one model can never quietly steer another. Structurally:
every choice's issue must exist in the decision model, every selected
option must belong to its issue, and every per-element choice must
resolve to an element of the input model. The
[configurations guide](../../../../user-guide/guides/configurations.md)
states both levels in full.

A configuration also does not have to be complete. An issue it says
nothing about falls back to its default, but never silently: the
fallback is announced with `(default)` and materialized as a real
choice, so the configuration that actually ran is always inspectable.
`--default-configs` governs only the case where there is no
configuration at all.

## The two schemas

Everything above the relationships is identical in both runs, so only
the tail differs. Under `ForeignKey`:

```tsx
  <Table $refByName="Book">
    <Column name="PublisherId_FK" type="INTEGER" isKey={false} isNullable={true} isAutoincrement={false} references={<Column $refByName="publisherId" />} />
  </Table>
  <Table name="writtenBy">
    <Column name="writtenBy_AuthorId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="authorId" />} />
    <Column name="writtenBy_BookId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
  </Table>
```

Under `JoinTable`:

```tsx
  <Table name="publishedBy">
    <Column name="publishedBy_PublisherId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="publisherId" />} />
    <Column name="publishedBy_BookId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
  </Table>
  <Table name="writtenBy">
    <Column name="writtenBy_AuthorId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="authorId" />} />
    <Column name="writtenBy_BookId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
  </Table>
```

Four things to read out of that.

**`Book` no longer carries the publisher.** The `<Table $refByName="Book">`
block is gone entirely, so `Book` is exactly the columns its attributes
produced. The link moved out of the table and into one of its own.

**The link to `Book` became explicit.** Under `ForeignKey` it was
half-stated: `PublisherId_FK` named `publisherId` as its target, and
the fact that the row belonged to a book was carried by which table the
column sat on. Under `JoinTable` both ends are columns with `references`
links of their own, `publishedBy_PublisherId_FK` at `publisherId` and
`publishedBy_BookId_FK` at `bookId`. The same relationship, said once
implicitly and once in full.

**`publishedBy` became a table.** Two non-nullable foreign key columns,
one per role, structurally identical to `writtenBy`. Both were produced
by the same `relationshipAsJoinTable` helper. What differs is how the
call was reached: for `writtenBy` the code decided, for `publishedBy`
the configuration did.

**`writtenBy` is byte for byte unchanged.** It was never up for
discussion. The binding condition kept it out of the design space, and
nothing anyone writes in a configuration model can move it.

That last point is also where the qualified column names pay off. This
schema holds two join tables, and both point at `bookId`. Under Part
2's naming they would both have produced a column called `BookId_FK`,
and since element names are unique across a model, the second would
have failed the run rather than silently overwriting the first.

## Where you are

The transformation makes three kinds of decision now, and each is made
in the place that knows the answer.

- **The code decides what is forced.** An M:N relationship gets a join
  table because nothing else can hold it, and that stays an `if`.
- **The source model decides what it has asserted.** A weak entity gets
  a key-bearing foreign key because it is a `Weak`, and the
  specialization dispatch reads that off the model.
- **The configuration decides what is genuinely open.** A 1:N
  relationship gets whichever structure the project wants, and the same
  source model with the same transformation produces either.

The `if` statement Part 1 wrote is finally gone from where it did not
belong, and still present where it does. Nothing was added to the
source metamodel to achieve it, which was the trap page 2 of Part 2
warned about: a `ForeignKeyRelationship` subtype would have made a
target-side design choice a permanent property of the source language.

What remains open is a different kind of question. Both options here
are rules somebody wrote by hand, and adding a third means writing a
third. Part 4 takes up templates that take templates as parameters, so
that families of structurally different targets come from one
definition rather than from one method each. The
[tutorial overview](../index.md) tracks what each remaining part adds
and when it becomes available.
