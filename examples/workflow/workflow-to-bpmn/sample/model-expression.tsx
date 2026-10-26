/** @jsx createExprNode */

/**
 * One model literal with all four operators of the model expression
 * algebra: model creation (the WorkflowModel), element creation (the
 * processes and tasks), computation (the process name from a variable
 * and the approval tasks generated from a number), and reference (the
 * SubProcess invoking the model-level Publishing process by name).
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { WorkflowModel, Process, Task, Parallel, SubProcess } from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'A model expression: all four operators in one literal'
} as const satisfies SynthHeaderInput

const processName = "DocumentApproval"
const approvers = 2

export default (store: ModelStore): ExprNode<wm.IWorkflowModel> => (
  <WorkflowModel name="ModelExpression" store={store}>
    <Process name="Publishing">
      <Task name="Format" />
      <Task name="Publish" />
    </Process>
    <Process name={processName}>
      <Task name="WriteProposal" />
      <Parallel name="approvals">
        {Array.from({ length: approvers }, (_, i) => <Task name={`Approve${i + 1}`} />)}
      </Parallel>
      <SubProcess $refByName="Publishing" />
    </Process>
  </WorkflowModel>
)
