/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { WorkflowModel, Process, Task, Parallel } from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Release process: a task, a parallel block, and an inline process'
} as const

export default (store: ModelStore): ExprNode<wm.IWorkflowModel> => (
  <WorkflowModel name="Release" store={store}>
    <Process name="Release">
      <Task name="Build" />
      <Parallel name="checks">
        <Task name="Unit tests" />
        <Task name="Lint" />
      </Parallel>
      <Process name="Publish">
        <Task name="Tag" />
        <Task name="Upload" />
      </Process>
    </Process>
  </WorkflowModel>
)
