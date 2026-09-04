/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from 'eer-tutorial-metamodel/basic'
import type * as em from 'eer-tutorial-metamodel/basic/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-tutorial-metamodel/basic',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample EER schema for tutorial Part 1: one 1:N and one M:N relationship'
} as const

export default (store: ModelStore): ExprNode<em.IEERSchema> => (
  <EERSchema name="Library" store={store}>
    <Entity name="Book">
      <Attribute name="bookId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="bookTitle" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Entity>
    <Entity name="Author">
      <Attribute name="authorId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="authorName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Entity name="Category">
      <Attribute name="categoryId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="categoryName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    {/* 1:N: a book has at most one author. Part 1 maps this with a
        foreign key on the N side. */}
    <Relationship name="writtenBy">
      <Role name="AuthoredBy" lb="0" ub="1" domain={<Entity $refByName="Author"></Entity>} />
      <Role name="Wrote" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
    </Relationship>
    {/* M:N: books carry any number of categories and vice versa. Part 1
        maps this with a join table. */}
    <Relationship name="categorizedAs">
      <Role name="Categorized" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
      <Role name="Categorizes" lb="0" ub="M" domain={<Entity $refByName="Category"></Entity>} />
    </Relationship>
  </EERSchema>
)
