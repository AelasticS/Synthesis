---
sidebar_position: 1
---

# 1. Text as a target

A transformation's signature has two halves, and only one of them is
new here.

The **source** half is the simplified tutorial relational metamodel,
`@synthesis/standard-metamodels/rel-tutorial`. You have met it already:
it is the target of the model-to-model tutorial, and its
[page on that metamodel](../../model-to-model/part-1-basic/2-target-metamodel.md)
reads it in full. Three concepts are all it has. A `RelSchema` contains
`Table` elements, a `Table` contains `Column` elements, and a `Column`
carries its SQL type, three booleans, and an optional `references` link
to the primary key column it points at. There is no `isForeignKey`
flag, because a column is a foreign key exactly when it references
another column.

The **target** half is the text-document metamodel, and it is the
subject of this page.

## A metamodel that describes documents

Generating text in Synthesis is not a separate feature with its own
template language. It is an ordinary transformation whose target
metamodel happens to describe documents rather than a domain. Your
rules build a model, as always. That model just says "a file called
`Library_rel.sql` containing these lines" instead of "a table called
`Book` containing these columns".

The metamodel ships with the engine rather than with the standard
metamodels, in
`libraries/engine/src/m2t/m2t-model/`, and is imported from
`@synthesis/engine`. That location is a statement about what it is: not
a domain language somebody chose, but part of the machinery, because
the CLI has to understand it in order to write files.

## The concepts

From `libraries/engine/src/m2t/m2t-model/m2t.meta.model.ts`, the
concepts this tutorial uses:

```ts
import * as t from "@aelastics/types"
import { ModelElement, Model } from "@synthesis/metamodel-core";

export const M2T_Schema = t.schema("M2T_Schema");

export const M2T_Item = t.subtype(ModelElement, {
}, "FS_Item", M2T_Schema);

export const M2T_Model = t.subtype(Model, {
    items: t.arrayOf(M2T_Item)
}, "FS_Model", M2T_Schema);

export const DocElement = t.subtype(ModelElement, {
    parentDocument: t.optional(t.link(M2T_Schema, 'Document'), 'parentDocument'),
    parentSection: t.optional(t.link(M2T_Schema, 'Section'), 'parentSection')
}, "DocElement", M2T_Schema);

export const Document = t.subtype(M2T_Item, {
    elements:t.arrayOf(DocElement, "elementsOfDocument"),
}, "Document", M2T_Schema);

export const Paragraph = t.subtype(DocElement, {
    txtContent:t.string,
}, "Paragraph", M2T_Schema);

export const Section = t.subtype(DocElement, {
    elements:t.arrayOf(DocElement, "elementsOfSection"),
}, "Section", M2T_Schema);

t.inverseProps(Document, 'elements', DocElement, 'parentDocument');
t.inverseProps(Section, 'elements', DocElement, 'parentSection');
```

The listing is abridged in one place: the file also declares
`Directory` as a second kind of item. Part 2 says what it is currently
good for, which is not much; this tutorial does not use it.

Read the declarations as two layers, because that is what they are.

**The item layer.** An `M2T_Model` holds `items`. A `Document` is an
item, and it is the only kind of item this tutorial produces. Every
document in the result becomes exactly one file, which makes `items`
the top-level structure of your output.

**The document layer.** A `DocElement` is something that lives inside a
document: either a `Paragraph`, which carries a string in
`txtContent`, or a `Section`, which carries further `DocElement`
children. Sections nest, so a document is a tree of sections whose
leaves are paragraphs.

Two things join the layers, and both are worth naming.

`parentDocument` and `parentSection` are declared on `DocElement`
itself, and `t.inverseProps` makes each of them the inverse end of the
corresponding `elements` collection. Putting an element into
`document.elements` sets its `parentDocument`, and setting its
`parentDocument` puts it into `document.elements`. Part 1 only ever
uses the first direction; Part 2 uses the second, and that is the whole
of its mechanism.

`M2T_Model` extends `Model` and every concept here extends
`ModelElement`, so documents, sections, and paragraphs are model
elements with names, subject to the same rules as any other. In
particular, element names are unique across a whole model rather than
per container. That fact has a consequence you will meet in Part 2,
when there are two documents.

## The tag functions

The engine exports the tags for these concepts from
`libraries/engine/src/m2t/m2t-model/m2t.jsx.ts`. Unlike the metamodel
you wrote in the model-to-model tutorial, this one comes with the
engine, so you write JSX with these tags rather than declaring them.

Each carries the same piece of information the components you declared
there carried: which property of the enclosing element a nested
occurrence connects into. That is what decides the shapes below.

- **`<M2T>`** is the result model's root, so it takes the store,
  exactly as `<RelSchema>` and `<EERSchema>` do.
- **`<Doc>`** connects into the model's `items`, the collection the
  generator walks. That is why a document has to be nested in the root
  to become a file.
- **`<Sec>`** connects into `elements`, so a section nested in a
  `<Doc>` belongs to that document, and a section nested in another
  `<Sec>` belongs to that section.
- **`<P>`** is the one tag that accepts a text child, which becomes the
  paragraph's content. That is why `<P>{'CREATE TABLE Book ('}</P>`
  needs no prop for its text.
- **`<SecParent>`** connects into `parentSection`, the inverse end of
  the `t.inverseProps` declaration above. Written inside a section, it
  names the existing section this one belongs to instead of being
  nested in it. Part 1 does not use it. Part 2 is built on it.

The file also exports `Dir`, for writing documents into a folder, and
`DocParent`, neither of which Part 1 uses.

## What the generator does with the tree

After `template()` returns, the CLI hands the resulting model to the
engine's text generation, and what that does is short enough to state
completely. It walks the model's `items`. For each `Document` it
concatenates the text of the document's element tree and writes the
result to one file under `--out-dir`, named after the document. For
each element of the tree:

- a `Paragraph` contributes its `txtContent` followed by a newline;
- a `Section` contributes the concatenation of its own children, in
  order, and nothing else.

Three consequences follow, and they are the whole formatting model of
Part 1.

**One paragraph is exactly one line.** There is no line-breaking, no
wrapping, and no width. If you want a line, emit a paragraph.

**Sections produce no text.** A section is structure for the author,
not markup for the output. It exists so that a rule can return one
value holding several lines, and so that Part 2 can name a region of a
document and place content into it. Removing every `<Sec>` from Part
1's template and emitting the paragraphs directly would produce a
byte-identical file.

**Indentation is part of the string.** The two-space indent of a column
line is written in the rule, as `` `  ${...}` ``. The engine does not
manage indentation levels for you.

## Blank lines are paragraphs with a space in them

Part 1's template separates statements with

```tsx
<P>{' '}</P>
```

a paragraph whose text is a single space, which produces a line
containing one space. That is the existing idiom, and it is worth
knowing why it is not `<P>{''}</P>`.

An empty string is not a child. JSX treats it as nothing at all, so the
paragraph is created with no text content, and the run fails when the
element is connected:

```text
Error: Transformation 'sql-tutorial-basic' failed: childElement undefined for
parent "undefined" of type "/DefaultSchema/M2T_Schema/Paragraph"
```

A single space is a child, so `<P>{' '}</P>` is the shortest thing that
reliably produces a separator line. The generated files in this
tutorial therefore have a space on their blank lines, which is
invisible in an editor and harmless in SQL.

## What the manifest needs from it

The text metamodel is not named by package specifier in `synth.json`.
It is named by the marker string `"text"`:

```json
"target": {
  "metamodel": "text"
}
```

There is no `target.components` entry beside it, and its absence is the
interesting part. In a model-to-model run the result is serialized back
into the workspace as a `.tsx` model file, so the CLI needs the target
metamodel's tag functions to write that file. A model-to-text run has
nothing to serialize: the result is text, written to files. The
document model exists only for the duration of the run.

## Next

The target is understood. The [generator](./2-the-generator.md) builds
one.
