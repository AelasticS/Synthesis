/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { M2T_Model } from '@aelastics/synthesis/m2t';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as rmT from 'relational-metamodel/model';
export declare class RelToMermaid extends abstractM2M<rmT.IRelSchema, M2T_Model> {
    constructor(store: ModelStore);
    template(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, M2T_Model>;
    /** One attribute line per column; key-ness IS membership in the
     * PrimaryKey element and foreign-key-ness IS appearing as an
     * fkColumn pair, read from those elements, never stored twice. */
    private tableBlock;
    /** Mermaid's type-first order: type word, column name, key marks, a
     * "nullable" comment on nullable columns and nothing otherwise. */
    private columnLine;
    /** A Mermaid attribute type allows no spaces and no commas: the SQL
     * type keeps its parentheses (VARCHAR(255) is valid as is) but drops
     * spaces, and a comma inside parentheses becomes an underscore, so
     * DECIMAL(10,2) renders as DECIMAL(10_2). */
    private mermaidType;
    /** The referenced side is exactly-one; the owner side is zero-or-more,
     * or zero-or-one when the key is unique. The line is identifying
     * (solid) exactly when every fk column is a member of the owner's
     * primary key: the dependent's identity derives from the reference,
     * the weak-entity and joined-subtype shapes. */
    private foreignKeyLine;
    /** The historyOf link is deliberately not a foreign key (history
     * outlives the deletion of the base row), so it renders as a dashed
     * one-to-one line, never as a reference. */
    private historyLine;
}
