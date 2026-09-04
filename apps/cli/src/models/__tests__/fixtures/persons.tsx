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
  description: 'Persons EER schema used by the model loader tests'
} as const

export default (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="Persons" store={store}>
    <Entity name="Person">
      <Attribute name="personId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="personName" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Entity>
    <Entity name="Organization">
      <Attribute name="organizationId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="organizationName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Relationship name="worksIn">
      <Role name="WorksIn" lb="0" ub="1" domain={<Entity $refByName="Organization"></Entity>} />
      <Role name="Employs" lb="0" ub="M" domain={<Entity $refByName="Person"></Entity>} />
    </Relationship>
  </EERSchema>
)
