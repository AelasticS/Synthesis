---
sidebar_position: 3
---

# Building Model Instances

With metamodels defined and JSX components created, you can build model instances. A model instance is a graph of typed elements assembled declaratively with JSX. Nesting captures associations, and embedded TypeScript expressions let you generate structure dynamically.

## ModelStore and Context

Every model lives in a `ModelStore`. The store manages element identity, naming, and type checking. A `Context` carries the store and rendering state through the JSX evaluation.

```typescript
import { ModelStore } from '@aelastics/synthesis/store'
import { Context } from '@aelastics/synthesis/jsx'

const store = new ModelStore()
```

## Creating a Model with JSX

Use your JSX components to build a model expression, then call `.render()` to evaluate it into a model instance.

```typescript
/** @jsx createExprNode */
import { createExprNode, Context } from '@aelastics/synthesis/jsx'
import * as e from './EER.jsx-comps'

const store = new ModelStore()

const eerModel = (
  <e.EERSchema name="Persons" store={store}>
    <e.Kernel name="Person">
      <e.Attribute name="PersonName" isKey={false}>
        <e.Domain name="string" />
      </e.Attribute>
      <e.Attribute name="Age" isKey={false}>
        <e.Domain name="number" />
      </e.Attribute>
    </e.Kernel>
    <e.Weak name="Child">
      <e.Attribute name="ChildID" isKey={true}>
        <e.Domain name="number" />
      </e.Attribute>
    </e.Weak>
  </e.EERSchema>
)

// Evaluate the expression into a model instance
const model: IEERSchema = eerModel.render(new Context())
```

The JSX expression is not the model. It is a tree of `ExprNode` objects. Calling `.render()` walks this tree, creates actual model elements in the store, and wires up all associations. The return value is a typed model instance.

### The `store` Prop

The `store` prop on the root element tells the framework which `ModelStore` to use. Child elements inherit the store from their parent. You only need to set it on the root.

## References

Not all associations can be expressed through nesting. When an element needs to reference another element that was created elsewhere, use one of the three reference mechanisms. A reference element retrieves an existing element instead of creating a new one.

**Important:** When a reference prop (`$ref`, `$refByName`, or `$refByID`) is set, it must be the only prop on that element. You cannot combine a reference with other property assignments. The framework throws an error if you try.

### `$refByName`

Resolves an element by name. Supports relative and absolute paths through the namespace hierarchy.

```typescript
<e.Attribute name="PersonName">
  <e.Domain $refByName="string" />
</e.Attribute>
```

This looks up the element named `"string"` in the current namespace context. You can use relative paths (`../other/element`) or absolute paths (`/root/namespace/element`) to reference elements in other namespaces.

### `$ref`

Passes a direct object reference to an already-created element.

```typescript
const stringDomain = store.getByName("string")

<e.Attribute name="PersonName">
  <e.Domain $ref={stringDomain} />
</e.Attribute>
```

### `$refByID`

Resolves an element by its unique ID.

```typescript
<e.Domain $refByID="element-uuid-here" />
```

## Templates

Everything above builds literal expressions: they always evaluate to the
same model. Parameterizing them, and abstracting over their structure
with higher-order templates, is the subject of the
[Templates](./templates.md) guide.

## Name scopes

Element names are unique per name scope. The model is always a scope,
and a metamodel may declare further concepts as scopes with one line
next to the type definition:

```ts
import { ModelElement, declareNamespace } from "@aelastics/synthesis/metamodel"

export const Table = t.subtype(ModelElement, { columns: t.arrayOf(Column) }, "Table", Schema)
declareNamespace(Table)
```

Elements contained in a declared scope have nested paths
(`//model/book/id` and `//model/copy/id` coexist), and a bare
`$refByName` resolves against the nearest scope first, probing outward
to the model: inside `copy`, `$refByName="no"` finds `copy`'s own
column, while `$refByName="book/id"` reaches a sibling table's column.
Metamodels that declare no scopes keep the flat one-name-per-model
rule unchanged.

## Rendering

The `render()` method on an `ExprNode` evaluates the entire expression tree:

1. Creates a fresh model in the store.
2. Walks the tree top-down.
3. At each node, creates a model element with the declared type and properties.
4. Connects child elements to their parent via the `connectionInfo` association.
5. Resolves all references (`$refByName`, `$ref`, `$refByID`).
6. Returns the typed root model instance.

```typescript
const ctx = new Context()
const model: IEERSchema = eerModel.render(ctx)

// Now model is a fully wired instance with typed access
console.log(model.name)                    // "Persons"
console.log(model.elements[0].name)        // "Person"
console.log(model.elements[0].attributes)  // [IAttribute, IAttribute]
```

You can also use the convenience function:

```typescript
import { render } from '@aelastics/synthesis/jsx'

const model = render(eerModel)
```
