---
sidebar_position: 1
---

# Defining Metamodels

A metamodel is a type schema that describes what can appear in a model: which entity types exist, what properties they carry, how they relate to each other, and what subtype hierarchies are defined. In Synthesis, metamodels are built using the `@aelastics/types` API.

## Creating a Type Schema

Every metamodel starts with a schema. A schema is a named container for related types.

```typescript
import * as t from '@aelastics/types'

export const EERModel_TypeSchema = t.schema("EERModelSchema")
```

All entity types, object types, and associations defined for this metamodel must reference this schema.

## Defining Entity Types

Entity types are the building blocks of models. Each entity type defines named, identifiable model elements. Use `t.subtype()` to create entity types that extend a base type.

```typescript
import { ModelElement } from 'aelastics-synthesis'

// A base concept for all EER elements
export const ERConcept = t.subtype(
  ModelElement,    // parent type (all model elements inherit from ModelElement)
  {},              // additional properties (none for the base)
  "ERConcept",     // type name
  EERModel_TypeSchema  // schema this type belongs to
)
```

`ModelElement` is provided by the Synthesis framework. It gives every element a `name` and `id` property and connects it to the model store.

## Adding Properties

Properties are declared in the second argument of `t.subtype()`. Use type constructors for different kinds of properties.

```typescript
export const Domain = t.subtype(ERConcept, {}, "Domain", EERModel_TypeSchema)

export const Attribute = t.subtype(
  ERConcept,
  {
    attrDomain: Domain,                              // association to Domain
    attrEntity: t.link(EERModel_TypeSchema, 'Entity'), // forward reference to Entity
    isKey: t.boolean,                                // simple attribute
  },
  "Attribute",
  EERModel_TypeSchema
)
```

### Property Types

| Constructor | Purpose | Example |
|---|---|---|
| `t.string` | String attribute | `name: t.string` |
| `t.number` | Number attribute | `age: t.number` |
| `t.boolean` | Boolean attribute | `isKey: t.boolean` |
| `SomeEntityType` | Direct association | `attrDomain: Domain` |
| `t.arrayOf(T)` | Collection association | `attributes: t.arrayOf(Attribute)` |
| `t.optional(T)` | Optional property | `description: t.optional(t.string)` |
| `t.link(schema, name)` | Forward reference to a type not yet defined | `attrEntity: t.link(schema, 'Entity')` |

## Subtype Hierarchies

Subtypes inherit all properties from their parent and can add new ones. This is how you model specialization.

```typescript
export const Entity = t.subtype(
  ERConcept,
  {
    attributes: t.arrayOf(Attribute),
    mappings: t.arrayOf(t.link(EERModel_TypeSchema, "Mapping")),
  },
  "Entity",
  EERModel_TypeSchema
)

// Kernel is a subtype of Entity with no extra properties
export const Kernel = t.subtype(Entity, {}, "Kernel", EERModel_TypeSchema)

// Weak adds an optional association to its owning mapping
export const Weak = t.subtype(
  Entity,
  {
    weakMap: t.optional(t.link(EERModel_TypeSchema, "WeakMapping")),
  },
  "Weak",
  EERModel_TypeSchema
)
```

At runtime, `Kernel` and `Weak` elements are recognized as subtypes of `Entity`. This is what enables polymorphic dispatch in transformations (see [Polymorphic Rule Dispatch](./polymorphic-dispatch.md)).

## Inverse Associations

When two types have a bidirectional relationship, declare both sides and connect them with `t.inverseProps()`. This tells the framework to maintain both directions automatically.

```typescript
t.inverseProps(Attribute, 'attrEntity', Entity, 'attributes')
```

When an Attribute is added to an Entity's `attributes` array, the Attribute's `attrEntity` property is set automatically, and vice versa.

## Extracting TypeScript Interfaces

Use `t.TypeOf<>` to extract a TypeScript interface from any type definition. This gives you compile-time type checking when working with model instances.

```typescript
export type IEERSchema = t.TypeOf<typeof EERSchema>
export type IEntity    = t.TypeOf<typeof Entity>
export type IKernel    = t.TypeOf<typeof Kernel>
export type IWeak      = t.TypeOf<typeof Weak>
export type IAttribute = t.TypeOf<typeof Attribute>
export type IDomain    = t.TypeOf<typeof Domain>
```

These interfaces are used in transformation rules to get typed access to source and target elements.

## Complete Example: EER Metamodel

```typescript
import * as t from '@aelastics/types'
import { Model, ModelElement } from 'aelastics-synthesis'

export const EERModel_TypeSchema = t.schema("EERModelSchema")

export const ERConcept = t.subtype(ModelElement, {}, "ERConcept", EERModel_TypeSchema)
export const Domain    = t.subtype(ERConcept, {}, "Domain", EERModel_TypeSchema)

export const Attribute = t.subtype(ERConcept, {
  attrDomain: Domain,
  attrEntity: t.link(EERModel_TypeSchema, 'Entity'),
  isKey: t.boolean,
}, "Attribute", EERModel_TypeSchema)

export const Entity = t.subtype(ERConcept, {
  attributes: t.arrayOf(Attribute),
}, "Entity", EERModel_TypeSchema)

export const Kernel = t.subtype(Entity, {}, "Kernel", EERModel_TypeSchema)
export const Weak   = t.subtype(Entity, {
  weakMap: t.optional(t.link(EERModel_TypeSchema, "WeakMapping")),
}, "Weak", EERModel_TypeSchema)

export const EERSchema = t.subtype(Model, {}, "EERSchema", EERModel_TypeSchema)

t.inverseProps(Attribute, 'attrEntity', Entity, 'attributes')

// TypeScript interfaces
export type IEERSchema = t.TypeOf<typeof EERSchema>
export type IEntity    = t.TypeOf<typeof Entity>
export type IKernel    = t.TypeOf<typeof Kernel>
export type IWeak      = t.TypeOf<typeof Weak>
export type IAttribute = t.TypeOf<typeof Attribute>
export type IDomain    = t.TypeOf<typeof Domain>
```

## Complete Example: Relational Metamodel

```typescript
import * as t from '@aelastics/types'
import { Model, ModelElement } from 'aelastics-synthesis'

export const RelModel_TypeSchema = t.schema("RelModelSchema")

export const RelConcept = t.subtype(ModelElement, {}, "RelConcept", RelModel_TypeSchema)

export const Column = t.subtype(RelConcept, {
  isForeignKey: t.boolean,
}, "Column", RelModel_TypeSchema)

export const Table = t.subtype(RelConcept, {
  columns: t.arrayOf(Column),
}, "Table", RelModel_TypeSchema)

export const RelSchema = t.subtype(Model, {}, "RelSchema", RelModel_TypeSchema)

t.inverseProps(Column, 'columnTable', Table, 'columns')

export type IRelSchema = t.TypeOf<typeof RelSchema>
export type ITable     = t.TypeOf<typeof Table>
export type IColumn    = t.TypeOf<typeof Column>
```

These two metamodels are the source and target of the EER-to-Relational transformation covered in [Writing Transformations](./writing-transformations.md).
