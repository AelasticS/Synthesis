/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import {
  EERSchema, Entity, Weak, Attribute, Domain, Relationship, Role,
  Specialization, SpecializationMapping, Subtype, WeakMapping,
} from 'eer-metamodel'
import type * as t from 'eer-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'The Library: kernels, an abstract root with a hierarchy, a weak chain, an M:N and a 1:N relationship'
} as const

export default (store: ModelStore): ExprNode<t.IEERSchema> => (
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

    {/* An abstract root: every person is a member or a staff member. */}
    <Entity name="Person" isAbstract={true}>
      <Attribute name="personId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="personName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Specialization name="personRoles">
      <SpecializationMapping name="personRolesMapping"
        domain={<Entity $refByName="Person" />}
        lb="0" ub="1" cnMapp="R" dcnMapp="R" />
      <Subtype name="Member" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
        <Attribute name="memberSince" isKey={false}>
          <Domain $refByName="string" />
        </Attribute>
      </Subtype>
      <Subtype name="Staff" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
        <Attribute name="salary" isKey={false}>
          <Domain $refByName="number" />
        </Attribute>
      </Subtype>
    </Specialization>

    {/* The weak chain: a copy belongs to a book, a reservation to a
        copy, so a reservation's key and foreign key are composite. */}
    <Weak name="BookCopy">
      <Attribute name="copyNo" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
    </Weak>
    <WeakMapping name="copyOf"
      domain={<Entity $refByName="Book" />}
      codomain={<Weak $refByName="BookCopy" />}
      lb="1" ub="1" cnMapp="R" dcnMapp="R"
      cnWeakOwner="R" dcnWeakOwner="R" />
    <Weak name="Reservation">
      <Attribute name="resNo" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="resDate" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Weak>
    <WeakMapping name="reservedAs"
      domain={<Weak $refByName="BookCopy" />}
      codomain={<Weak $refByName="Reservation" />}
      lb="1" ub="1" cnMapp="R" dcnMapp="R"
      cnWeakOwner="R" dcnWeakOwner="R" />

    {/* M:N: a book has many authors, an author writes many books. */}
    <Relationship name="writtenBy">
      <Role name="Wrote" lb="0" ub="M" domain={<Entity $refByName="Author" />} />
      <Role name="OfBook" lb="0" ub="M" domain={<Entity $refByName="Book" />} />
    </Relationship>

    {/* 1:N, the OneToManyStrategy playground: a member borrows many
        copies; its source is a subtype and its target is weak, so the
        ForeignKey option produces a strategy-routed composite key. */}
    <Relationship name="borrows">
      <Role name="borrower" lb="0" ub="1" domain={<Subtype $refByName="Member" />} />
      <Role name="borrowed" lb="0" ub="M" domain={<Weak $refByName="BookCopy" />} />
    </Relationship>
  </EERSchema>
)
