/** @jsx createExprNode */

/**
 * The documentation's higher-order template example, executable. The
 * writing step is a template of its own; the workflow is a higher-order
 * template taking the whole step template as a parameter; evaluation
 * happens in two steps, from higher-order template to template to model
 * literal. Import this model and run the suite's chain to see the
 * resulting process as a BPMN graph or a Mermaid diagram.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode, Template } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { WorkflowModel, Process, Sequence, Task, Parallel } from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Approval workflow built from a higher-order template: the writing step is itself a template'
} as const satisfies SynthHeaderInput

// Step templates, defined outside any workflow.
const Write = () => <Task name="Write" />

const ReviewedWrite = () => (
  <Process name="WriteDocument">
    <Task name="Draft" />
    <Task name="ReviewDraft" />
  </Process>
)

// The workflow as a higher-order template: the whole writing step is
// the parameter (any step template qualifies, a plain task or an
// inline process alike).
const Approval = (WriteStep: Template<wm.IStep>) =>
  ({ doc, approvers }: { doc: string; approvers: number }) => (
    <Sequence name={`${doc}_main`}>
      <WriteStep />
      <Parallel name="approvals">
        {Array.from({ length: approvers }, (_, i) => (
          <Task name={`Approve${i + 1}`} />
        ))}
      </Parallel>
    </Sequence>
  )

// Two-step evaluation: applying the higher-order template to a step
// template yields an ordinary template; instantiating that closes the
// expression into a model literal. Swap ReviewedWrite for Write and the
// workflow's structure changes without touching its skeleton.
const ReviewedApproval = Approval(ReviewedWrite)

export default (store: ModelStore): ExprNode<wm.IWorkflowModel> => (
  <WorkflowModel name="TemplatedApproval" store={store}>
    <Process name="ContractApproval">
      <ReviewedApproval doc="Contract" approvers={2} />
    </Process>
  </WorkflowModel>
)
