/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as em from 'eer-tutorial-metamodel/basic/model';
import * as rmT from 'rel-tutorial-metamodel/model';
export declare class EER2RelBasicTransformation extends abstractM2M<em.IEERSchema, rmT.IRelSchema> {
    constructor(store: ModelStore);
    template(s: em.IEERSchema): ExprNode<em.IEERSchema, rmT.IRelSchema>;
    entityToTable(e: em.IEntity): ExprNode<rmT.ITable>;
    attributeToColumn(a: em.IAttribute): ExprNode<rmT.IColumn>;
    relationshipToStructure(rel: em.IRelationship): ExprNode<rmT.ITable>;
    relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable>;
    relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable>;
    private columnType;
    private keyAttributeOf;
}
