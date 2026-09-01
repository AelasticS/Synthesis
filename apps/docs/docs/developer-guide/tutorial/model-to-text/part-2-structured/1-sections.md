---
sidebar_position: 1
---

# 1. Sections and composition

Part 1 built its document in one expression, with the rule call sitting
where its output belonged:

```tsx
<Doc name={`${s.name}.sql`}>
  <Sec name="header">...</Sec>
  {this.tablesOf(s).map((tab) => this.tableToCreate(s, tab))}
</Doc>
```

That reads well while there is one file with one kind of content. With
two files it stops reading well, because the expression grows until you
can no longer see the shape of the output inside it, and because a rule
written elsewhere gives no clue which file it feeds.

Part 2 keeps the same idea, nesting, and changes only how the expression
is written: the pieces are built first, as named values, and the
documents are composed from them.

## Sections group, they do not place

A `Section` is a `DocElement` that holds further document elements. It
exists to group: a section named after a table holds the paragraphs of
that table's `CREATE TABLE` statement, so the statement is one thing in
the model rather than five loose lines.

```tsx
<Sec name={`table_${tab.name}`}>
  <P>{`CREATE TABLE ${tab.name} (`}</P>
  {cols.map((c, i) => (
    <P>{`  ${this.columnLine(c)}${i < cols.length - 1 ? ',' : ''}`}</P>
  ))}
  <P>{');'}</P>
  <P>{' '}</P>
</Sec>
```

Where that section ends up is decided by where it is nested, and nothing
else. This one is not nested anywhere yet, which is the point of the
next section.

## Building the pieces first

An expression node is an ordinary value. It can be assigned to a
variable, put in an array, returned from a function, and used later
exactly as if it had been written in place. That is what makes a
template composable rather than one long literal:

```tsx
const tables = this.tablesOf(s)
const foreignKeys = this.foreignKeysOf(s)

const createStatements = tables.map((tab) => (
  <Sec name={`table_${tab.name}`}>...</Sec>
))

const alterStatements = foreignKeys.map((fk) => (
  <Sec name={`constraint_${fk.table.name}_${fk.column.name}`}>...</Sec>
))
```

Two reads of the model, two arrays of sections, and nothing decided yet
about which file anything belongs to. The next page uses them to build
the two documents, and the template's final expression becomes short
enough to state the whole output:

```tsx
return (
  <M2T name={`${s.name}_sql`}>
    {tablesFile}
    {constraintsFile}
  </M2T>
)
```

This is worth doing deliberately. A reader who wants to know what the
transformation produces reads four lines. A reader who wants to know
what is in the constraints file reads the one expression that builds
it. Neither has to search for a rule that places its output from a
distance.

## What decides the order

Order is tree order: the file is the paragraphs of the document, in the
order they appear in its element tree. `tablesOf` returns the tables in
the order they appear in the schema, so the `CREATE TABLE` statements
come out in that order, exactly as in Part 1.

Building the pieces first does not change that. `createStatements` is an
array in schema order, and embedding it in the document preserves that
order. What changed is only where the ordering is visible: it is a
property of the array you built, sitting in front of you, rather than of
the sequence in which rules happened to run.

## Sections produce no text of their own

A section contributes nothing to the output. `table_Book` produces no
text; it groups the paragraphs that do, and the file is the
concatenation of the paragraphs in tree order.

Their names are not decoration either. They are element names in a
model, subject to the same uniqueness rule as any other element name,
and `table_${tab.name}` is qualified with the table name for exactly
that reason. Two sections named `table` would be a duplicate name, not
two sections.

## When nesting is not enough

There is one more way to place content, and it exists for the case this
part does not have. `<SecParent $refByName="..." />`, written inside a
section, names an existing section as this one's parent, so a rule can
put its output somewhere it is not written. The metamodel supports it
because `parentSection` is the inverse of a section's `elements`, so
naming your parent and being nested in it are two ways of writing one
fact.

It earns its place when a rule genuinely cannot be written where its
output belongs, for instance when one walk over the source feeds several
documents and the decision is made per element. It costs the reader the
ability to see the structure in one place, so it is worth reaching for
only when composition cannot express what you need. This tutorial does
not need it: two reads of the model produce two arrays, and each array
goes in one document.

## Next

[Multiple documents](./2-multiple-documents.md) uses these pieces to
build the second file, and shows the finished template whole.
