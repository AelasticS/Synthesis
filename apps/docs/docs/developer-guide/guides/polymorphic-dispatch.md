---
sidebar_position: 5
---

# Polymorphic Rule Dispatch

When a metamodel has a subtype hierarchy, you often need different transformation logic for each subtype. Instead of writing `if/else` chains that check element types, you declare specialized rules that the framework dispatches automatically based on the runtime type of the source element.

## The Problem

Consider transforming EER entities to relational tables. The base rule works for any Entity, but Kernel entities need a primary key column and Weak entities need both a primary key and a foreign key column. Without polymorphic dispatch, you would write:

```typescript
// Without dispatch - manual type checking
Entity2Table(e: et.IEntity): Element<rt.ITable> {
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
@E2E({ input: et.Entity, output: rt.Table })
Entity2Table(e: et.IEntity): Element<rt.ITable> {
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
Kernel2Table(k: et.IKernel): Element<rt.ITable> {
  return (
    <r.Table>
      <r.Column name={`${k.name}ID_PK`} />
    </r.Table>
  )
}

@SpecOption('Entity2Table', et.Weak)
Weak2Table(w: et.IWeak): Element<rt.ITable> {
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

1. The framework checks the runtime type of the element against the store's type system.
2. If the element is a `Kernel`, the `Kernel2Table` specialization is selected.
3. If the element is a `Weak`, the `Weak2Table` specialization is selected.
4. If no specialization matches, the base rule (`Entity2Table`) runs as the fallback.

The dispatch is deterministic. The most specific matching rule wins. This mirrors method dispatch in object-oriented languages, but applied to transformation rules.

## Result Merging

The base rule and the specialized rule both produce JSX elements. The framework merges their results. The specialized rule's output is combined with the base rule's output.

In the example above, when transforming a `Kernel` entity named "Person":

- The base rule produces: `<Table name="Person">` with attribute columns.
- The specialized rule produces: `<Table>` with a `PersonID_PK` column.
- The merged result is a Table named "Person" with both the PK column and the attribute columns.

This means specialized rules only need to declare what is different. They do not need to repeat the base logic.

## Complete Example

```typescript
/** @jsx hm */
import { hm, abstractM2M, M2M, E2E, Element, ModelStore } from 'aelastics-synthesis'
import { SpecPoint, SpecOption } from 'aelastics-synthesis'
import * as et from './EER.meta.model.type'
import * as rt from './REL.meta.model.type'
import * as r from './REL.jsx-comps'

@M2M({ input: et.EERSchema, output: rt.RelSchema })
class EER2RelTransformation extends abstractM2M<et.IEERSchema, rt.IRelSchema> {

  constructor(store: ModelStore) {
    super(store)
  }

  template(source: et.IEERSchema) {
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
  @E2E({ input: et.Entity, output: rt.Table })
  Entity2Table(e: et.IEntity): Element<rt.ITable> {
    return (
      <r.Table name={e.name}>
        {e.attributes.map((a) => this.Attribute2Column(a))}
      </r.Table>
    )
  }

  // Specialized: Kernel entities get a primary key column
  @SpecOption('Entity2Table', et.Kernel)
  Kernel2Table(k: et.IKernel): Element<rt.ITable> {
    return (
      <r.Table>
        <r.Column name={`${k.name}ID_PK`} />
      </r.Table>
    )
  }

  // Specialized: Weak entities get PK + foreign key column
  @SpecOption('Entity2Table', et.Weak)
  Weak2Table(w: et.IWeak): Element<rt.ITable> {
    return (
      <r.Table name={`Weak_${w.name}`}>
        <r.Column name={`${w.name}ID_PK`} />
        <r.Column name="OwnerID_FK" isForeignKey={true} />
      </r.Table>
    )
  }

  @E2E({ input: et.Attribute, output: rt.Column })
  Attribute2Column(a: et.IAttribute): Element<rt.IColumn> {
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
