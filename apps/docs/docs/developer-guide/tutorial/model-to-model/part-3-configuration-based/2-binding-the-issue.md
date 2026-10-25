---
sidebar_position: 2
---

# 2. Binding the issue

Read the decision model from page 1 again and notice what is missing
from it. It never says `Relationship`. It never mentions EER at all.
"How to implement a 1:N relationship" is a question about data
modelling, not about one particular modelling language, and the same
issue with the same two options is just as meaningful when the source
is a UML class diagram or an IDEF1X model.

That is not an oversight, it is the point. A decision space describes
design knowledge, and design knowledge outlives the metamodel it was
first applied to. Keeping the two apart means the issue can be declared
once and attached to several source languages, each through its own
binding.

The **binding model** is that attachment. It answers one question: for
which source elements does this issue arise? And to answer it, it needs
two things that do not exist yet.

## First problem: a vocabulary to point at

A binding names a metamodel concept. But a binding model is a model,
and its `element` property holds a model element, resolved by path in
the store. The real source metamodel is a TypeScript package of
aelastics type objects, imported and compared by identity; there is
nothing in the store for a reference to land on.

So the metamodel package ships its concepts a second time, as a model:
the metamodel-as-model, its third facet next to the type schemas and
the JSX components. It is exported as
`eer-tutorial-metamodel/advanced/as-model`, its source is
`as-model.tsx` in
[`examples/tutorial/metamodels/eer-tutorial/src/advanced`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/metamodels/eer-tutorial/src/advanced),
and its header states exactly what it is and what it is not:

```tsx
/**
 * The tutorial EER metamodel expressed as a types-metamodel model. It
 * ships with the transformation as a manifest part and is rendered into
 * the store before the decision and binding models, so the binding model
 * can reference its concepts by absolute path.
 *
 * Only the concepts the binding model has to name are declared here.
 * The transformation itself works against the real metamodel package
 * (eer-tutorial-metamodel/advanced); this model is the vocabulary the
 * decision machinery talks about, not a second definition of the
 * language.
 */
```

It is written in the types metamodel, whose tags describe types the way
the relational tags describe tables:

```tsx
import {
  Property,
  PropertyDomain,
  TypeArray,
  TypeModel,
  TypeObject,
} from '@aelastics/synthesis/metamodels/types/components'
```

The two concepts that matter to this binding are `Role`, because the
condition reads its cardinality bounds, and `Relationship`, because the
issue attaches to it:

```tsx
    {/* One end of a relationship: the entity it reaches and the
        cardinality bounds the binding model's condition reads. */}
    <TypeObject name="Role">
      <Property name="domain">
        <PropertyDomain $refByName="Entity" />
      </Property>
      <Property name="lb">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="ub">
        <PropertyDomain $refByName="string" />
      </Property>
    </TypeObject>

    {/* The concept the OneToManyStrategy issue is bound to. */}
    <TypeObject name="Relationship">
      <Property
        name="roles"
        domain={<TypeArray name="ArrayOfRoles" elementType={<TypeObject $refByName="Role" />} />}
      />
    </TypeObject>
```

`Entity`, `Attribute` and `Domain` are declared too, along with the
predefined `string` and `boolean` types the properties draw on. Nothing
else is: no `Kernel`, no `Weak`, no `EERSchema`. The rule for what goes
in this file is narrow and worth stating plainly. **Declare a concept
here only if a binding or a condition has to name it.** This is not a
mirror of the source metamodel that has to be kept in sync with it; it
is the vocabulary the decision machinery talks in, and a concept nobody
points at earns nothing by being present.

## Second problem: not every relationship raises the question

The binding itself is `src/binding-model.tsx`:

```tsx
export const EERTutorialBindings = (store: ModelStore): ExprNode<t.IBindingModel> => (
  <BindingModel
    name="EERTutorialBindings"
    description="Binding the tutorial EER concepts to relational design issues"
    sourceModel={<Model $refByName="//www.aelastics.org/EERTutorialMetamodel" />}
    decisionModel={<DecisionModel $refByName="//www.aelastics.org/RelationshipDesign" />}
    store={store}
  >
    <Binding
      name="OneToManyBinding"
      description="OneToManyStrategy applies to 1:N relationships only"
      element={<ModelElement $refByName="//www.aelastics.org/EERTutorialMetamodel/Relationship" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationshipDesign/OneToManyStrategy" />,
      ]}
      condition='return (e) => {
                if (!e.roles || e.roles.length !== 2) return false;
                const r1 = e.roles[0];
                const r2 = e.roles[1];
                return (r1.ub === "1" && r2.ub === "M") ||
                       (r1.ub === "M" && r2.ub === "1");
            }'
    />
  </BindingModel>
)
```

The model as a whole names its two ends: `sourceModel` is the metamodel
model from the previous section, `decisionModel` is the design space
from page 1. Both are absolute paths, and both resolve because the
manifest renders those two models into the store first. Page 3 covers
the ordering.

Inside it, each `<Binding>` is one attachment, and it carries three
things:

- **`element`**, the metamodel concept the issue is attached to. Here
  `Relationship`, addressed by its path in the metamodel model.
- **`issues`**, the list of issues this concept raises. One here, but a
  concept may raise several: how to name the table, how to index it,
  how to map the link.
- **`condition`**, an optional predicate that narrows the attachment.

## What the condition is for

Without the condition, `OneToManyStrategy` would be raised for every
`Relationship` in the source model, including `writtenBy`, the M:N one.
That would be wrong in a specific and instructive way. It would offer a
choice where there is none: an M:N relationship cannot be carried by a
foreign key, so a configuration selecting `ForeignKey` for it would be
a configuration asking for something impossible, and the run would
either produce nonsense or fail somewhere far from the cause.

The condition returns true only for a relationship with two roles whose
upper bounds are `1` and `M`, in either order. It is the same line the
transformation's `relationshipToStructure` draws with its `if`, stated
a second time as data. That duplication is real, and it is deliberate:
the code needs it to know which branch to take, and the decision
machinery needs it to know which elements to ask about. They are two
different consumers of the same fact.

Two properties of conditions are worth understanding.

**A condition is a string.** It is not a TypeScript closure captured in
the model. A binding model is a model like any other, which means it
can be serialized, inspected, and shipped; a live function could be
none of those. The body is `return (e) => { ... }`, so the string
evaluates to a function that takes one element and returns a boolean.
The consequence is that nothing type-checks the property names inside
it. `e.roles`, `r1.ub` and the string values `"1"` and `"M"` have to
match the source model's actual shape, and a typo produces a condition
that quietly never fires.

**A binding is written at M2 and evaluated at M1.** The binding names a
concept, once, for the whole metamodel. The condition runs against each
concrete element of that concept in whatever source model is being
transformed. So this one binding covers every EER model anyone ever
writes in this metamodel, and page 4's run shows it selecting exactly
one relationship out of the sample's two.

## When a binding is not needed

An issue only needs a binding when it is raised per element, which is
why `Binding` carries element issues. A `ModelLevelIssue` is answered once
for the run and has no element to attach to, so a package whose only
issue is global still ships a binding model, but an empty one, naming
its two ends and containing no bindings at all. The decision model and
the binding model are always declared together; what varies is whether
the binding model has anything inside it.

## Next

The design space is declared and attached. What is still missing is the
rule that actually leaves the question open:
[variability points](./3-variability-points.md).
