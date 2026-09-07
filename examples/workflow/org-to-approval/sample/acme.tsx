/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { Organization, Board, Department, Worker, Manager, TopUnit, OrgUnit } from 'org-metamodel'
import type * as om from 'org-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'org-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'AcmeCorp: an executive board over two nested departments (the paper example)'
} as const

// The hierarchy is laid flat: each unit names its parent as a
// reference prop, workers nest in the unit they work in (the inverse
// fills worksIn), and each department names its manager among its own
// members, after they exist.
export default (store: ModelStore): ExprNode<om.IOrganization> => (
  <Organization name="AcmeCorp" store={store}>
    <Board name="Executive Board">
      <Worker name="Alice" />
      <Worker name="Bob" />
      <Worker name="Carol" />
    </Board>
    <Department name="Technology Division" parent={<OrgUnit $refByName="Executive Board" />}>
      <Worker name="Dave" role="manager" />
      <Manager $refByName="Dave" />
    </Department>
    <Department name="Engineering" parent={<OrgUnit $refByName="Technology Division" />}>
      <Worker name="Grace" role="manager" />
      <Worker name="Judy" role="engineer" />
      <Manager $refByName="Grace" />
    </Department>
    <TopUnit $refByName="Executive Board" />
  </Organization>
)
