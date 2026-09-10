/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import type { ModelStore } from '@aelastics/synthesis/store';
import { DecisionAwareM2M } from '@aelastics/synthesis/variability';
import * as cm from '@aelastics/synthesis/metamodels/configuration/model';
import * as em from 'eer-tutorial-metamodel/advanced/model';
import * as rmT from 'rel-tutorial-metamodel/model';
export declare class EER2RelConfigurableTransformation extends DecisionAwareM2M<em.IEERSchema, rmT.IRelSchema, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, {}: {}, configModel?: cm.IConfigurationModel);
    topRule(s: em.IEERSchema): ExprNode<em.IEERSchema, rmT.IRelSchema>;
    entityToTable(e: em.IEntity): ExprNode<rmT.ITable>;
    kernelToTable(k: em.IKernel): ExprNode<rmT.ITable>;
    weakToTable(w: em.IWeak): ExprNode<rmT.ITable>;
    attributeToColumn(a: em.IAttribute): ExprNode<rmT.IColumn>;
    relationshipToStructure(rel: em.IRelationship): ExprNode<rmT.ITable>;
    oneToManyMapping(rel: em.IRelationship): ExprNode<rmT.ITable>;
    oneToManyAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable>;
    oneToManyAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable>;
    relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable>;
    private columnType;
    private keyAttributeOf;
}
