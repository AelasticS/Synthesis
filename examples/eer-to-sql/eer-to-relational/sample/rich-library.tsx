/** @jsx createExprNode */

/*
 * The EER authoring pass: a sample exercising every concept of the
 * eer-metamodel once (kernels, a specialization with subtypes, a weak
 * entity with its weak mapping, an aggregation with its mapping, a
 * relationship with roles). The suite smoke imports every sample, so a
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
    {/* kernels */}
    <Entity name="Person" isAbstract={true}>
      <Attribute name="personId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="personName" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Entity>
    <Entity name="Book">
      <Attribute name="bookId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
    </Entity>

    {/* specialization: Person into Member and Staff */}
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

    {/* weak entity: BookCopy identified through Book */}
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

    {/* aggregation with its mapping */}
    <Aggregation name="BookSeries">
      <Attribute name="seriesTitle" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
      <AggregationMapping name="seriesOf"
        domain={<Entity $refByName="Book" />}
        lb="0" ub="M" cnMapp="R" dcnMapp="R"
        cnAggrOwner="R" dcnAggrOwner="R" />
    </Aggregation>

    {/* relationship with two roles */}
    <Relationship name="borrows">
      <Role name="borrower" lb="0" ub="1" cnMapp="R" dcnMapp="R"
        domain={<Entity $refByName="Person" />} />
      <Role name="borrowed" lb="0" ub="M" cnMapp="R" dcnMapp="R"
        domain={<Entity $refByName="Book" />} />
    </Relationship>
  </EERSchema>
)
