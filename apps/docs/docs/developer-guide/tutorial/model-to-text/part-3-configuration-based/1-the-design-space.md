---
sidebar_position: 1
---

# 1. The design space

A **decision model** is the design space of a transformation, written
down as data: the questions it is prepared to have answered for it, and
the answers it will accept. The model-to-model tutorial's
[page on decision models](../../model-to-model/part-3-configuration-based/1-the-design-space.md)
covers what one is and how it is authored. This page is about the two
questions this generator asks, and about the one word that makes them
different from the question that tutorial asked.

The whole design space is `src/decision-model.tsx`:

```tsx
export const SqlGenerationIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
  <DecisionModel
    name="SqlGenerationDesign"
    description="Design space for generating SQL DDL from a relational schema"
    store={store}
  >
    {/* How many files the schema becomes, and what goes in each. The
        three options are the three shapes a deployable script can take,
        and no property of the schema decides between them. */}
    <ModelLevelIssue name="OutputLayout" description="How the generated DDL is laid out over files">
      <Option
        name="SingleFile"
        description="One file with every CREATE TABLE and inline REFERENCES clauses"
        isDefault={false}
      />
      <Option
        name="TablesAndConstraints"
        description="One file of CREATE TABLE statements and one of ALTER TABLE foreign keys"
        isDefault={true}
      />
      <Option
        name="FilePerTable"
        description="One file per table, plus one file of ALTER TABLE foreign keys"
        isDefault={false}
      />
    </ModelLevelIssue>

    {/* The same issue rel-to-sql-ddl carries: quoting is a house style,
        not something the schema can answer. */}
    <ModelLevelIssue name="IdentifierQuoting" description="How to emit SQL identifiers in the generated DDL">
      <Option
        name="Unquoted"
        description="Emit identifiers verbatim"
        isDefault={true}
      />
      <Option
        name="DoubleQuoted"
        description="Wrap identifiers in double quotes"
        isDefault={false}
      />
    </ModelLevelIssue>
  </DecisionModel>
)
```

The imports come from the library's internal decision metamodel rather
than from a domain metamodel package:

```tsx
import {
  DecisionModel,
  ModelLevelIssue,
  Option,
} from '@aelastics/synthesis/metamodels/decision'
```

Everything else is the shape Part 1 established: the
`/** @jsx createExprNode */` pragma, the `createExprNode` import, and a
function taking a `ModelStore` and returning an `ExprNode`.

## Two issues of very different sizes

`OutputLayout` decides which files exist. `IdentifierQuoting` decides
whether a name is wrapped in two characters. They sit in the same model,
under the same tag, with the same kind of options, and the
transformation reads them through the same mechanism. Page 2 shows the
first one implemented in three methods of a dozen lines each and the
second in three methods of one line each.

That similarity is the point worth taking from this file. An issue is
not a large thing or a small thing. It is a question the source model
cannot answer, and the amount of code behind an answer has nothing to
do with whether it deserves to be declared.

## Options as names, and where they have to match

An **issue** is one open question, an **option** is one admissible
answer, and an issue with fewer than two options is a preference rather
than a design space. The option names here are a contract with the
transformation:

- Each option's `name` is what a configuration model selects and what a
  `@VarOption` predicate matches against. `SingleFile` in this file is
  the `Option('SingleFile')` on page 2.
- Each issue's `name` is what the `@VarPoint` decorator names, and what
  the run prints when it announces the decision it took.

Nothing checks the spelling at build time, because the decision model
and the transformation are separate modules by design. Spell an option
differently in one of the two places and the option simply never
matches.

Note that `OutputLayout` has three options rather than two. Nothing in
the mechanism prefers two; page 2's variability point gains one more
method per option and changes in no other way. Three is simply how many
shapes of deployable DDL this tutorial has a use for.

## `isDefault`

`TablesAndConstraints` and `Unquoted` carry `isDefault={true}`. That
states which answer applies when a configuration does not choose
explicitly, and the file's own header comment says where it has to
agree:

```tsx
 * Option names correspond to the @VarOption methods of the
 * transformation, and isDefault marks the answer used when a
 * configuration does not choose explicitly. It has to agree with the
 * @Default() decorators in transformation.tsx.
```

The two declarations are read at different moments. `isDefault` is what
`config init` and `--default-configs` read when they generate a
configuration; `@Default()` is what the engine falls back to when it
dispatches a variability point and no option's predicate matched. Page 3
shows both paths arriving at `TablesAndConstraints`.

The defaults were not chosen arbitrarily. `TablesAndConstraints` is the
layout that always applies cleanly, because circular foreign keys make
inline `REFERENCES` clauses unorderable in general, and a default
should be the answer that is never actually wrong. `Unquoted` is the
quieter output, and quoting can always be turned on.

Both issues here are answered with plain `<Option>` elements: a plain
answer that opens no further questions. The model-to-model tutorial's
[page 1](../../model-to-model/part-3-configuration-based/1-the-design-space.md#options-are-plain-data)
covers the alternative, `<OpeningOption>`, an option that opens further
questions of its own.

## Answered once, not once per element

`ModelLevelIssue` is the whole difference between this design space and the
one in the model-to-model tutorial, and it is worth being concrete about
what it changes. That tutorial used `ElementLevelIssue`, so
`OneToManyStrategy` was asked once for every 1:N relationship in the
source model, and a schema with three of them got three independent
answers. Both issues here are asked once for the run.

| | `ElementLevelIssue` (the model-to-model tutorial) | `ModelLevelIssue` (this package) |
| --- | --- | --- |
| Asked | Once per matching source element | Once per run |
| Needs a binding | Yes, naming the concept it attaches to | No, there is no element to attach to |
| Choices in a configuration | One per matching element | One, whatever the model contains |
| Announced as | `decision for element <name>: <issue> -> <option>` | `decision OutputLayout -> SingleFile` |
| Decided | While the element is being transformed | Before generation starts |

The last row is why `OutputLayout` could not have been an element issue
even if somebody wanted it to be. An element issue is resolved when the
engine reaches that element, and by then the documents that element's
output goes into already exist. `OutputLayout` decides how many
documents there are, so it has to be settled before the first one is
created, which is exactly what page 2's template does by handing over
to the variability point as its first and only act.

A `ModelLevelIssue` is a property of the run as a whole, not of any
element of the input. Neither of the two questions here would change its
answer if the schema were replaced, so both are model-level.

## A binding model with nothing in it

A binding model answers one question: for which source elements does
this issue arise? With both issues model-level, the honest answer is "that
question does not apply", and `src/binding-model.tsx` says so by having
an empty body:

```tsx
export const RelTutorialSqlBindings = (store: ModelStore): ExprNode<t.IBindingModel> => (
  <BindingModel
    name="RelTutorialSqlBindings"
    description="Binding the tutorial relational concepts to SQL generation issues"
    sourceModel={<Model $refByName="//www.aelastics.org/RelTutorialMetamodel" />}
    decisionModel={<DecisionModel $refByName="//www.aelastics.org/SqlGenerationDesign" />}
    store={store}
  >
  </BindingModel>
)
```

The model still has to exist, and the file's header comment says what
for:

```tsx
 * The model still has to exist. It is what names the two ends the
 * decision machinery works across, and the references are absolute store
 * paths into the metamodel part and the decision model, both rendered
 * before this model in the order the manifest's `parts` block lists
 * them.
```

`sourceModel` and `decisionModel` are the two ends. Naming them is what
lets a configuration model declare which binding model it was generated
against, so that a configuration written for one transformation cannot
quietly steer another. Page 3's generated configuration carries
`//www.aelastics.org/RelTutorialSqlBindings` in its header for exactly
that reason.

## The metamodel as a model

`sourceModel` resolves by absolute path in the store, so something has
to be there for it to land on. The real source metamodel is a TypeScript
package of type objects, imported and compared by identity; it is not in
the store. So the metamodel package ships its concepts a second time, as
a model: its `as-model` facet, exported as
`rel-tutorial-metamodel/as-model` from `as-model.tsx` in
[`examples/tutorial/metamodels/rel-tutorial/src`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/metamodels/rel-tutorial/src),
written in
the types metamodel:

```tsx
export const RelTutorialMetamodel = (store: ModelStore): ExprNode<t.ITypeModel> => (
  <TypeModel name="RelTutorialMetamodel" store={store}>
    <TypeString name="string"></TypeString>
    <TypeBoolean name="boolean"></TypeBoolean>

    {/* A column carries its SQL type and its key, nullability and
        autoincrement flags. `references` is deliberately absent: the
        binding model does not need it, and a metamodel part declares
        only the vocabulary the decisions talk about. */}
    <TypeObject name="Column">
      <Property name="type">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="isKey">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="Table">
      <Property
        name="columns"
        domain={<TypeArray name="ArrayOfColumns" elementType={<TypeObject $refByName="Column" />} />}
      />
    </TypeObject>

    <TypeObject name="RelSchema">
      <Property
        name="tables"
        domain={<TypeArray name="ArrayOfTables" elementType={<TypeObject $refByName="Table" />} />}
      />
    </TypeObject>
  </TypeModel>
)
```

The model-to-model tutorial's
[page on binding](../../model-to-model/part-3-configuration-based/2-binding-the-issue.md)
explains why this file exists and states the rule for what goes in it:
declare a concept only if a binding or a condition has to name it. This
package is the degenerate case of that rule. No binding names a concept,
because there are no bindings, so what is strictly required is the model
root that `sourceModel` points at. The three type objects are here
because they are the vocabulary the decision machinery would talk in the
moment somebody adds an element issue, and because a metamodel part
naming nothing would be a puzzle to read.

Note what is *not* declared, since it shows the rule working. `Column`
has `type` and `isKey` and stops there. It has no `references`, even
though `references` is the property the whole constraints file is built
from, because nothing on the decision side reads it. This file is not a
mirror of the source metamodel and is not kept in sync with it.

## Names are paths

The elements declared above acquire absolute paths in the store, built
from the model's namespace and the containment chain:

```text
//www.aelastics.org/SqlGenerationDesign
//www.aelastics.org/SqlGenerationDesign/OutputLayout
//www.aelastics.org/SqlGenerationDesign/SingleFile
//www.aelastics.org/SqlGenerationDesign/TablesAndConstraints
//www.aelastics.org/SqlGenerationDesign/FilePerTable
//www.aelastics.org/SqlGenerationDesign/IdentifierQuoting
//www.aelastics.org/SqlGenerationDesign/Unquoted
//www.aelastics.org/SqlGenerationDesign/DoubleQuoted
```

The binding model above references the decision model by the first of
those, and page 3's configuration model references an issue and an
option by two more. Names are unique across a whole model here,
because neither metamodel declares name scopes, and a path is how one
model points into another.

## Further reading

The [design decisions guide](../../../guides/variability.md) is the
reference treatment of decision models, including opening options and
the constraints between options that this tutorial does not use.

## Next

The design space is declared. Nothing reads it yet, which is the subject
of [variability points](./2-variability-points.md).
