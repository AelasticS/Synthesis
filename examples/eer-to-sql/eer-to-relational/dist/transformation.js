/** @jsx createExprNode */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * The full-featured configuration-based EER to relational
 * transformation.
 * Nine design issues are left open and closed per run by a
 * configuration model (see decision-model.tsx); the target is the rich
 * relational metamodel (real foreign keys, composite capable, and
 * indexes; Table is a name scope). Every template kind appears: plain
 * @E2E rules, @SpecPoint specialization over the entity kinds,
 * @VarPoint configuration dispatch, and the higher-order templates
 * withAuditColumns (audit.tsx, a columns step selected by the
 * TableAuditing issue) and withHistoryTable (history.tsx, a table-set
 * step selected by the RowHistory issue, whose HistoryTable option
 * opens the HistoryDiscriminator sub-issue).
 *
 * Authority over source elements is partitioned at the composition
 * site: the entities pass takes kernels and weak entities (hierarchy
 * roots included), every Subtype belongs exclusively to its
 * hierarchy's rule, relationships and indexes run last. Emission order
 * is a topological sort over the table-producing units (a weak entity
 * depends on its owner, a hierarchy on its root), so references always
 * find their targets; a cycle is a clear error.
 */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { VarPoint, VarOption, Default, Option, DecisionAwareM2M } from "@aelastics/synthesis/variability";
import { E2E, M2M, SpecPoint, SpecOption } from "@aelastics/synthesis/m2m";
import * as em from "eer-metamodel/model";
import { RelSchema, Table, Column, Domain as RelDomain, ForeignKey, ForeignKeyColumn, Index, PrimaryKey } from "relational-metamodel";
import { withAuditColumns } from "./audit.js";
import { columnNodesOf, copiedHistoryColumn, withHistoryTable } from "./history.js";
let EerToRelational = class EerToRelational extends DecisionAwareM2M {
    constructor(store, {}, configModel) {
        super(store, {}, configModel);
    }
    // Foreign keys emitted so far, for the index pass.
    emittedFks = [];
    // Key column plans, memoized per entity (single source of truth for
    // emission and referencing).
    keyPlans = new Map();
    main(s) {
        const store = this.context.store;
        const els = (s.elements ?? []);
        const hierarchies = els.filter((el) => store.isTypeOf(el, em.Specialization));
        const relationships = els.filter((el) => store.isTypeOf(el, em.Relationship));
        // The partition: every source element belongs to exactly one pass.
        // Subtypes are claimed by their hierarchy; an abstract root whose
        // hierarchy is TablePerClass gets no table of its own.
        const entities = els.filter((el) => store.isTypeOf(el, em.Entity) && !store.isTypeOf(el, em.Subtype)).filter((e) => !this.skipsOwnTable(e));
        const units = this.sortUnits(entities, hierarchies);
        const userDomains = els.filter((el) => store.isTypeOf(el, em.Domain))
            .filter((d) => d.baseType !== undefined && d.baseType !== null);
        return (createExprNode(RelSchema, { name: this.applyNaming(`${s.name}_rel`), store: this.context.store },
            userDomains.map((d) => this.domainToDomain(d)),
            units.map((u) => u.kind === "entity"
                ? this.entityToTables(u.element)
                : this.hierarchyToTables(u.element)),
            relationships.map((r) => this.relationshipToStructure(r)),
            this.indexesForForeignKeys()));
    }
    /** A user-defined EER domain becomes a relational domain: the base
     * type resolved through the one primitive mapping, check and default
     * carried over. Primitive domains stay what they always were: names
     * the mapping resolves inline. */
    domainToDomain(d) {
        return (createExprNode(RelDomain, { name: this.applyNaming(String(d.name)), type: this.typeOfName(String(d.baseType)), check: d.check, defaultValue: d.defaultValue }));
    }
    // ── the entities pass ────────────────────────────────────────────────
    entityToTable(e) {
        return undefined; // pure dispatch: Kernel and Weak options below
    }
    kernelToTable(e) {
        return (createExprNode(Table, { name: this.tableNameOf(e) },
            this.tableColumns(e),
            this.primaryKeyFor(e)));
    }
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
    aggregationToTable(g) {
        const table = this.tableNameOf(g);
        const { keyed, mappings } = this.aggregationParts(g);
        const plan = this.keyColumnsPlan(g);
        const taken = new Set([
            ...((g.attributes ?? []).map((a) => this.applyNaming(a.name))),
            ...plan.map((c) => c.name),
        ]);
        const others = mappings.filter((m) => m !== keyed);
        const otherParts = others.map((m) => this.plannedForeignKey(table, String(m.name), m.domain, m.lowerBound === "0", keyed !== undefined && m.upperBound === "1", this.fkActions(m.cnAggrOwner, m.dcnAggrOwner), taken));
        let keyFks;
        if (keyed !== undefined) {
            keyFks = [
                this.foreignKeyTo(table, `fk_${table}_${this.applyNaming(keyed.name)}`, plan.map((c) => c.name), keyed.domain, this.fkActions(keyed.cnAggrOwner, keyed.dcnAggrOwner)),
            ];
        }
        else {
            let offset = 0;
            keyFks = mappings.map((m) => {
                const participant = m.domain;
                const len = this.keyColumnsPlan(participant).length;
                const cols = plan.slice(offset, offset + len).map((c) => c.name);
                offset += len;
                return this.foreignKeyTo(table, `fk_${table}_${this.applyNaming(m.name)}`, cols, participant, this.fkActions(m.cnAggrOwner, m.dcnAggrOwner));
            });
        }
        return (createExprNode(Table, { name: table },
            plan.map((c) => (createExprNode(Column, { name: c.name, type: c.type, isNullable: false, isAutoincrement: false }))),
            this.tableColumns(g),
            otherParts.flatMap((p) => p.cols),
            this.primaryKeyFor(g),
            keyFks,
            otherParts.flatMap((p) => p.pairs)));
    }
    /** The participants of an aggregation, arity-checked, with the
     * keying participant (first declared at-most-once one) if any. */
    aggregationParts(g) {
        const mappings = (g.agrMapp ?? []);
        if (mappings.length < 2) {
            throw new Error(`Aggregation '${g.name}' relates ${mappings.length} participant(s); an aggregation relates at least two.`);
        }
        const keyed = mappings.find((m) => m.upperBound === "1");
        return { keyed, mappings };
    }
    weakToTable(w) {
        const owner = this.ownerOf(w);
        const table = this.tableNameOf(w);
        const copies = this.keyColumnsPlan(w).slice(0, this.keyColumnsPlan(this.ownerOf(w)).length);
        return (createExprNode(Table, { name: table },
            copies.map((c) => (createExprNode(Column, { name: c.name, type: c.type, isNullable: false, isAutoincrement: false }))),
            this.tableColumns(w),
            this.primaryKeyFor(w),
            this.foreignKeyTo(table, `fk_${table}_${this.tableFor(owner)}`, copies.map((c) => c.name), owner, this.fkActions(w.weakMap.cnWeakOwner, w.weakMap.dcnWeakOwner))));
    }
    // ── the row-history dispatch, one granularity above entityToTable ────
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
    entityToTables(e) {
        throw new Error("Not implemented VarOptions for VarPoint RowHistory");
    }
    currentRowsOnly(e) {
        // the SpecPoint dispatch is total: the undefined in its declared
        // return never materializes
        return [this.entityToTable(e)];
    }
    withRowHistory(e) {
        return withHistoryTable(() => this.historyDiscriminator(e))(() => this.entityToTable(e))();
    }
    /** What distinguishes row versions in this entity's history table. */
    historyDiscriminator(e) {
        throw new Error("Not implemented VarOptions for VarPoint HistoryDiscriminator");
    }
    validFromDiscriminator(e) {
        return createExprNode(Column, { name: "valid_from", type: "TIMESTAMP", isNullable: false, isAutoincrement: false });
    }
    versionCounterDiscriminator(e) {
        return createExprNode(Column, { name: "version", type: "INTEGER", isNullable: false, isAutoincrement: false });
    }
    // A second point on the same issue, answering with the VALUE for the
    // graft sites that must know whether a table keeps history without
    // building anything (the strategyOf precedent).
    keepsHistory(e) {
        throw new Error("Not implemented VarOptions for VarPoint RowHistory");
    }
    keepsNoHistory(e) { return false; }
    keepsRowHistory(e) { return true; }
    /**
     * The graft mirror: relationship foreign keys and single-table
     * hierarchy columns land in already-emitted tables AFTER the
     * entities pass, and a versioned row's relationship columns are part
     * of its state. When the grafted-into table keeps history, the same
     * columns (and nothing else: no foreign keys, no indexes, no key
     * change) are copied into its history table. The mirror introspects
     * the just-built graft node, so no rule runs twice.
     */
    mirrorGraftIntoHistory(e, graft) {
        const owner = this.tableOwnerEntity(e);
        if (!this.keepsHistory(owner))
            return graft;
        return [
            graft,
            createExprNode(Table, { "$refByName": `${this.tableFor(owner)}_history` }, columnNodesOf(graft).map((c) => copiedHistoryColumn(c))),
        ];
    }
    /** The entity whose OWN table holds this entity's rows: a subtype
     * under SingleTable defers to its hierarchy's root. */
    tableOwnerEntity(e) {
        const store = this.context.store;
        if (store.isTypeOf(e, em.Subtype)) {
            const spec = e.supertype;
            if (this.strategyOf(spec) === "single")
                return this.rootOf(spec);
        }
        return e;
    }
    /**
     * The audited or plain columns of an entity's table: a rule pair
     * selected by the TableAuditing issue, the higher-order
     * withAuditColumns applied inside the audited option (the confirmed
     * simplified zero-argument composition, no table qualifier under
     * table scopes).
     */
    tableColumns(e) {
        throw new Error("Not implemented VarOptions for VarPoint TableAuditing");
    }
    auditedColumns(e) {
        const base = () => e.attributes.flatMap((a) => this.attributeColumns(a));
        return withAuditColumns(base)();
    }
    plainColumns(e) {
        return e.attributes.flatMap((a) => this.attributeColumns(a));
    }
    /** One attribute's columns in the entity's own table: a composite
     * parent contributes one column per leaf (attribute_component), a
     * leaf contributes its column. */
    attributeColumns(a) {
        const components = (a.components ?? []);
        if (components.length > 0) {
            const parentOptional = a.isOptional === true;
            return components.map((leaf) => (createExprNode(Column, { name: this.applyNaming(`${a.name}_${leaf.name}`), type: this.getColumnType(this.domainOf(leaf)), isNullable: parentOptional || leaf.isOptional === true, isAutoincrement: false })));
        }
        return [this.attributeToColumn(a)];
    }
    attributeToColumn(a) {
        // compositeness is a property of the TABLE key (the plan), not of
        // the entity's own attributes: a weak entity with one key attribute
        // still has a composite key through its owner
        const composite = this.keyColumnsPlan(a.attrEntity).length > 1;
        const dom = this.domainOf(a);
        const userDefined = dom.baseType !== undefined && dom.baseType !== null;
        return (createExprNode(Column, { name: this.applyNaming(a.name), type: this.getColumnType(dom), isNullable: a.isOptional === true, isAutoincrement: a.isKey && !composite && this.primaryKeyStrategy(a) && this.getColumnType(dom) === "INTEGER", ...(userDefined ? { domain: createExprNode(RelDomain, { "$refByName": this.applyNaming(String(dom.name)) }) } : {}) }));
    }
    // ── the hierarchies pass ─────────────────────────────────────────────
    hierarchyToTables(spec) {
        throw new Error("Not implemented VarOptions for VarPoint InheritanceStrategy");
    }
    joinedHierarchy(spec) {
        return spec.subtypes.map((st) => this.joinedSubtypeTable(st));
    }
    /**
     * The single-table emission follows the specialization's own
     * bounds. Disjoint (upperBound 1) gets the `type` discriminator,
     * NOT NULL exactly when the specialization is total (lowerBound 1);
     * overlapping gets NO discriminator, membership being carried by
     * the subtype columns themselves. Those grafted columns are always
     * nullable: rows of other subtypes (and, under a partial
     * specialization, of no subtype) have no value for them.
     */
    singleTableHierarchy(spec) {
        const root = this.rootOf(spec);
        const rootTable = this.tableNameOf(root);
        const disjoint = spec.upperBound === "1";
        const graft = (createExprNode(Table, { "$refByName": rootTable },
            disjoint
                ? [createExprNode(Column, { name: "type", type: "VARCHAR(255)", isNullable: spec.lowerBound === "0", isAutoincrement: false })]
                : [],
            spec.subtypes.flatMap((st) => st.attributes.flatMap((a) => this.singleTableColumns(a)))));
        return this.mirrorGraftIntoHistory(root, graft);
    }
    /** One subtype attribute's columns in the shared single table: a
     * composite parent contributes one nullable column per leaf. */
    singleTableColumns(a) {
        const components = (a.components ?? []);
        if (components.length > 0) {
            return components.map((leaf) => (createExprNode(Column, { name: this.applyNaming(`${a.name}_${leaf.name}`), type: this.getColumnType(this.domainOf(leaf)), isNullable: true, isAutoincrement: false })));
        }
        return [this.singleTableColumn(a)];
    }
    /** A subtype attribute's column in the shared single table: like
     * attributeToColumn, but always nullable and never autoincrement. */
    singleTableColumn(a) {
        const dom = this.domainOf(a);
        const userDefined = dom.baseType !== undefined && dom.baseType !== null;
        return (createExprNode(Column, { name: this.applyNaming(a.name), type: this.getColumnType(dom), isNullable: true, isAutoincrement: false, ...(userDefined ? { domain: createExprNode(RelDomain, { "$refByName": this.applyNaming(String(dom.name)) }) } : {}) }));
    }
    tablePerClassHierarchy(spec) {
        return spec.subtypes.map((st) => this.tablePerClassSubtypeTable(st));
    }
    joinedSubtypeTable(st) {
        const root = this.rootOf(st.supertype);
        const table = this.tableNameOf(st);
        const copies = this.keyColumnsPlan(st);
        return (createExprNode(Table, { name: table },
            copies.map((c) => (createExprNode(Column, { name: c.name, type: c.type, isNullable: false, isAutoincrement: false }))),
            this.tableColumns(st),
            this.primaryKeyFor(st),
            this.foreignKeyTo(table, `fk_${table}_${this.tableFor(root)}`, copies.map((c) => c.name), root, this.fkActions(st.cnSupertype, st.dcnSupertype))));
    }
    tablePerClassSubtypeTable(st) {
        const root = this.rootOf(st.supertype);
        const table = this.tableNameOf(st);
        return (createExprNode(Table, { name: table },
            root.attributes.flatMap((a) => this.copiedColumns(a)),
            this.tableColumns(st),
            this.primaryKeyFor(st)));
    }
    /** The copies of one root attribute in a TablePerClass subtype
     * table: a composite parent contributes one copy per leaf
     * (attribute_component), a leaf its plain copy. */
    copiedColumns(a) {
        const components = (a.components ?? []);
        if (components.length > 0) {
            const parentOptional = a.isOptional === true;
            return components.map((leaf) => (createExprNode(Column, { name: this.applyNaming(`${a.name}_${leaf.name}`), type: this.getColumnType(this.domainOf(leaf)), isNullable: parentOptional || leaf.isOptional === true, isAutoincrement: false })));
        }
        return [this.copiedColumn(a)];
    }
    /** A copy of a root attribute's column in a TablePerClass subtype
     * table: a new element with the same name (the table scope keeps it
     * unambiguous) and no autoincrement. */
    copiedColumn(a) {
        return (createExprNode(Column, { name: this.applyNaming(a.name), type: this.getColumnType(this.domainOf(a)), isNullable: a.isOptional === true, isAutoincrement: false }));
    }
    // A second point on the same issue, answering with the strategy VALUE
    // for the places that must know where an entity's rows live (tableFor,
    // key plans) without building anything.
    strategyOf(spec) {
        throw new Error("Not implemented VarOptions for VarPoint InheritanceStrategy");
    }
    strategyJoined(spec) { return "joined"; }
    strategySingle(spec) { return "single"; }
    strategyTpc(spec) { return "tpc"; }
    // ── the relationships pass ───────────────────────────────────────────
    /** Plain dispatcher: the shape of the relationship decides the rule;
     * only the genuinely open 1:N case is a configuration issue. */
    relationshipToStructure(r) {
        const roles = r.roles;
        if (roles.length !== 2) {
            throw new Error(`Relationship '${r.name}' has ${roles.length} roles; relationships are binary by doctrine. Relate more than two entities with an Aggregation.`);
        }
        const [a, b] = roles;
        const oneToN = (a.upperBound === "1" && b.upperBound === "M") || (a.upperBound === "M" && b.upperBound === "1");
        if (oneToN)
            return this.relationshipMapping(r);
        if (a.upperBound === "1" && b.upperBound === "1")
            return this.oneToOneForeignKey(r);
        return this.manyToManyJoinTable(r);
    }
    relationshipMapping(rel) {
        throw new Error("Not implemented VarOptions for VarPoint OneToManyStrategy");
    }
    relationshipAsForeignKey(rel) {
        const roles = rel.roles;
        const oneSide = roles.find((m) => m.upperBound === "1");
        const manySide = roles.find((m) => m.upperBound !== "1");
        const table = this.tableFor(manySide.domain);
        const nullable = oneSide.lowerBound === "0";
        const { cols, pairs } = this.plannedForeignKey(table, rel.name, oneSide.domain, nullable, false, this.fkActions(oneSide.cnMapp, oneSide.dcnMapp));
        const graft = (createExprNode(Table, { "$refByName": table },
            cols,
            pairs));
        return this.mirrorGraftIntoHistory(manySide.domain, graft);
    }
    relationshipAsJoinTable(rel) {
        return this.buildJoinTable(rel);
    }
    manyToManyJoinTable(rel) {
        return this.buildJoinTable(rel);
    }
    oneToOneForeignKey(rel) {
        const roles = rel.roles;
        // the optional side carries the (unique) foreign key
        const holder = roles.find((m) => m.lowerBound === "0") ?? roles[0];
        const other = roles.find((m) => m !== holder);
        const table = this.tableFor(holder.domain);
        const { cols, pairs } = this.plannedForeignKey(table, rel.name, other.domain, holder.lowerBound === "0", true, this.fkActions(other.cnMapp, other.dcnMapp));
        const graft = (createExprNode(Table, { "$refByName": table },
            cols,
            pairs));
        return this.mirrorGraftIntoHistory(holder.domain, graft);
    }
    buildJoinTable(rel) {
        const table = this.applyNaming(rel.name);
        const roles = rel.roles;
        const parts = roles.map((role) => this.plannedForeignKey(table, String(role.name), role.domain, false, false, this.fkActions(role.cnMapp, role.dcnMapp)));
        return (createExprNode(Table, { name: table },
            parts.flatMap((p) => p.cols),
            parts.flatMap((p) => p.pairs)));
    }
    // ── the index pass ───────────────────────────────────────────────────
    indexesForForeignKeys() {
        throw new Error("Not implemented VarOptions for VarPoint IndexOnForeignKey");
    }
    indexAllForeignKeys() {
        return this.emittedFks.map(({ table, fkName, cols }) => (createExprNode(Table, { "$refByName": table },
            createExprNode(Index, { name: `ix_${fkName}`, isUnique: false }, cols.map((c) => (createExprNode(Column, { "$refByName": c })))))));
    }
    noForeignKeyIndexes() {
        return [];
    }
    // ── foreign key machinery ────────────────────────────────────────────
    /** R, C, N, D as the dialect-neutral vocabulary. */
    actionOf(letter) {
        switch (letter) {
            case "R": return "Restrict";
            case "C": return "Cascade";
            case "N": return "SetNull";
            case "D": return "SetDefault";
            default: return undefined;
        }
    }
    /**
     * The integrity pair of the mapping guarding the REFERENCED end,
     * translated to foreign key facts: the disconnect rule (a referenced
     * row deleted or its key changed) becomes onDelete and onUpdate; the
     * connect rule becomes onConnect (declaratively inexpressible, the
     * DDL layer emits triggers for it). Restrict is the SQL default and
     * is omitted, keeping models and DDL free of noise.
     */
    fkActions(cn, dcn) {
        const connect = this.actionOf(cn);
        const disconnect = this.actionOf(dcn);
        return {
            ...(connect !== undefined && connect !== "Restrict" ? { onConnect: connect } : {}),
            ...(disconnect !== undefined && disconnect !== "Restrict" ? { onDelete: disconnect, onUpdate: disconnect } : {}),
        };
    }
    /**
     * Plan and emit one foreign key held by `table` toward `refEntity`'s
     * table: the qualified fk columns (types mirroring the referenced key
     * plan) and the ForeignKey element whose ForeignKeyColumn pairs name
     * the fk column (resolved in the holding table's scope) and the
     * referenced column (as <refTable>/<column>).
     */
    plannedForeignKey(table, qualifier, refEntity, nullable, unique = false, actions = {}, reserved) {
        const refTable = this.tableFor(refEntity);
        const refPlan = this.keyColumnsPlan(refEntity);
        const taken = reserved ?? new Set();
        const fkCols = refPlan.map((c) => ({
            name: this.uniqueName(this.fkColumnName(refTable, c.name), taken),
            type: c.type,
            ref: c.name,
        }));
        const fkName = this.applyNaming(`fk_${table}_${qualifier}`);
        const cols = fkCols.map((c) => (createExprNode(Column, { name: c.name, type: c.type, isNullable: nullable, isAutoincrement: false })));
        const pairs = [this.foreignKeyElement(fkName, refTable, fkCols, unique, actions)];
        this.emittedFks.push({ table, fkName, cols: fkCols.map((c) => c.name) });
        return { cols, pairs, fkName };
    }
    /** The ForeignKey element for already-planned fk columns. */
    foreignKeyElement(fkName, refTable, fkCols, unique, actions = {}) {
        return (createExprNode(ForeignKey, { name: fkName, isUnique: unique, ...actions, referencedTable: createExprNode(Table, { "$refByName": refTable }) }, fkCols.map((c, i) => (createExprNode(ForeignKeyColumn, { name: `${fkName}_p${i + 1}` },
            createExprNode(Column, { "$refByName": c.name }),
            createExprNode(Column, { "$refByName": `${refTable}/${c.ref}` }))))));
    }
    /** The weak entity's and joined subtype's inline foreign key over the
     * copied key columns (already present in the table). */
    foreignKeyTo(table, fkName, colNames, refEntity, actions = {}) {
        const refTable = this.tableFor(refEntity);
        const refPlan = this.keyColumnsPlan(refEntity);
        const named = this.applyNaming(fkName);
        this.emittedFks.push({ table, fkName: named, cols: colNames });
        return this.foreignKeyElement(named, refTable, colNames.map((n, i) => ({ name: n, ref: refPlan[i].name })), false, actions);
    }
    /**
     * The name of a foreign key or copied key column, per the
     * ForeignKeyColumnNaming issue. ShortNames keeps a name that already
     * carries meaning (it contains an underscore from a prior hop) and
     * prefixes the referenced table's name otherwise; TablePrefixed
     * prefixes on every hop. Collisions get numbered suffixes via
     * uniqueName.
     */
    fkColumnName(refTable, colName) {
        throw new Error("Not implemented VarOptions for VarPoint ForeignKeyColumnNaming");
    }
    shortFkColumnName(refTable, colName) {
        return colName.includes("_") ? colName : `${refTable}_${colName}`;
    }
    prefixedFkColumnName(refTable, colName) {
        return `${refTable}_${colName}`;
    }
    uniqueName(base, taken) {
        let name = base;
        let n = 1;
        while (taken.has(name)) {
            n += 1;
            name = `${base}_${n}`;
        }
        taken.add(name);
        return name;
    }
    // ── key plans and table resolution ───────────────────────────────────
    /** Where an entity's rows live: its own table for kernels and weak
     * entities; for a subtype, whatever its hierarchy's strategy says. */
    tableFor(e) {
        const store = this.context.store;
        if (store.isTypeOf(e, em.Subtype)) {
            const spec = e.supertype;
            if (this.strategyOf(spec) === "single") {
                return this.tableFor(this.rootOf(spec));
            }
        }
        return this.tableNameOf(e);
    }
    /** The key columns of the table holding this entity's rows: names as
     * emitted, types mirrored. One source of truth for emission and
     * referencing. */
    keyColumnsPlan(e) {
        const cached = this.keyPlans.get(e);
        if (cached)
            return cached;
        const store = this.context.store;
        let plan;
        if (store.isTypeOf(e, em.Weak)) {
            const owner = this.ownerOf(e);
            const ownerPlan = this.keyColumnsPlan(owner);
            const ownerTable = this.tableFor(owner);
            const taken = new Set(e.attributes.map((a) => this.applyNaming(a.name)));
            plan = [
                ...ownerPlan.map((c) => ({ name: this.uniqueName(this.fkColumnName(ownerTable, c.name), taken), type: c.type })),
                ...this.keyAttrsOf(e).map((a) => ({ name: this.applyNaming(a.name), type: this.getColumnType(this.domainOf(a)) })),
            ];
        }
        else if (store.isTypeOf(e, em.Subtype)) {
            const spec = e.supertype;
            const root = this.rootOf(spec);
            const rootPlan = this.keyColumnsPlan(root);
            const strategy = this.strategyOf(spec);
            if (strategy === "single") {
                plan = rootPlan;
            }
            else if (strategy === "tpc") {
                plan = rootPlan.map((c) => ({ ...c }));
            }
            else {
                const rootTable = this.tableFor(root);
                const taken = new Set(e.attributes.map((a) => this.applyNaming(a.name)));
                plan = rootPlan.map((c) => ({ name: this.uniqueName(this.fkColumnName(rootTable, c.name), taken), type: c.type }));
            }
        }
        else if (store.isTypeOf(e, em.Aggregation)) {
            const { keyed, mappings } = this.aggregationParts(e);
            const taken = new Set(e.attributes.map((a) => this.applyNaming(a.name)));
            const copiesOf = (m) => {
                const participant = m.domain;
                const pTable = this.tableFor(participant);
                return this.keyColumnsPlan(participant).map((c) => ({
                    name: this.uniqueName(this.fkColumnName(pTable, c.name), taken),
                    type: c.type,
                }));
            };
            plan = keyed !== undefined ? copiesOf(keyed) : mappings.flatMap((m) => copiesOf(m));
        }
        else {
            plan = this.keyAttrsOf(e).map((a) => ({ name: this.applyNaming(a.name), type: this.getColumnType(this.domainOf(a)) }));
        }
        this.keyPlans.set(e, plan);
        return plan;
    }
    /** The table's PrimaryKey element over its key plan, in plan order:
     * key-ness is membership here, stated once. */
    primaryKeyFor(e) {
        return (createExprNode(PrimaryKey, { name: this.applyNaming(`pk_${this.tableFor(e)}`) }, this.keyColumnsPlan(e).map((c) => (createExprNode(Column, { "$refByName": c.name })))));
    }
    /** A leaf attribute's domain; composite parents have components
     * instead and are mapped by their components (v2 stage 3). */
    domainOf(a) {
        const d = a.attrDomain;
        if (!d) {
            throw new Error(`Attribute '${a.name}' has no domain; composite attributes are mapped from their components.`);
        }
        return d;
    }
    keyAttrsOf(e) {
        return (e.attributes ?? []).filter((a) => a.isKey);
    }
    ownerOf(w) {
        const wm = w.weakMap;
        if (!wm || !wm.domain) {
            throw new Error(`Weak entity '${w.name}' has no weak mapping naming its owner.`);
        }
        return wm.domain;
    }
    rootOf(spec) {
        const root = spec.domain;
        if (!root) {
            throw new Error(`Specialization '${spec.name}' has no root entity; nest it inside the entity it specializes.`);
        }
        if (this.context.store.isTypeOf(root, em.Subtype)) {
            throw new Error(`eer-to-relational v1 maps one-level hierarchies only; '${spec.name}' is rooted in subtype '${root.name}'.`);
        }
        return root;
    }
    /** The hierarchies an entity is the root of: a specialization is a
     * mapping, so it sits in the entity's mappings. Several are several
     * independent categories of subtyping. */
    hierarchiesOfRoot(e) {
        const store = this.context.store;
        return (e.mappings ?? []).filter((m) => store.isTypeOf(m, em.Specialization));
    }
    /** An abstract root gets no table of its own exactly when every
     * hierarchy it roots is TablePerClass (any other strategy needs the
     * root's table). */
    skipsOwnTable(e) {
        if (!e.isAbstract)
            return false;
        const specs = this.hierarchiesOfRoot(e);
        return specs.length > 0 && specs.every((spec) => this.strategyOf(spec) === "tpc");
    }
    tableNameOf(e) {
        return this.applyNaming(e.name);
    }
    // ── topological emission order ───────────────────────────────────────
    /** Kahn's sort over the table-producing units: a weak entity depends
     * on the unit holding its owner's table, a hierarchy on its root's
     * unit. Ties keep source order; a cycle is a clear error. */
    sortUnits(entities, hierarchies) {
        const store = this.context.store;
        const units = [];
        const byKey = new Map();
        const unitKeyOfEntity = (e) => {
            if (store.isTypeOf(e, em.Subtype)) {
                return `h:${e.supertype.name}`;
            }
            return `e:${e.name}`;
        };
        for (const e of entities) {
            const u = { key: `e:${e.name}`, kind: "entity", element: e, deps: [] };
            if (store.isTypeOf(e, em.Weak)) {
                u.deps.push(unitKeyOfEntity(this.ownerOf(e)));
            }
            if (store.isTypeOf(e, em.Aggregation)) {
                for (const m of (e.agrMapp ?? [])) {
                    u.deps.push(unitKeyOfEntity(m.domain));
                }
            }
            units.push(u);
            byKey.set(u.key, u);
        }
        for (const h of hierarchies) {
            const root = this.rootOf(h);
            const u = { key: `h:${h.name}`, kind: "hierarchy", element: h, deps: [`e:${root.name}`] };
            units.push(u);
            byKey.set(u.key, u);
        }
        const externalDeps = (u) => u.deps.filter((d) => byKey.has(d));
        const emitted = [];
        const done = new Set();
        let remaining = units.slice();
        while (remaining.length > 0) {
            const ready = remaining.filter((u) => externalDeps(u).every((d) => done.has(d)));
            if (ready.length === 0) {
                throw new Error(`Cyclic ownership among: ${remaining.map((u) => u.key).join(", ")}; a weak entity chain must be acyclic.`);
            }
            for (const u of ready) {
                emitted.push(u);
                done.add(u.key);
            }
            remaining = remaining.filter((u) => !done.has(u.key));
        }
        return emitted;
    }
    // ── retained fixed logic and naming ──────────────────────────────────
    primaryKeyStrategy(a) {
        throw new Error("Not implemented VarOptions for VarPoint PrimaryKeyStrategy");
    }
    useAutoIncrement(a) {
        return a.isKey ? true : false;
    }
    useManualIncrement(a) {
        return false;
    }
    applyNaming(name) {
        throw new Error("Not implemented VarOptions for VarPoint NamingConvention");
    }
    applyCamelCaseNaming(name) {
        return name.replace(/_/g, "");
    }
    applySnakeCaseNaming(name) {
        return name
            .replace(/([a-z])([A-Z])/g, "$1_$2")
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
            .toLowerCase();
    }
    getColumnType(domain) {
        const base = domain.baseType;
        return this.typeOfName(base ?? String(domain.name));
    }
    /** The one primitive-name-to-SQL-type mapping. */
    typeOfName(name) {
        const domainName = name.toLowerCase();
        switch (domainName) {
            case "string":
                return "VARCHAR(255)";
            case "number":
            case "integer":
            case "int":
                return "INTEGER";
            case "float":
            case "double":
                return "DOUBLE";
            case "boolean":
            case "bool":
                return "BOOLEAN";
            case "date":
                return "DATE";
            case "datetime":
            case "timestamp":
                return "TIMESTAMP";
            case "text":
                return "TEXT";
            case "bigint":
                return "BIGINT";
            default:
                return "VARCHAR(255)";
        }
    }
};
__decorate([
    E2E()
], EerToRelational.prototype, "domainToDomain", null);
__decorate([
    E2E(),
    SpecPoint()
], EerToRelational.prototype, "entityToTable", null);
__decorate([
    SpecOption("entityToTable", em.Kernel)
], EerToRelational.prototype, "kernelToTable", null);
__decorate([
    SpecOption("entityToTable", em.Aggregation)
], EerToRelational.prototype, "aggregationToTable", null);
__decorate([
    SpecOption("entityToTable", em.Weak)
], EerToRelational.prototype, "weakToTable", null);
__decorate([
    E2E(),
    VarPoint("RowHistory")
], EerToRelational.prototype, "entityToTables", null);
__decorate([
    Default(),
    VarOption("entityToTables", Option("NoHistory"))
], EerToRelational.prototype, "currentRowsOnly", null);
__decorate([
    VarOption("entityToTables", Option("HistoryTable"))
], EerToRelational.prototype, "withRowHistory", null);
__decorate([
    VarPoint("HistoryDiscriminator")
], EerToRelational.prototype, "historyDiscriminator", null);
__decorate([
    Default(),
    VarOption("historyDiscriminator", Option("ValidFromTimestamp"))
], EerToRelational.prototype, "validFromDiscriminator", null);
__decorate([
    VarOption("historyDiscriminator", Option("VersionCounter"))
], EerToRelational.prototype, "versionCounterDiscriminator", null);
__decorate([
    VarPoint("RowHistory")
], EerToRelational.prototype, "keepsHistory", null);
__decorate([
    Default(),
    VarOption("keepsHistory", Option("NoHistory"))
], EerToRelational.prototype, "keepsNoHistory", null);
__decorate([
    VarOption("keepsHistory", Option("HistoryTable"))
], EerToRelational.prototype, "keepsRowHistory", null);
__decorate([
    E2E(),
    VarPoint("TableAuditing")
], EerToRelational.prototype, "tableColumns", null);
__decorate([
    Default(),
    VarOption("tableColumns", Option("AuditColumns"))
], EerToRelational.prototype, "auditedColumns", null);
__decorate([
    VarOption("tableColumns", Option("NoAuditColumns"))
], EerToRelational.prototype, "plainColumns", null);
__decorate([
    E2E()
], EerToRelational.prototype, "attributeToColumn", null);
__decorate([
    E2E(),
    VarPoint("InheritanceStrategy")
], EerToRelational.prototype, "hierarchyToTables", null);
__decorate([
    Default(),
    VarOption("hierarchyToTables", Option("JoinedTables"))
], EerToRelational.prototype, "joinedHierarchy", null);
__decorate([
    VarOption("hierarchyToTables", Option("SingleTable"))
], EerToRelational.prototype, "singleTableHierarchy", null);
__decorate([
    E2E()
], EerToRelational.prototype, "singleTableColumn", null);
__decorate([
    VarOption("hierarchyToTables", Option("TablePerClass"))
], EerToRelational.prototype, "tablePerClassHierarchy", null);
__decorate([
    E2E()
], EerToRelational.prototype, "joinedSubtypeTable", null);
__decorate([
    E2E()
], EerToRelational.prototype, "tablePerClassSubtypeTable", null);
__decorate([
    E2E()
], EerToRelational.prototype, "copiedColumn", null);
__decorate([
    VarPoint("InheritanceStrategy")
], EerToRelational.prototype, "strategyOf", null);
__decorate([
    Default(),
    VarOption("strategyOf", Option("JoinedTables"))
], EerToRelational.prototype, "strategyJoined", null);
__decorate([
    VarOption("strategyOf", Option("SingleTable"))
], EerToRelational.prototype, "strategySingle", null);
__decorate([
    VarOption("strategyOf", Option("TablePerClass"))
], EerToRelational.prototype, "strategyTpc", null);
__decorate([
    E2E(),
    VarPoint("OneToManyStrategy")
], EerToRelational.prototype, "relationshipMapping", null);
__decorate([
    VarOption("relationshipMapping", Option("ForeignKey"))
], EerToRelational.prototype, "relationshipAsForeignKey", null);
__decorate([
    Default(),
    VarOption("relationshipMapping", Option("JoinTable"))
], EerToRelational.prototype, "relationshipAsJoinTable", null);
__decorate([
    E2E()
], EerToRelational.prototype, "manyToManyJoinTable", null);
__decorate([
    E2E()
], EerToRelational.prototype, "oneToOneForeignKey", null);
__decorate([
    VarPoint("IndexOnForeignKey")
], EerToRelational.prototype, "indexesForForeignKeys", null);
__decorate([
    Default(),
    VarOption("indexesForForeignKeys", Option("IndexAllForeignKeys"))
], EerToRelational.prototype, "indexAllForeignKeys", null);
__decorate([
    VarOption("indexesForForeignKeys", Option("NoForeignKeyIndexes"))
], EerToRelational.prototype, "noForeignKeyIndexes", null);
__decorate([
    VarPoint("ForeignKeyColumnNaming")
], EerToRelational.prototype, "fkColumnName", null);
__decorate([
    Default(),
    VarOption("fkColumnName", Option("ShortNames"))
], EerToRelational.prototype, "shortFkColumnName", null);
__decorate([
    VarOption("fkColumnName", Option("TablePrefixed"))
], EerToRelational.prototype, "prefixedFkColumnName", null);
__decorate([
    VarPoint("PrimaryKeyStrategy")
], EerToRelational.prototype, "primaryKeyStrategy", null);
__decorate([
    Default(),
    VarOption("primaryKeyStrategy", Option("UseAutoIncrement"))
], EerToRelational.prototype, "useAutoIncrement", null);
__decorate([
    VarOption("primaryKeyStrategy", Option("UseManualIncrement"))
], EerToRelational.prototype, "useManualIncrement", null);
__decorate([
    VarPoint("NamingConvention")
], EerToRelational.prototype, "applyNaming", null);
__decorate([
    VarOption("applyNaming", Option("CamelCase"))
], EerToRelational.prototype, "applyCamelCaseNaming", null);
__decorate([
    Default(),
    VarOption("applyNaming", Option("SnakeCase"))
], EerToRelational.prototype, "applySnakeCaseNaming", null);
EerToRelational = __decorate([
    M2M()
], EerToRelational);
export { EerToRelational };
//# sourceMappingURL=transformation.js.map