---
sidebar_position: 3
---

# Tutorial

A two-part, hands-on path to authoring Synthesis transformations. You
build complete, installable transformation packages and run them with
the `synth` CLI; every command and output shown was executed against
the real tools, and each part names a smoke-tested package from the
repository's `examples/` catalog as its answer key.

- [Part I: your first transformation](./part-1-first-transformation.md)
  builds a minimal model-to-model transformation: the package layout,
  the `synth.json` manifest, the transformation class, and the loop of
  build, install, and run. Answer key: `examples/rel-copy`.
- [Part II: decision-based transformations](./part-2-decision-based-transformations.md)
  turns hard-coded design choices into a declared design space: the
  decision model, the binding model, variation points, manifest parts,
  and configuration-driven runs. Answer key:
  `examples/eer-to-relational`.

Part I assumes no prior Synthesis experience beyond the
[User Guide's introduction](../../user-guide/concepts.md); Part II
builds directly on Part I. If you prefer reading finished code first,
start with the [Examples](../examples/index.md) section instead and
return here for the why behind each piece.
