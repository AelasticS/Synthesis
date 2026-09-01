---
sidebar_position: 6
---

# Design Decisions in Transformations

Model transformations are not just technical mappings. They involve meaningful design decisions that affect the structure and semantics of the output. For example, a 0..1 to 0..M relationship in an EER model can legitimately be transformed into either a foreign key column or a separate join table. Each approach has different tradeoffs in terms of normalization, performance, and null handling.

Traditional transformation approaches hardcode one particular solution, burying these design decisions in the transformation logic. Our approach separates design knowledge from transformation implementation. Design decisions become explicit, configurable artifacts that guide transformation execution.

## Core Concepts

The approach is built on four interconnected artifacts.

### Design Decision Space

A design decision space captures the complete set of design decisions (called **issues**) relevant to a transformation domain. Each issue has two or more **options**, a **default** option, and a **scope** (model-level or element-level).

Issues and options are defined independently of any source modeling language. For example, transformations from various data modeling languages (ER, UML class diagrams, IDEF1X) to relational schemas share common design decisions: how to handle inheritance hierarchies, how to map associations, what naming conventions to use. By capturing these decisions once, the same design knowledge is reusable across transformations from different source languages.

| Concept | Description |
|---|---|
| **Issue** | A design decision with at least two alternatives (e.g., "how to map a 0..1:M relationship") |
| **Option** | One possible resolution of an issue (e.g., "ForeignKey" or "JoinTable") |
| **Default** | The option selected when no explicit choice is made |
| **Scope: model** | The decision applies globally to the entire transformation (e.g., naming conventions) |
| **Scope: element** | The decision is resolved independently for each applicable source element |

Element-level scope is important. It means that two relationships in the same source model can be transformed using different strategies. One relationship might use a foreign key, while another uses a join table. The decision is per-element, not per-type.

### Binding Model

Since the decision space is language-agnostic, a separate **binding model** connects issues to specific metaclasses in a source metamodel. A binding says: "this issue is relevant when transforming instances of this metaclass, provided this condition holds."

For example, the "relationship mapping" issue is bound to the `Relationship` metaclass in the ER metamodel, with a condition that checks whether the relationship has 0..1 to 0..M multiplicity. The same issue could be bound to the `Association` metaclass in a UML metamodel through a separate binding model.

Bindings are defined at the metamodel level (M2) but their conditions are evaluated at the model level (M1) on each concrete element. This means the same binding model works for any source model that conforms to the metamodel.

### Configuration Model

A **configuration model** records the actual choices for a specific transformation task. For each source model element and each applicable issue, the developer selects one option.

- For **model-level** issues, one choice applies globally.
- For **element-level** issues, each element gets its own choice.

A default configuration can be generated automatically from the source model. Every applicable issue is set to its default option. The developer reviews and modifies as needed. The default configuration is always valid and can be used without modification.

### Execution Trace

During transformation execution, a **trace model** records which source elements were transformed to which target elements, which rules were applied, and which design choices guided each step. This provides full traceability from source through decisions to target.

## Implementation in Synthesis

In the AelasticS framework, the four artifacts map to decorators and runtime structures.

### Variability Points (`@VarPoint`)

A variability point is a transformation rule where a design decision must be resolved. Mark it with `@VarPoint` and an issue name. The method body throws because it is never called directly. The framework dispatches to one of its registered options.

```typescript
@E2E()
@VarPoint("OneToManyStrategy")
RelationshipMapping(rel: et.IRelationship): ExprNode<rt.IColumn> | ExprNode<rt.ITable> {
  throw new Error("VarOptions should be selected")
}
```

The string argument identifies the design issue. At runtime, the framework looks up the configuration for this issue and the current source element, then dispatches to the matching option.

### Variability Options (`@VarOption`)

Each option is a separate method registered with `@VarOption`. It takes the name of the variability point method it belongs to and a predicate that determines when it is selected.

```typescript
@VarOption("RelationshipMapping", Option("ForeignKey"))
relationshipAsForeignKey(rel: et.IRelationship): ExprNode<rt.IColumn> {
  return (
    <r.Column
      name={`${rel.name}_FK`}
      isForeignKey={true}
    />
  )
}

@VarOption("RelationshipMapping", Option("JoinTable"))
relationshipAsJoinTable(rel: et.IRelationship): ExprNode<rt.ITable> {
  return (
    <r.Table name={`${rel.name}_Join`}>
      <r.Column name={`${rel.sourceEntity.name}_FK`} isForeignKey={true} />
      <r.Column name={`${rel.targetEntity.name}_FK`} isForeignKey={true} />
    </r.Table>
  )
}
```

Options cannot be invoked directly by other rules. They can only be reached through the resolution mechanism at their parent variability point. This guarantees that the configuration model is the single source of truth for all design decision resolution. No rule can bypass the variability mechanism.

### Default Option (`@Default`)

Marks an option as the fallback. When no other predicate evaluates to true, the default is selected.

```typescript
@Default()
@VarOption("RelationshipMapping", Option("ForeignKey"))
relationshipAsForeignKey(rel: et.IRelationship): ExprNode<rt.IColumn> {
  return <r.Column name={`${rel.name}_FK`} isForeignKey={true} />
}
```

If every variability point has a default option, the transformation is complete: it will always find a rule to apply, regardless of the configuration.

### Predicate Language

Predicates are guards on variability options. They evaluate against the configuration model for the current source element.

| Operator | Meaning | Example |
|---|---|---|
| `Option(name)` | True if the named option is selected for the current element | `Option("ForeignKey")` |
| `Default()` | Fallback when no other predicate matches | used via `@Default()` |
| `And(...conds)` | All conditions must be true | `And(Option("A"), Option("B"))` |
| `Or(...conds)` | At least one condition must be true | `Or(Option("A"), Option("B"))` |
| `Not(cond)` | Negation | `Not(Option("Legacy"))` |

These compose freely:

```typescript
@VarOption("SomeRule", And(Option("FeatureX"), Not(Option("LegacyMode"))))
optimizedVariant(e: IElement): ExprNode<ITarget> {
  // Selected when FeatureX is on and LegacyMode is off
}
```

When each option's predicate is a single `Option(name)` reference (the common case), the predicates are automatically mutually exclusive. The transformation is deterministic under all valid configurations.

## The Configuration Model in Code

The configuration model is passed to the transformation constructor as the fourth type parameter of `DecisionAwareM2M`.

```typescript
import * as cm from '@aelastics/synthesis/metamodels/configuration/model'

@M2M()
class EER2RelWithConfig
  extends DecisionAwareM2M<et.IEERSchema, rt.IRelSchema, {}, cm.IConfigurationModel>
{
  constructor(store: ModelStore, extra: {}, configModel?: cm.IConfigurationModel) {
    super(store, extra, configModel)
  }
  // ...
}
```

### Running with Different Configurations

The same transformation class produces structurally different target models depending on the configuration.

```typescript
const store = new ModelStore()
const source = buildEERModel(store)

// Use foreign key strategy for all relationships
const fkConfig = buildConfig({ OneToManyStrategy: "ForeignKey" })
const fkResult = new EER2RelWithConfig(store, {}, fkConfig).transform(source)

// Use join table strategy for all relationships
const jtConfig = buildConfig({ OneToManyStrategy: "JoinTable" })
const jtResult = new EER2RelWithConfig(store, {}, jtConfig).transform(source)
```

Because issues can have element-level scope, you can also configure individual elements differently:

```typescript
// Mixed: foreign key for Employment, join table for Membership
const mixedConfig = buildConfig({
  OneToManyStrategy: {
    "Employment": "ForeignKey",
    "Membership": "JoinTable",
  }
})
const mixedResult = new EER2RelWithConfig(store, {}, mixedConfig).transform(source)
```

## Complete Example

```typescript
/** @jsx createExprNode */
import { createExprNode, ExprNode } from '@aelastics/synthesis/jsx'
import { E2E, M2M } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import { DecisionAwareM2M, VarPoint, VarOption, Default, Option } from '@aelastics/synthesis/variability'
import * as et from './EER.meta.model.type'
import * as rt from './REL.meta.model.type'
import * as r from './REL.jsx-comps'
import * as cm from '@aelastics/synthesis/metamodels/configuration/model'

@M2M()
class EER2RelWithConfig
  extends DecisionAwareM2M<et.IEERSchema, rt.IRelSchema, {}, cm.IConfigurationModel>
{
  constructor(store: ModelStore, extra: {}, configModel?: cm.IConfigurationModel) {
    super(store, extra, configModel)
  }

  template(source: et.IEERSchema) {
    return (
      <r.RelSchema name={`${source.name} Relational Schema`}>
        {source.elements
          .filter((el) => this.context.store.isTypeOf(el, et.Entity))
          .map((el) => this.Entity2Table(el as et.IEntity))
        }
        {source.elements
          .filter((el) => this.context.store.isTypeOf(el, et.Relationship))
          .map((el) => this.RelationshipMapping(el as et.IRelationship))
        }
      </r.RelSchema>
    )
  }

  @E2E()
  Entity2Table(e: et.IEntity): ExprNode<rt.ITable> {
    return (
      <r.Table name={e.name}>
        {e.attributes.map((a) => this.Attribute2Column(a))}
      </r.Table>
    )
  }

  @E2E()
  Attribute2Column(a: et.IAttribute): ExprNode<rt.IColumn> {
    return <r.Column name={a.name} />
  }

  // Variability point: how to handle relationships
  @E2E()
  @VarPoint("OneToManyStrategy")
  RelationshipMapping(rel: et.IRelationship): ExprNode<rt.IColumn> | ExprNode<rt.ITable> {
    throw new Error("VarOptions should be selected")
  }

  // Option A: foreign key column (default fallback)
  @Default()
  @VarOption("RelationshipMapping", Option("ForeignKey"))
  relationshipAsForeignKey(rel: et.IRelationship): ExprNode<rt.IColumn> {
    return <r.Column name={`${rel.name}_FK`} isForeignKey={true} />
  }

  // Option B: separate join table
  @VarOption("RelationshipMapping", Option("JoinTable"))
  relationshipAsJoinTable(rel: et.IRelationship): ExprNode<rt.ITable> {
    return (
      <r.Table name={`${rel.name}_Join`}>
        <r.Column name={`Source_FK`} isForeignKey={true} />
        <r.Column name={`Target_FK`} isForeignKey={true} />
      </r.Table>
    )
  }
}
```

## Guarantees

The framework provides several guarantees for well-formed transformations with design decisions.

**Determinism.** When each option's predicate is a single `Option(name)` reference, at most one option matches for any given element and configuration. There are no ambiguous cases.

**Completeness.** If every variability point has a `@Default` option, the transformation always finds a rule to apply. No source element can reach a variability point without a matching option.

**Separation.** Options can only be reached through the resolution mechanism at their variability point. No rule can directly invoke an option, so the configuration model governs all design decision resolution.

**Default validity.** A default configuration (all issues set to their default options) is always valid. It can be used without modification as a starting point.

## Combining with Polymorphic Dispatch

Variability points and specialization points address different concerns and can coexist in the same transformation.

| Mechanism | Dispatches on | Use when |
|---|---|---|
| `@SpecPoint` / `@SpecOption` | Source element's runtime type (subtype hierarchy) | Different subtypes need different transformation logic |
| `@VarPoint` / `@VarOption` | Configuration model (design decisions) | The same element type has multiple valid transformation strategies |

For example, `@SpecPoint` on `Entity2Table` dispatches Kernel and Weak entities differently (structural concern). `@VarPoint` on `RelationshipMapping` lets the developer choose between foreign key and join table strategies (design concern). Both can appear in the same transformation class.
