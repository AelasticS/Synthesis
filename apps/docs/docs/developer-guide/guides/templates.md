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
      <Task name="write proposal" />
      {isParallel
        ? <Parallel>{tasks}</Parallel>
        : <Sequence>{tasks}</Sequence>
      }
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
parameter, abstracting over the structure of sub-expressions: a value
parameter selects among shapes a template already contains, while a
template parameter supplies the shape itself. The example below is the
workflow suite's executable sample, embedded from its source: the
writing step is defined outside as a template (a plain task, or a
two-task inline process), the workflow takes the whole step template
as a parameter, and evaluation happens in two steps, from higher-order
template to template to model literal.

```tsx file=<rootDir>/examples/workflow/workflow-to-bpmn/sample/templated-approval.tsx
```

Because it is a workspace model like any other, you can run it and see
the higher-order construction come out the other end as a diagram:

```bash
synth transformation install <path-to>/workflow-to-bpmn
synth transformation install <path-to>/bpmn-to-mermaid
synth model import <path-to>/sample/templated-approval.tsx --as demo/templated
synth transformation run workflow-to-bpmn bpmn-to-mermaid --in demo/templated --out-dir ./generated
```

The generated Mermaid flowchart shows the swapped structure: the
inline write process from `ReviewedWrite`, flattened as an embedded
sub-process, then the parallel approvals. Replace
`Approval(ReviewedWrite)` with `Approval(Write)` and only the writing
step changes; the workflow skeleton is untouched.

## Templates and transformation rules

A transformation rule is a template whose parameter is a source model
element: the same mechanism, applied once per matched element, with
every invocation recorded in the trace. See
[Writing Transformations](./writing-transformations.md).
