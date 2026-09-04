/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { Process, Sequence, Task, Parallel, SubProcess } from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Approval workflow whose writing step is a two-task sub-process'
} as const

export default (store: ModelStore): ExprNode<wm.IProcess> => (
  <Process name="ReviewedApproval" store={store}>
    <Sequence name="main">
      <SubProcess name="WriteDocument">
        <Task name="Draft" />
        <Task name="ReviewDraft" />
      </SubProcess>
      <Parallel name="approvals">
        <Task name="Approve 1" />
        <Task name="Approve 2" />
      </Parallel>
    </Sequence>
  </Process>
)
