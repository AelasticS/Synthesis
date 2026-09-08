---
sidebar_position: 3
---

# 3. The refactor

Everything is in place: a metamodel that distinguishes the two kinds of
entity, and a mechanism that dispatches on the distinction. This page
puts them together, runs the result, and reads the generated model.

Every listing is from [`examples/tutorial/eer-tutorial-advanced`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/eer-tutorial-advanced).

## Before

Part 1's entity rule, complete:

```tsx
  entityToTable(e: em.IEntity): ExprNode<rmT.ITable> {
    return (
      <Table name={e.name}>
        {e.attributes.map((a) => this.attributeToColumn(a))}
      </Table>
    )
  }
```

One method, one shape of table.

## After

The same method, decorated, plus two options:

```tsx
  // The specialization point: the table skeleton every entity produces,
  // a name plus one column per attribute. The engine calls it for any
  // entity, then merges the result with the option selected for the
  // entity's runtime type. @E2E stays outermost so it traces the merged
  // result.
  @E2E()
  @SpecPoint()
  entityToTable(e: em.IEntity): ExprNode<rmT.ITable> {
    return (
      <Table name={e.name}>
        {e.attributes.map((a) => this.attributeToColumn(a))}
      </Table>
    )
  }

  // A kernel entity is independent: its own key attribute identifies it,
  // so the skeleton is already the whole table and this option adds
  // nothing. It still has to exist, because dispatch is total: an entity
  // with no matching option is an error, not a fall back to the base
  // rule.
  @SpecOption('entityToTable', em.Kernel)
  kernelToTable(k: em.IKernel): ExprNode<rmT.ITable> {
    return <Table />
  }

  // A weak entity is identified relative to its owner, so its table adds
  // a foreign key to the owner's key, and that column takes part in the
  // primary key next to the entity's own partial key. Name and attribute
  // columns come from the skeleton.
  @SpecOption('entityToTable', em.Weak)
  weakToTable(w: em.IWeak): ExprNode<rmT.ITable> {
    return (
      <Table>
        <Column
          name={`${w.name}_${w.owner.name}Id_FK`}
          type={this.columnType(this.keyAttributeOf(w.owner).attrDomain)}
          isKey={true}
          isNullable={false}
          isAutoincrement={false}
          references={<Column $refByName={this.keyAttributeOf(w.owner).name} />}
        />
      </Table>
    )
  }
```

Notice what did *not* happen. The body of `entityToTable` is byte for
byte what it was in Part 1. The refactoring added two decorators and
two methods; it rewrote nothing.

### Reading the three bodies

**The base rule** produces the skeleton: the table's name, and one
column per attribute through the unchanged `attributeToColumn`. It is
the part of the answer that does not depend on which kind of entity
this is.

**`kernelToTable`** returns `<Table />`, a table with no props and no
children. Merged with the skeleton, it contributes nothing at all: no
prop to override the name, no child to append. That is the correct
answer for a kernel entity, and writing it out is not a formality but
the thing that makes kernel entities transformable, because dispatch is
total.

**`weakToTable`** adds exactly one column and nothing else. It sets no
`name` prop, so the table keeps the name the skeleton gave it. The
column it adds is a foreign key to the owner's primary key column, and
it is marked `isKey={true}`.

That flag is the whole point of the exercise. The weak entity's own
partial key and this foreign key together identify a row, which is what
"identified relative to an owner" means in a relational schema.

Both halves of the foreign key go through `keyAttributeOf(w.owner)`,
the helper Part 1 already wrote for relationship foreign keys. Its
domain types the column, and its name is what the `references` link
resolves, so `BookCopy`'s owner column points at `Book`'s `bookId`
column rather than at the `Book` table. Page 1 noted the ordering this
implies: `Book` is declared above `BookCopy` in the sample, so `bookId`
is in the store by the time this rule runs.

The column's name is built as `` `${w.name}_${w.owner.name}Id_FK` ``,
producing `BookCopy_BookId_FK` rather than the plainer `BookId_FK`.
Part 1's page 3 explains why: element names are unique across a whole
model, not per container. `BookId_FK` is already taken by the join
table the M:N relationship produces, and an unqualified name would
collide.

## The other two changes

**The manifest** names the new class and the new source metamodel, and
is otherwise Part 1's file:

```json
{
  "kind": "m2m",
  "entry": "./dist/transformation.js",
  "exportName": "EER2RelAdvancedTransformation",
  "source": {
    "metamodel": "eer-tutorial-metamodel/advanced"
  },
  "target": {
    "metamodel": "rel-tutorial-metamodel",
    "components": "rel-tutorial-metamodel"
  }
}
```

**`tsconfig.json`** gains the one line page 2 asked for:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "jsx": "react",
    "jsxFactory": "createExprNode",
    "experimentalDecorators": true
  },
  "include": ["src"]
}
```

`package.json` changes only its name and description. The dependencies
are the same three packages.

## Run it

The loop is Part 1's, unchanged:

```bash
npm run build

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library
```

```text
Imported demo/library
```

Then install and run:

```bash
synth transformation install .
synth transformation run eer-tutorial-advanced --in demo/library --out demo/library-rel
```

```text
Installed transformation 'eer-tutorial-advanced@0.1.0' (m2m) to ~/.synth/transformations/eer-tutorial-advanced
Running eer-tutorial-advanced@0.1.0 (m2m) on demo/library
Wrote demo/library-rel (~/.synth/models/demo/library-rel.tsx)
```

The run says nothing about specialization, which is the intended
experience. Dispatch is not an event you supervise; it is how the rule
is defined.

## The generated model

`~/.synth/models/demo/library-rel.tsx`, below its `$synth` header:

```tsx
<RelSchema store={store} name="Library_rel">
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
    <Column name="AuthorId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="authorId" />} />
    <Column name="BookId_FK" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
  </Table>
</RelSchema>
```

Four of the six tables are the same story Part 1 told. `Book`,
`Author`, and `Publisher` are kernel entities, and their tables are
pure skeleton, because `kernelToTable` added nothing. The 1:N
relationship `publishedBy` produced no table of its own but a
`<Table $refByName="Book">` grafting a nullable `PublisherId_FK` into
the `Book` table, and the M:N relationship `writtenBy` produced a join
table with one foreign key column per role. That is the Part 1
relationship rule, running unchanged.

### The table only specialization could produce

```tsx
  <Table name="BookCopy">
    <Column name="copyNumber" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="copyShelf" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
    <Column name="BookCopy_BookId_FK" type="INTEGER" isKey={true} isNullable={false} isAutoincrement={false} references={<Column $refByName="bookId" />} />
  </Table>
```

Every merge rule from page 2 is legible in those four lines.

The table's `name` came from the base rule, because `weakToTable` set
no name of its own. The first two columns came from the base rule, in
model order. The third came from the option, appended after them, which
is why it is last rather than first.

And that third column is the payoff: `isKey={true}` together with
`references={<Column $refByName="bookId" />}`. `BookCopy`'s primary key
is `copyNumber` plus a reference to the owning `Book`'s key column,
which is exactly what the source model asserted and what Part 1's
single rule had no way to express. Compare it against the foreign keys
the relationship rule produced, both `isKey={false}`: a relationship's
foreign key describes a row, while a weak entity's foreign key
identifies it. The first two columns carry no `references` prop at all,
which is how the model says they are not foreign keys.

Note also `BookId_FK` in the `writtenBy` join table, sitting in the
same model as `BookCopy_BookId_FK`. Both point at the same `bookId`
column, and both would have been called `BookId_FK` under a naive
naming scheme. Element names are unique per model, so the second one
would have failed the run, not silently merged.

## When an option is missing

Page 2 claimed that deleting `kernelToTable` does not make kernel
entities fall back to the base rule. It is worth seeing, because the
message is short and the cause is not stated in it. Remove the option,
rebuild, reinstall, and run:

```text
Running eer-tutorial-advanced@0.1.0 (m2m) on demo/library
Error: Transformation 'eer-tutorial-advanced' failed: No specialized
method found
```

The run fails at the first kernel entity. The fix is always the same:
find the specialization point that received the element and give it an
option covering that element's type.

## Where you are

The transformation now has two different entity rules, and no code that
chooses between them. The choice is made by the metamodel's subtype
hierarchy and the engine's dispatch, which means adding a third kind of
entity is adding a type, a tag, and an option, with nothing existing to
edit.

What has not moved is the conditional in `relationshipToStructure`. It
survived Part 2 intact, and it will not yield to the same treatment,
because it does not encode something the source model knows. It encodes
a judgement about database design that belongs to the project, not to
the schema. Part 3 declares that judgement as an issue with options in
a decision model, binds it to the `Relationship` concept, and turns the
open branch into a configuration-based rule, so that the same source
model and the same transformation can produce different relational
architectures. The M:N branch stays fixed logic, because a join table
there is structurally forced rather than chosen.

The [tutorial overview](../index.md) describes what each part adds.
