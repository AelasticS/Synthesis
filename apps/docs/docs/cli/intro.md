---
sidebar_position: 1
---

# Synthesis CLI

`synth` is the command-line tool for the Synthesis model-driven engineering toolkit.
It lets you validate models, apply transformations, and generate code from templates.

## Running

```bash
node apps/cli/bin/synth.js --help
```

Once installed globally:

```bash
synth --help
```

## Commands

| Command | Description |
|---|---|
| `synth validate <model>` | Validate a model file against its type constraints |
| `synth generate <model>` | Generate code from a model file using a template |
| `synth transform <model>` | Apply a model-to-model transformation |

## Modes

**Classical mode** — pass all arguments directly:

```bash
synth validate ./order.model.ts
synth generate ./order.model.ts --template ./tmpl/java/ --out ./src-gen/
synth transform ./order.model.ts --tx ./order-to-invoice.tx.ts --out ./invoice.model.ts
```

**Interactive mode** — omit arguments and be prompted:

```bash
synth generate
# ? Which model file? ...
# ? Which template? ...
```

**REPL mode** — start without arguments for a persistent session (coming soon):

```bash
synth
# synth> load ./order.model.ts as Order
# synth> validate Order
# synth> generate Order --template ./tmpl/java/
```
