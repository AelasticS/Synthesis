/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { DecisionAwareM2M } from "@aelastics/synthesis/variability";
import { ModelStore } from "@aelastics/synthesis/store";
import * as cm from "@aelastics/synthesis/metamodels/configuration/model";
import { IEntity, IEERSchema, IAttribute, IRelationship } from "simple-eer-metamodel/model";
import * as rmT from "simple-relational-metamodel/model";
export declare class SimpleEerToRelational extends DecisionAwareM2M<IEERSchema, rmT.IRelSchema, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, {}: {}, configModel?: cm.IConfigurationModel);
    main(s: IEERSchema): any;
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
    private getColumnType;
}
