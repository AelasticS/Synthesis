/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from '@synthesis/standard-metamodels/eer'
import type * as t from '@synthesis/standard-metamodels/eer/model'

export const $synth = {
  kind: 'model',
  metamodel: '@synthesis/standard-metamodels/eer',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample EER schema: import it to try the eer-to-relational example'
} as const

export default (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="Library" MDA_level="M1" store={store}>
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
    {/* A book has at most one author; an author wrote any number of
        books. This 1:N shape is what the binding model's condition
        matches, so the OneToManyStrategy issue applies here. */}
    <Relationship name="writtenBy">
      <Role name="AuthoredBy" lb="0" ub="1" domain={<Entity $refByName="Author"></Entity>} />
      <Role name="Wrote" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
    </Relationship>
  </EERSchema>
)
