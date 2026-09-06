/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import {
  EERSchema, Entity, Weak, Attribute, Domain, Relationship, Role,
  Specialization, SpecializationMapping, Subtype, WeakMapping,
  Aggregation, AggregationMapping,
} from 'eer-metamodel'
import type * as t from 'eer-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'The Library: kernels, an abstract root with a hierarchy, a weak chain, an M:N and a 1:N relationship'
} as const

/**
 * Entities scope their attributes' names, so every key is simply `id`
 * and the shared domain vocabulary is declared once at the model
 * level, where every entity's bare references reach it by outward
 * probing.
 */
export default (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="Library" store={store}>
    <Domain name="number" />
    <Domain name="string" />
    <Domain name="Money" baseType="number" check="VALUE >= 0" defaultValue="0" />

    <Entity name="Book">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="title" isKey={false} isOptional={true}>
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
      {/* composite, one level: flattened to address_street, address_city */}
      <Attribute name="address" isKey={false} isOptional={true}>
        <Attribute name="street" isKey={false}>
          <Domain $refByName="string" />
        </Attribute>
        <Attribute name="city" isKey={false}>
          <Domain $refByName="string" />
        </Attribute>
      </Attribute>
    </Entity>

    {/* An abstract root: every person is a member or a staff member. */}
    <Entity name="Person" isAbstract={true}>
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false} isOptional={true}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Specialization name="personRoles">
      <SpecializationMapping name="personRolesMapping"
        domain={<Entity $refByName="Person" />}
        lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
      <Subtype name="Member" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
        <Attribute name="since" isKey={false} isOptional={true}>
          <Domain $refByName="string" />
        </Attribute>
      </Subtype>
      <Subtype name="Staff" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
        <Attribute name="salary" isKey={false}>
          <Domain $refByName="Money" />
        </Attribute>
      </Subtype>
    </Specialization>

    {/* The weak chain: a copy belongs to a book, a reservation to a
        copy, so a reservation's key and foreign key are composite. */}
    <Weak name="BookCopy">
      <Attribute name="no" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
    </Weak>
    <WeakMapping name="copyOf"
      domain={<Entity $refByName="Book" />}
      codomain={<Weak $refByName="BookCopy" />}
      lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R"
      cnWeakOwner="R" dcnWeakOwner="R" />
    <Weak name="Reservation">
      <Attribute name="no" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="date" isKey={false} isOptional={true}>
        <Domain $refByName="string" />
      </Attribute>
    </Weak>
    <WeakMapping name="reservedAs"
      domain={<Weak $refByName="BookCopy" />}
      codomain={<Weak $refByName="Reservation" />}
      lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R"
      cnWeakOwner="R" dcnWeakOwner="R" />

    {/* M:N: a book has many authors, an author writes many books.
        Deleting an author cascades its join rows (dcn = C). */}
    <Relationship name="writtenBy">
      <Role name="Wrote" lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="C" domain={<Entity $refByName="Author" />} />
      <Role name="OfBook" lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" domain={<Entity $refByName="Book" />} />
    </Relationship>

    {/* 1:N, the OneToManyStrategy playground: a member borrows many
        copies; its source is a subtype and its target is weak, so the
        ForeignKey option produces a strategy-routed composite key. */}
    <Relationship name="borrows">
      <Role name="borrower" lowerBound="0" upperBound="1" cnMapp="C" dcnMapp="R" domain={<Subtype $refByName="Member" />} />
      <Role name="borrowed" lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" domain={<Weak $refByName="BookCopy" />} />
    </Relationship>

    {/* the aggregation: a loan relates a copy and a member. Each copy
        is on at most one loan, so the copy's key IS the loan's key
        (the key rule); the member is an ordinary foreign key. Deleting
        the copy cascades the loan (dcn = C on the copy side). */}
    <Aggregation name="Loan">
      <Attribute name="date" isKey={false} isOptional={true}>
        <Domain $refByName="string" />
      </Attribute>
      <AggregationMapping name="ofCopy"
        domain={<Weak $refByName="BookCopy" />}
        lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R"
        cnAggrOwner="R" dcnAggrOwner="C" />
      <AggregationMapping name="byMember"
        domain={<Subtype $refByName="Member" />}
        lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R"
        cnAggrOwner="R" dcnAggrOwner="R" />
    </Aggregation>
  </EERSchema>
)
