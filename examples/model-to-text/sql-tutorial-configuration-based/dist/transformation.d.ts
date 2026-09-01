/** @jsx createExprNode */
import type { ExprNode } from '@synthesis/jsx-runtime';
import type { ModelStore } from '@synthesis/engine';
import * as m2tmm from '@synthesis/engine';
import { DecisionAwareM2M } from '@synthesis/decision-framework';
import * as cm from '@synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model';
import * as rmT from '@synthesis/standard-metamodels/rel-tutorial/model';
/** One foreign key: the column that points, and the column it points at. */
type ForeignKey = {
    table: rmT.ITable;
    column: rmT.IColumn;
    targetTable: rmT.ITable;
    targetColumn: rmT.IColumn;
};
export declare class RelToSqlConfigurableTransformation extends DecisionAwareM2M<rmT.IRelSchema, m2tmm.M2T_Model, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, extra?: {}, configModel?: cm.IConfigurationModel);
    template(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, m2tmm.M2T_Model>;
    documentLayout(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, m2tmm.M2T_Model>;
    singleFileLayout(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, m2tmm.M2T_Model>;
    tablesAndConstraintsLayout(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, m2tmm.M2T_Model>;
    filePerTableLayout(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, m2tmm.M2T_Model>;
    headerSection(name: string, comment: string): ExprNode<m2tmm.ISection>;
    tableToCreate(s: rmT.IRelSchema, tab: rmT.ITable, inlineReferences: boolean): ExprNode<m2tmm.ISection>;
    constraintsDocument(s: rmT.IRelSchema): ExprNode<m2tmm.IDocument>;
    foreignKeyToAlter(fk: ForeignKey): ExprNode<m2tmm.ISection>;
    private columnLine;
    quoteIdentifier(name: string): string;
    unquotedIdentifier(name: string): string;
    doubleQuotedIdentifier(name: string): string;
    private tablesOf;
    private foreignKeysOf;
    private tableOwning;
}
export {};
