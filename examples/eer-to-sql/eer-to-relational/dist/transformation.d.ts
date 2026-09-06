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
    /** A user-defined EER domain becomes a relational domain: the base
     * type resolved through the one primitive mapping, check and default
     * carried over. Primitive domains stay what they always were: names
     * the mapping resolves inline. */
    domainToDomain(d: em.IDomain): ExprNode<rmT.IDomain>;
    entityToTable(e: em.IEntity): ExprNode<rmT.ITable> | undefined;
    kernelToTable(e: em.IKernel): ExprNode<rmT.ITable>;
    /**
     * The aggregation rule. Participants attach through their mappings;
     * the KEY rule (user 2026-09-06): a participant involved at most
     * once functionally determines the aggregation, so its copied key IS
     * the primary key and every other participant becomes a plain
     * foreign key (UNIQUE when that participant is also at-most-once,
     * preserving the surplus candidate keys); with no such participant
     * the key is the composite of all participants' copied keys, each
     * slice doubling as that participant's foreign key.
     */
    aggregationToTable(g: em.IAggregation): ExprNode<rmT.ITable>;
    /** The participants of an aggregation, arity-checked, with the
     * keying participant (first declared at-most-once one) if any. */
    private aggregationParts;
    weakToTable(w: em.IWeak): ExprNode<rmT.ITable>;
    /**
     * The RowHistory issue decides per entity whether its table is
     * emitted alone or wrapped by withHistoryTable (history.tsx), the
     * table-set step that derives <table>_history from the base table's
     * own node. The HistoryDiscriminator sub-issue is consulted only on
     * the HistoryTable path: the composite option's conditionality
     * polices itself at run time (an unconsulted sub-issue needs no
     * choice, a consulted one without a choice falls back to its
     * default).
     */
    entityToTables(e: em.IEntity): ExprNode<rmT.ITable>[];
    currentRowsOnly(e: em.IEntity): ExprNode<rmT.ITable>[];
    withRowHistory(e: em.IEntity): ExprNode<rmT.ITable>[];
    /** What distinguishes row versions in this entity's history table. */
    historyDiscriminator(e: em.IEntity): ExprNode<rmT.IColumn>;
    validFromDiscriminator(e: em.IEntity): ExprNode<rmT.IColumn>;
    versionCounterDiscriminator(e: em.IEntity): ExprNode<rmT.IColumn>;
    keepsHistory(e: em.IEntity): boolean;
    keepsNoHistory(e: em.IEntity): boolean;
    keepsRowHistory(e: em.IEntity): boolean;
    /**
     * The graft mirror: relationship foreign keys and single-table
     * hierarchy columns land in already-emitted tables AFTER the
     * entities pass, and a versioned row's relationship columns are part
     * of its state. When the grafted-into table keeps history, the same
     * columns (and nothing else: no foreign keys, no indexes, no key
     * change) are copied into its history table. The mirror introspects
     * the just-built graft node, so no rule runs twice.
     */
    private mirrorGraftIntoHistory;
    /** The entity whose OWN table holds this entity's rows: a subtype
     * under SingleTable defers to its hierarchy's root. */
    private tableOwnerEntity;
    /**
     * The audited or plain columns of an entity's table: a rule pair
     * selected by the TableAuditing issue, the higher-order
     * withAuditColumns applied inside the audited option (the confirmed
     * simplified zero-argument composition, no table qualifier under
     * table scopes).
     */
    tableColumns(e: em.IEntity): ExprNode<rmT.IColumn>[];
    auditedColumns(e: em.IEntity): ExprNode<rmT.IColumn>[];
    plainColumns(e: em.IEntity): ExprNode<rmT.IColumn>[];
    /** One attribute's columns in the entity's own table: a composite
     * parent contributes one column per leaf (attribute_component), a
     * leaf contributes its column. */
    private attributeColumns;
    attributeToColumn(a: em.IAttribute): ExprNode<rmT.IColumn>;
    hierarchyToTables(spec: em.ISpecialization): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[];
    joinedHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable>[];
    /**
     * The single-table emission follows the specialization's own
     * bounds. Disjoint (upperBound 1) gets the `type` discriminator,
     * NOT NULL exactly when the specialization is total (lowerBound 1);
     * overlapping gets NO discriminator, membership being carried by
     * the subtype columns themselves. Those grafted columns are always
     * nullable: rows of other subtypes (and, under a partial
     * specialization, of no subtype) have no value for them.
     */
    singleTableHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[];
    /** One subtype attribute's columns in the shared single table: a
     * composite parent contributes one nullable column per leaf. */
    private singleTableColumns;
    /** A subtype attribute's column in the shared single table: like
     * attributeToColumn, but always nullable and never autoincrement. */
    singleTableColumn(a: em.IAttribute): ExprNode<rmT.IColumn>;
    tablePerClassHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable>[];
    joinedSubtypeTable(st: em.ISubtype): ExprNode<rmT.ITable>;
    tablePerClassSubtypeTable(st: em.ISubtype): ExprNode<rmT.ITable>;
    /** The copies of one root attribute in a TablePerClass subtype
     * table: a composite parent contributes one copy per leaf
     * (attribute_component), a leaf its plain copy. */
    private copiedColumns;
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
    relationshipToStructure(r: em.IRelationship): ExprNode<any> | ExprNode<any>[];
    relationshipMapping(rel: em.IRelationship): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[];
    relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[];
    relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable>;
    manyToManyJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable>;
    oneToOneForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[];
    private buildJoinTable;
    indexesForForeignKeys(): ExprNode<rmT.ITable>[];
    indexAllForeignKeys(): ExprNode<rmT.ITable>[];
    noForeignKeyIndexes(): ExprNode<rmT.ITable>[];
    /** R, C, N, D as the dialect-neutral vocabulary. */
    private actionOf;
    /**
     * The integrity pair of the mapping guarding the REFERENCED end,
     * translated to foreign key facts: the disconnect rule (a referenced
     * row deleted or its key changed) becomes onDelete and onUpdate; the
     * connect rule becomes onConnect (declaratively inexpressible, the
     * DDL layer emits triggers for it). Restrict is the SQL default and
     * is omitted, keeping models and DDL free of noise.
     */
    private fkActions;
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
    /** The table's PrimaryKey element over its key plan, in plan order:
     * key-ness is membership here, stated once. */
    private primaryKeyFor;
    /** A leaf attribute's domain; composite parents have components
     * instead and are mapped by their components (v2 stage 3). */
    private domainOf;
    private keyAttrsOf;
    private ownerOf;
    private rootOf;
    /** The hierarchies an entity is the root of: a specialization is a
     * mapping, so it sits in the entity's mappings. Several are several
     * independent categories of subtyping. */
    private hierarchiesOfRoot;
    /** An abstract root gets no table of its own exactly when every
     * hierarchy it roots is TablePerClass (any other strategy needs the
     * root's table). */
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
    /** The one primitive-name-to-SQL-type mapping. */
    private typeOfName;
}
