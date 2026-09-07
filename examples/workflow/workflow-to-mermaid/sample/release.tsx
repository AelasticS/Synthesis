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
  description: 'Release process exercising all four activity kinds'
} as const

export default (store: ModelStore): ExprNode<wm.IProcess> => (
  <Process name="Release" store={store}>
    <Sequence name="pipeline">
      <Task name="Build" />
      <Parallel name="checks">
        <Task name="Unit tests" />
        <Task name="Lint" />
      </Parallel>
      <SubProcess name="Publish">
        <Task name="Tag" />
        <Task name="Upload" />
      </SubProcess>
    </Sequence>
  </Process>
)
