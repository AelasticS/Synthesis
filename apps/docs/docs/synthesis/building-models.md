---
sidebar_position: 4
---

# Building Model Instances

With metamodels defined and JSX components created, you can build model instances. A model instance is a graph of typed elements assembled declaratively with JSX. Nesting captures associations, and embedded TypeScript expressions let you generate structure dynamically.

## ModelStore and Context

Every model lives in a `ModelStore`. The store manages element identity, naming, and type checking. A `Context` carries the store and rendering state through the JSX evaluation.

```typescript
import { ModelStore, Context } from 'aelastics-synthesis'

const store = new ModelStore()
```

## Creating a Model with JSX

Use your JSX components to build a model expression, then call `.render()` to evaluate it into a model instance.

```typescript
/** @jsx hm */
import { hm, Context } from 'aelastics-synthesis'
import * as e from './EER.jsx-comps'

const store = new ModelStore()

const eerModel = (
  <e.EERSchema name="Persons" MDA_level="M1" store={store}>
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

The JSX expression is not the model. It is a tree of `Element` objects. Calling `.render()` walks this tree, creates actual model elements in the store, and wires up all associations. The return value is a typed model instance.

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

## Parameterized Templates

A template is a function that takes parameters and returns a JSX expression. This defines not one model but a family of models from a single definition.

### Document Pattern Template

A common pattern is a reusable model fragment parameterized by name. For example, a generic document pattern for EER models:

```typescript
/** @jsx hm */

function DocumentPattern(documentName: string): Element<IEERSchema> {
  return (
    <e.EERSchema name={`${documentName}-Schema`}>
      <e.Kernel name={documentName}>
        <e.Attribute name={documentName}>
          <e.Domain name="string" />
        </e.Attribute>
        <e.Attribute name={`${documentName}ID`}>
          <e.Domain name="string" />
        </e.Attribute>
        <e.Weak name={`${documentName}Item`}>
          <e.Attribute name={`${documentName}ItemID`}>
            <e.Domain name="string" />
          </e.Attribute>
          <e.Attribute name={`${documentName}ItemDescription`}>
            <e.Domain name="string" />
          </e.Attribute>
        </e.Weak>
      </e.Kernel>
    </e.EERSchema>
  )
}
```

Instantiating for a specific document type:

```typescript
const invoiceSchema = DocumentPattern("Invoice")
```

This produces an EER schema with a Kernel entity named "Invoice", attributes "Invoice" and "InvoiceID", and a Weak entity "InvoiceItem" with its own attributes. Calling `DocumentPattern("PurchaseOrder")` produces a structurally identical model with different names throughout.

### Dynamic Structure with Computation

Embed TypeScript expressions in curly braces to generate variable structure. Loops, conditionals, and any other TypeScript logic can appear inside JSX.

```typescript
/** @jsx hm */

interface IApprovalConfig {
  processName: string
  howManyApprovers: number
  isParallel: boolean
}

const DynamicApproval = ({ processName, howManyApprovers, isParallel }: IApprovalConfig) => {
  const tasks = Array.from({ length: howManyApprovers }, (_, i) =>
    <Task name={`approval ${i + 1}`} />
  )

  return (
    <Process name={processName}>
      <Sequence>
        <Task name="write proposal" />
        {isParallel
          ? <Parallel>{tasks}</Parallel>
          : <Sequence>{tasks}</Sequence>
        }
      </Sequence>
    </Process>
  )
}
```

Call it as a JSX component:

```typescript
const myApproval = <DynamicApproval processName="Budget Review" howManyApprovers={3} isParallel={true} />
```

This generates a process with three parallel approval tasks. Changing the parameters produces a structurally different model. The `Array.from` and the conditional are computation operators embedded in the model expression.

## Higher-Order Templates

A higher-order template is a function that takes another template as a parameter. This lets you abstract over the structure of sub-expressions.

```typescript
/** @jsx hm */

const GenericApproval = (WorkerTask: Template<ITask>) =>
  (config: IApprovalConfig) => {
    const tasks = Array.from({ length: config.howManyApprovers }, (_, i) =>
      <Task name={`approval ${i + 1}`} />
    )
    return (
      <Sequence>
        <WorkerTask />
        {config.isParallel
          ? <Parallel>{tasks}</Parallel>
          : <Sequence>{tasks}</Sequence>
        }
      </Sequence>
    )
  }
```

Now you can plug in different worker tasks:

```typescript
// A simple worker
const SimpleWrite = () => <Task name="Write document" />

// A complex worker
const GroupWork = () => (
  <Sequence>
    <Task name="Research" />
    <Parallel>
      <Task name="Draft section A" />
      <Task name="Draft section B" />
    </Parallel>
  </Sequence>
)

// Create specialized approval workflows
const SimpleApproval = GenericApproval(SimpleWrite)
const GroupApproval  = GenericApproval(GroupWork)

// Use them
const model1 = <SimpleApproval processName="Simple" howManyApprovers={2} isParallel={true} />
const model2 = <GroupApproval processName="Group" howManyApprovers={3} isParallel={false} />
```

`GenericApproval` does not know what the worker task looks like. It accepts any template that produces a Task element. The caller decides the structure. This is compositional model construction.

## Rendering

The `render()` method on an `Element` evaluates the entire expression tree:

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
import { render } from 'aelastics-synthesis'

const model = render(eerModel)
```
