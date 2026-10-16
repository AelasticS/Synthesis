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
import { ModelElement } from '@aelastics/synthesis/metamodel'

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

## Name scopes

Element names are unique per name scope, and by default the model is
the only scope: two elements in one model cannot share a name, wherever
they sit. A metamodel may relax this by declaring further concepts as
scopes, with one line next to the type definition:

```typescript
import { Model, ModelElement, declareNamespace } from '@aelastics/synthesis/metamodel'

export const Table = t.subtype(RelConcept, {
  columns: t.arrayOf(Column),
}, "Table", RelModel_TypeSchema)

// A table scopes its columns' names: every table can have its own `id`.
declareNamespace(Table)
```

`declareNamespace` is a classification, not a supertype: it works on a
concept wherever it sits in the subtype hierarchy, so a type keeps its
natural parent and still scopes names.

The declaration changes two things. Elements contained in a scope get
nested paths (`//db/book/id` and `//db/copy/id` coexist), and reference
resolution becomes scope-aware: a bare `$refByName` resolves against
the nearest enclosing scope first, probing outward to the model, while
a path such as `book/id` reaches into a sibling scope. Metamodels that
declare no scopes keep the flat one-name-per-model rule unchanged.

In the metamodel-as-model, the classification is recorded as the
`isNamespace` marker on the concept's type object, so the data form of
the metamodel carries the same fact as the code.
The [building-models guide](./building-models.md#name-scopes) describes
resolution in detail, and
[Part 4 of the model-to-model tutorial](../tutorial/model-to-model/part-4-name-scopes/index.md)
shows what the declaration changes across a whole transformation.

## Constraints

A metamodel can declare semantic rules directly on its concepts with
`addValidator`, the same mechanism every aelastics type carries (see
[Specifying Constraints](../../types/defining-types/constraints.md)).
The predicate receives the element instance with its links live, so
rules can span the graph:

```typescript
// an aggregation relates at least two participants
Aggregation.addValidator({
  predicate: (v) => (v?.agrMapp?.length ?? 0) >= 2,
  message: (_v, label) => `${label}: an aggregation relates at least two participants`,
})

// identification dependencies must not loop: ONE rule on the schema
// walks the COMBINED graph (weak ownership, aggregation
// participation, subtyping) once per validation, because kind-local
// checks would miss mixed cycles, e.g. a weak entity owned by an
// aggregation it participates in. Typed with the metamodel's own
// interfaces; the message names the elements on the cycles.
const identityDependencies = (el: IEntity): IEntity[] => { /* weakMap.domain, agrMapp[].domain, supertype.mapping.domain */ }
const elementsOnIdentityCycles = (schema: IEERSchema): IEntity[] => { /* colored DFS over schema.elements */ }

EERSchema.addValidator({
  predicate: (v: IEERSchema) => elementsOnIdentityCycles(v).length === 0,
  message: (v: IEERSchema, label?: string) =>
    `${label}: cyclic identification dependency involving ${elementsOnIdentityCycles(v).map((e) => e.name).join(", ")}`,
})
```

Placement follows the rule's nature: an element-local rule (arity, a
required mapping) sits on the element's type, while a whole-graph rule
(acyclicity) sits on the schema type, so it runs once per validation
rather than once per element. The full walker is in the eer-metamodel
source (EER.meta.model.type.ts).

Timing is the point to understand. Validators never run during
authoring or rendering, because a model under construction is
legitimately incomplete: a weak entity exists before the mapping that
names its owner, and arrays grow one element at a time. Declared
constraints are judgments about the finished model, and they run at a
validation point: `synth model validate <ref>` renders the model and
then executes every element's declared validators, reporting each
violation with the rule's own message. The same reasoning explains a
modeling guideline from the creation order: a backlink on a child
(`Subtype.supertype`, filled the moment the child connects to its
parent) may be a mandatory property, while a slot filled by a later
element (`Weak.weakMap`) must be type-level optional, with the
completeness rule declared as a constraint instead.

The
[full EER metamodel](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql/metamodels/eer)
of the advanced-eer-to-sql suite declares its doctrine
this way: binary relationships (the message points the modeler to
Aggregation), aggregation arity, weak-mapping presence, and the
schema-level identification-dependency acyclicity shown above.

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
import { Model, ModelElement } from '@aelastics/synthesis/metamodel'

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
import { Model, ModelElement, declareNamespace } from '@aelastics/synthesis/metamodel'

export const RelModel_TypeSchema = t.schema("RelModelSchema")

export const RelConcept = t.subtype(ModelElement, {}, "RelConcept", RelModel_TypeSchema)

export const Column = t.subtype(RelConcept, {
  type: t.string,
  isKey: t.boolean,
  // A column is a foreign key exactly when it references another
  // column: the fact is derived from the model, never stored beside
  // it where the two could disagree.
  references: t.optional(t.link(RelModel_TypeSchema, "Column")),
  ownerTable: t.optional(t.link(RelModel_TypeSchema, "Table")),
}, "Column", RelModel_TypeSchema)

export const Table = t.subtype(RelConcept, {
  columns: t.arrayOf(Column),
}, "Table", RelModel_TypeSchema)

export const RelSchema = t.subtype(Model, {}, "RelSchema", RelModel_TypeSchema)

t.inverseProps(Table, 'columns', Column, 'ownerTable')

// A table scopes its columns' names.
declareNamespace(Table)

export type IRelSchema = t.TypeOf<typeof RelSchema>
export type ITable     = t.TypeOf<typeof Table>
export type IColumn    = t.TypeOf<typeof Column>
```

These two metamodels are the source and target of the EER-to-Relational transformation covered in [Writing Transformations](./writing-transformations.md). The repository ships both shapes executable: the tutorial's [rel-tutorial metamodel](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/metamodels/rel-tutorial) is this relational shape (a flat base stage and a name-scopes stage), and the advanced-eer-to-sql suite's [full relational metamodel](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql/metamodels/relational) goes further, with first-class composite foreign keys and indexes.
