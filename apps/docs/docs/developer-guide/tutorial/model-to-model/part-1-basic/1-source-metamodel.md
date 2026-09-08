---
sidebar_position: 1
---

# 1. The source metamodel

Nothing in Synthesis can be written before its metamodel exists.
Models are JSX expressions whose tags come from a metamodel, and a
transformation is a function from one metamodel's elements to another
metamodel's elements. So this is where Part 1 starts.

The source metamodel here is the **basic tutorial EER metamodel**. It
carries exactly the concepts this part needs and nothing more: entities
with attributes over domains, and binary relationships with cardinality
roles. It ships in the repository as the `eer-tutorial-metamodel`
package, imported as `eer-tutorial-metamodel/basic`, and its sources
live in
[`examples/tutorial/metamodels/eer-tutorial/src/basic/`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/metamodels/eer-tutorial/src/basic).
Read
this page as if you were writing those two files yourself, because that
is exactly what authoring a metamodel looks like.

## Every metamodel makes two declarations

A metamodel is two files, and the split is the same for every metamodel
in the system:

1. **The concepts, as aelastics types.** Each concept is declared with
   its properties and its supertype, and a TypeScript interface is
   derived from it. This is the data model: what may exist, what
   properties it has, how instances relate.
2. **One JSX tag function per concept.** Each concept gets a small
   function, called a component, that binds a JSX tag to its type and
   says which parent property a nested element connects into. This is
   the authoring surface: what you can write in a `.tsx` file.

The first file is `EER-basic.meta.model.type.ts`, the second is
`EER-basic-components.ts`. Neither is generated; both are ordinary
TypeScript you write once per metamodel.

## Declaration one: the concepts as aelastics types

Here is the complete type declaration, from
`examples/tutorial/metamodels/eer-tutorial/src/basic/EER-basic.meta.model.type.ts`:

```ts
import * as t from "@aelastics/types"

import { ModelElement, Model } from "@aelastics/synthesis/metamodel"

export const EERTutorialBasic_TypeSchema = t.schema("EERTutorialBasicSchema")

export const EERSchema = t.subtype(Model, {}, "EERSchema", EERTutorialBasic_TypeSchema)

export const Domain = t.subtype(ModelElement, {}, "Domain", EERTutorialBasic_TypeSchema)

export const Attribute = t.subtype(
  ModelElement,
  {
    attrDomain: Domain,
    attrEntity: t.link(EERTutorialBasic_TypeSchema, "Entity"),
    isKey: t.boolean,
  },
  "Attribute",
  EERTutorialBasic_TypeSchema
)

export const Entity = t.subtype(
  ModelElement,
  {
    attributes: t.arrayOf(Attribute),
  },
  "Entity",
  EERTutorialBasic_TypeSchema
)

t.inverseProps(Attribute, "attrEntity", Entity, "attributes")

export const Mapping = t.subtype(
  ModelElement,
  {
    domain: Entity,
    lb: t.string.derive().oneOf(["0", "1", "M"]),
    ub: t.string.derive().oneOf(["1", "M"]),
  },
  "Mapping",
  EERTutorialBasic_TypeSchema
)

export const OrdinaryMapping = t.subtype(
  Mapping,
  {
    relationship: t.link(EERTutorialBasic_TypeSchema, "Relationship", "relationship"),
  },
  "OrdinaryMapping",
  EERTutorialBasic_TypeSchema
)

export const Relationship = t.subtype(
  ModelElement,
  {
    roles: t.arrayOf(OrdinaryMapping),
  },
  "Relationship",
  EERTutorialBasic_TypeSchema
)

export type IEERSchema = t.TypeOf<typeof EERSchema>
export type IDomain = t.TypeOf<typeof Domain>
export type IAttribute = t.TypeOf<typeof Attribute>
export type IEntity = t.TypeOf<typeof Entity>
export type IMapping = t.TypeOf<typeof Mapping>
export type IOrdinaryMapping = t.TypeOf<typeof OrdinaryMapping>
export type IRelationship = t.TypeOf<typeof Relationship>
```

Five things in that listing are worth pausing on.

**The schema.** `t.schema("EERTutorialBasicSchema")` creates the named
container every type in this metamodel belongs to. It is passed as the
last argument to every `t.subtype` call, and it is what makes the types
resolvable by name later on.

**`t.subtype` and the base types.** Every concept extends either
`Model` or `ModelElement`, both from `@aelastics/synthesis/metamodel`. Those
base types supply what all model elements have in common, `name` above
all, which is why no concept here declares a `name` property of its
own. `EERSchema` extends `Model` because it is the root container;
everything else extends `ModelElement`.

**Forward references with `t.link`.** `Attribute.attrEntity` has to
refer to `Entity`, but `Entity` is declared after `Attribute`.
`t.link(schema, "Entity")` names the target type by string within the
schema and resolves it later, which lets concepts refer to each other
in any order.

**Bidirectional associations with `t.inverseProps`.** The line

```ts
t.inverseProps(Attribute, "attrEntity", Entity, "attributes")
```

declares that `Attribute.attrEntity` and `Entity.attributes` are the
two ends of one association. Setting either end updates the other, so
an attribute added to `entity.attributes` automatically has its
`attrEntity` pointing back. Without this, the two properties would be
independent and could drift apart.

**Interfaces derived from types, not written beside them.**
`t.TypeOf<typeof Entity>` produces the TypeScript interface that
corresponds to the runtime type. There is one source of truth: change
the type declaration and the interface follows. Those `I...` interfaces
are what your transformation code is typed against.

### Domain is what gives attributes their types

`Domain` looks almost empty (`t.subtype(ModelElement, {}, ...)`), and
it is easy to skip past. It is central. An EER attribute does not carry
a SQL type; it carries a reference to a domain, and the domain's name
is the type information. In the sample model an attribute writes
`<Domain name="number" />` or `<Domain $refByName="string" />`, and the
transformation reads `a.attrDomain.name` to decide whether the column
becomes `INTEGER` or `VARCHAR(255)`.

This indirection is what keeps the source metamodel independent of any
target technology. The EER model says "this attribute ranges over
numbers"; only the transformation decides that numbers become
`INTEGER` in this particular target. Page 4 shows the mapping function
that makes that decision.

### Mapping, OrdinaryMapping, and cardinality

A relationship in this metamodel is a named element with an array of
`roles`. Each role is an `OrdinaryMapping`: it points at the entity it
connects (`domain`) and carries the cardinality of that end as two
strings, a lower bound `lb` in `"0"`, `"1"`, `"M"` and an upper bound
`ub` in `"1"`, `"M"`. The `.derive().oneOf([...])` call constrains the
admissible values, so a typo like `ub="N"` is rejected when the model
is validated rather than misbehaving at run time.

`Mapping` holds everything a role needs; `OrdinaryMapping` adds only
the link back to its owning relationship. The split exists because
richer EER metamodels add other mapping kinds beside the ordinary one.
In Part 1 you only ever see `OrdinaryMapping`.

Reading cardinality off the roles is the whole of the relationship
rule: a relationship whose two roles both have `ub === "M"` is M:N, and
anything else has an N side to hang a foreign key on.

## Declaration two: one tag function per concept

The types above cannot be written as JSX yet. That is the second file's
job, `EER-basic-components.ts`, complete:

```ts
import * as e from "./EER-basic.meta.model.type.js"
import {
  CpxTemplate,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<e.IEERSchema> & { store?: IStore };

export const EERSchema: CpxTemplate<IModelProps, e.IEERSchema> = (props) => {
  return new ExprNode(e.EERSchema, props, undefined)
}

export const Entity: Template<e.IEntity> = (props) => {
  return new ExprNode(e.Entity, props, undefined)
}

export const Attribute: Template<e.IAttribute> = (props) => {
  return new ExprNode(e.Attribute, props, "attributes")
}

export const Domain: Template<e.IDomain> = (props) => {
  return new ExprNode(e.Domain, props, "attrDomain")
}

export const Relationship: Template<e.IRelationship> = (props) => {
  return new ExprNode(e.Relationship, props, undefined)
}

export const Role: Template<e.IOrdinaryMapping> = (props) => {
  return new ExprNode(e.OrdinaryMapping, props, "roles")
}
```

Every one of these functions has the same shape: it receives the JSX
props and returns `new ExprNode(type, props, connectionInfo)`. The
first argument is the aelastics type the tag instantiates. The second
is whatever the JSX author wrote as attributes. The third argument is
the interesting one.

### The third argument names the parent property

`ExprNode`'s third argument is the name of the property on the parent
element that a nested occurrence of this tag connects into. It is what
turns nesting into structure.

Because `Attribute` passes `"attributes"`, writing

```tsx
<Entity name="Book">
  <Attribute name="bookId" isKey={true} />
</Entity>
```

puts the new attribute into `book.attributes`, and (thanks to
`t.inverseProps`) sets `attribute.attrEntity` to the book. Because
`Domain` passes `"attrDomain"`, a `Domain` nested inside an
`Attribute` lands in `attribute.attrDomain`. Because `Role` passes
`"roles"`, roles nested inside a `Relationship` land in
`relationship.roles`.

A third argument of `undefined` means the tag has no parent property:
the element is a top-level member of the model. `Entity` and
`Relationship` pass `undefined`, which is why entities and
relationships sit directly under `EERSchema` and end up in the model's
`elements` collection. The transformation iterates exactly that
collection when it scans the source model.

Two smaller points in the same listing:

- **The tag name need not match the type name.** The `Role` component
  instantiates the `OrdinaryMapping` type. The exported name of the
  function is the JSX tag, so model authors write `<Role .../>` while
  the store holds `OrdinaryMapping` instances. Choose tag names for
  readability in models.
- **The root component is different.** `EERSchema` is typed as
  `CpxTemplate` rather than `Template`, and its props include an
  optional `store`. The root of a model expression is where the
  `ModelStore` enters, which is why the sample model on page 3 writes
  `<EERSchema name="Library" store={store}>` and nothing
  below it mentions the store again. `WithRefProps` is what allows any
  tag to be written in reference form (`$refByName`) instead of
  definition form; page 3 uses that.

## The package's entry point

The two files are tied together by an `index.ts` and the package's
subpath exports:

```ts
// Basic tutorial EER metamodel (model-to-model tutorial, Part 1).
// Package convention: "eer-tutorial-metamodel/basic" exports the JSX
// template components flat. The data-type schemas live behind
// "eer-tutorial-metamodel/basic/model" to avoid identifier clashes (e.g.
// `EERSchema` is both an @aelastics/types Type and a JSX template).
export * from "./EER-basic-components.js"
```

The components are re-exported flat, so an author can write

```ts
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from 'eer-tutorial-metamodel/basic'
```

and get the JSX tags. The data types live behind the `/model` subpath,
which the package's `exports` map points straight at the types file:

```ts
import * as em from 'eer-tutorial-metamodel/basic/model'
```

This is the convention every metamodel package in the repository
follows, from the framework's internal metamodels to the example
suites' domain metamodels: the flat subpath exports the JSX
components, and `<subpath>/model` exports the type schemas.

The split is not decoration. `EERSchema` is both an aelastics
type and a JSX tag function, and the two would clash if both were
exported flat from the same module. The transformation on page 4 uses
both at once, the tags to build output and `em.Entity` to test source
element types, so it imports them under different names.

## Why a metamodel must be an importable package

You may be wondering why the metamodel lives in a package of its own
rather than in a folder next to the transformation. The answer is the
single most useful thing to understand about how the CLI runs your
code.

When the CLI loads a workspace model, it transpiles the `.tsx` file and
then does something specific with its imports: **every bare package
specifier is resolved against the CLI's own installation first, then
against the installed transformation packages' dependencies, and left
external.** Only relative imports inside the model file are bundled.
The loader in `apps/cli/src/models/loader.ts` says so in as many words:

```ts
// Bare specifiers (packages and node builtins) are resolved against the
// CLI's own node_modules first, then against installed transformation
// packages, and emitted as absolute-path externals. The imported model
// therefore shares the exact module instances -- and with them aelastics
// type/schema identity -- with the CLI process and with every other
// importer in this run; bundling copies of metamodel packages would break
// that identity. Relative imports inside the model file are bundled as
// usual.
```

Transformation packages are loaded the same way: bare specifiers in the
manifest's `entry` and `parts` route through the same resolver, and
each specifier is resolved at most once per process, so every importer
in a run shares one module instance.

The consequence is the point. The source model, the transformation
class, and the engine all end up holding *the same* aelastics type
objects, not three structurally identical copies. That matters because
type identity is how the system works:

- `store.isTypeOf(el, em.Entity)` compares against the type object the
  metamodel package exported. If the model had been rendered from its
  own private copy of the metamodel, the elements would carry a
  different `Entity` object and every such test would silently return
  `false`.
- Reference resolution, schema lookup, and validation all key off the
  same schema instance.

A metamodel reached only through relative paths cannot participate in
that: relative imports are bundled per transpiled module, so even two
parts of one package would end up with private copies. So a metamodel
is a package, resolvable by a bare specifier, and it is named that way
in model headers and in manifests. If the CLI cannot resolve one, it
says so explicitly:

```text
Cannot resolve import '<specifier>'. Package imports must be resolvable
from the Synthesis CLI installation or from an installed transformation package.
```

For Part 1 this costs you nothing. `eer-tutorial-metamodel` is a
package in the tutorial suite's `metamodels/` folder, and the tutorial
transformation declares it as an ordinary dependency, so installing the
transformation brings the metamodel with it and the CLI resolves it
from there. When you author a metamodel of your own, do the same: make
it a package and ship it as a dependency of your transformation.

## Next

The source side is settled. The
[target metamodel](./2-target-metamodel.md) is the other half of the
transformation's signature, and you do not have to write it.
