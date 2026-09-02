---
sidebar_position: 4
---

# Templates

A model expression with no parameters and no computation is a **model
literal**: it always evaluates to the same model. Add parameters and it
becomes a **model template**, a function returning a model expression
that describes a whole family of models from a single definition. This
guide covers writing templates, instantiating them, and composing them;
the algebraic view behind the terminology is in
[Concepts](../concepts.md#templates-define-families-of-models).

## Parameterized templates

### Document pattern template

A common pattern is a reusable model fragment parameterized by name. For
example, a generic document pattern for EER models:

```typescript
/** @jsx createExprNode */

function DocumentPattern(documentName: string): ExprNode<IEERSchema> {
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

This produces an EER schema with a Kernel entity named "Invoice",
attributes "Invoice" and "InvoiceID", and a Weak entity "InvoiceItem"
with its own attributes. Calling `DocumentPattern("PurchaseOrder")`
produces a structurally identical model with different names throughout.

### Dynamic structure with computation

Embed TypeScript expressions in curly braces to generate variable
structure. Loops, conditionals, and any other TypeScript logic can
appear inside JSX.

```typescript
/** @jsx createExprNode */

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

A template whose single parameter is a props object is itself a JSX
component, so it can be instantiated as a tag:

```typescript
const myApproval = <DynamicApproval processName="Budget Review" howManyApprovers={3} isParallel={true} />
```

This generates a process with three parallel approval tasks. Changing
the parameters produces a structurally different model. The
`Array.from` and the conditional are computation operators embedded in
the model expression.

## Higher-Order Templates

A higher-order template is a function that takes another template as a
parameter. This lets you abstract over the structure of sub-expressions:
a value parameter selects among shapes the template already contains,
while a template parameter supplies the shape itself.

```typescript
/** @jsx createExprNode */

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

The worker templates are defined outside, as values of their own:

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
```

Evaluation then happens in two steps: applying the higher-order template
to a worker template yields an ordinary template, and supplying the
remaining parameters closes the expression into a model literal:

```typescript
// Step 1: specialized approval workflows (ordinary templates)
const SimpleApproval = GenericApproval(SimpleWrite)
const GroupApproval  = GenericApproval(GroupWork)

// Step 2: model literals, ready to render
const model1 = <SimpleApproval processName="Simple" howManyApprovers={2} isParallel={true} />
const model2 = <GroupApproval processName="Group" howManyApprovers={3} isParallel={false} />
```

`GenericApproval` does not know what the worker task looks like. It
accepts any template that produces a Task element. The caller decides
the structure. This is compositional model construction.

## Templates and transformation rules

A transformation rule is a template whose parameter is a source model
element: the same mechanism, applied once per matched element, with
every invocation recorded in the trace. See
[Writing Transformations](./writing-transformations.md).
