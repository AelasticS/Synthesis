/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx-runtime"
import { ExprNode } from "@aelastics/synthesis/jsx-runtime"
import { ModelStore } from "@aelastics/synthesis/engine"
import { EERSchema, Attribute, Domain, Relationship, Role, Entity } from "@synthesis/standard-metamodels/eer"
import * as t from "@synthesis/standard-metamodels/eer/model"

/**
 * A small EER schema authored in JSX:
 *   - Person (kernel entity, attributes personId/personName)
 *   - Organization (kernel entity, attributes organizationId/organizationName)
 *   - worksIn (binary relationship between Person and Organization)
 *
 * This is the source model for the eer-to-rel-to-text showcase. It is
 * transformed to a Relational schema via the existing EER2Rel decision-aware
 * transformation, then rendered as SQL DDL via an M2T template.
 */
export const PersonsSchema = (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="Persons" MDA_level="M1" store={store}>
    <Entity name="Person">
      <Attribute name="personId" isKey={true}>
        <Domain name="number" />
      </Attribute>
      <Attribute name="personName" isKey={false}>
        <Domain name="string" />
      </Attribute>
    </Entity>
    <Entity name="Organization">
      <Attribute name="organizationId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="organizationName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    {/* 0:1 to 0:M Relationship: Person works in Organization */}
    <Relationship name="worksIn">
      <Role
        name="WorksIn"
        lb="0"
        ub="1"
        domain={<Entity $refByName="Organization"></Entity>}
      />
      <Role
        name="Employs"
        lb="0"
        ub="M"
        domain={<Entity $refByName="Person"></Entity>}
      />
    </Relationship>
  </EERSchema>
)
