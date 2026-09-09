/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { EERSchema, Entity, Kernel, Weak, Attribute, Domain, Relationship, Role } from 'eer-tutorial-metamodel/advanced'
import type * as em from 'eer-tutorial-metamodel/advanced/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-tutorial-metamodel/advanced',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample EER schema for tutorial Part 3: kernel and weak entities, one 1:N and one M:N relationship'
} as const satisfies SynthHeaderInput

export default (store: ModelStore): ExprNode<em.IEERSchema> => (
  <EERSchema name="Library" store={store}>
    <Kernel name="Book">
      <Attribute name="bookId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="bookTitle" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Kernel>
    <Kernel name="Author">
      <Attribute name="authorId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="authorName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Kernel>
    <Kernel name="Publisher">
      <Attribute name="publisherId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="publisherName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Kernel>
    {/* A physical copy exists only as a copy of some book: copyNumber is
        a partial key, and Book completes it. The specialized weak entity
        rule of Part 2 is unchanged here. */}
    <Weak name="BookCopy" owner={<Entity $refByName="Book"></Entity>}>
      <Attribute name="copyNumber" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="copyShelf" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Weak>
    {/* 1:N: a book has at most one publisher. This is the relationship
        the configuration decides about: foreign key by default, join
        table if the configuration says so. */}
    <Relationship name="publishedBy">
      <Role name="Published" lb="0" ub="1" domain={<Entity $refByName="Publisher"></Entity>} />
      <Role name="Publishes" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
    </Relationship>
    {/* M:N: a book has any number of authors and vice versa. No choice
        to make, so the binding model's condition leaves it out of the
        configuration and the transformation maps it with fixed logic. */}
    <Relationship name="writtenBy">
      <Role name="Wrote" lb="0" ub="M" domain={<Entity $refByName="Author"></Entity>} />
      <Role name="WrittenBy" lb="0" ub="M" domain={<Entity $refByName="Book"></Entity>} />
    </Relationship>
  </EERSchema>
)
