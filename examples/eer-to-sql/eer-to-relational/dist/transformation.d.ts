/** @jsx createExprNode */
import { DecisionAwareM2M } from "@aelastics/synthesis/variability";
import { IEntity, IEERSchema, IAttribute, IRelationship } from "eer-metamodel/model";
import * as rmT from "relational-metamodel/model";
import { ExprNode } from "@aelastics/synthesis/jsx";
import { ModelStore } from "@aelastics/synthesis/store";
import * as cm from "@aelastics/synthesis/metamodels/configuration/model";
export declare class EER2RelDomainWithDecisionTransformation extends DecisionAwareM2M<IEERSchema, rmT.IRelSchema, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, {}: {}, configModel?: cm.IConfigurationModel);
    template(s: IEERSchema): any;
    Entity2Table(e: IEntity): ExprNode<rmT.ITable>;
    Attribute2Column(a: IAttribute): ExprNode<rmT.IColumn>;
    RelationshipMapping(rel: IRelationship): ExprNode<rmT.IColumn> | ExprNode<rmT.ITable>;
    relationshipAsForeignKey(rel: IRelationship): ExprNode<rmT.IColumn>;
    relationshipAsJoinTable(rel: IRelationship): ExprNode<rmT.ITable>;
    primaryKeyStrategy(a: IAttribute): boolean;
    useAutoIncrement(a: IAttribute): boolean;
    useManualIncrement(a: IAttribute): boolean;
    applyNaming(name: string): string;
    applyCamelCaseNaming(name: string): string;
    applySnakeCaseNaming(name: string): string;
    private getFKSide;
    private getPKSide;
    private keyColumnType;
    private getColumnType;
}
