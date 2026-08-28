/*
 * Simplified EER metamodel for the developer-guide tutorial. It carries
 * exactly the concepts the tutorial needs and nothing else: entities
 * with attributes over domains, binary relationships with cardinality
 * roles, and the Kernel/Weak entity subtypes that tutorial Part 2 uses
 * to teach rule specialization. Aggregations, subtyping hierarchies,
 * and integrity rules live in the full `eer` metamodel.
 */
import * as t from "@aelastics/types"

import { ModelElement, Model } from "@synthesis/metamodel-core"

export const EERTutorial_TypeSchema = t.schema("EERTutorialSchema")

export const EERSchema = t.subtype(Model, {}, "EERSchema", EERTutorial_TypeSchema)

export const Domain = t.subtype(ModelElement, {}, "Domain", EERTutorial_TypeSchema)

export const Attribute = t.subtype(
  ModelElement,
  {
    attrDomain: Domain,
    attrEntity: t.link(EERTutorial_TypeSchema, "Entity"),
    isKey: t.boolean,
  },
  "Attribute",
  EERTutorial_TypeSchema
)

export const Entity = t.subtype(
  ModelElement,
  {
    attributes: t.arrayOf(Attribute),
  },
  "Entity",
  EERTutorial_TypeSchema
)

t.inverseProps(Attribute, "attrEntity", Entity, "attributes")

// Introduced in tutorial Part 2: specialization of the Entity2Table rule
// dispatches on these subtypes.
export const Kernel = t.subtype(Entity, {}, "Kernel", EERTutorial_TypeSchema)

export const Weak = t.subtype(Entity, {}, "Weak", EERTutorial_TypeSchema)

export const Mapping = t.subtype(
  ModelElement,
  {
    domain: Entity,
    lb: t.string.derive().oneOf(["0", "1", "M"]),
    ub: t.string.derive().oneOf(["1", "M"]),
  },
  "Mapping",
  EERTutorial_TypeSchema
)

export const OrdinaryMapping = t.subtype(
  Mapping,
  {
    relationship: t.link(EERTutorial_TypeSchema, "Relationship", "relationship"),
  },
  "OrdinaryMapping",
  EERTutorial_TypeSchema
)

export const Relationship = t.subtype(
  ModelElement,
  {
    roles: t.arrayOf(OrdinaryMapping),
  },
  "Relationship",
  EERTutorial_TypeSchema
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
