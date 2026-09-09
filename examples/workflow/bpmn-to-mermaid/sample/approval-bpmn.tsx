/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { Process, Task, StartEvent, EndEvent, Gateway, Flow, FromNode, ToNode } from 'bpmn-metamodel'
import type * as bm from 'bpmn-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'bpmn-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'The approval process as a BPMN graph'
} as const satisfies SynthHeaderInput

export default (store: ModelStore): ExprNode<bm.IProcess> => (
  <Process name="Approval" store={store}>
    <StartEvent name="start" />
    <Task name="Write" />
    <Gateway name="split" kind="parallel" />
    <Task name="Approve1" />
    <Task name="Approve2" />
    <Gateway name="join" kind="parallel" />
    <EndEvent name="end" />
    <Flow name="f1"><FromNode $refByName="start" /><ToNode $refByName="Write" /></Flow>
    <Flow name="f2"><FromNode $refByName="Write" /><ToNode $refByName="split" /></Flow>
    <Flow name="f3"><FromNode $refByName="split" /><ToNode $refByName="Approve1" /></Flow>
    <Flow name="f4"><FromNode $refByName="split" /><ToNode $refByName="Approve2" /></Flow>
    <Flow name="f5"><FromNode $refByName="Approve1" /><ToNode $refByName="join" /></Flow>
    <Flow name="f6"><FromNode $refByName="Approve2" /><ToNode $refByName="join" /></Flow>
    <Flow name="f7"><FromNode $refByName="join" /><ToNode $refByName="end" /></Flow>
  </Process>
)
