/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from 'simple-eer-metamodel'
import type * as t from 'simple-eer-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'simple-eer-metamodel',
  author: 'Dejan Stojimirovic',
  version: '0.1.0',
  description: 'The Company: two kernels (Person, Company) and a 1:N Employment relationship'
} as const satisfies SynthHeaderInput

/**
 * Entities scope their attributes' names. In the simple metamodel a
 * domain is a plain name, declared inside the attribute it types.
 * Employment is 1:N: a company hires many persons, a person works in
 * one company.
 */
export default (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="CompanySchema" store={store}>
    <Entity name="Person">
      <Attribute name="personId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="name" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Entity>
    <Entity name="Company">
      <Attribute name="companyId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="companyName" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Entity>

    <Relationship name="Employment">
      <Role name="WorksIn" lb="0" ub="1" cnMapp="R" dcnMapp="R" domain={<Entity $refByName="Company" />} />
      <Role name="Hires" lb="0" ub="M" cnMapp="R" dcnMapp="R" domain={<Entity $refByName="Person" />} />
    </Relationship>
  </EERSchema>
)
