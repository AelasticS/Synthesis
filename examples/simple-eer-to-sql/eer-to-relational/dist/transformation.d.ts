/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { DecisionAwareM2M } from "@aelastics/synthesis/variability";
import { ModelStore } from "@aelastics/synthesis/store";
import * as cmT from "@aelastics/synthesis/metamodels/configuration/model";
import * as et from "simple-eer-metamodel/model";
import * as rt from "simple-relational-metamodel/model";
export declare class EerToRelational extends DecisionAwareM2M<et.IEERSchema, rt.IRelSchema, {}, cmT.IConfigurationModel> {
    constructor(store: ModelStore, {}: {}, decisionModel?: cmT.IConfigurationModel);
    main(s: et.IEERSchema): any;
    Entity2Table(e: et.IEntity): ExprNode<rt.ITable>;
    Kernel2Table(k: et.IKernel): ExprNode<rt.ITable>;
    Week2Table(w: et.IWeak): ExprNode<rt.ITable>;
    WeekMappingToFK(wm: et.IWeakMapping): any;
    Attribute2Column(a: et.IAttribute): ExprNode<rt.IColumn>;
    Attribute2PKColumn(a: et.IAttribute, ownerTable: rt.ITable): ExprNode<rt.IColumn>;
    Attribute2FKColumn(a: et.IAttribute): ExprNode<rt.IForeignKeyColumn>;
    RelationshipToElement(rel: et.IRelationship): ExprNode<rt.IForeignKey> | ExprNode<rt.ITable>;
    RelatioshipToFK(rel: et.IRelationship): ExprNode<rt.IForeignKey>;
    RelatioshipToTable(rel: et.IRelationship): ExprNode<rt.ITable>;
}
