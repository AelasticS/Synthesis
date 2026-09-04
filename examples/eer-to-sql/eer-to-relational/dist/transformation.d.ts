/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { DecisionAwareM2M } from "@aelastics/synthesis/variability";
import { ModelStore } from "@aelastics/synthesis/store";
import * as cm from "@aelastics/synthesis/metamodels/configuration/model";
import * as em from "eer-metamodel/model";
import * as rmT from "relational-metamodel/model";
export declare class EerToRelational extends DecisionAwareM2M<em.IEERSchema, rmT.IRelSchema, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, {}: {}, configModel?: cm.IConfigurationModel);
    private emittedFks;
    private keyPlans;
    template(s: em.IEERSchema): any;
    entityToTable(e: em.IEntity): ExprNode<rmT.ITable> | undefined;
    kernelToTable(e: em.IKernel): ExprNode<rmT.ITable>;
    weakToTable(w: em.IWeak): ExprNode<rmT.ITable>;
    /**
     * The audited or plain columns of an entity's table: a rule pair
     * selected by the TableAuditing issue, the higher-order
     * withAuditColumns applied inside the audited option (the confirmed
     * zero-argument composition).
     */
    tableColumns(e: em.IEntity): ExprNode<rmT.IColumn>[];
    auditedColumns(e: em.IEntity): ExprNode<rmT.IColumn>[];
    plainColumns(e: em.IEntity): ExprNode<rmT.IColumn>[];
    attributeToColumn(a: em.IAttribute): ExprNode<rmT.IColumn>;
    hierarchyToTables(spec: em.ISpecialization): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[];
    joinedHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable>[];
    singleTableHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable>;
    tablePerClassHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable>[];
    joinedSubtypeTable(st: em.ISubtype): ExprNode<rmT.ITable>;
    tablePerClassSubtypeTable(st: em.ISubtype): ExprNode<rmT.ITable>;
    /** A copy of a root attribute's column in a TablePerClass subtype
     * table: a new element with the same name (the table scope keeps it
     * unambiguous) and no autoincrement. */
    copiedColumn(a: em.IAttribute): ExprNode<rmT.IColumn>;
    strategyOf(spec: em.ISpecialization): "joined" | "single" | "tpc";
    strategyJoined(spec: em.ISpecialization): "joined";
    strategySingle(spec: em.ISpecialization): "single";
    strategyTpc(spec: em.ISpecialization): "tpc";
    /** Plain dispatcher: the shape of the relationship decides the rule;
     * only the genuinely open 1:N case is a configuration issue. */
    relationshipToStructure(r: em.IRelationship): ExprNode<any>;
    relationshipMapping(rel: em.IRelationship): ExprNode<rmT.ITable>;
    relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable>;
    relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable>;
    manyToManyJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable>;
    oneToOneForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable>;
    private buildJoinTable;
    indexesForForeignKeys(): ExprNode<rmT.ITable>[];
    indexAllForeignKeys(): ExprNode<rmT.ITable>[];
    noForeignKeyIndexes(): ExprNode<rmT.ITable>[];
    /**
     * Plan and emit one foreign key held by `table` toward `refEntity`'s
     * table: the qualified fk columns (types mirroring the referenced key
     * plan) and the ForeignKey element whose ForeignKeyColumn pairs name
     * the fk column (resolved in the holding table's scope) and the
     * referenced column (as <refTable>/<column>).
     */
    private plannedForeignKey;
    /** The ForeignKey element for already-planned fk columns. */
    private foreignKeyElement;
    /** The weak entity's and joined subtype's inline foreign key over the
     * copied key columns (already present in the table). */
    private foreignKeyTo;
    /**
     * The name of a foreign key or copied key column, per the
     * ForeignKeyColumnNaming issue. ShortNames keeps a name that already
     * carries meaning (it contains an underscore from a prior hop) and
     * prefixes the referenced table's name otherwise; TablePrefixed
     * prefixes on every hop. Collisions get numbered suffixes via
     * uniqueName.
     */
    fkColumnName(refTable: string, colName: string): string;
    shortFkColumnName(refTable: string, colName: string): string;
    prefixedFkColumnName(refTable: string, colName: string): string;
    private uniqueName;
    /** Where an entity's rows live: its own table for kernels and weak
     * entities; for a subtype, whatever its hierarchy's strategy says. */
    private tableFor;
    /** The key columns of the table holding this entity's rows: names as
     * emitted, types mirrored. One source of truth for emission and
     * referencing. */
    private keyColumnsPlan;
    private keyAttrsOf;
    private ownerOf;
    private rootOf;
    /** The hierarchy an entity is the root of, if any. */
    private hierarchyOfRoot;
    /** An abstract root under TablePerClass gets no table of its own. */
    private skipsOwnTable;
    private tableNameOf;
    /** Kahn's sort over the table-producing units: a weak entity depends
     * on the unit holding its owner's table, a hierarchy on its root's
     * unit. Ties keep source order; a cycle is a clear error. */
    private sortUnits;
    primaryKeyStrategy(a: em.IAttribute): boolean;
    useAutoIncrement(a: em.IAttribute): boolean;
    useManualIncrement(a: em.IAttribute): boolean;
    applyNaming(name: string): string;
    applyCamelCaseNaming(name: string): string;
    applySnakeCaseNaming(name: string): string;
    private getColumnType;
}
