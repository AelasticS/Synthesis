/*
 * Advanced tutorial EER metamodel (model-to-model tutorial, Part 2 and
 * later). A complete, standalone stage: everything the basic stage has
 * (entities with attributes over domains, binary relationships with
 * cardinality roles) plus the Kernel and Weak entity subtypes that the
 * specialization part dispatches on. Aggregations, subtyping
 * hierarchies, and integrity rules live in the full `eer` metamodel.
 */
import * as t from "@aelastics/types"

import { ModelElement, Model } from "@synthesis/metamodel-core"

export const EERTutorialAdvanced_TypeSchema = t.schema("EERTutorialAdvancedSchema")

export const EERSchema = t.subtype(Model, {}, "EERSchema", EERTutorialAdvanced_TypeSchema)

export const Domain = t.subtype(ModelElement, {}, "Domain", EERTutorialAdvanced_TypeSchema)

export const Attribute = t.subtype(
  ModelElement,
  {
    attrDomain: Domain,
    attrEntity: t.link(EERTutorialAdvanced_TypeSchema, "Entity"),
    isKey: t.boolean,
  },
  "Attribute",
  EERTutorialAdvanced_TypeSchema
)

export const Entity = t.subtype(
  ModelElement,
  {
    attributes: t.arrayOf(Attribute),
  },
  "Entity",
  EERTutorialAdvanced_TypeSchema
)

t.inverseProps(Attribute, "attrEntity", Entity, "attributes")

// The specialization part dispatches Entity2Table on these subtypes.
export const Kernel = t.subtype(Entity, {}, "Kernel", EERTutorialAdvanced_TypeSchema)

// A weak entity is identified relative to an owner entity: its own
// attributes carry only a partial key, so the owner link is what a
// specialized rule turns into the rest of the key.
export const Weak = t.subtype(
  Entity,
  {
    owner: Entity,
  },
  "Weak",
  EERTutorialAdvanced_TypeSchema
)

export const Mapping = t.subtype(
  ModelElement,
  {
    domain: Entity,
    lb: t.string.derive().oneOf(["0", "1", "M"]),
    ub: t.string.derive().oneOf(["1", "M"]),
  },
  "Mapping",
  EERTutorialAdvanced_TypeSchema
)

export const OrdinaryMapping = t.subtype(
  Mapping,
  {
    relationship: t.link(EERTutorialAdvanced_TypeSchema, "Relationship", "relationship"),
  },
  "OrdinaryMapping",
  EERTutorialAdvanced_TypeSchema
)

export const Relationship = t.subtype(
  ModelElement,
  {
    roles: t.arrayOf(OrdinaryMapping),
  },
  "Relationship",
  EERTutorialAdvanced_TypeSchema
)

export type IEERSchema = t.TypeOf<typeof EERSchema>
export type IDomain = t.TypeOf<typeof Domain>
export type IAttribute = t.TypeOf<typeof Attribute>
export type IEntity = t.TypeOf<typeof Entity>
export type IKernel = t.TypeOf<typeof Kernel>
export type IWeak = t.TypeOf<typeof Weak>
export type IMapping = t.TypeOf<typeof Mapping>
export type IOrdinaryMapping = t.TypeOf<typeof OrdinaryMapping>
export type IRelationship = t.TypeOf<typeof Relationship>
