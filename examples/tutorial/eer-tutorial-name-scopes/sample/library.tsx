/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from 'eer-tutorial-metamodel/name-scopes'
import type * as em from 'eer-tutorial-metamodel/name-scopes/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-tutorial-metamodel/name-scopes',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample EER schema for tutorial Part 4: the Library of Part 1 with natural names under entity scopes'
} as const satisfies SynthHeaderInput

/**
 * Part 1's Library schema in the scoped naming world. Every entity
 * scopes its attributes' names, so all three keys are simply `id` and
 * both Author and Category can carry a `name`. The domain vocabulary is
 * declared once at the model level; the bare references from the
 * attributes still reach it, because a name that misses in the current
 * scope is probed outward. Compare with Part 1's sample, where every
 * name had to be unique across the whole model.
 */
export default (store: ModelStore): ExprNode<em.IEERSchema> => (
  <EERSchema name="Library" store={store}>
    <Domain name="number" />
    <Domain name="string" />
    <Entity name="Book">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="title" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Entity name="Author">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Entity name="Category">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    {/* 1:N: a book has at most one author. The mapping puts a foreign
        key on the N side, exactly as in Part 1. */}
    <Relationship name="writtenBy">
      <Role name="AuthoredBy" lb="0" ub="1" domain={<Entity $refByName="Author"></Entity>} />
      <Role name="Wrote" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
    </Relationship>
    {/* M:N: books carry any number of categories and vice versa, mapped
        with a join table, exactly as in Part 1. */}
    <Relationship name="categorizedAs">
      <Role name="Categorized" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
      <Role name="Categorizes" lb="0" ub="M" domain={<Entity $refByName="Category"></Entity>} />
    </Relationship>
  </EERSchema>
)
