# eer-to-mermaid-er

Model-to-text over the EER metamodel: the same source the suite's m2m
step consumes, rendered as Mermaid `erDiagram` text. A sibling view,
not a chain step. Every entity kind gets an attribute block (the type
word is the domain's name, `PK` on key attributes, an `"optional"`
comment on optional ones, composite attributes flattened one level to
`parent_component` lines); ordinary relationships are dashed
(non-identifying) with per-role glyphs; weak identification and
aggregation participation are solid (identifying); a specialization
renders one dashed one-to-one line per subtype, because a subtype
instance IS its root instance. The logic is fixed: a diagram renderer
has no open design questions at this scale, so the manifest declares
no parts and the CLI runs it without configuration flags. The
conventions are explained canonically in the docs page "A
full-featured EER to SQL transformation".

## The package anatomy

- [src/transformation.tsx](./src/transformation.tsx): one document per
  schema, the entity blocks first, then the relationship lines; a weak
  entity without its mapping or a non-binary relationship is a clear
  error.
- [sample/shop.tsx](./sample/shop.tsx): a compact shop, two kernels,
  one M:N relationship, one weak entity.
- [scripts/verify.mjs](./scripts/verify.mjs): the suite's Library
  sample rendered in one CLI run, asserting the attribute blocks and
  every line convention.

## Try it

```bash
synth init
synth namespace mk demo
synth transformation install .
synth model import sample/shop.tsx --as demo/shop
synth transformation run eer-to-mermaid-er --in demo/shop --out-dir ./generated
cat generated/Shop.mmd
```
