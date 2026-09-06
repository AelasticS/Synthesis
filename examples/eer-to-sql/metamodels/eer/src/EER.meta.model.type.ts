/*
 * Copyright (c) AelasticS 2020.
 *
 * The full EER metamodel of the eer-to-sql suite (v2): entities scope
 * their attributes' names, attributes carry cardinality (nullability
 * and multivalued in one fact) and may be composite one level deep,
 * and domains are user-definable (base type, check, default) on top of
 * the primitive names. Relationships are strictly binary by doctrine:
 * relating more than two entities is modeled as an Aggregation.
 */

import * as t from "@aelastics/types";
import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel";

// tslint:disable-next-line:variable-name
export const EERModel_TypeSchema = t.schema("EERModelSchema");

// Integrity rules on associations: R restricts, C cascades, N
// nullifies, D sets the default. Each mapping carries a pair: cn, the
// CONNECT rule (the association is established: the referencing row
// inserted or its foreign key set), and dcn, the DISCONNECT rule (the
// association is broken: the row deleted or the key value changed).
export const IntegrityRule = t.string.derive().oneOf(["R", "C", "N", "D"]);
/** @deprecated Use IntegrityRule; kept as an alias for old imports. */
export const IntegityRule = IntegrityRule;

export const ERConcept = t.subtype(
  ModelElement,
  {
    conceptType: t.string
      .derive()
      .oneOf([
        "Domain",
        "Submodel",
        "EERSchema",
        "Attribute",
        "Entity",
        "Kernel",
        "Weak",
        "Aggregation",
        "Subtype",
        "Specialization",
        "Mapping",
        "WeakMapping",
        "AggregationMapping",
        "OrdinaryMapping",
        "SpecializationMapping",
        "Relationship",
      ]),
  },
  "ERConcept",
  EERModel_TypeSchema
);

// A domain without a baseType IS a primitive name (number, string,
// boolean, ...). A user-defined domain names its base type and may
// carry a check (a boolean SQL expression over VALUE) and a default.
export const Domain = t.subtype(
  ERConcept,
  {
    baseType: t.optional(t.string),
    check: t.optional(t.string),
    defaultValue: t.optional(t.string),
  },
  "Domain",
  EERModel_TypeSchema
);

export const Submodel = t.subtype(
  ERConcept,
  {
    concepts: t.arrayOf(ERConcept),
  },
  "Submodel",
  EERModel_TypeSchema
);

export const EERSchema = t.subtype(
  Model,
  {
    submodels: t.arrayOf(Submodel),
  },
  "EERSchema",
  EERModel_TypeSchema
);

export const Attribute = t.subtype(
  ERConcept,
  {
    // A leaf attribute carries its domain; a composite parent carries
    // components instead. Both links are filled by nesting, so they
    // are type-level optional (the Flow.from/to idiom).
    attrDomain: t.optional(Domain),
    attrEntity: t.optional(t.link(EERModel_TypeSchema, "Entity")),
    isKey: t.boolean,
    defaultValue: t.optional(t.string),
    // Attribute cardinality, (1,1) when absent: lowerBound "0" makes
    // the attribute nullable, upperBound "M" makes it multivalued (an
    // own table in the relational mapping).
    lowerBound: t.optional(t.string.derive().oneOf(["0", "1"])),
    upperBound: t.optional(t.string.derive().oneOf(["1", "M"])),
    // One level of composition: the parts of a composite attribute.
    components: t.arrayOf(t.link(EERModel_TypeSchema, "Attribute")),
  },
  "Attribute",
  EERModel_TypeSchema
);

export const Entity = t.subtype(
  ERConcept,
  {
    attributes: t.arrayOf(Attribute),
    mappings: t.arrayOf(t.link(EERModel_TypeSchema, "Mapping")),
    // A domain fact: an abstract entity has no direct instances (every
    // one belongs to a subtype). The mapping consequences are fixed
    // logic in the transformation, not a design option.
    isAbstract: t.optional(t.boolean),
  },
  "Entity",
  EERModel_TypeSchema
);

t.inverseProps(Attribute, "attrEntity", Entity, "attributes");

// An entity scopes its attributes' names: every entity can carry its
// own `id`, and the samples use natural names throughout.
declareNamespace(Entity);

export const Kernel = t.subtype(Entity, {}, "Kernel", EERModel_TypeSchema);

export const Weak = t.subtype(
  Entity,
  {
    // Semantically exactly one weak mapping names the owner; the
    // OPTIONAL is a creation-order accommodation, not semantics: the
    // link is filled only when the WeakMapping element is authored,
    // later in the model, and the store auto-initializes mandatory
    // properties at creation (verified: a mandatory link here breaks
    // rendering). Subtype.supertype can stay mandatory because
    // nesting inside the Specialization fills it at creation time.
    // The transformation enforces the semantic rule (ownerOf).
    weakMap: t.optional(t.link(EERModel_TypeSchema, "WeakMapping")),
  },
  "Weak",
  EERModel_TypeSchema
);

export const Aggregation = t.subtype(
  Entity,
  {
    // At least two participants: relating two or more entities is
    // what an aggregation is for (relationships stay binary). The
    // arity is declared as a validator below and enforced by the
    // transformation.
    agrMapp: t.arrayOf(t.link(EERModel_TypeSchema, "AggregationMapping")),
  },
  "Aggregation",
  EERModel_TypeSchema
);

export const Subtype = t.subtype(
  Entity,
  {
    supertype: t.link(EERModel_TypeSchema, "Specialization"),
    cnSupertype: IntegrityRule,
    dcnSupertype: IntegrityRule,
    cnSubtype: IntegrityRule,
    dcnSubtype: IntegrityRule,
  },
  "Subtype",
  EERModel_TypeSchema
);

export const Mapping = t.subtype(
  ERConcept,
  {
    domain: Entity,
    lowerBound: t.string.derive().oneOf(["0", "1", "M", "m", "*"]), // .defaultValue("0"),
    upperBound: t.string.derive().oneOf(["1", "M", "m", "*"]), // .defaultValue("M"),
    cnMapp: IntegrityRule,
    dcnMapp: IntegrityRule,
  },
  "Mapping",
  EERModel_TypeSchema
);

export const WeakMapping = t.subtype(
  Mapping,
  {
    codomain: Weak,
    cnWeakOwner: IntegrityRule,
    dcnWeakOwner: IntegrityRule,
  },
  "WeakMapping",
  EERModel_TypeSchema
);

export const AggregationMapping = t.subtype(
  Mapping,
  {
    codomain: Aggregation,
    cnAggrOwner: IntegrityRule,
    dcnAggrOwner: IntegrityRule,
  },
  "AggregationMapping",
  EERModel_TypeSchema
);

export const OrdinaryMapping = t.subtype(
  Mapping,
  {
    relationship: t.link(EERModel_TypeSchema, "Relationship", "relationship"),
  },
  "OrdinaryMapping",
  EERModel_TypeSchema
);

export const SpecializationMapping = t.subtype(
  Mapping,
  {
    specialization: t.optional(t.link(EERModel_TypeSchema, "Specialization")),
  },
  "SpecializationMapping",
  EERModel_TypeSchema
);

export const Specialization = t.subtype(
  ERConcept,
  {
    mapping: t.optional(SpecializationMapping),
    subtypes: t.arrayOf(Subtype),
  },
  "Specialization",
  EERModel_TypeSchema
);

export const Relationship = t.subtype(
  ERConcept,
  {
    // Exactly two roles, by doctrine: relationships are binary, and
    // relating more entities is modeled as an Aggregation. The arity
    // is declared as a validator below and enforced by the
    // transformation.
    roles: t.arrayOf(OrdinaryMapping),
  },
  "Relationship",
  EERModel_TypeSchema
);

t.inverseProps(
  Relationship,
  "roles",
  OrdinaryMapping,
  "relationship"
);
t.inverseProps(Entity, "mappings", Mapping, "domain");
t.inverseProps(Weak, "weakMap", WeakMapping, "codomain");
t.inverseProps(Aggregation, "agrMapp", AggregationMapping, "codomain");
t.inverseProps(Subtype, "supertype", Specialization, "subtypes");
t.inverseProps(
  Specialization,
  "mapping",
  SpecializationMapping,
  "specialization"
);

// ── semantic completeness constraints ────────────────────────────────
// Declared on the types, run only in a validation traversal: while a
// model renders it is legitimately incomplete (a Weak exists before
// its mapping, arrays grow one element at a time), so these are
// judgments about the finished model, never authoring-time checks.
Weak.addValidator({
  predicate: (v: IWeak) => v.weakMap !== undefined,
  message: (_v: IWeak, label?: string) =>
    `${label ?? "Weak"}: a weak entity needs exactly one weak mapping naming its owner`,
});
Aggregation.addValidator({
  predicate: (v: IAggregation) => (v.agrMapp?.length ?? 0) >= 2,
  message: (_v: IAggregation, label?: string) =>
    `${label ?? "Aggregation"}: an aggregation relates at least two participants`,
});
Relationship.addValidator({
  predicate: (v: IRelationship) => (v.roles?.length ?? 0) === 2,
  message: (_v: IRelationship, label?: string) =>
    `${label ?? "Relationship"}: a relationship is binary (exactly two roles); relate more entities with an Aggregation`,
});

// One identification-dependency graph spans the kinds: a weak entity
// depends on its owner, an aggregation on its participants, a subtype
// on its hierarchy's root. The graph must be acyclic, because an
// identity cannot derive from itself: a weak entity owned by an
// aggregation that the same weak entity participates in is just as
// circular as a weak chain that loops, and only the combined walk
// catches such mixed cases. Acyclicity is a property of the WHOLE
// schema's graph, so the rule sits on EERSchema and runs once per
// validation, not once per element; the message names the elements on
// the cycles.
type IDependencyCarrier = Partial<IWeak> & Partial<IAggregation> & Partial<ISubtype>;

const identityDependencies = (el: IEntity): IEntity[] => {
  const e = el as IDependencyCarrier;
  const deps: IEntity[] = [];
  const owner = (e.weakMap as IWeakMapping | undefined)?.domain as IEntity | undefined;
  if (owner !== undefined) deps.push(owner);
  for (const m of (e.agrMapp ?? []) as IAggregationMapping[]) {
    const participant = m?.domain as IEntity | undefined;
    if (participant !== undefined) deps.push(participant);
  }
  const spec = e.supertype as ISpecialization | undefined;
  const root = (spec?.mapping as ISpecializationMapping | undefined)?.domain as IEntity | undefined;
  if (root !== undefined) deps.push(root);
  return deps;
};

const elementsOnIdentityCycles = (schema: IEERSchema): IEntity[] => {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<IEntity, number>();
  const offenders = new Set<IEntity>();
  const visit = (el: IEntity, stack: IEntity[]): void => {
    const c = color.get(el) ?? WHITE;
    if (c === GRAY) {
      for (const s of stack.slice(stack.indexOf(el))) offenders.add(s);
      return;
    }
    if (c === BLACK) return;
    color.set(el, GRAY);
    stack.push(el);
    for (const d of identityDependencies(el)) visit(d, stack);
    stack.pop();
    color.set(el, BLACK);
  };
  for (const el of (schema.elements ?? []) as IEntity[]) visit(el, []);
  return [...offenders];
};

EERSchema.addValidator({
  predicate: (v: IEERSchema) => elementsOnIdentityCycles(v).length === 0,
  message: (v: IEERSchema, label?: string) =>
    `${label ?? "EERSchema"}: cyclic identification dependency (weak ownership, aggregation participation, and subtyping must not loop) involving ${elementsOnIdentityCycles(v)
      .map((e) => String(e.name))
      .join(", ")}`,
});

export type IERConcept = t.TypeOf<typeof ERConcept>;
export type IDomain = t.TypeOf<typeof Domain>;
export type ISubmodel = t.TypeOf<typeof Submodel>;
export type IEERSchema = t.TypeOf<typeof EERSchema>;
export type IAttribute = t.TypeOf<typeof Attribute>;
export type IEntity = t.TypeOf<typeof Entity>;
export type IKernel = t.TypeOf<typeof Kernel>;
export type IWeak = t.TypeOf<typeof Weak>;
export type IAggregation = t.TypeOf<typeof Aggregation>;
export type ISubtype = t.TypeOf<typeof Subtype>;
export type ISpecialization = t.TypeOf<typeof Specialization>;
export type IMapping = t.TypeOf<typeof Mapping>;
export type IWeakMapping = t.TypeOf<typeof WeakMapping>;
export type IAggregationMapping = t.TypeOf<typeof AggregationMapping>;
export type IOrdinaryMapping = t.TypeOf<typeof OrdinaryMapping>;
export type ISpecializationMapping = t.TypeOf<typeof SpecializationMapping>;
export type IRelationship = t.TypeOf<typeof Relationship>;

export const getCodomain = (mapping: IOrdinaryMapping): IEntity => {
  return getInverse(mapping).domain;
};

export const getInverse = (mapping: IOrdinaryMapping): IOrdinaryMapping => {
  const first: IOrdinaryMapping = (mapping.relationship as IRelationship)
    .roles[0];
  const second: IOrdinaryMapping = (mapping.relationship as IRelationship)
    .roles[1];

  return first === mapping ? second : first;
};
