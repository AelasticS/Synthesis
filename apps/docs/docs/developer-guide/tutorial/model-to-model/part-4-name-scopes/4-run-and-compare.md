---
sidebar_position: 4
---

# 4. Run and compare

The loop is Part 1's, verbatim: build, install, import the sample, run.

```bash
npm run build
synth transformation install .
synth model import sample/library.tsx --as demo/library
synth transformation run eer-tutorial-name-scopes --in demo/library --out demo/library-rel
```

```text
Running eer-tutorial-name-scopes@0.1.0 (m2m) on demo/library
Wrote demo/library-rel (~/.synth/models/demo/library-rel.tsx)
```

## The output

```tsx
export default (store) => (
<RelSchema store={store} name="Library_rel">
  <Table name="Book">
    <Column name="id" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="title" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table name="Author">
    <Column name="id" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="name" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table name="Category">
    <Column name="id" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
    <Column name="name" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
  </Table>
  <Table $refByName="Book">
    <Column name="authorId" type="INTEGER" isKey={false} isNullable={true} isAutoincrement={false} references={<Column $refByName="Author/id" />} />
  </Table>
  <Table name="categorizedAs">
    <Column name="bookId" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="Book/id" />} />
    <Column name="categoryId" type="INTEGER" isKey={false} isNullable={false} isAutoincrement={false} references={<Column $refByName="Category/id" />} />
  </Table>
</RelSchema>
)
```

The `$synth` header above this expression records
`metamodel: 'rel-tutorial-metamodel/name-scopes'` and the same
provenance fields Part 1 explained. Note that the *serializer* wrote
those path references: the CLI understands scopes when writing a model
out, which is what keeps the generated file importable, and importing
it back in is a check worth running once yourself.

## Side by side with Part 1

Structurally the two outputs are the same model: five table
declarations, the same graft into `Book`, the same join table, the
same types and nullabilities. Every difference is a name:

| Part 1 (flat) | Part 4 (scoped) |
| --- | --- |
| `bookId`, `bookTitle` | `Book`'s `id`, `title` |
| `authorId`, `authorName` | `Author`'s `id`, `name` |
| `AuthorId_FK` | `authorId` |
| `references={<Column $refByName="authorId" />}` | `references={<Column $refByName="Author/id" />}` |

Part 1's output was correct and traceable, and its names carried the
scars of the flat rule. Part 4's output is the schema you would have
written by hand. The transformation logic that produced both is the
same `if` statement, the same two passes, the same rules; what changed
is one declaration in each metamodel and the two naming sites that
declaration frees.

One rule from Part 1 still holds exactly as stated: read the file top
to bottom and every `references` target is declared above the line
that points at it. Scopes change how names are *found*, not when they
have to exist.

## Where you are, and where the story continues

You have now seen the whole arc of the model-to-model tutorial. A
fixed-logic transformation (Part 1), its variants dispatched on source
types (Part 2), its genuinely open decisions declared as a
configurable design space (Part 3), and its naming world made natural
by scopes (Part 4).

The tutorial's metamodels stayed deliberately small through all four
parts: single-column foreign keys, no constraint elements, no
indexes, no configurable naming. The place where everything composes
is the repository's full-featured suite,
[`examples/advanced-eer-to-sql`](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql):
a full EER
metamodel, a relational metamodel whose tables are scopes and whose
foreign keys are first-class composite-capable elements, a
transformation that combines specialization, configurations,
higher-order templates, and scoped naming, and a DDL generator that
closes the chain to SQL. Its READMEs are written to be read after
this tutorial, and the [examples catalog](../../../examples/index.md)
is the map.
