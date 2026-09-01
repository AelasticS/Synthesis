/*
 * Basic tutorial EER metamodel (model-to-model tutorial, Part 1). It
 * carries exactly the concepts Part 1 needs: entities with attributes
 * over domains, and binary relationships with cardinality roles. The
 * `advanced` stage adds the Kernel/Weak entity subtypes; everything
 * else lives in the full `eer` metamodel.
 */
import * as t from "@aelastics/types"

import { ModelElement, Model } from "@aelastics/synthesis/metamodel"

export const EERTutorialBasic_TypeSchema = t.schema("EERTutorialBasicSchema")

export const EERSchema = t.subtype(Model, {}, "EERSchema", EERTutorialBasic_TypeSchema)

export const Domain = t.subtype(ModelElement, {}, "Domain", EERTutorialBasic_TypeSchema)

export const Attribute = t.subtype(
  ModelElement,
  {
    attrDomain: Domain,
    attrEntity: t.link(EERTutorialBasic_TypeSchema, "Entity"),
    isKey: t.boolean,
  },
  "Attribute",
  EERTutorialBasic_TypeSchema
)

export const Entity = t.subtype(
  ModelElement,
  {
    attributes: t.arrayOf(Attribute),
  },
  "Entity",
  EERTutorialBasic_TypeSchema
)

t.inverseProps(Attribute, "attrEntity", Entity, "attributes")

export const Mapping = t.subtype(
  ModelElement,
  {
    domain: Entity,
    lb: t.string.derive().oneOf(["0", "1", "M"]),
    ub: t.string.derive().oneOf(["1", "M"]),
  },
  "Mapping",
  EERTutorialBasic_TypeSchema
)

export const OrdinaryMapping = t.subtype(
  Mapping,
  {
    relationship: t.link(EERTutorialBasic_TypeSchema, "Relationship", "relationship"),
  },
  "OrdinaryMapping",
  EERTutorialBasic_TypeSchema
)

export const Relationship = t.subtype(
  ModelElement,
  {
    roles: t.arrayOf(OrdinaryMapping),
  },
  "Relationship",
  EERTutorialBasic_TypeSchema
)

export type IEERSchema = t.TypeOf<typeof EERSchema>
export type IDomain = t.TypeOf<typeof Domain>
export type IAttribute = t.TypeOf<typeof Attribute>
export type IEntity = t.TypeOf<typeof Entity>
export type IMapping = t.TypeOf<typeof Mapping>
export type IOrdinaryMapping = t.TypeOf<typeof OrdinaryMapping>
export type IRelationship = t.TypeOf<typeof Relationship>
