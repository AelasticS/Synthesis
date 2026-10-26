---
sidebar_position: 6
---

# Polymorphic Rule Dispatch

When a metamodel has a subtype hierarchy, you often need different transformation logic for each subtype. Instead of writing `if/else` chains that check element types, you declare specialized rules that the framework dispatches automatically based on the runtime type of the source element.

## The Problem

Consider transforming EER entities to relational tables. The base rule works for any Entity, but Kernel entities need a primary key column and Weak entities need both a primary key and a foreign key column. Without polymorphic dispatch, you would write:

```typescript
// Without dispatch - manual type checking
Entity2Table(e: et.IEntity): ExprNode<rt.ITable> {
  if (this.context.store.isTypeOf(e, et.Kernel)) {
    return (
      <r.Table name={e.name}>
        <r.Column name={`${e.name}ID_PK`} />
        {e.attributes.map((a) => this.Attribute2Column(a))}
      </r.Table>
    )
  } else if (this.context.store.isTypeOf(e, et.Weak)) {
    return (
      <r.Table name={`Weak_${e.name}`}>
        <r.Column name={`${e.name}ID_PK`} />
        <r.Column name="OwnerID_FK" isForeignKey={true} />
        {e.attributes.map((a) => this.Attribute2Column(a))}
      </r.Table>
    )
  }
  // base case...
}
```

This gets unwieldy as the hierarchy grows. The framework provides a declarative alternative.

## `@SpecPoint` and `@SpecOption`

### Declaring a Specialization Point

Mark the base rule with `@SpecPoint()`. This tells the framework that this rule has specialized variants.

```typescript
@SpecPoint()
Entity2Table(e: et.IEntity): ExprNode<rt.ITable> {
  return (
    <r.Table name={e.name}>
      {e.attributes.map((a) => this.Attribute2Column(a))}
    </r.Table>
  )
}
```

### Declaring Specialized Rules

Use `@SpecOption(baseMethodName, inputType)` to register a specialized rule for a specific subtype.

```typescript
@SpecOption('Entity2Table', et.Kernel)
Kernel2Table(k: et.IKernel): ExprNode<rt.ITable> {
  return (
    <r.Table>
      <r.Column name={`${k.name}ID_PK`} />
    </r.Table>
  )
}

@SpecOption('Entity2Table', et.Weak)
Weak2Table(w: et.IWeak): ExprNode<rt.ITable> {
  return (
    <r.Table name={`Weak_${w.name}`}>
      <r.Column name={`${w.name}ID_PK`} />
      <r.Column name="OwnerID_FK" isForeignKey={true} />
    </r.Table>
  )
}
```

## How Dispatch Works

When `Entity2Table` is called with a source element:

1. The framework reads the runtime type of the element from the store.
2. It collects the applicable specializations: those whose declared type is the element's runtime type or a supertype of it. Among them it selects the most specific one, the one whose declared type is a subtype of all the others. Declaration order plays no role.
3. The base rule runs as well: its result becomes the abstract parent, and the selected specialization's result is attached to it (see Result Merging below).
4. If no specialization matches, the dispatch throws `No specialized method found`.

Three consequences are worth knowing before you rely on this.

**Dispatch is total, so the options must cover every type the rule receives.** There is no fallback to the base rule on its own. If a transformation can encounter a plain `Entity`, declare a specialization for it; otherwise the run fails at that element.

**The most specific specialization wins, as with method overriding.** A specialization declared for a type also covers its subtypes. With specializations for `Entity` and for `Kernel`, a `Kernel` element gets the `Kernel` one and a `Weak` element gets the `Entity` one, whatever order they are declared in. A specialization declared for the rule's own source type therefore acts as a catch-all for every type without a more specific one, and a deeper hierarchy needs a specialization only where its logic differs.

**Two specializations for the same type are an error.** Dispatch could never choose between them, so the second one is rejected when the class is decorated, before any element is transformed.

## Inheritance and Declaration Order

Each transformation class has its own list of specializations for every point. A subclass starts with the specializations it inherits and adds its own. The parent class and sibling subclasses never see them, so a parent instance only dispatches to its own specializations.

```typescript
class EER2RelWithViews extends EER2RelTransformation {
  // Added for subclass instances only.
  @SpecOption('Entity2Table', et.Aggregation)
  Aggregation2Table(a: et.IAggregation): ExprNode<rt.ITable> { ... }

  // Overrides the parent's Kernel2Table for subclass instances.
  @SpecOption('Entity2Table', et.Kernel)
  Kernel2TableWithView(k: et.IKernel): ExprNode<rt.ITable> { ... }
}
```

**A subclass specialization for a type the parent already covers overrides it.** It replaces the parent's specialization for that type in the subclass's list, as overriding a method would. Instances of the parent class keep the parent's specialization. Within one class, two specializations for the same type are still an error.

**Declaration order inside a class does not matter.** A `@SpecOption` may be written above or below its `@SpecPoint`. A subclass may also redeclare an inherited point with `@SpecPoint` to change its base rule; the specializations registered for the point are kept.

## Result Merging

The base rule and the specialized rule both produce JSX elements. The framework merges their results. The specialized rule's output is combined with the base rule's output.

In the example above, when transforming a `Kernel` entity named "Person":

- The base rule produces: `<Table name="Person">` with attribute columns.
- The specialized rule produces: `<Table>` with a `PersonID_PK` column.
- The merged result is a Table named "Person" with both the PK column and the attribute columns.

This means specialized rules only need to declare what is different. They do not need to repeat the base logic.

The merge follows two rules. Props: the base rule's props are applied first and the specialized rule's over them, so a prop set by both comes from the specialized rule. Children: the base rule's children come first, then the specialized rule's. The created element is the specialized rule's element, with its type. The base rule may therefore return a more general element than its specializations: in the [workflow suite](../examples/workflow.md), `OrgUnit2Approval` returns an abstract `Step` carrying a description, and the created element is the `Task` or `Parallel` of the selected specialization, with that description. The serialized target model (for example `synth transformation run --out`) shows the created element.

A base rule that returns nothing (`return undefined!`) makes the point a pure dispatcher: the selected specialization's result is returned as is, and it may then also be an array or a plain value.

## Complete Example

```typescript
/** @jsx createExprNode */
import { createExprNode, ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M, M2M, E2E, SpecPoint, SpecOption } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as et from './EER.meta.model.type'
import * as rt from './REL.meta.model.type'
import * as r from './REL.jsx-comps'

@M2M()
class EER2RelTransformation extends abstractM2M<et.IEERSchema, rt.IRelSchema> {

  constructor(store: ModelStore) {
    super(store)
  }

  main(source: et.IEERSchema) {
    return (
      <r.RelSchema name={`${source.name} Relational Schema`}>
        {source.elements
          .filter((el) => this.context.store.isTypeOf(el, et.Entity))
          .map((el) => this.Entity2Table(el as et.IEntity))
        }
      </r.RelSchema>
    )
  }

  // Base rule for any Entity
  @SpecPoint()
  Entity2Table(e: et.IEntity): ExprNode<rt.ITable> {
    return (
      <r.Table name={e.name}>
        {e.attributes.map((a) => this.Attribute2Column(a))}
      </r.Table>
    )
  }

  // Specialized: Kernel entities get a primary key column
  @SpecOption('Entity2Table', et.Kernel)
  Kernel2Table(k: et.IKernel): ExprNode<rt.ITable> {
    return (
      <r.Table>
        <r.Column name={`${k.name}ID_PK`} />
      </r.Table>
    )
  }

  // Specialized: Weak entities get PK + foreign key column
  @SpecOption('Entity2Table', et.Weak)
  Weak2Table(w: et.IWeak): ExprNode<rt.ITable> {
    return (
      <r.Table name={`Weak_${w.name}`}>
        <r.Column name={`${w.name}ID_PK`} />
        <r.Column name="OwnerID_FK" isForeignKey={true} />
      </r.Table>
    )
  }

  @E2E()
  Attribute2Column(a: et.IAttribute): ExprNode<rt.IColumn> {
    return <r.Column name={a.name} />
  }
}
```

## When to Use Polymorphic Dispatch

Use `@SpecPoint`/`@SpecOption` when:

- Your source metamodel has a subtype hierarchy (e.g., Entity with subtypes Kernel and Weak).
- Different subtypes need different transformation logic.
- You want to keep rules focused on their specific concern rather than bundling all cases into one method.

The alternative is manual type checking with `isTypeOf()` in a single rule. That works for simple cases but becomes harder to maintain as the number of subtypes grows.
