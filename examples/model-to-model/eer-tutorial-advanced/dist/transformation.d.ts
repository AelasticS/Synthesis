/** @jsx createExprNode */
import type { ExprNode } from '@synthesis/jsx-runtime';
import { abstractM2M } from '@synthesis/engine';
import type { ModelStore } from '@synthesis/engine';
import * as em from '@synthesis/standard-metamodels/eer-tutorial/advanced/model';
import * as rmT from '@synthesis/standard-metamodels/rel-tutorial/model';
export declare class EER2RelAdvancedTransformation extends abstractM2M<em.IEERSchema, rmT.IRelSchema> {
    constructor(store: ModelStore);
    template(s: em.IEERSchema): ExprNode<em.IEERSchema, rmT.IRelSchema>;
    entityToTable(e: em.IEntity): ExprNode<rmT.ITable>;
    kernelToTable(k: em.IKernel): ExprNode<rmT.ITable>;
    weakToTable(w: em.IWeak): ExprNode<rmT.ITable>;
    attributeToColumn(a: em.IAttribute): ExprNode<rmT.IColumn>;
    relationshipToStructure(rel: em.IRelationship): ExprNode<rmT.ITable>;
    relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable>;
    relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable>;
    private columnType;
    private keyAttributeOf;
}
