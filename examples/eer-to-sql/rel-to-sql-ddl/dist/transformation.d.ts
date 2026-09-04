/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { ModelStore } from "@aelastics/synthesis/store";
import * as m2tmm from "@aelastics/synthesis/m2t";
import * as rmT from "relational-metamodel/model";
import { DecisionAwareM2M } from "@aelastics/synthesis/variability";
import * as cm from "@aelastics/synthesis/metamodels/configuration/model";
/**
 * Model-to-text transformation that turns a rich relational schema into
 * SQL DDL: CREATE TABLE statements with composite-aware PRIMARY KEY
 * clauses, named foreign key constraints as ALTER TABLE statements in a
 * separate section (foreign keys can be circular, so no creation order
 * can satisfy them inline), and CREATE INDEX statements.
 *
 * The schema's identifiers are already named per the naming convention
 * chosen upstream; this template emits them verbatim, subject to the
 * IdentifierQuoting issue (verbatim or double-quoted).
 */
export declare class Rel2DdlTransformation extends DecisionAwareM2M<rmT.IRelSchema, m2tmm.M2T_Model, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, extra?: {}, configModel?: cm.IConfigurationModel);
    template(s: rmT.IRelSchema): any;
    tableToCreate(tab: rmT.ITable): ExprNode<m2tmm.ISection>;
    foreignKeyToAlter(fk: rmT.IForeignKey): ExprNode<m2tmm.ISection>;
    indexToCreate(ix: rmT.IIndex): ExprNode<m2tmm.ISection>;
    private columnLine;
    quoteIdentifier(name: string): string;
    unquotedIdentifier(name: string): string;
    doubleQuotedIdentifier(name: string): string;
}
