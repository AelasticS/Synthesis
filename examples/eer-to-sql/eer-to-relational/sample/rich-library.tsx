/** @jsx createExprNode */

/*
 * The EER authoring pass: a sample exercising every concept of the
 * eer-metamodel once (kernels, a specialization with subtypes, a weak
 * entity with its weak mapping, an aggregation with its mapping, a
 * relationship with roles, a user-defined domain, a composite
 * attribute). The suite smoke imports every sample, so a
 * broken authoring path fails the gate. Fix the metamodel or the
 * components, never this file's shape.
 */
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
  description: 'Rich EER schema exercising every metamodel concept'
} as const

export default (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="RichLibrary" store={store}>
    {/* the domain vocabulary: primitives, and one user-defined domain
        with a base type, a check, and a default */}
    <Domain name="number" />
    <Domain name="string" />
    <Domain name="Money" baseType="number" check="VALUE >= 0" defaultValue="0" />

    {/* kernels */}
    <Entity name="Person" isAbstract={true}>
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="name" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
      {/* composite, one level: an address of street and city */}
      <Attribute name="address" isKey={false} isOptional={true}>
        <Attribute name="street" isKey={false}>
          <Domain $refByName="string" />
        </Attribute>
        <Attribute name="city" isKey={false}>
          <Domain $refByName="string" />
        </Attribute>
      </Attribute>
    </Entity>
    <Entity name="Book">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="price" isKey={false} isOptional={true}>
        <Domain $refByName="Money" />
      </Attribute>
    </Entity>
    <Entity name="Publisher">
      <Attribute name="id" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
    </Entity>

    {/* specialization: Person into Member and Staff */}
    <Specialization name="personRoles">
      <SpecializationMapping name="personRolesMapping"
        domain={<Entity $refByName="Person" />}
        lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
      <Subtype name="Member" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
        <Attribute name="since" isKey={false}>
          <Domain $refByName="string" />
        </Attribute>
      </Subtype>
      <Subtype name="Staff" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
        <Attribute name="salary" isKey={false}>
          <Domain $refByName="Money" />
        </Attribute>
      </Subtype>
    </Specialization>

    {/* weak entity: BookCopy identified through Book */}
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

    {/* aggregation: at least two participants, by the arity rule */}
    <Aggregation name="BookSeries">
      <Attribute name="title" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
      <AggregationMapping name="seriesOf"
        domain={<Entity $refByName="Book" />}
        lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R"
        cnAggrOwner="R" dcnAggrOwner="R" />
      <AggregationMapping name="seriesBy"
        domain={<Entity $refByName="Publisher" />}
        lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R"
        cnAggrOwner="R" dcnAggrOwner="R" />
    </Aggregation>

    {/* relationship with two roles */}
    <Relationship name="borrows">
      <Role name="borrower" lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R"
        domain={<Entity $refByName="Person" />} />
      <Role name="borrowed" lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R"
        domain={<Entity $refByName="Book" />} />
    </Relationship>
  </EERSchema>
)
