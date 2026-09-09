/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { WorkflowModel, Process, Task, Parallel } from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Approval workflow whose writing step is an inline two-task process'
} as const satisfies SynthHeaderInput

export default (store: ModelStore): ExprNode<wm.IWorkflowModel> => (
  <WorkflowModel name="ReviewedApproval" store={store}>
    <Process name="ReviewedApproval">
      <Process name="WriteDocument">
        <Task name="Draft" />
        <Task name="ReviewDraft" />
      </Process>
      <Parallel name="approvals">
        <Task name="Approve 1" />
        <Task name="Approve 2" />
      </Parallel>
    </Process>
  </WorkflowModel>
)
