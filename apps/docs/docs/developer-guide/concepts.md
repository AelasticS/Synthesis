---
sidebar_position: 2
---

# Concepts

The Synthesis approach is grounded in a **model expression algebra**: models
are values, JSX expressions are terms, and evaluation is the interpretation
that produces the model. Everything else in this guide — components,
templates, transformation rules — is a disciplined way of writing such
terms.

## Three kinds of operators

Three kinds of operators appear in model expressions:

- **Element creation** (JSX tags) introduces typed model elements.
- **Computation** (embedded TypeScript in curly braces) produces
  sub-expressions dynamically — `map` over data, conditionals, function
  calls.
- **Reference retrieval** (`$refByName`, `$ref`) resolves existing elements
  to form graph structure, so a model can be a true graph rather than a
  tree.

## Templates and transformations

Templates are functions returning JSX: applying a template to arguments
yields a model expression, so a single definition can produce a family of
structurally different models. Transformations are templates parameterized
by a **source model** — their rules inspect source elements and emit target
JSX, and the engine records a trace linking every target element back to the
source elements it came from.

The formal details are published in the companion paper. The
[guides](./guides/defining-metamodels.md) focus on how to use the framework in
practice, in the order of the developer workflow: metamodels, JSX
components, model instances, transformations, polymorphic dispatch, and
design decisions.
