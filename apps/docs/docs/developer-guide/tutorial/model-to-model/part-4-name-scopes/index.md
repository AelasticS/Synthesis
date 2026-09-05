# Part 4: Name scopes

The first three parts reorganized the transformation's rules three
ways while the naming world underneath stayed the same: element names
were unique across the whole model, which is why the sample carried
qualified names like `bookId` and `authorName`, and why the generated
foreign key columns were called `AuthorId_FK`. Part 4 keeps the rules
of Part 1 exactly as they are and changes that naming world instead.

One declaration per metamodel does it. When `Entity` and `Table` are
declared name scopes, attribute and column names only have to be
unique inside their entity or table, so every table can have its own
`id`, foreign key columns can take natural names like `authorId`, and
a reference into another table's scope becomes a path like
`Author/id`. The result reads like a schema a database designer would
actually write.

This is the smallest part of the tutorial, and deliberately so: the
diff against Part 1 is the lesson. Nothing about rule structure,
packaging, or the build, install, run loop changes. What changes is
names, and everything that follows from names.

## What you build

The Part 1 transformation moved onto *name-scopes stages* of the same
two tutorial metamodels:

- Each metamodel package gains a stage that is structurally identical
  to the one you know, plus one `declareNamespace` line.
- The sample Library schema is rewritten with natural names: all three
  keys are `id`, and both `Author` and `Category` carry a `name`.
- The transformation's mapping rules are untouched; only its two
  naming sites change, the foreign key column name and the reference
  it emits.

The finished package exists in the repository as
`examples/tutorial/eer-tutorial-name-scopes`. As always, every listing
on the following pages is taken from it verbatim.

## Prerequisites

Part 1, and nothing else. This part evolves Part 1's code directly, so
Parts 2 and 3 are not on the path; if you have read them, nothing here
conflicts with what they taught. The reference description of the
mechanism lives in the
[building-models guide's Name scopes section](../../../guides/building-models.md#name-scopes),
which this part shows in action.

## In this part

1. **[The scoped metamodel stages](./1-scoped-metamodel-stages.md)**:
   the flat rule you have been living under, `declareNamespace`, and
   the two new stage modules.
2. **[The scoped source model](./2-the-scoped-source-model.md)**: the
   Library sample with natural names, model-level domain vocabulary,
   and why bare domain references still resolve.
3. **[The transformation](./3-the-transformation.md)**: the two naming
   sites that change, path references, and why everything else stays
   byte-identical to Part 1.
4. **[Run and compare](./4-run-and-compare.md)**: the generated model
   side by side with Part 1's output, and where to go next.
