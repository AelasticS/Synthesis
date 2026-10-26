/** @jsx createExprNode */

/**
 * A higher-order model template: the writing step is itself a template,
 * passed as a parameter. Applying GenericApproval to a step template
 * yields an ordinary model template with the parameters of
 * configurable-approval.tsx.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode, Template } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { WorkflowModel, Process, Task, Parallel, Sequence } from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Approval workflow from a higher-order model template: the writing step is a template parameter'
} as const satisfies SynthHeaderInput

type IApprovalConfig = { document: string; approvers: number; mode?: "parallel" | "sequential" }

const GenericApproval = (WriteStep: Template<wm.IStep>) =>
  ({ document, approvers, mode = "parallel", store }: IApprovalConfig & { store?: ModelStore }) => {
    const Approvals = mode === "parallel" ? Parallel : Sequence
    return (
      <WorkflowModel name="GenericApproval" store={store}>
        <Process name={`${document}Approval`}>
          <WriteStep />
          <Approvals name="approvals">
            {Array.from({ length: approvers }, (_, i) => <Task name={`Approve${i + 1}`} />)}
          </Approvals>
        </Process>
      </WorkflowModel>
    )
  }

const TwoStepWrite: Template<wm.IStep> = () => (
  <Sequence name="write">
    <Task name="Draft" />
    <Task name="Final" />
  </Sequence>
)

const TwoStepApproval = GenericApproval(TwoStepWrite)

export default (store: ModelStore): ExprNode<wm.IWorkflowModel> => (
  <TwoStepApproval document="Contract" approvers={2} mode="parallel" store={store} />
)
