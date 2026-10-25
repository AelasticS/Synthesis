/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { abstractM2M } from "@aelastics/synthesis/m2m";
import { ModelStore } from "@aelastics/synthesis/store";
import { IEntity, IEERSchema, IAttribute, IRelationship } from "simple-eer-metamodel/model";
import * as rmT from "simple-relational-metamodel/model";
export declare class SimpleEerToRelational extends abstractM2M<IEERSchema, rmT.IRelSchema> {
    constructor(store: ModelStore);
    main(s: IEERSchema): any;
    Entity2Table(e: IEntity): ExprNode<rmT.ITable>;
    Attribute2Column(a: IAttribute): ExprNode<rmT.IColumn>;
    RelationshipMapping(rel: IRelationship): ExprNode<rmT.ITable>;
    private applyNaming;
    private getFKSide;
    private getPKSide;
    private getColumnType;
}
