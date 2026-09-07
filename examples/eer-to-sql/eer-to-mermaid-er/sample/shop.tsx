/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import {
  EERSchema, Entity, Weak, Attribute, Domain, Relationship, Role, WeakMapping,
} from 'eer-metamodel'
import type * as t from 'eer-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'A compact shop: two kernels, one M:N relationship, one weak entity'
} as const

export default (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="Shop" store={store}>
    <Domain name="number" />
    <Domain name="string" />

    <Entity name="Customer">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
      <Attribute name="email" isKey={false} isOptional={true}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Entity name="Product">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>

    {/* the weak entity: a review is identified through its product */}
    <Weak name="Review">
      <Attribute name="no" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="stars" isKey={false}>
        <Domain $refByName="number" />
      </Attribute>
      <WeakMapping name="reviewOf"
        domain={<Entity $refByName="Product" />}
        lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R"
        cnWeakOwner="R" dcnWeakOwner="R" />
    </Weak>

    {/* M:N: a customer buys many products, a product is bought by many */}
    <Relationship name="buys">
      <Role name="buyer" lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" domain={<Entity $refByName="Customer" />} />
      <Role name="bought" lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" domain={<Entity $refByName="Product" />} />
    </Relationship>
  </EERSchema>
)
