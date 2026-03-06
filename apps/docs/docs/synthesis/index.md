---
sidebar_position: 1
---

# Synthesis eDSL

Synthesis is an embedded domain-specific language for model-driven development in TypeScript. You define metamodels as type schemas, construct model instances using JSX syntax, and write model-to-model transformations as TypeScript classes with JSX templates.

## What You Can Build

- **Metamodels** that describe the structure of a domain (entities, properties, associations, subtype hierarchies).
- **Model instances** assembled declaratively with JSX. Nesting captures associations. Embedded TypeScript expressions (map, conditionals, function calls) generate structure dynamically.
- **Parameterized templates** that produce families of structurally different models from a single definition.
- **Model-to-model transformations** that map source models to target models with typed rules and automatic tracing.
- **Configurable transformations** with variation points that select different strategies at runtime based on a decision model.

## Developer Workflow

A typical project follows these steps:

```
1. Define metamodels          (type schemas using @aelastics/types)
2. Create JSX components      (thin wrappers that map types to JSX tags)
3. Build model instances      (JSX expressions rendered via ModelStore)
4. Write transformations      (classes extending abstractM2M with @E2E rules)
5. Execute and use results    (call transform(), get typed target model)
```

## Running Example

The documentation uses an **EER-to-Relational** transformation as the running example throughout all pages. An Extended Entity-Relationship metamodel (with Entities, Attributes, Domains, and subtype distinctions like Kernel vs Weak) is transformed into a Relational metamodel (Tables, Columns, Indexes, ForeignKeys).

A secondary example uses **BPM workflows** (Process, Task, Sequence, Parallel) to illustrate parameterized and higher-order templates.

## Background

The approach is grounded in a model expression algebra where models are values, JSX expressions are terms, and evaluation is the interpretation that produces the model. Three kinds of operators appear in model expressions:

- **Element creation** (JSX tags) introduces typed model elements.
- **Computation** (embedded TypeScript in curly braces) produces sub-expressions dynamically.
- **Reference retrieval** (`$refByName`, `$ref`) resolves existing elements to form graph structure.

Templates are functions returning JSX. Transformations are templates parameterized by a source model. The formal details are published in the companion paper. This guide focuses on how to use the framework in practice.

## Pages

| Page | What you will learn |
|---|---|
| [Defining Metamodels](./defining-metamodels) | Type schemas, entity types, associations, subtype hierarchies |
| [Creating JSX Components](./jsx-components) | Element class, ConnectionInfo, Template/CpxTemplate types, JSX pragma |
| [Building Model Instances](./building-models) | ModelStore, rendering, references, parameterized templates |
| [Writing Transformations](./writing-transformations) | abstractM2M, @M2M, @E2E, template method, tracing |
| [Polymorphic Rule Dispatch](./polymorphic-dispatch) | @SpecPoint, @SpecOption, subtype-based rule selection |
| [Design Decisions in Transformations](./variability) | Issues, options, bindings, configurations, @VarPoint, @VarOption |
