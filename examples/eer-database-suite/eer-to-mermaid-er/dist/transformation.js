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
import { createExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import { M2T, Doc, P } from '@aelastics/synthesis/m2t';
import * as em from 'eer-metamodel/model';
export class EerToMermaidEr extends abstractM2M {
    constructor(store) {
        super(store);
    }
    main(s) {
        const store = this.context.store;
        const els = (s.elements ?? []);
        // Specialization is a Mapping, not an Entity, so the Entity filter
        // takes exactly the four entity kinds, subtypes included.
        const entities = els.filter((el) => store.isTypeOf(el, em.Entity));
        const relationships = els.filter((el) => store.isTypeOf(el, em.Relationship));
        const weaks = entities.filter((e) => store.isTypeOf(e, em.Weak));
        const aggregations = entities.filter((e) => store.isTypeOf(e, em.Aggregation));
        const specializations = els.filter((el) => store.isTypeOf(el, em.Specialization));
        return (createExprNode(M2T, { name: `${s.name}_mermaid` },
            createExprNode(Doc, { name: `${s.name}.mmd` },
                createExprNode(P, null, 'erDiagram'),
                entities.flatMap((e) => this.entityBlock(e)),
                relationships.map((r) => this.relationshipLine(r)),
                weaks.map((w) => this.weakIdentificationLine(w)),
                aggregations.flatMap((g) => this.aggregationLines(g)),
                specializations.flatMap((spec) => this.specializationLines(spec)))));
    }
    entityBlock(e) {
        return [
            createExprNode(P, null, `  ${e.name} {`),
            ...(e.attributes ?? []).flatMap((a) => this.attributeLines(a)),
            createExprNode(P, null, '  }'),
        ];
    }
    /** A composite parent flattens one level to parent_component lines
     * carrying the component's own facts; a leaf contributes its line. */
    attributeLines(a) {
        const components = (a.components ?? []);
        if (components.length > 0) {
            return components.map((leaf) => (createExprNode(P, null, `    ${this.attributeLine(leaf, `${a.name}_${leaf.name}`)}`)));
        }
        return [createExprNode(P, null, `    ${this.attributeLine(a, String(a.name))}`)];
    }
    /** Type word, attribute name, PK on key attributes, an "optional"
     * comment on optional ones. The type is the domain's NAME: the
     * diagram keeps the model vocabulary (Money), not storage types. */
    attributeLine(a, name) {
        const dom = a.attrDomain;
        if (!dom) {
            throw new Error(`Attribute '${a.name}' has no domain; composite attributes flatten one level only.`);
        }
        const parts = [String(dom.name), name];
        if (a.isKey)
            parts.push('PK');
        if (a.isOptional === true)
            parts.push('"optional"');
        return parts.join(' ');
    }
    /** One non-identifying (dashed) line per relationship; the glyph
     * next to an entity comes from that entity's own role bounds. */
    relationshipLine(r) {
        const roles = (r.roles ?? []);
        if (roles.length !== 2) {
            throw new Error(`Relationship '${r.name}' has ${roles.length} roles; relationships are binary by doctrine.`);
        }
        const [a, b] = roles;
        const left = this.leftGlyph(String(a.lowerBound), String(a.upperBound));
        const right = this.rightGlyph(String(b.lowerBound), String(b.upperBound));
        return (createExprNode(P, null, `  ${a.domain.name} ${left}..${right} ${b.domain.name} : ${r.name}`));
    }
    /** The weak entity hangs off its owner with an identifying (solid)
     * line: the owner-side glyph from the weak mapping's bounds, the
     * weak side zero-or-more. */
    weakIdentificationLine(w) {
        const wm = w.weakMap;
        if (!wm || !wm.domain) {
            throw new Error(`Weak entity '${w.name}' has no weak mapping naming its owner.`);
        }
        const owner = wm.domain;
        const ownerGlyph = this.leftGlyph(String(wm.lowerBound), String(wm.upperBound));
        return createExprNode(P, null, `  ${owner.name} ${ownerGlyph}--o{ ${w.name} : ${wm.name}`);
    }
    /** One identifying (solid) line per participant: an aggregation
     * instance relates exactly one instance of each participant, hence
     * exactly-one on the participant side; the aggregation-side glyph
     * comes from the mapping's bounds. */
    aggregationLines(g) {
        return (g.agrMapp ?? []).map((m) => (createExprNode(P, null, `  ${m.domain.name} ||--${this.rightGlyph(String(m.lowerBound), String(m.upperBound))} ${g.name} : ${m.name}`)));
    }
    /** Mermaid has no inheritance arrow; the convention is one dashed
     * one-to-one line per subtype, labeled with the specialization's
     * name: a subtype instance IS its root instance. */
    specializationLines(spec) {
        const root = spec.domain;
        if (!root) {
            throw new Error(`Specialization '${spec.name}' has no root entity; nest it inside the entity it specializes.`);
        }
        return (spec.subtypes ?? []).map((st) => (createExprNode(P, null, `  ${st.name} ||..|| ${root.name} : ${spec.name}`)));
    }
    // Bounds are strings; "m" and "*" mean "M". The pair maps to the
    // four Mermaid cardinalities: (0,1) zero-or-one, (1,1) exactly-one,
    // (0,M) zero-or-more, (1,M) one-or-more.
    leftGlyph(lower, upper) {
        if (this.isMany(upper))
            return lower === '0' ? '}o' : '}|';
        return lower === '0' ? '|o' : '||';
    }
    rightGlyph(lower, upper) {
        if (this.isMany(upper))
            return lower === '0' ? 'o{' : '|{';
        return lower === '0' ? 'o|' : '||';
    }
    isMany(bound) {
        return bound === 'M' || bound === 'm' || bound === '*';
    }
}
//# sourceMappingURL=transformation.js.map