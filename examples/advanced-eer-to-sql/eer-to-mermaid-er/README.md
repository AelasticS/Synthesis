# eer-to-mermaid-er

Model-to-text transformation rendering an EER schema (`eer-metamodel`,
the same source the suite's mapping consumes) as Mermaid `erDiagram`
text: an attribute block per entity, solid (identifying) lines for
weak identification and aggregation participation, dashed lines for
ordinary relationships, and one dashed one-to-one line per subtype.
A sibling view of the source, not a chain step. The logic is fixed:
the manifest declares no parts and the CLI runs it without
configuration flags.

## Run

```bash
npm run build   # from the repository root: rush build -t eer-to-mermaid-er

synth init
synth namespace mk demo
synth transformation install .
synth model import sample/shop.tsx --as demo/shop

synth transformation run eer-to-mermaid-er --in demo/shop --out-dir ./generated
cat generated/Shop.mmd
```

`npm test` runs the CLI smoke plus `scripts/verify.mjs`, which renders
the suite's Library sample and asserts every line convention.

The diagram conventions are explained on the suite page
[A full-featured EER to SQL transformation](https://AelasticS.github.io/Synthesis/developer-guide/examples/advanced-eer-to-sql#the-diagram-view-eer-to-mermaid).
