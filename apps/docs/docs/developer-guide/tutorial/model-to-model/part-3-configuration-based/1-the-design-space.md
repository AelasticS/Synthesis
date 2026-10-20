---
sidebar_position: 1
---

# 1. The design space

Before a transformation can leave a question open, the question has to
exist somewhere other than in a developer's head. That is what a
**decision model** is: the design space of the transformation, written
down as data.

It is a model like any other in Synthesis, authored in JSX, rendered
into a store, and made of typed elements. The difference is what it
describes. A source model describes a library; a decision model
describes the choices a transformation is prepared to have made for it.

The whole of this package's design space is one file,
`src/decision-model.tsx`:

```tsx
export const RelationshipDesignIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
  <DecisionModel
    name="RelationshipDesign"
    description="Design space for implementing EER relationships in a relational schema"
    store={store}
  >
    <ElementLevelIssue
      name="OneToManyStrategy"
      description="How to implement a 1:N relationship"
    >
      <Option
        name="ForeignKey"
        description="Put a foreign key column on the N side table"
        isDefault={true}
      />
      <Option
        name="JoinTable"
        description="Give the relationship a table of its own"
        isDefault={false}
      />
    </ElementLevelIssue>
  </DecisionModel>
)
```

Its imports come from the library's internal decision metamodel rather
than from a domain metamodel package:

```tsx
import {
  DecisionModel,
  ElementLevelIssue,
  Option,
} from '@aelastics/synthesis/metamodels/decision'
```

Everything else about the file is the shape Part 1 established: the
`/** @jsx createExprNode */` pragma, the `createExprNode` import, and a
function taking a `ModelStore` and returning an `ExprNode`.

## Issues and options

An **issue** is one open question. An **option** is one admissible
answer to it. An issue with fewer than two options is not a design
space, it is a preference; if there is only one answer, the answer
belongs in the code.

`OneToManyStrategy` has exactly two, and they correspond one to one
with the two `@VarOption` methods page 3 adds to the transformation.
Those names are a contract:

- The option's `name` is what a configuration model selects and what a
  `@VarOption` predicate matches against.
- The issue's `name` is what the `@VarPoint` decorator names, and what
  the run announces when it reports the decision it took.

Spell either of them differently in one place and the two halves stop
meeting. Nothing checks the spelling for you at build time, because the
transformation and the decision model are separate modules by design.

## `isDefault` and where it has to agree

`isDefault={true}` on `ForeignKey` states which answer applies when a
configuration does not choose explicitly. It is declared here, in the
data, and it is declared a second time in the transformation, as the
`@Default()` decorator on `oneToManyAsForeignKey`. The companion's own
comment on the decision model says why that matters:

```tsx
 * Option names correspond to the @VarOption methods of the
 * transformation class, and isDefault marks the answer used when a
 * configuration does not choose explicitly. It has to agree with the
 * @Default() decorator in transformation.tsx.
```

The two are used at different moments. `isDefault` is what
`config init` and `--default-configs` read when they generate a
configuration; `@Default()` is what the engine falls back to when it
dispatches a variation point and no option's predicate matched. In a
well-formed package they name the same option, and page 4 shows both
paths ending on `ForeignKey`.

## Options are plain data

`<Option>` is a plain answer: selecting it selects nothing further, and
there is no wrapper attribute left to say so. The alternative is a
different tag entirely: an option that opens further questions is
authored as `<OpeningOption>` instead of `<Option>`, wrapping the
sub-issues it opens as JSX children. `ForeignKey` and `JoinTable` both
settle the question outright, so both are plain `<Option>` elements
here. The [design decisions guide](../../../guides/variability.md#opening-options-an-option-that-opens-sub-issues)
covers `OpeningOption` in full.

## The three kinds of issue

The tag you use for the issue decides how often the question gets
answered:

| Tag | Answered | Use it when |
| --- | --- | --- |
| `ElementLevelIssue` | Once per matching source element | Each element can legitimately be treated differently |
| `ModelLevelIssue` | Once for the model being transformed | The answer is a property of this schema as a whole |
| `ModelLevelIssue` | Once for the run, independently of the source model | The answer is a property of the target, not the input |

`ModelLevelIssue` and `ModelLevelIssue` produce the same underlying element
type; the two spellings differ in what they say about intent, and
`ModelLevelIssue` is the one to reach for when the question has nothing to
do with the model at all. A naming convention for generated
identifiers is the standard example: it is settled once, and no
individual entity or relationship gets a say.

This package uses `ElementLevelIssue`, and the choice is not cosmetic.
Consider a schema with two 1:N relationships, one linking books to
their publisher and one linking books to their acquisition batch. The
first is queried on every page of the application and wants a foreign
key. The second is written once and read rarely and can afford a table
of its own. A single answer for the whole model would force the same
compromise on both. An element issue lets each relationship carry its
own answer, and page 4's configuration model reflects that: it holds
one choice per element, addressed by that element's name.

## Names are paths

One thing worth noticing before the next page, because it is the first
place it becomes visible. The elements declared above acquire absolute
paths in the store, built from the model's namespace and the containment
chain:

```text
//www.aelastics.org/RelationshipDesign/OneToManyStrategy
//www.aelastics.org/RelationshipDesign/ForeignKey
//www.aelastics.org/RelationshipDesign/JoinTable
```

The binding model on the next page references the issue by exactly that
path, and the configuration model on page 4 references both an issue
and an option the same way. This is the same naming rule Part 1
introduced when it explained why foreign key columns need qualified
names: names are unique across a whole model, and a path is how one
model points into another.

## Further reading

The [design decisions guide](../../../guides/variability.md) is the
reference treatment of decision models, including opening options and
the constraints between options that this tutorial does not use.

## Next

The design space exists, and it says nothing yet about EER. That is
deliberate, and the reason is the subject of
[binding the issue](./2-binding-the-issue.md).
