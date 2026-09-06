/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from 'eer-metamodel'
import type * as t from 'eer-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-metamodel',
  author: 'Test Author <test@example.org>',
  version: '0.1.0',
  description: 'Renders fine but violates a declared constraint: a one-role relationship'
} as const

export default (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="PersonsInvalid" store={store}>
    <Domain name="number" />
    <Domain name="string" />
    <Entity name="Person">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
    </Entity>
    {/* one role only: renders, but the binary-relationship constraint
        must reject it at the validation point */}
    <Relationship name="worksIn">
      <Role name="Employs" lowerBound="0" upperBound="M" domain={<Entity $refByName="Person"></Entity>} />
    </Relationship>
  </EERSchema>
)
