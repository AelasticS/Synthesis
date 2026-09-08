# Document Generation: Formats, Renderers, and the Presentation Model

> Internal design documentation for contributors to Synthesis itself.
> Strategy context for why this direction matters lives in
> [llm-and-model-driven-engineering-v2.md](llm-and-model-driven-engineering-v2.md)
> (a claim-to-evidence map sits alongside it).

A design outline for extending model-to-text generation beyond plain text
to Markdown, HTML, Word, and PDF, without turning the engine into a
document processor. Nothing here is implemented yet. The purpose is to fix
the architecture before the first non-text renderer is written, because the
first renderer will otherwise pin the shape of everything after it.

## 1. Where things stand

A transformation with `"kind": "m2t"` produces an **M2T model**, not text.
The metamodel (`libraries/engine/src/m2t/m2t-model/m2t.meta.model.ts`) is a
small tree:

```text
M2T_Model
  items: [ Directory | Document ]
Directory
  items: [ Directory | Document ]     (recursive)
Document
  elements: [ Section | Paragraph ]
Section
  elements: [ Section | Paragraph ]   (recursive)
Paragraph
  txtContent: string
```

`generate` (`libraries/engine/src/m2t/text-generation/generate.ts`) walks
that tree and serializes it. The CLI then writes the resulting documents
under `--out-dir`.

**Nothing about the model is text-specific.** The text assumption lives in
exactly three places:

1. `generateFileElement` and `generateSection`, a hardcoded pair that
   flattens a paragraph to `txtContent + "\n"` and a section to the
   concatenation of its children.
2. `ItemResult.outcome: Result<string>` in `gen-result.ts`, and
   `createFile(path, data: string)` in `fs-operations.ts`.
3. The CLI writer, `writeFile(dest, value, 'utf-8')` in
   `apps/cli/src/tx/execute.ts`, and the manifest convention
   `"target": { "metamodel": "text" }`.

Everything else is format-agnostic and would be reused unchanged: the
directory walk, the relative path threading, the success and failure
accounting, and the CLI's output root resolution with escape rejection.

Worth noting: `Section` carries a `name` like every `ModelElement`, and the
text renderer discards it. The model already holds more structure than the
current serializer consumes. A Markdown or Word renderer would map
`section.name` to a heading and derive the level from nesting depth, with
no metamodel change at all.

## 2. The governing principle: model the domain, not the encoding

The single most important decision here is what **not** to model.

There should be no PDF metamodel and no Word metamodel. PDF and OOXML are
concrete syntaxes for documents; the document model is the abstract syntax.
Building a metamodel of an encoding buys nothing, because nobody wants to
reason about a PDF cross-reference table or OOXML `w:rPr` elements as a
model.

The repository already makes this call elsewhere. The
[rel-to-sql-ddl](../examples/rel-to-sql-ddl/) example goes from the
relational model straight to text. There is no SQL AST metamodel in
between, because SQL DDL is how a relational schema is written down, not a
separate domain worth reasoning about. Relational schema is the domain,
DDL is the encoding. The same relationship holds here.

The one case that would justify a real format metamodel is if the format
itself became the subject matter, for example to **read** `.docx` files
back in and transform them. That is a different project and is out of
scope.

## 3. The three-level stack

The natural architecture has three levels, and each hop is an existing
Synthesis concept.

```text
domain / semantic models      novel, contract, technical manual, API reference
  |                           (many metamodels, one per genre)
  |  m2m transformation
  v
presentation document model   blocks, inline runs, lists, tables,
  |                           styles, page masters, fields
  |                           (ONE metamodel, built once)
  |  m2t transformation (renderer)
  v
encodings                     markdown, html, latex, docx, pdf
                              (no metamodels, just renderers)
```

The structural insight is that **the semantic level is domain-specific
while the presentation level is universal**. A novel model (chapters,
scenes, point of view, dialogue), a contract model (parties, clauses,
definitions, cross-references), and a manual model (tasks, prerequisites,
steps, warnings) share almost no vocabulary, but all of them funnel into
one presentation model, which then fans out to encodings.

This is exactly the many-sources-to-one-target shape that Synthesis already
supports, and it tells us where to spend effort. The presentation model is
built once and everything depends on it, so it deserves care. Semantic
models are comparatively cheap and there can be many.

The current M2T model sits at the presentation level, but is far too thin
for it. Section 5 describes what it needs.

## 4. Formats sort into three tiers

### Tier 1: text-shaped formats are nearly free

Markdown, HTML, LaTeX, Typst, SVG, and XML dialects need only a different
`generateFileElement`. No metamodel change, no binary handling, no new
infrastructure. The work is a renderer interface and making `generate`
accept one.

### Tier 2: container formats fit the existing machinery

A `.docx`, `.odt`, or `.epub` is a zip archive of XML parts in a fixed
directory layout (`[Content_Types].xml`, `_rels/.rels`,
`word/document.xml`). That is a `<Dir>` tree of text documents, which is
precisely what the M2T model expresses and what the CLI now writes to disk
correctly. A Word generator could emit that tree through the existing
pipeline and finish with a packaging step that zips the output directory.

The only genuinely new capability is "zip this directory", not "write
bytes per document". The cost is that hand-writing OOXML is verbose and
finicky, and conformance becomes ours to own.

### Tier 3: PDF should not be generated directly

Producing PDF bytes from a document tree means owning pagination, font
metrics, and line breaking. The sane path is to render to HTML and CSS,
LaTeX, or Typst using tier 1, then convert with an external tool. The same
applies to `.docx` if hand-written OOXML is unappealing: render to
Markdown or HTML and hand it to pandoc.

**PDF never gets a renderer of its own. It sits downstream of a text
format.**

### The high-leverage version

If the goal is "our transformations can produce Word and PDF", the cheapest
good answer is one HTML or Markdown renderer plus pandoc. That single
renderer yields PDF, DOCX, ODT, and EPUB at once, with no metamodel work,
no binary handling, and no change to `ItemResult`. Write a native renderer
later only for a format where pandoc will not give the needed control.

Conversion belongs **outside the engine**. The engine's job ends at
"content produced"; invoking a toolchain is a build concern. The CLI
already thinks in steps, so conversion fits as a pipeline step after the
m2t run rather than as something `generate` shells out to.

## 5. What the presentation model needs

The current model is too thin to drive a rich renderer. `Paragraph` holds a
single `txtContent` string, which cannot express emphasis, a link, or a
footnote reference.

Sketch of the additions, all as `DocElement` subtypes so the existing
typed-subtype machinery handles them and each renderer decides what it
supports:

**Block level**: `Heading` (or keep `Section` and derive level from depth),
`List` and `ListItem` (ordered and unordered), `Table`, `Row`, `Cell`,
`CodeBlock`, `Quote`, `Figure`, `PageBreak`.

**Inline level**: this is the significant change. `Paragraph` stops being a
string and becomes a sequence of inline runs: `Run` (text plus emphasis
flags), `Link`, `InlineCode`, `FootnoteRef`, `CrossRef`, `Image`.

**Presentation**: `Style` definitions (named, so content references a style
rather than carrying fonts inline), and page geometry.

The discipline to hold: content elements say what something **is**, styles
say how it **looks**, and the two stay separate. A `Heading` does not carry
a font size.

## 6. Headers, footers, and fields

Page furniture is the clearest case of something with no home in the
semantic model. A novel does not have a footer; a *printing* of a novel
has one. Headers and footers only exist once pages exist, so they never
appear at the semantic level, and at the presentation level they do not
belong on the content tree either.

The shape that works, and that desktop publishing, OOXML sections, and CSS
Paged Media all converge on:

- Content is a **flowing stream** of blocks with no page awareness.
- A **page master** owns page size, margins, and header and footer slots,
  and applies to a range of that flow. Word calls these sections.
- Headers and footers hold small block trees containing **fields**: page
  number, total pages, running head, chapter title, date. Fields are
  unresolved placeholders, not text.

Two consequences matter:

**Fields are resolved by the renderer, not by the model.** Markdown and
HTML have no pages, so that renderer drops page masters entirely. Word and
PDF resolve them. This is the clearest demonstration that the presentation
model is still not the encoding: it can legitimately express things some
encodings ignore, and that is expected rather than a defect.

**Some fields are derivations from the content.** A running head showing
"the current chapter title" has to reference something in the flow. That is
reference resolution, the same territory as `$refByName`, and it is the one
part of this that needs real design rather than transcription from existing
standards.

## 7. Styling as a configuration-based transformation

Fonts, margins, page size, heading styles, and numbering schemes are
variation, not content. "How do headings render", "which page size", and
"numbered or unnumbered chapters" are all the same shape of question as the
identifier-quoting choice in
[rel-to-sql-ddl](../examples/rel-to-sql-ddl/src/decision-model.tsx).

That makes styling a natural fit for the decision framework: issues with
options, resolved by a configuration model, rather than a growing pile of
renderer flags. The payoff is that one document model plus several
configuration models produces several stylings of the same document, with
the choices recorded and traceable instead of buried in renderer arguments.

This also keeps the presentation metamodel smaller, because variation that
would otherwise have to be modeled becomes configuration.

## 8. Concrete engine changes

In rough dependency order:

1. **Renderer interface.** Something like
   `{ name, fileExtension, renderDocument(doc: IDocument): string }`, with
   `generate` taking one in `Options` and defaulting to the current text
   renderer. This alone unlocks all of tier 1.
2. **Extract the existing text renderer** into that interface, unchanged,
   to prove the seam is in the right place.
3. **Markdown or HTML renderer** as the second implementation. Two
   implementations is the minimum that validates an abstraction.
4. **Extend the metamodel** with inline runs, lists, and tables, driven by
   what the second renderer actually wanted rather than by guesswork.
5. **Binary output**, only if a native renderer is written:
   `ItemResult.outcome` becomes `Result<string | Uint8Array>` (or
   `ItemResult` becomes generic), `createFile` accepts both, and the CLI
   writer branches on the value type instead of always passing `'utf-8'`.
6. **Page masters and fields**, only when the first paged renderer is
   written. Markdown will not exercise them, so designing them earlier
   means designing blind.
7. **Manifest and CLI surface.** `"target": { "metamodel": "text" }` needs
   to express a format, and `--out-dir` may want a companion flag
   selecting the renderer.

## 9. Known blockers

**The flat name scope per model.** Rich documents will want two sections
called "Introduction" in different chapters, and the store rejects that
today: within a model, every non-Model element shares one name scope. This
surfaced concretely while writing the same-name test case for the
directory-nesting fix, where two documents named `README.md` in different
directories could not be authored in a single model.

This is already tracked as the half-activated hierarchical namespaces item
in [engine-follow-ups.md](engine-follow-ups.md). Document generation is
probably the use case that forces that decision, because unique-naming
conventions are tolerable for database columns and intolerable for prose.

## 10. What to build first

The presentation document model, driven by one concrete pair: a small
semantic model, for example a technical manual or a short-story collection
rather than a novel, plus a Markdown renderer.

That exercises all three levels of the stack, keeps the encoding free,
requires no binary handling, and will teach us what the presentation model
actually needs before we commit to it. Add page masters and fields when the
first paged renderer arrives, and add native binary renderers only where a
converter genuinely will not do.

## Summary of positions

| Question | Position |
| --- | --- |
| PDF or Word metamodel? | No. Model the domain, not the encoding. |
| How to reach PDF? | Render to HTML or LaTeX, convert externally. |
| Where does conversion run? | Outside the engine, as a pipeline step. |
| One document model or two? | Two levels: domain-specific semantic, universal presentation. |
| Where do headers and footers live? | Page masters at the presentation level, never in the semantic model. |
| How is styling varied? | Configuration-based, through issues and options. |
| First thing to build? | Renderer interface plus a Markdown renderer. |
