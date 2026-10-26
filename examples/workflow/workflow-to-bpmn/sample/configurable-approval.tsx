/** @jsx createExprNode */

/**
 * A model template: a function from configuration values to a model
 * expression. The approval tasks run in parallel or in sequence
 * depending on the mode.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { WorkflowModel, Process, Task, Parallel, Sequence } from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Approval workflow from a model template: document, number of approvers and mode as parameters'
} as const satisfies SynthHeaderInput

type IApprovalConfig = { document: string; approvers: number; mode?: "parallel" | "sequential" }

const ConfigurableApproval = (
  { document, approvers, mode = "parallel", store }: IApprovalConfig & { store?: ModelStore }
) => {
  const Approvals = mode === "parallel" ? Parallel : Sequence
  return (
    <WorkflowModel name="ConfigurableApproval" store={store}>
      <Process name={`${document}Approval`}>
        <Task name={`Write${document}`} />
        <Approvals name="approvals">
          {Array.from({ length: approvers }, (_, i) => <Task name={`Approve${i + 1}`} />)}
        </Approvals>
      </Process>
    </WorkflowModel>
  )
}

export default (store: ModelStore): ExprNode<wm.IWorkflowModel> => (
  <ConfigurableApproval document="Contract" approvers={3} mode="parallel" store={store} />
)
