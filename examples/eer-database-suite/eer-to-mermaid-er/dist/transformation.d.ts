/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { M2T_Model } from '@aelastics/synthesis/m2t';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as em from 'eer-metamodel/model';
export declare class EerToMermaidEr extends abstractM2M<em.IEERSchema, M2T_Model> {
    constructor(store: ModelStore);
    main(s: em.IEERSchema): ExprNode<em.IEERSchema, M2T_Model>;
    private entityBlock;
    /** A composite parent flattens one level to parent_component lines
     * carrying the component's own facts; a leaf contributes its line. */
    private attributeLines;
    /** Type word, attribute name, PK on key attributes, an "optional"
     * comment on optional ones. The type is the domain's NAME: the
     * diagram keeps the model vocabulary (Money), not storage types. */
    private attributeLine;
    /** One non-identifying (dashed) line per relationship; the glyph
     * next to an entity comes from that entity's own role bounds. */
    private relationshipLine;
    /** The weak entity hangs off its owner with an identifying (solid)
     * line: the owner-side glyph from the weak mapping's bounds, the
     * weak side zero-or-more. */
    private weakIdentificationLine;
    /** One identifying (solid) line per participant: an aggregation
     * instance relates exactly one instance of each participant, hence
     * exactly-one on the participant side; the aggregation-side glyph
     * comes from the mapping's bounds. */
    private aggregationLines;
    /** Mermaid has no inheritance arrow; the convention is one dashed
     * one-to-one line per subtype, labeled with the specialization's
     * name: a subtype instance IS its root instance. */
    private specializationLines;
    private leftGlyph;
    private rightGlyph;
    private isMany;
}
