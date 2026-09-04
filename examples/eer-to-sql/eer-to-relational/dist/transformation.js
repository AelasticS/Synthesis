/** @jsx createExprNode */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * The flagship configuration-based EER to relational transformation.
 * Seven design issues are left open and closed per run by a
 * configuration model (see decision-model.tsx); the target is the rich
 * relational metamodel (real foreign keys, composite capable, and
 * indexes; Table is a name scope). Every template kind appears: plain
 * @E2E rules, @SpecPoint specialization over the entity kinds,
 * @VarPoint configuration dispatch, and the higher-order
 * withAuditColumns template (audit.tsx) selected by the TableAuditing
 * issue.
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
import { RelSchema, Table, Column, ForeignKey, ForeignKeyColumn, Index } from "relational-metamodel";
import { withAuditColumns } from "./audit.js";
let EerToRelational = class EerToRelational extends DecisionAwareM2M {
    constructor(store, {}, configModel) {
        super(store, {}, configModel);
    }
    // Foreign keys emitted so far, for the index pass.
    emittedFks = [];
    // Key column plans, memoized per entity (single source of truth for
    // emission and referencing).
    keyPlans = new Map();
    template(s) {
        const store = this.context.store;
        const els = (s.elements ?? []);
        if (els.some((el) => store.isTypeOf(el, em.Aggregation))) {
            throw new Error("eer-to-relational v1 does not map Aggregation (a stated limitation); remove the aggregation or wait for v2.");
        }
        const hierarchies = els.filter((el) => store.isTypeOf(el, em.Specialization));
        const relationships = els.filter((el) => store.isTypeOf(el, em.Relationship));
        // The partition: every source element belongs to exactly one pass.
        // Subtypes are claimed by their hierarchy; an abstract root whose
        // hierarchy is TablePerClass gets no table of its own.
        const entities = els.filter((el) => store.isTypeOf(el, em.Entity) && !store.isTypeOf(el, em.Subtype)).filter((e) => !this.skipsOwnTable(e));
        const units = this.sortUnits(entities, hierarchies);
        return (createExprNode(RelSchema, { name: this.applyNaming(`${s.name}_rel`), store: this.context.store },
            units.map((u) => u.kind === "entity"
                ? this.entityToTable(u.element)
                : this.hierarchyToTables(u.element)),
            relationships.map((r) => this.relationshipToStructure(r)),
            this.indexesForForeignKeys()));
    }
    // ── the entities pass ────────────────────────────────────────────────
    entityToTable(e) {
        return undefined; // pure dispatch: Kernel and Weak options below
    }
    kernelToTable(e) {
        return createExprNode(Table, { name: this.tableNameOf(e) }, this.tableColumns(e));
    }
    weakToTable(w) {
        const owner = this.ownerOf(w);
        const table = this.tableNameOf(w);
        const copies = this.keyColumnsPlan(w).slice(0, this.keyColumnsPlan(this.ownerOf(w)).length);
        return (createExprNode(Table, { name: table },
            copies.map((c) => (createExprNode(Column, { name: c.name, type: c.type, isKey: true, isNullable: false, isAutoincrement: false }))),
            this.tableColumns(w),
            this.foreignKeyTo(table, `fk_${table}_${this.tableFor(owner)}`, copies.map((c) => c.name), owner, false)));
    }
    /**
     * The audited or plain columns of an entity's table: a rule pair
     * selected by the TableAuditing issue, the higher-order
     * withAuditColumns applied inside the audited option (the confirmed
     * zero-argument composition).
     */
    tableColumns(e) {
        throw new Error("Not implemented VarOptions for VarPoint TableAuditing");
    }
    auditedColumns(e) {
        const base = () => e.attributes.map((a) => this.attributeToColumn(a));
        return withAuditColumns(this.tableNameOf(e))(base)();
    }
    plainColumns(e) {
        return e.attributes.map((a) => this.attributeToColumn(a));
    }
    attributeToColumn(a) {
        const composite = this.keyAttrsOf(a.attrEntity).length > 1;
        return (createExprNode(Column, { name: this.applyNaming(a.name), type: this.getColumnType(a.attrDomain), isKey: a.isKey, isNullable: !a.isKey, isAutoincrement: a.isKey && !composite && this.primaryKeyStrategy(a) && this.getColumnType(a.attrDomain) === "INTEGER" }));
    }
    // ── the hierarchies pass ─────────────────────────────────────────────
    hierarchyToTables(spec) {
        throw new Error("Not implemented VarOptions for VarPoint InheritanceStrategy");
    }
    joinedHierarchy(spec) {
        return spec.subtypes.map((st) => this.joinedSubtypeTable(st));
    }
    singleTableHierarchy(spec) {
        const root = this.rootOf(spec);
        const rootTable = this.tableNameOf(root);
        return (createExprNode(Table, { "$refByName": rootTable },
            createExprNode(Column, { name: `${rootTable}_type`, type: "VARCHAR(255)", isKey: false, isNullable: false, isAutoincrement: false }),
            spec.subtypes.flatMap((st) => st.attributes.map((a) => this.attributeToColumn(a)))));
    }
    tablePerClassHierarchy(spec) {
        return spec.subtypes.map((st) => this.tablePerClassSubtypeTable(st));
    }
    joinedSubtypeTable(st) {
        const root = this.rootOf(st.supertype);
        const table = this.tableNameOf(st);
        const copies = this.keyColumnsPlan(st);
        return (createExprNode(Table, { name: table },
            copies.map((c) => (createExprNode(Column, { name: c.name, type: c.type, isKey: true, isNullable: false, isAutoincrement: false }))),
            this.tableColumns(st),
            this.foreignKeyTo(table, `fk_${table}_${this.tableFor(root)}`, copies.map((c) => c.name), root, true)));
    }
    tablePerClassSubtypeTable(st) {
        const root = this.rootOf(st.supertype);
        const table = this.tableNameOf(st);
        return (createExprNode(Table, { name: table },
            root.attributes.map((a) => this.copiedColumn(a)),
            this.tableColumns(st)));
    }
    /** A copy of a root attribute's column in a TablePerClass subtype
     * table: a new element with the same name (the table scope keeps it
     * unambiguous) and no autoincrement. */
    copiedColumn(a) {
        return (createExprNode(Column, { name: this.applyNaming(a.name), type: this.getColumnType(a.attrDomain), isKey: a.isKey, isNullable: !a.isKey, isAutoincrement: false }));
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
            throw new Error(`eer-to-relational v1 maps binary relationships only; '${r.name}' has ${roles.length} roles.`);
        }
        const [a, b] = roles;
        const oneToN = (a.ub === "1" && b.ub === "M") || (a.ub === "M" && b.ub === "1");
        if (oneToN)
            return this.relationshipMapping(r);
        if (a.ub === "1" && b.ub === "1")
            return this.oneToOneForeignKey(r);
        return this.manyToManyJoinTable(r);
    }
    relationshipMapping(rel) {
        throw new Error("Not implemented VarOptions for VarPoint OneToManyStrategy");
    }
    relationshipAsForeignKey(rel) {
        const roles = rel.roles;
        const oneSide = roles.find((m) => m.ub === "1");
        const manySide = roles.find((m) => m.ub !== "1");
        const table = this.tableFor(manySide.domain);
        const nullable = oneSide.lb === "0";
        const { cols, pairs } = this.plannedForeignKey(table, rel.name, oneSide.domain, nullable);
        return (createExprNode(Table, { "$refByName": table },
            cols,
            pairs));
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
        const holder = roles.find((m) => m.lb === "0") ?? roles[0];
        const other = roles.find((m) => m !== holder);
        const table = this.tableFor(holder.domain);
        const { cols, pairs } = this.plannedForeignKey(table, rel.name, other.domain, holder.lb === "0", true);
        return (createExprNode(Table, { "$refByName": table },
            cols,
            pairs));
    }
    buildJoinTable(rel) {
        const table = this.applyNaming(rel.name);
        const roles = rel.roles;
        const parts = roles.map((role) => this.plannedForeignKey(table, `${rel.name}_${role.name}`, role.domain, false));
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
    /**
     * Plan and emit one foreign key held by `table` toward `refEntity`'s
     * table: the qualified fk columns (types mirroring the referenced key
     * plan) and the ForeignKey element whose ForeignKeyColumn pairs name
     * the fk column (resolved in the holding table's scope) and the
     * referenced column (as <refTable>/<column>).
     */
    plannedForeignKey(table, qualifier, refEntity, nullable, unique = false) {
        const refTable = this.tableFor(refEntity);
        const refPlan = this.keyColumnsPlan(refEntity);
        const taken = new Set();
        const fkCols = refPlan.map((c) => ({
            name: this.uniqueName(this.fkColumnName(refTable, c.name), taken),
            type: c.type,
            ref: c.name,
        }));
        const fkName = this.applyNaming(`fk_${table}_${qualifier}`);
        const cols = fkCols.map((c) => (createExprNode(Column, { name: c.name, type: c.type, isKey: false, isNullable: nullable, isAutoincrement: false })));
        const pairs = [this.foreignKeyElement(fkName, refTable, fkCols, unique)];
        this.emittedFks.push({ table, fkName, cols: fkCols.map((c) => c.name) });
        return { cols, pairs, fkName };
    }
    /** The ForeignKey element for already-planned fk columns. */
    foreignKeyElement(fkName, refTable, fkCols, unique) {
        return (createExprNode(ForeignKey, { name: fkName, isUnique: unique, referencedTable: createExprNode(Table, { "$refByName": refTable }) }, fkCols.map((c, i) => (createExprNode(ForeignKeyColumn, { name: `${fkName}_p${i + 1}` },
            createExprNode(Column, { "$refByName": c.name }),
            createExprNode(Column, { "$refByName": `${refTable}/${c.ref}` }))))));
    }
    /** The weak entity's and joined subtype's inline foreign key over the
     * copied key columns (already present in the table). */
    foreignKeyTo(table, fkName, colNames, refEntity, _joined) {
        const refTable = this.tableFor(refEntity);
        const refPlan = this.keyColumnsPlan(refEntity);
        const named = this.applyNaming(fkName);
        this.emittedFks.push({ table, fkName: named, cols: colNames });
        return this.foreignKeyElement(named, refTable, colNames.map((n, i) => ({ name: n, ref: refPlan[i].name })), false);
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
                ...this.keyAttrsOf(e).map((a) => ({ name: this.applyNaming(a.name), type: this.getColumnType(a.attrDomain) })),
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
        else {
            plan = this.keyAttrsOf(e).map((a) => ({ name: this.applyNaming(a.name), type: this.getColumnType(a.attrDomain) }));
        }
        this.keyPlans.set(e, plan);
        return plan;
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
        const mapping = spec.mapping;
        const root = mapping?.domain;
        if (!root) {
            throw new Error(`Specialization '${spec.name}' has no mapping naming its root entity.`);
        }
        if (this.context.store.isTypeOf(root, em.Subtype)) {
            throw new Error(`eer-to-relational v1 maps one-level hierarchies only; '${spec.name}' is rooted in subtype '${root.name}'.`);
        }
        return root;
    }
    /** The hierarchy an entity is the root of, if any. */
    hierarchyOfRoot(e) {
        const store = this.context.store;
        const sm = (e.mappings ?? []).find((m) => store.isTypeOf(m, em.SpecializationMapping));
        return sm?.specialization;
    }
    /** An abstract root under TablePerClass gets no table of its own. */
    skipsOwnTable(e) {
        if (!e.isAbstract)
            return false;
        const spec = this.hierarchyOfRoot(e);
        return spec !== undefined && this.strategyOf(spec) === "tpc";
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
        const domainName = domain.name.toLowerCase();
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
    E2E(),
    SpecPoint()
], EerToRelational.prototype, "entityToTable", null);
__decorate([
    SpecOption("entityToTable", em.Kernel)
], EerToRelational.prototype, "kernelToTable", null);
__decorate([
    SpecOption("entityToTable", em.Weak)
], EerToRelational.prototype, "weakToTable", null);
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