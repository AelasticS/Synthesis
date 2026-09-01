/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx-runtime';
import type { ModelStore } from '@aelastics/synthesis/engine';
import { DecisionAwareM2M } from '@aelastics/synthesis/decision-framework';
import * as cm from '@aelastics/synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model';
import * as em from '@synthesis/standard-metamodels/eer-tutorial/advanced/model';
import * as rmT from '@synthesis/standard-metamodels/rel-tutorial/model';
export declare class EER2RelConfigurableTransformation extends DecisionAwareM2M<em.IEERSchema, rmT.IRelSchema, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, {}: {}, configModel?: cm.IConfigurationModel);
    template(s: em.IEERSchema): ExprNode<em.IEERSchema, rmT.IRelSchema>;
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
