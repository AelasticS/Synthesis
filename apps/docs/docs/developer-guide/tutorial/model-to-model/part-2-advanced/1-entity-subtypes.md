---
sidebar_position: 1
---

# 1. The entity subtypes

The mechanism Part 2 introduces dispatches on the type of the source
element, so the source metamodel has to have types to dispatch on. That
is what this page is: the advanced tutorial EER metamodel, the second
of the tutorial's metamodel stages.

It ships as `eer-tutorial-metamodel/advanced`, the second subpath of
the same `eer-tutorial-metamodel` package, and its sources live in
[`examples/tutorial/metamodels/eer-tutorial/src/advanced/`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/metamodels/eer-tutorial/src/advanced).
The shape
is the one Part 1 described: a types file
(`EER-advanced.meta.model.type.ts`), a components file
(`EER-advanced-components.ts`), and an `index.ts` tying the two
together.

## A stage is a whole metamodel, not a patch

The advanced stage does not import the basic stage and extend it. It
declares everything the basic stage declares, in its own schema, and
adds two concepts. Its module header says as much:

```ts
/*
 * Advanced tutorial EER metamodel (model-to-model tutorial, Part 2 and
 * later). A complete, standalone stage: everything the basic stage has
 * (entities with attributes over domains, binary relationships with
 * cardinality roles) plus the Kernel and Weak entity subtypes that the
 * specialization part dispatches on. Aggregations, subtyping
 * hierarchies, and integrity rules live in the full `eer` metamodel.
 */
```

That is not duplication for its own sake. Two facts from Part 1 force
it.

A model is written in exactly one metamodel, named in its `$synth`
header and checked against the transformation's manifest before any
engine work happens. There is no notion of a model written in "basic
plus a bit of advanced".

And types belong to schemas. The basic stage's concepts live in
`t.schema("EERTutorialBasicSchema")`, the advanced stage's in
`t.schema("EERTutorialAdvancedSchema")`. `em.Entity` imported from the
advanced module is a different type object than `em.Entity` imported
from the basic one, and since `store.isTypeOf` and the specialization
dispatch both compare type objects, mixing the two would silently match
nothing. Keeping each stage whole keeps each stage's type identity
whole.

The practical consequence for you is a single line. The sample model's
header and the manifest's `source.metamodel` both name the advanced
package, and everything else about how the model is authored is
unchanged.

## What the advanced stage adds

Two type declarations, both subtypes of `Entity`, in
`EER-advanced.meta.model.type.ts`:

```ts
// The specialization part dispatches Entity2Table on these subtypes.
export const Kernel = t.subtype(Entity, {}, "Kernel", EERTutorialAdvanced_TypeSchema)

// A weak entity is identified relative to an owner entity: its own
// attributes carry only a partial key, so the owner link is what a
// specialized rule turns into the rest of the key.
export const Weak = t.subtype(
  Entity,
  {
    owner: Entity,
  },
  "Weak",
  EERTutorialAdvanced_TypeSchema
)
```

and the two interfaces derived from them, beside the ones the basic
stage already had:

```ts
export type IKernel = t.TypeOf<typeof Kernel>
export type IWeak = t.TypeOf<typeof Weak>
```

`Kernel` adds no properties at all. It is a pure marker: a kernel
entity is exactly an entity, and the only thing that distinguishes it
is that the model author said `Kernel` rather than something else.
Empty subtypes are cheap and they are worth declaring, because a type
is the thing dispatch can see. A boolean property `isWeak` on `Entity`
would carry the same information and no rule could dispatch on it.

`Weak` adds one property, `owner`, pointing at the `Entity` that
identifies it. Note that its declared type is `Entity` and not
`Kernel`: a weak entity may be owned by another weak entity, and
nothing in the metamodel needs to forbid that.

Everything else in the file is the basic stage verbatim, under the
advanced schema: `EERSchema`, `Domain`, `Attribute`, `Entity`, the
`t.inverseProps` call joining attributes to entities, `Mapping`,
`OrdinaryMapping`, and `Relationship`. Part 1's
[source metamodel page](../part-1-basic/1-source-metamodel.md) walks
through all of them.

## Two more tag functions

The components file gains one JSX tag per new concept:

```ts
export const Kernel: Template<e.IKernel> = (props) => {
  return new ExprNode(e.Kernel, props, undefined)
}

export const Weak: Template<e.IWeak> = (props) => {
  return new ExprNode(e.Weak, props, undefined)
}
```

Both pass `undefined` as the connection info, exactly as `Entity`
does, because a kernel or weak entity is a top-level member of the
model, not something nested inside another element. The `Entity` tag
stays exported too, and the next section shows what it is still for.

## The sample model

The Part 2 sample is Part 1's Library schema with the entity tags made
specific and one entity added. Here are the parts that matter, from
`examples/tutorial/eer-tutorial-advanced/sample/library.tsx`:

```tsx
    <Kernel name="Book">
      <Attribute name="bookId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="bookTitle" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Kernel>
```

`Book`, `Author`, and `Publisher` are all written this way: `Kernel`
where Part 1 wrote `Entity`, and identical inside. The new element is
the weak one:

```tsx
    {/* A physical copy exists only as a copy of some book: copyNumber is
        a partial key, and Book completes it. Part 2 maps the owner link
        to a foreign key that takes part in the primary key. */}
    <Weak name="BookCopy" owner={<Entity $refByName="Book"></Entity>}>
      <Attribute name="copyNumber" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="copyShelf" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Weak>
```

Read `isKey={true}` on `copyNumber` as "partial key" rather than
"primary key". Within one book, the copy numbers are distinct; across
the whole library they repeat, and the model does not pretend
otherwise. Completing the key is the transformation's job, and it can
only do it because of the next line.

The `owner` prop is the reference form Part 1 introduced, used inside a
prop:

```tsx
owner={<Entity $refByName="Book"></Entity>}
```

`$refByName` resolves an element that already exists by name, so this
points at the `Book` declared a few lines above rather than creating
anything. The tag is `Entity` because `owner` is declared as an
`Entity`; the element it resolves to happens to be a `Kernel`, which is
an `Entity`, so both the property type and the reference are satisfied.
Roles use the same form for the same reason.

## Why the owner link is the whole point

Without `owner`, `Weak` would be a label and nothing more. A rule could
see that `BookCopy` is weak, and would then have no way to act on it:
it could not name the foreign key, could not type it, and could not
say what it references. There is nothing to look up. A weak entity's
identity is a fact about its relationship to another entity, so it has
to be represented as a link to that entity.

With `owner` present, everything a specialized rule needs is one
property access away, and page 3's `weakToTable` uses exactly that:

- `w.owner.name` gives the column its name, qualified with the weak
  entity's own name.
- The owner's key attribute gives the column both its SQL type and the
  column it references, through the same `keyAttributeOf` helper Part 1
  wrote for relationship foreign keys.

This is the general shape of the lesson. Adding a subtype to a
metamodel is only half the work; the subtype earns its place when it
carries the property that makes the specialized rule possible.

The `owner` link also settles a question of order. Part 1's page 2
explained that a `references` link resolves against what is already in
the store, so the owner's primary key column has to exist before the
weak entity's table is built. Entities are mapped in model order, so
the owner has to be written before the weak entity in the source file.
`Book` above `BookCopy` in this sample is what satisfies that, and the
same holds for a weak entity owned by another weak entity.

## What stays the same in `topRule()`

One thing worth checking before you move on. Part 1's template selects
entities like this, and Part 2 does not change the line:

```tsx
        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, em.Entity))
          .map((el) => this.entityToTable(el as em.IEntity))}
```

`isTypeOf` is a subtype test, so a `Kernel` and a `Weak` both pass a
test against `em.Entity`. The traversal still says "for every entity in
the model", which is what it means, and the question of which kind of
entity each one is never reaches the template. That question is settled
one level down, which is the subject of the next page.

## Next

The metamodel offers the distinction. Now make the transformation act
on it: [specialization](./2-specialization.md).
