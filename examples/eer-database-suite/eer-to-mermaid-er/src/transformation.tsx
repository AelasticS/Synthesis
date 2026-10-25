/** @jsx createExprNode */

/**
 * EER schema to Mermaid erDiagram text, the suite's diagram view. One
 * document per schema: an attribute block per entity (every kind,
 * subtypes included; composite attributes flatten one level to
 * parent_component lines), then the relationship lines. Ordinary
 * relationships are non-identifying (dashed); weak identification and
 * aggregation participation are identifying (solid); a specialization
 * renders one dashed one-to-one line per subtype, because a subtype
 * instance IS its root instance. The glyph next to an entity always
 * comes from that side's bounds. The logic is fixed: a diagram
 * renderer has no open design questions at this scale, so the
 * manifest declares no parts and the CLI runs it without
 * configuration flags.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M } from '@aelastics/synthesis/m2m'
import { M2T, Doc, P } from '@aelastics/synthesis/m2t'
import type { M2T_Model } from '@aelastics/synthesis/m2t'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as em from 'eer-metamodel/model'

export class EerToMermaidEr extends abstractM2M<em.IEERSchema, M2T_Model> {
  constructor(store: ModelStore) {
    super(store)
  }

  main(s: em.IEERSchema): ExprNode<em.IEERSchema, M2T_Model> {
    const store = this.context.store
    const els = (s.elements ?? []) as em.IERConcept[]
    // Specialization is a Mapping, not an Entity, so the Entity filter
    // takes exactly the four entity kinds, subtypes included.
    const entities = els.filter((el) => store.isTypeOf(el, em.Entity)) as em.IEntity[]
    const relationships = els.filter((el) => store.isTypeOf(el, em.Relationship)) as em.IRelationship[]
    const weaks = entities.filter((e) => store.isTypeOf(e, em.Weak)) as em.IWeak[]
    const aggregations = entities.filter((e) => store.isTypeOf(e, em.Aggregation)) as em.IAggregation[]
    const specializations = els.filter((el) => store.isTypeOf(el, em.Specialization)) as em.ISpecialization[]
    return (
      <M2T name={`${s.name}_mermaid`}>
        <Doc name={`${s.name}.mmd`}>
          <P>{'erDiagram'}</P>
          {entities.flatMap((e) => this.entityBlock(e))}
          {relationships.map((r) => this.relationshipLine(r))}
          {weaks.map((w) => this.weakIdentificationLine(w))}
          {aggregations.flatMap((g) => this.aggregationLines(g))}
          {specializations.flatMap((spec) => this.specializationLines(spec))}
        </Doc>
      </M2T>
    )
  }

  private entityBlock(e: em.IEntity): ExprNode<any>[] {
    return [
      <P>{`  ${e.name} {`}</P>,
      ...((e.attributes ?? []) as em.IAttribute[]).flatMap((a) => this.attributeLines(a)),
      <P>{'  }'}</P>,
    ]
  }

  /** A composite parent flattens one level to parent_component lines
   * carrying the component's own facts; a leaf contributes its line. */
  private attributeLines(a: em.IAttribute): ExprNode<any>[] {
    const components = (a.components ?? []) as em.IAttribute[]
    if (components.length > 0) {
      return components.map((leaf) => (
        <P>{`    ${this.attributeLine(leaf, `${a.name}_${leaf.name}`)}`}</P>
      ))
    }
    return [<P>{`    ${this.attributeLine(a, String(a.name))}`}</P>]
  }

  /** Type word, attribute name, PK on key attributes, an "optional"
   * comment on optional ones. The type is the domain's NAME: the
   * diagram keeps the model vocabulary (Money), not storage types. */
  private attributeLine(a: em.IAttribute, name: string): string {
    const dom = a.attrDomain as em.IDomain | undefined
    if (!dom) {
      throw new Error(`Attribute '${a.name}' has no domain; composite attributes flatten one level only.`)
    }
    const parts = [String(dom.name), name]
    if (a.isKey) parts.push('PK')
    if (a.isOptional === true) parts.push('"optional"')
    return parts.join(' ')
  }

  /** One non-identifying (dashed) line per relationship; the glyph
   * next to an entity comes from that entity's own role bounds. */
  private relationshipLine(r: em.IRelationship): ExprNode<any> {
    const roles = (r.roles ?? []) as em.IOrdinaryMapping[]
    if (roles.length !== 2) {
      throw new Error(`Relationship '${r.name}' has ${roles.length} roles; relationships are binary by doctrine.`)
    }
    const [a, b] = roles
    const left = this.leftGlyph(String(a.lowerBound), String(a.upperBound))
    const right = this.rightGlyph(String(b.lowerBound), String(b.upperBound))
    return (
      <P>{`  ${(a.domain as em.IEntity).name} ${left}..${right} ${(b.domain as em.IEntity).name} : ${r.name}`}</P>
    )
  }

  /** The weak entity hangs off its owner with an identifying (solid)
   * line: the owner-side glyph from the weak mapping's bounds, the
   * weak side zero-or-more. */
  private weakIdentificationLine(w: em.IWeak): ExprNode<any> {
    const wm = w.weakMap as em.IWeakMapping | undefined
    if (!wm || !wm.domain) {
      throw new Error(`Weak entity '${w.name}' has no weak mapping naming its owner.`)
    }
    const owner = wm.domain as em.IEntity
    const ownerGlyph = this.leftGlyph(String(wm.lowerBound), String(wm.upperBound))
    return <P>{`  ${owner.name} ${ownerGlyph}--o{ ${w.name} : ${wm.name}`}</P>
  }

  /** One identifying (solid) line per participant: an aggregation
   * instance relates exactly one instance of each participant, hence
   * exactly-one on the participant side; the aggregation-side glyph
   * comes from the mapping's bounds. */
  private aggregationLines(g: em.IAggregation): ExprNode<any>[] {
    return ((g.agrMapp ?? []) as em.IAggregationMapping[]).map((m) => (
      <P>{`  ${(m.domain as em.IEntity).name} ||--${this.rightGlyph(String(m.lowerBound), String(m.upperBound))} ${g.name} : ${m.name}`}</P>
    ))
  }

  /** Mermaid has no inheritance arrow; the convention is one dashed
   * one-to-one line per subtype, labeled with the specialization's
   * name: a subtype instance IS its root instance. */
  private specializationLines(spec: em.ISpecialization): ExprNode<any>[] {
    const root = spec.domain as em.IEntity | undefined
    if (!root) {
      throw new Error(`Specialization '${spec.name}' has no root entity; nest it inside the entity it specializes.`)
    }
    return ((spec.subtypes ?? []) as em.ISubtype[]).map((st) => (
      <P>{`  ${st.name} ||..|| ${root.name} : ${spec.name}`}</P>
    ))
  }

  // Bounds are strings; "m" and "*" mean "M". The pair maps to the
  // four Mermaid cardinalities: (0,1) zero-or-one, (1,1) exactly-one,
  // (0,M) zero-or-more, (1,M) one-or-more.
  private leftGlyph(lower: string, upper: string): string {
    if (this.isMany(upper)) return lower === '0' ? '}o' : '}|'
    return lower === '0' ? '|o' : '||'
  }

  private rightGlyph(lower: string, upper: string): string {
    if (this.isMany(upper)) return lower === '0' ? 'o{' : '|{'
    return lower === '0' ? 'o|' : '||'
  }

  private isMany(bound: string): boolean {
    return bound === 'M' || bound === 'm' || bound === '*'
  }
}
