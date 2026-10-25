/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import {
  EERSchema, Entity, Weak, Attribute, Domain, Relationship, Role,
  Specialization, Subtype, WeakMapping,
  Aggregation, AggregationMapping,
} from 'eer-metamodel'
import type * as t from 'eer-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'The Library: kernels, an abstract root with a hierarchy, an overlapping hierarchy, a weak chain, an M:N and a 1:N relationship'
} as const satisfies SynthHeaderInput

/**
 * Entities scope their attributes' names, so every key is simply `id`
 * and the shared domain vocabulary is declared once at the model
 * level, where every entity's bare references reach it by outward
 * probing. A specialization nests inside its root entity (it IS a
 * mapping, and its bounds carry completeness and disjointness);
 * subtypes are first-class top-level entities declaring their
 * membership with a supertype reference. A weak mapping nests inside
 * its weak entity.
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
      {/* an OVERLAPPING partial specialization (upperBound M): an
          author may be a reviewer and an editor at the same time */}
      <Specialization name="authorEngagement" lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" />
    </Entity>
    <Subtype name="Reviewer" supertype={<Specialization $refByName="Author/authorEngagement" />}
      cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
      <Attribute name="expertise" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Subtype>
    <Subtype name="Editor" supertype={<Specialization $refByName="Author/authorEngagement" />}
      cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
      <Attribute name="section" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Subtype>

    {/* An abstract root: every person is a member or a staff member,
        never both (a PARTIAL DISJOINT specialization: lowerBound 0,
        upperBound 1). */}
    <Entity name="Person" isAbstract={true}>
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false} isOptional={true}>
        <Domain $refByName="string" />
      </Attribute>
      <Specialization name="personRoles" lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
    </Entity>
    <Subtype name="Member" supertype={<Specialization $refByName="Person/personRoles" />}
      cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
      <Attribute name="since" isKey={false} isOptional={true}>
        <Domain $refByName="string" />
      </Attribute>
    </Subtype>
    <Subtype name="Staff" supertype={<Specialization $refByName="Person/personRoles" />}
      cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
      <Attribute name="salary" isKey={false}>
        <Domain $refByName="Money" />
      </Attribute>
    </Subtype>

    {/* The weak chain: a copy belongs to a book, a reservation to a
        copy, so a reservation's key and foreign key are composite.
        The weak mapping is authored inside its weak entity; the
        codomain fills itself from the nesting. */}
    <Weak name="BookCopy">
      <Attribute name="no" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <WeakMapping name="copyOf"
        domain={<Entity $refByName="Book" />}
        lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R"
        cnWeakOwner="R" dcnWeakOwner="R" />
    </Weak>
    <Weak name="Reservation">
      <Attribute name="no" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="date" isKey={false} isOptional={true}>
        <Domain $refByName="string" />
      </Attribute>
      <WeakMapping name="reservedAs"
        domain={<Weak $refByName="BookCopy" />}
        lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R"
        cnWeakOwner="R" dcnWeakOwner="R" />
    </Weak>

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
