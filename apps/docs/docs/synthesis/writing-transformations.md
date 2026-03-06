---
sidebar_position: 5
---

# Writing Transformations

A model-to-model transformation maps a source model to a target model. In Synthesis, you write a transformation as a TypeScript class that extends `abstractM2M` and uses JSX to construct the target model from source elements.

## The Transformation Class

Every transformation extends `abstractM2M<Source, Destination, ExtraModels, ConfigModel>` and is decorated with `@M2M`.

```typescript
/** @jsx hm */
import { hm, abstractM2M, M2M, E2E, Element, ModelStore } from 'aelastics-synthesis'
import * as et from './EER.meta.model.type'
import * as rt from './REL.meta.model.type'
import * as e from './EER.jsx-comps'
import * as r from './REL.jsx-comps'

@M2M({
  input: et.EERSchema,
  output: rt.RelSchema,
})
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

  @E2E({ input: et.Entity, output: rt.Table })
  Entity2Table(e: et.IEntity): Element<rt.ITable> {
    return (
      <r.Table name={e.name}>
        {e.attributes.map((a) => this.Attribute2Column(a))}
      </r.Table>
    )
  }

  @E2E({ input: et.Attribute, output: rt.Column })
  Attribute2Column(a: et.IAttribute): Element<rt.IColumn> {
    return <r.Column name={a.name} />
  }
}
```

## Key Parts

### `@M2M` Decorator

Applied to the class. Declares the input and output metamodel types.

```typescript
@M2M({
  input: et.EERSchema,    // source type schema
  output: rt.RelSchema,   // target type schema
})
```

The decorator registers the transformation with the framework and sets up the execution context.

### `template()` Method

The entry point of every transformation. It receives the source model and returns a JSX expression that constructs the target model.

```typescript
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
```

The `template()` method typically:
1. Creates the root target model element.
2. Filters source elements by type.
3. Maps each source element to the appropriate transformation rule.

### `@E2E` Decorator

Applied to methods that transform individual elements. Declares which source type maps to which target type.

```typescript
@E2E({
  input: et.Entity,     // source element type
  output: rt.Table,     // target element type
  ruleName: "Entity2Table",  // optional: explicit name for tracing
})
Entity2Table(e: et.IEntity): Element<rt.ITable> {
  // ...
}
```

The `@E2E` decorator does two things:

1. **Registers the rule** so the framework knows which method handles which source type.
2. **Creates trace records** automatically. Every time the rule executes, a trace entry maps the source element to the target JSX element.

### Return Type

Every `@E2E` method returns `Element<TargetType>`, not the target instance directly. The JSX expression is an unevaluated element tree. The framework renders it during `transform()`.

## Executing a Transformation

```typescript
const store = new ModelStore()

// Build the source model
const eerModel = (
  <e.EERSchema name="Persons" store={store}>
    <e.Kernel name="Person">
      <e.Attribute name="PersonName" isKey={false}>
        <e.Domain name="string" />
      </e.Attribute>
    </e.Kernel>
  </e.EERSchema>
)
const source: et.IEERSchema = eerModel.render(new Context())

// Run the transformation
const transformer = new EER2RelTransformation(store)
const result: rt.IRelSchema = transformer.transform(source)

// Use the result
console.log(result.name)  // "Persons Relational Schema"
// result contains Table elements with Column children
```

The `transform()` method:
1. Calls `template(source)` to get the target JSX expression tree.
2. Renders the tree in a `M2MContext`, which extends the normal `Context` with tracing support.
3. Returns the typed target model.

## Filtering Source Elements

The `template()` method often needs to filter source elements by type. Use the store's `isTypeOf()` method.

```typescript
template(source: et.IEERSchema) {
  return (
    <r.RelSchema name={`${source.name} Relational Schema`}>
      {source.elements
        .filter((el) => this.context.store.isTypeOf(el, et.Entity))
        .map((el) => this.Entity2Table(el as et.IEntity))
      }
      {source.elements
        .filter((el) => this.context.store.isTypeOf(el, et.Relationship))
        .map((el) => this.Relationship2ForeignKey(el as et.IRelationship))
      }
    </r.RelSchema>
  )
}
```

This pattern groups source elements by type and routes each group to the appropriate rule.

## Tracing

The framework automatically records which source elements produced which target elements. Every `@E2E` rule invocation creates a trace entry.

The trace is available through `this.context`:

- `this.context.traceMap` maps source elements to their trace records.
- `this.context.resolveMap` maps JSX elements to the rendered model instances.

### Resolving Transformed Elements

When a rule needs to reference a target element that was produced by another rule, use `Resolve`. This is a special JSX element that bridges the trace map, letting you look up what a source element was transformed into and use that target element in your current rule.

`Resolve` takes two props:

| Prop | Type | Purpose |
|---|---|---|
| `input` | source model element | The source element whose transformation result you want to access |
| `ruleName` | string (optional) | The name of the `@E2E` rule that produced the target. Needed when multiple rules could apply to the same source element. |

`Resolve` must have exactly one child, and that child must be a function. The function receives the resolved target model element as its argument and returns a JSX expression.

```typescript
import { Resolve } from 'aelastics-synthesis'

@E2E({ input: et.Relationship, output: rt.ForeignKey })
Relationship2ForeignKey(rel: et.IRelationship): Element<rt.IForeignKey> {
  return (
    <r.ForeignKey name={rel.name}>
      <Resolve input={rel.sourceEntity} ruleName="Entity2Table">
        {(targetTable: rt.ITable) => (
          <r.Column name={`${targetTable.name}_FK`} isForeignKey={true} />
        )}
      </Resolve>
    </r.ForeignKey>
  )
}
```

Here is what happens during rendering:

1. `Resolve` receives `rel.sourceEntity` (a source model element, e.g., the "Person" entity).
2. It looks up the trace map via `resolveJSXElement()` to find the JSX Element that was produced by the `"Entity2Table"` rule for that source element.
3. It then looks up the `resolveMap` to find the actual rendered target model element (e.g., the "Person" table).
4. It calls the child function with that target model element.
5. The returned JSX expression is rendered and connected to the parent as a normal child.

This is how you create cross-references in the target model that mirror associations in the source model. Without `Resolve`, you would have no way to access target elements produced by other rules. `Resolve` elements can also be nested: the child function can itself return another `Resolve`, allowing you to follow chains of references.

## The Transformation Context

Every transformation has access to `this.context`, an `M2MContext` instance.

| Property/Method | Purpose |
|---|---|
| `this.context.store` | The `ModelStore` containing all models |
| `this.context.traceMap` | Maps source elements to trace records |
| `this.context.resolveMap` | Maps JSX elements to rendered instances |
| `this.context.makeTrace(source, target)` | Manually record a trace entry |
| `this.context.resolveJSXElement(source, ruleName?)` | Look up the target element for a source |
| `this.extra` | Extra models passed to the constructor |
| `this.configModel` | Configuration model for variability |

## Type Parameters

The full signature of `abstractM2M` has four type parameters:

```typescript
abstractM2M<Source, Destination, ExtraModels, ConfigModel>
```

| Parameter | Purpose | Default |
|---|---|---|
| `Source` | Interface of the source model (e.g., `IEERSchema`) | required |
| `Destination` | Interface of the target model (e.g., `IRelSchema`) | required |
| `ExtraModels` | Additional input models (object type with named models) | `{}` |
| `ConfigModel` | Decision/configuration model for variability | `undefined` |

Extra models and configuration models are covered in [Design Decisions in Transformations](./variability).
