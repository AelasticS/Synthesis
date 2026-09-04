/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { Process, Sequence, Task, Parallel } from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Approval workflow: write, then two parallel approvals'
} as const

export default (store: ModelStore): ExprNode<wm.IProcess> => (
  <Process name="Approval" store={store}>
    <Sequence name="main">
      <Task name="Write" />
      <Parallel name="approvals">
        <Task name="Approve 1" />
        <Task name="Approve 2" />
      </Parallel>
    </Sequence>
  </Process>
)
