/** @jsx createExprNode */

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
import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { VarPoint, VarOption, Default, Option, DecisionAwareM2M } from "@aelastics/synthesis/variability"
import { E2E, M2M, SpecPoint, SpecOption } from "@aelastics/synthesis/m2m"
import { ModelStore } from "@aelastics/synthesis/store"
import * as cm from "@aelastics/synthesis/metamodels/configuration/model"
import * as em from "eer-metamodel/model"
import * as rmT from "relational-metamodel/model"
import { RelSchema, Table, Column, Domain as RelDomain, ForeignKey, ForeignKeyColumn, Index, PrimaryKey } from "relational-metamodel"
import { withAuditColumns } from "./audit.js"
import { columnNodesOf, copiedHistoryColumn, withHistoryTable } from "./history.js"

/** A key column of a table, as planned for emission and referencing. */
interface KeyColumnPlan {
  name: string
  type: string
}

/** A table-producing unit of the topological emission order. */
interface Unit {
  key: string
  kind: "entity" | "hierarchy"
  element: em.IEntity | em.ISpecialization
  deps: string[]
}

@M2M()
export class EerToRelational extends DecisionAwareM2M<
  em.IEERSchema,
  rmT.IRelSchema,
  {},
  cm.IConfigurationModel
> {
  constructor(store: ModelStore, {}, configModel?: cm.IConfigurationModel) {
    super(store, {}, configModel)
  }

  // Foreign keys emitted so far, for the index pass.
  private emittedFks: Array<{ table: string; fkName: string; cols: string[] }> = []
  // Key column plans, memoized per entity (single source of truth for
  // emission and referencing).
  private keyPlans = new Map<em.IEntity, KeyColumnPlan[]>()

  template(s: em.IEERSchema) {
    const store = this.context.store
    const els = ((s.elements ?? []) as em.IERConcept[])

    const hierarchies = els.filter((el) => store.isTypeOf(el, em.Specialization)) as em.ISpecialization[]
    const relationships = els.filter((el) => store.isTypeOf(el, em.Relationship)) as em.IRelationship[]
    // The partition: every source element belongs to exactly one pass.
    // Subtypes are claimed by their hierarchy; an abstract root whose
    // hierarchy is TablePerClass gets no table of its own.
    const entities = (els.filter(
      (el) => store.isTypeOf(el, em.Entity) && !store.isTypeOf(el, em.Subtype),
    ) as em.IEntity[]).filter((e) => !this.skipsOwnTable(e))

    const units = this.sortUnits(entities, hierarchies)

    const userDomains = (els.filter((el) => store.isTypeOf(el, em.Domain)) as em.IDomain[])
      .filter((d) => d.baseType !== undefined && d.baseType !== null)

    return (
      <RelSchema name={this.applyNaming(`${s.name}_rel`)} store={this.context.store}>
        {userDomains.map((d) => this.domainToDomain(d))}
        {units.map((u) =>
          u.kind === "entity"
            ? this.entityToTables(u.element as em.IEntity)
            : this.hierarchyToTables(u.element as em.ISpecialization),
        )}
        {relationships.map((r) => this.relationshipToStructure(r))}
        {this.indexesForForeignKeys()}
      </RelSchema>
    )
  }

  /** A user-defined EER domain becomes a relational domain: the base
   * type resolved through the one primitive mapping, check and default
   * carried over. Primitive domains stay what they always were: names
   * the mapping resolves inline. */
  @E2E()
  domainToDomain(d: em.IDomain): ExprNode<rmT.IDomain> {
    return (
      <RelDomain
        name={this.applyNaming(String(d.name))}
        type={this.typeOfName(String(d.baseType))}
        check={d.check as string | undefined}
        defaultValue={d.defaultValue as string | undefined}
      />
    )
  }

  // ── the entities pass ────────────────────────────────────────────────

  @E2E()
  @SpecPoint()
  entityToTable(e: em.IEntity): ExprNode<rmT.ITable> | undefined {
    return undefined // pure dispatch: Kernel and Weak options below
  }

  @SpecOption("entityToTable", em.Kernel)
  kernelToTable(e: em.IKernel): ExprNode<rmT.ITable> {
    return (
      <Table name={this.tableNameOf(e)}>
        {this.tableColumns(e)}
        {this.primaryKeyFor(e)}
      </Table>
    )
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
  @SpecOption("entityToTable", em.Aggregation)
  aggregationToTable(g: em.IAggregation): ExprNode<rmT.ITable> {
    const table = this.tableNameOf(g)
    const { keyed, mappings } = this.aggregationParts(g)
    const plan = this.keyColumnsPlan(g)
    const taken = new Set<string>([
      ...(((g.attributes ?? []) as em.IAttribute[]).map((a) => this.applyNaming(a.name))),
      ...plan.map((c) => c.name),
    ])
    const others = mappings.filter((m) => m !== keyed)
    const otherParts = others.map((m) =>
      this.plannedForeignKey(
        table,
        String(m.name),
        m.domain as em.IEntity,
        m.lowerBound === "0",
        keyed !== undefined && m.upperBound === "1",
        this.fkActions(m.cnAggrOwner, m.dcnAggrOwner),
        taken,
      ),
    )
    let keyFks: ExprNode<rmT.IForeignKey>[]
    if (keyed !== undefined) {
      keyFks = [
        this.foreignKeyTo(
          table,
          `fk_${table}_${this.applyNaming(keyed.name)}`,
          plan.map((c) => c.name),
          keyed.domain as em.IEntity,
          this.fkActions(keyed.cnAggrOwner, keyed.dcnAggrOwner),
        ),
      ]
    } else {
      let offset = 0
      keyFks = mappings.map((m) => {
        const participant = m.domain as em.IEntity
        const len = this.keyColumnsPlan(participant).length
        const cols = plan.slice(offset, offset + len).map((c) => c.name)
        offset += len
        return this.foreignKeyTo(table, `fk_${table}_${this.applyNaming(m.name)}`, cols, participant, this.fkActions(m.cnAggrOwner, m.dcnAggrOwner))
      })
    }
    return (
      <Table name={table}>
        {plan.map((c) => (
          <Column name={c.name} type={c.type} isNullable={false} isAutoincrement={false} />
        ))}
        {this.tableColumns(g)}
        {otherParts.flatMap((p) => p.cols)}
        {this.primaryKeyFor(g)}
        {keyFks}
        {otherParts.flatMap((p) => p.pairs)}
      </Table>
    )
  }

  /** The participants of an aggregation, arity-checked, with the
   * keying participant (first declared at-most-once one) if any. */
  private aggregationParts(g: em.IAggregation): { keyed: em.IAggregationMapping | undefined; mappings: em.IAggregationMapping[] } {
    const mappings = ((g.agrMapp ?? []) as em.IAggregationMapping[])
    if (mappings.length < 2) {
      throw new Error(`Aggregation '${g.name}' relates ${mappings.length} participant(s); an aggregation relates at least two.`)
    }
    const keyed = mappings.find((m) => m.upperBound === "1")
    return { keyed, mappings }
  }

  @SpecOption("entityToTable", em.Weak)
  weakToTable(w: em.IWeak): ExprNode<rmT.ITable> {
    const owner = this.ownerOf(w)
    const table = this.tableNameOf(w)
    const copies = this.keyColumnsPlan(w).slice(0, this.keyColumnsPlan(this.ownerOf(w)).length)
    return (
      <Table name={table}>
        {copies.map((c) => (
          <Column name={c.name} type={c.type} isNullable={false} isAutoincrement={false} />
        ))}
        {this.tableColumns(w)}
        {this.primaryKeyFor(w)}
        {this.foreignKeyTo(table, `fk_${table}_${this.tableFor(owner)}`, copies.map((c) => c.name), owner, this.fkActions((w.weakMap as em.IWeakMapping).cnWeakOwner, (w.weakMap as em.IWeakMapping).dcnWeakOwner))}
      </Table>
    )
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
  @E2E()
  @VarPoint("RowHistory")
  entityToTables(e: em.IEntity): ExprNode<rmT.ITable>[] {
    throw new Error("Not implemented VarOptions for VarPoint RowHistory")
  }

  @Default()
  @VarOption("entityToTables", Option("NoHistory"))
  currentRowsOnly(e: em.IEntity): ExprNode<rmT.ITable>[] {
    // the SpecPoint dispatch is total: the undefined in its declared
    // return never materializes
    return [this.entityToTable(e)!]
  }

  @VarOption("entityToTables", Option("HistoryTable"))
  withRowHistory(e: em.IEntity): ExprNode<rmT.ITable>[] {
    return withHistoryTable(() => this.historyDiscriminator(e))(() => this.entityToTable(e)!)()
  }

  /** What distinguishes row versions in this entity's history table. */
  @VarPoint("HistoryDiscriminator")
  historyDiscriminator(e: em.IEntity): ExprNode<rmT.IColumn> {
    throw new Error("Not implemented VarOptions for VarPoint HistoryDiscriminator")
  }

  @Default()
  @VarOption("historyDiscriminator", Option("ValidFromTimestamp"))
  validFromDiscriminator(e: em.IEntity): ExprNode<rmT.IColumn> {
    return <Column name="valid_from" type="TIMESTAMP" isNullable={false} isAutoincrement={false} />
  }

  @VarOption("historyDiscriminator", Option("VersionCounter"))
  versionCounterDiscriminator(e: em.IEntity): ExprNode<rmT.IColumn> {
    return <Column name="version" type="INTEGER" isNullable={false} isAutoincrement={false} />
  }

  // A second point on the same issue, answering with the VALUE for the
  // graft sites that must know whether a table keeps history without
  // building anything (the strategyOf precedent).
  @VarPoint("RowHistory")
  keepsHistory(e: em.IEntity): boolean {
    throw new Error("Not implemented VarOptions for VarPoint RowHistory")
  }

  @Default()
  @VarOption("keepsHistory", Option("NoHistory"))
  keepsNoHistory(e: em.IEntity): boolean { return false }

  @VarOption("keepsHistory", Option("HistoryTable"))
  keepsRowHistory(e: em.IEntity): boolean { return true }

  /**
   * The graft mirror: relationship foreign keys and single-table
   * hierarchy columns land in already-emitted tables AFTER the
   * entities pass, and a versioned row's relationship columns are part
   * of its state. When the grafted-into table keeps history, the same
   * columns (and nothing else: no foreign keys, no indexes, no key
   * change) are copied into its history table. The mirror introspects
   * the just-built graft node, so no rule runs twice.
   */
  private mirrorGraftIntoHistory(e: em.IEntity, graft: ExprNode<rmT.ITable>): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[] {
    const owner = this.tableOwnerEntity(e)
    if (!this.keepsHistory(owner)) return graft
    return [
      graft,
      <Table $refByName={`${this.tableFor(owner)}_history`}>
        {columnNodesOf(graft).map((c) => copiedHistoryColumn(c))}
      </Table>,
    ]
  }

  /** The entity whose OWN table holds this entity's rows: a subtype
   * under SingleTable defers to its hierarchy's root. */
  private tableOwnerEntity(e: em.IEntity): em.IEntity {
    const store = this.context.store
    if (store.isTypeOf(e, em.Subtype)) {
      const spec = (e as em.ISubtype).supertype as em.ISpecialization
      if (this.strategyOf(spec) === "single") return this.rootOf(spec)
    }
    return e
  }

  /**
   * The audited or plain columns of an entity's table: a rule pair
   * selected by the TableAuditing issue, the higher-order
   * withAuditColumns applied inside the audited option (the confirmed
   * simplified zero-argument composition, no table qualifier under
   * table scopes).
   */
  @E2E()
  @VarPoint("TableAuditing")
  tableColumns(e: em.IEntity): ExprNode<rmT.IColumn>[] {
    throw new Error("Not implemented VarOptions for VarPoint TableAuditing")
  }

  @Default()
  @VarOption("tableColumns", Option("AuditColumns"))
  auditedColumns(e: em.IEntity): ExprNode<rmT.IColumn>[] {
    const base = () => (e.attributes as em.IAttribute[]).flatMap((a) => this.attributeColumns(a))
    return withAuditColumns(base)()
  }

  @VarOption("tableColumns", Option("NoAuditColumns"))
  plainColumns(e: em.IEntity): ExprNode<rmT.IColumn>[] {
    return (e.attributes as em.IAttribute[]).flatMap((a) => this.attributeColumns(a))
  }

  /** One attribute's columns in the entity's own table: a composite
   * parent contributes one column per leaf (attribute_component), a
   * leaf contributes its column. */
  private attributeColumns(a: em.IAttribute): ExprNode<rmT.IColumn>[] {
    const components = ((a.components ?? []) as em.IAttribute[])
    if (components.length > 0) {
      const parentOptional = a.isOptional === true
      return components.map((leaf) => (
        <Column
          name={this.applyNaming(`${a.name}_${leaf.name}`)}
          type={this.getColumnType(this.domainOf(leaf))}
          isNullable={parentOptional || leaf.isOptional === true}
          isAutoincrement={false}
        />
      ))
    }
    return [this.attributeToColumn(a)]
  }

  @E2E()
  attributeToColumn(a: em.IAttribute): ExprNode<rmT.IColumn> {
    // compositeness is a property of the TABLE key (the plan), not of
    // the entity's own attributes: a weak entity with one key attribute
    // still has a composite key through its owner
    const composite = this.keyColumnsPlan(a.attrEntity as em.IEntity).length > 1
    const dom = this.domainOf(a)
    const userDefined = dom.baseType !== undefined && dom.baseType !== null
    return (
      <Column
        name={this.applyNaming(a.name)}
        type={this.getColumnType(dom)}
        isNullable={a.isOptional === true}
        isAutoincrement={a.isKey && !composite && this.primaryKeyStrategy(a) && this.getColumnType(dom) === "INTEGER"}
        {...(userDefined ? { domain: <RelDomain $refByName={this.applyNaming(String(dom.name))} /> } : {})}
      />
    )
  }

  // ── the hierarchies pass ─────────────────────────────────────────────

  @E2E()
  @VarPoint("InheritanceStrategy")
  hierarchyToTables(spec: em.ISpecialization): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[] {
    throw new Error("Not implemented VarOptions for VarPoint InheritanceStrategy")
  }

  @Default()
  @VarOption("hierarchyToTables", Option("JoinedTables"))
  joinedHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable>[] {
    return (spec.subtypes as em.ISubtype[]).map((st) => this.joinedSubtypeTable(st))
  }

  @VarOption("hierarchyToTables", Option("SingleTable"))
  singleTableHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[] {
    const root = this.rootOf(spec)
    const rootTable = this.tableNameOf(root)
    const graft = (
      <Table $refByName={rootTable}>
        <Column name="type" type="VARCHAR(255)" isNullable={false} isAutoincrement={false} />
        {(spec.subtypes as em.ISubtype[]).flatMap((st) =>
          (st.attributes as em.IAttribute[]).map((a) => this.attributeToColumn(a)),
        )}
      </Table>
    )
    return this.mirrorGraftIntoHistory(root, graft)
  }

  @VarOption("hierarchyToTables", Option("TablePerClass"))
  tablePerClassHierarchy(spec: em.ISpecialization): ExprNode<rmT.ITable>[] {
    return (spec.subtypes as em.ISubtype[]).map((st) => this.tablePerClassSubtypeTable(st))
  }

  @E2E()
  joinedSubtypeTable(st: em.ISubtype): ExprNode<rmT.ITable> {
    const root = this.rootOf(st.supertype as em.ISpecialization)
    const table = this.tableNameOf(st)
    const copies = this.keyColumnsPlan(st)
    return (
      <Table name={table}>
        {copies.map((c) => (
          <Column name={c.name} type={c.type} isNullable={false} isAutoincrement={false} />
        ))}
        {this.tableColumns(st)}
        {this.primaryKeyFor(st)}
        {this.foreignKeyTo(table, `fk_${table}_${this.tableFor(root)}`, copies.map((c) => c.name), root, this.fkActions(st.cnSupertype, st.dcnSupertype))}
      </Table>
    )
  }

  @E2E()
  tablePerClassSubtypeTable(st: em.ISubtype): ExprNode<rmT.ITable> {
    const root = this.rootOf(st.supertype as em.ISpecialization)
    const table = this.tableNameOf(st)
    return (
      <Table name={table}>
        {(root.attributes as em.IAttribute[]).map((a) => this.copiedColumn(a))}
        {this.tableColumns(st)}
        {this.primaryKeyFor(st)}
      </Table>
    )
  }

  /** A copy of a root attribute's column in a TablePerClass subtype
   * table: a new element with the same name (the table scope keeps it
   * unambiguous) and no autoincrement. */
  @E2E()
  copiedColumn(a: em.IAttribute): ExprNode<rmT.IColumn> {
    return (
      <Column
        name={this.applyNaming(a.name)}
        type={this.getColumnType(this.domainOf(a))}
        isNullable={a.isOptional === true}
        isAutoincrement={false}
      />
    )
  }

  // A second point on the same issue, answering with the strategy VALUE
  // for the places that must know where an entity's rows live (tableFor,
  // key plans) without building anything.
  @VarPoint("InheritanceStrategy")
  strategyOf(spec: em.ISpecialization): "joined" | "single" | "tpc" {
    throw new Error("Not implemented VarOptions for VarPoint InheritanceStrategy")
  }

  @Default()
  @VarOption("strategyOf", Option("JoinedTables"))
  strategyJoined(spec: em.ISpecialization): "joined" { return "joined" }

  @VarOption("strategyOf", Option("SingleTable"))
  strategySingle(spec: em.ISpecialization): "single" { return "single" }

  @VarOption("strategyOf", Option("TablePerClass"))
  strategyTpc(spec: em.ISpecialization): "tpc" { return "tpc" }

  // ── the relationships pass ───────────────────────────────────────────

  /** Plain dispatcher: the shape of the relationship decides the rule;
   * only the genuinely open 1:N case is a configuration issue. */
  relationshipToStructure(r: em.IRelationship): ExprNode<any> | ExprNode<any>[] {
    const roles = r.roles as em.IOrdinaryMapping[]
    if (roles.length !== 2) {
      throw new Error(
        `Relationship '${r.name}' has ${roles.length} roles; relationships are binary by doctrine. Relate more than two entities with an Aggregation.`,
      )
    }
    const [a, b] = roles
    const oneToN = (a.upperBound === "1" && b.upperBound === "M") || (a.upperBound === "M" && b.upperBound === "1")
    if (oneToN) return this.relationshipMapping(r)
    if (a.upperBound === "1" && b.upperBound === "1") return this.oneToOneForeignKey(r)
    return this.manyToManyJoinTable(r)
  }

  @E2E()
  @VarPoint("OneToManyStrategy")
  relationshipMapping(rel: em.IRelationship): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[] {
    throw new Error("Not implemented VarOptions for VarPoint OneToManyStrategy")
  }

  @VarOption("relationshipMapping", Option("ForeignKey"))
  relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[] {
    const roles = rel.roles as em.IOrdinaryMapping[]
    const oneSide = roles.find((m) => m.upperBound === "1")!
    const manySide = roles.find((m) => m.upperBound !== "1")!
    const table = this.tableFor(manySide.domain as em.IEntity)
    const nullable = oneSide.lowerBound === "0"
    const { cols, pairs } = this.plannedForeignKey(table, rel.name, oneSide.domain as em.IEntity, nullable, false, this.fkActions(oneSide.cnMapp, oneSide.dcnMapp))
    const graft = (
      <Table $refByName={table}>
        {cols}
        {pairs}
      </Table>
    )
    return this.mirrorGraftIntoHistory(manySide.domain as em.IEntity, graft)
  }

  @Default()
  @VarOption("relationshipMapping", Option("JoinTable"))
  relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return this.buildJoinTable(rel)
  }

  @E2E()
  manyToManyJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return this.buildJoinTable(rel)
  }

  @E2E()
  oneToOneForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> | ExprNode<rmT.ITable>[] {
    const roles = rel.roles as em.IOrdinaryMapping[]
    // the optional side carries the (unique) foreign key
    const holder = roles.find((m) => m.lowerBound === "0") ?? roles[0]
    const other = roles.find((m) => m !== holder)!
    const table = this.tableFor(holder.domain as em.IEntity)
    const { cols, pairs } = this.plannedForeignKey(table, rel.name, other.domain as em.IEntity, holder.lowerBound === "0", true, this.fkActions(other.cnMapp, other.dcnMapp))
    const graft = (
      <Table $refByName={table}>
        {cols}
        {pairs}
      </Table>
    )
    return this.mirrorGraftIntoHistory(holder.domain as em.IEntity, graft)
  }

  private buildJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const table = this.applyNaming(rel.name)
    const roles = rel.roles as em.IOrdinaryMapping[]
    const parts = roles.map((role) =>
      this.plannedForeignKey(table, String(role.name), role.domain as em.IEntity, false, false, this.fkActions(role.cnMapp, role.dcnMapp)),
    )
    return (
      <Table name={table}>
        {parts.flatMap((p) => p.cols)}
        {parts.flatMap((p) => p.pairs)}
      </Table>
    )
  }

  // ── the index pass ───────────────────────────────────────────────────

  @VarPoint("IndexOnForeignKey")
  indexesForForeignKeys(): ExprNode<rmT.ITable>[] {
    throw new Error("Not implemented VarOptions for VarPoint IndexOnForeignKey")
  }

  @Default()
  @VarOption("indexesForForeignKeys", Option("IndexAllForeignKeys"))
  indexAllForeignKeys(): ExprNode<rmT.ITable>[] {
    return this.emittedFks.map(({ table, fkName, cols }) => (
      <Table $refByName={table}>
        <Index name={`ix_${fkName}`} isUnique={false}>
          {cols.map((c) => (
            <Column $refByName={c} />
          ))}
        </Index>
      </Table>
    ))
  }

  @VarOption("indexesForForeignKeys", Option("NoForeignKeyIndexes"))
  noForeignKeyIndexes(): ExprNode<rmT.ITable>[] {
    return []
  }

  // ── foreign key machinery ────────────────────────────────────────────

  /** R, C, N, D as the dialect-neutral vocabulary. */
  private actionOf(letter: string | undefined): "Restrict" | "Cascade" | "SetNull" | "SetDefault" | undefined {
    switch (letter) {
      case "R": return "Restrict"
      case "C": return "Cascade"
      case "N": return "SetNull"
      case "D": return "SetDefault"
      default: return undefined
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
  private fkActions(cn: string | undefined, dcn: string | undefined): Partial<Pick<rmT.IForeignKey, "onConnect" | "onDelete" | "onUpdate">> {
    const connect = this.actionOf(cn)
    const disconnect = this.actionOf(dcn)
    return {
      ...(connect !== undefined && connect !== "Restrict" ? { onConnect: connect } : {}),
      ...(disconnect !== undefined && disconnect !== "Restrict" ? { onDelete: disconnect, onUpdate: disconnect } : {}),
    }
  }

  /**
   * Plan and emit one foreign key held by `table` toward `refEntity`'s
   * table: the qualified fk columns (types mirroring the referenced key
   * plan) and the ForeignKey element whose ForeignKeyColumn pairs name
   * the fk column (resolved in the holding table's scope) and the
   * referenced column (as <refTable>/<column>).
   */
  private plannedForeignKey(
    table: string,
    qualifier: string,
    refEntity: em.IEntity,
    nullable: boolean,
    unique: boolean = false,
    actions: Partial<Pick<rmT.IForeignKey, "onConnect" | "onDelete" | "onUpdate">> = {},
    reserved?: Set<string>,
  ): { cols: ExprNode<rmT.IColumn>[]; pairs: ExprNode<rmT.IForeignKey>[]; fkName: string } {
    const refTable = this.tableFor(refEntity)
    const refPlan = this.keyColumnsPlan(refEntity)
    const taken = reserved ?? new Set<string>()
    const fkCols = refPlan.map((c) => ({
      name: this.uniqueName(this.fkColumnName(refTable, c.name), taken),
      type: c.type,
      ref: c.name,
    }))
    const fkName = this.applyNaming(`fk_${table}_${qualifier}`)
    const cols = fkCols.map((c) => (
      <Column name={c.name} type={c.type} isNullable={nullable} isAutoincrement={false} />
    ))
    const pairs = [this.foreignKeyElement(fkName, refTable, fkCols, unique, actions)]
    this.emittedFks.push({ table, fkName, cols: fkCols.map((c) => c.name) })
    return { cols, pairs, fkName }
  }

  /** The ForeignKey element for already-planned fk columns. */
  private foreignKeyElement(
    fkName: string,
    refTable: string,
    fkCols: Array<{ name: string; ref: string }>,
    unique: boolean,
    actions: Partial<Pick<rmT.IForeignKey, "onConnect" | "onDelete" | "onUpdate">> = {},
  ): ExprNode<rmT.IForeignKey> {
    return (
      <ForeignKey name={fkName} isUnique={unique} {...actions} referencedTable={<Table $refByName={refTable} />}>
        {fkCols.map((c, i) => (
          <ForeignKeyColumn name={`${fkName}_p${i + 1}`}>
            <Column $refByName={c.name} />
            <Column $refByName={`${refTable}/${c.ref}`} />
          </ForeignKeyColumn>
        ))}
      </ForeignKey>
    )
  }

  /** The weak entity's and joined subtype's inline foreign key over the
   * copied key columns (already present in the table). */
  private foreignKeyTo(
    table: string,
    fkName: string,
    colNames: string[],
    refEntity: em.IEntity,
    actions: Partial<Pick<rmT.IForeignKey, "onConnect" | "onDelete" | "onUpdate">> = {},
  ): ExprNode<rmT.IForeignKey> {
    const refTable = this.tableFor(refEntity)
    const refPlan = this.keyColumnsPlan(refEntity)
    const named = this.applyNaming(fkName)
    this.emittedFks.push({ table, fkName: named, cols: colNames })
    return this.foreignKeyElement(
      named,
      refTable,
      colNames.map((n, i) => ({ name: n, ref: refPlan[i].name })),
      false,
      actions,
    )
  }

  /**
   * The name of a foreign key or copied key column, per the
   * ForeignKeyColumnNaming issue. ShortNames keeps a name that already
   * carries meaning (it contains an underscore from a prior hop) and
   * prefixes the referenced table's name otherwise; TablePrefixed
   * prefixes on every hop. Collisions get numbered suffixes via
   * uniqueName.
   */
  @VarPoint("ForeignKeyColumnNaming")
  fkColumnName(refTable: string, colName: string): string {
    throw new Error("Not implemented VarOptions for VarPoint ForeignKeyColumnNaming")
  }

  @Default()
  @VarOption("fkColumnName", Option("ShortNames"))
  shortFkColumnName(refTable: string, colName: string): string {
    return colName.includes("_") ? colName : `${refTable}_${colName}`
  }

  @VarOption("fkColumnName", Option("TablePrefixed"))
  prefixedFkColumnName(refTable: string, colName: string): string {
    return `${refTable}_${colName}`
  }

  private uniqueName(base: string, taken: Set<string>): string {
    let name = base
    let n = 1
    while (taken.has(name)) {
      n += 1
      name = `${base}_${n}`
    }
    taken.add(name)
    return name
  }

  // ── key plans and table resolution ───────────────────────────────────

  /** Where an entity's rows live: its own table for kernels and weak
   * entities; for a subtype, whatever its hierarchy's strategy says. */
  private tableFor(e: em.IEntity): string {
    const store = this.context.store
    if (store.isTypeOf(e, em.Subtype)) {
      const spec = (e as em.ISubtype).supertype as em.ISpecialization
      if (this.strategyOf(spec) === "single") {
        return this.tableFor(this.rootOf(spec))
      }
    }
    return this.tableNameOf(e)
  }

  /** The key columns of the table holding this entity's rows: names as
   * emitted, types mirrored. One source of truth for emission and
   * referencing. */
  private keyColumnsPlan(e: em.IEntity): KeyColumnPlan[] {
    const cached = this.keyPlans.get(e)
    if (cached) return cached
    const store = this.context.store
    let plan: KeyColumnPlan[]
    if (store.isTypeOf(e, em.Weak)) {
      const owner = this.ownerOf(e as em.IWeak)
      const ownerPlan = this.keyColumnsPlan(owner)
      const ownerTable = this.tableFor(owner)
      const taken = new Set<string>((e.attributes as em.IAttribute[]).map((a) => this.applyNaming(a.name)))
      plan = [
        ...ownerPlan.map((c) => ({ name: this.uniqueName(this.fkColumnName(ownerTable, c.name), taken), type: c.type })),
        ...this.keyAttrsOf(e).map((a) => ({ name: this.applyNaming(a.name), type: this.getColumnType(this.domainOf(a)) })),
      ]
    } else if (store.isTypeOf(e, em.Subtype)) {
      const spec = (e as em.ISubtype).supertype as em.ISpecialization
      const root = this.rootOf(spec)
      const rootPlan = this.keyColumnsPlan(root)
      const strategy = this.strategyOf(spec)
      if (strategy === "single") {
        plan = rootPlan
      } else if (strategy === "tpc") {
        plan = rootPlan.map((c) => ({ ...c }))
      } else {
        const rootTable = this.tableFor(root)
        const taken = new Set<string>((e.attributes as em.IAttribute[]).map((a) => this.applyNaming(a.name)))
        plan = rootPlan.map((c) => ({ name: this.uniqueName(this.fkColumnName(rootTable, c.name), taken), type: c.type }))
      }
    } else if (store.isTypeOf(e, em.Aggregation)) {
      const { keyed, mappings } = this.aggregationParts(e as em.IAggregation)
      const taken = new Set<string>((e.attributes as em.IAttribute[]).map((a) => this.applyNaming(a.name)))
      const copiesOf = (m: em.IAggregationMapping) => {
        const participant = m.domain as em.IEntity
        const pTable = this.tableFor(participant)
        return this.keyColumnsPlan(participant).map((c) => ({
          name: this.uniqueName(this.fkColumnName(pTable, c.name), taken),
          type: c.type,
        }))
      }
      plan = keyed !== undefined ? copiesOf(keyed) : mappings.flatMap((m) => copiesOf(m))
    } else {
      plan = this.keyAttrsOf(e).map((a) => ({ name: this.applyNaming(a.name), type: this.getColumnType(this.domainOf(a)) }))
    }
    this.keyPlans.set(e, plan)
    return plan
  }

  /** The table's PrimaryKey element over its key plan, in plan order:
   * key-ness is membership here, stated once. */
  private primaryKeyFor(e: em.IEntity): ExprNode<rmT.IPrimaryKey> {
    return (
      <PrimaryKey name={this.applyNaming(`pk_${this.tableFor(e)}`)}>
        {this.keyColumnsPlan(e).map((c) => (
          <Column $refByName={c.name} />
        ))}
      </PrimaryKey>
    )
  }

  /** A leaf attribute's domain; composite parents have components
   * instead and are mapped by their components (v2 stage 3). */
  private domainOf(a: em.IAttribute): em.IDomain {
    const d = a.attrDomain as em.IDomain | undefined
    if (!d) {
      throw new Error(`Attribute '${a.name}' has no domain; composite attributes are mapped from their components.`)
    }
    return d
  }

  private keyAttrsOf(e: em.IEntity): em.IAttribute[] {
    return ((e.attributes ?? []) as em.IAttribute[]).filter((a) => a.isKey)
  }

  private ownerOf(w: em.IWeak): em.IEntity {
    const wm = w.weakMap as em.IWeakMapping | undefined
    if (!wm || !wm.domain) {
      throw new Error(`Weak entity '${w.name}' has no weak mapping naming its owner.`)
    }
    return wm.domain as em.IEntity
  }

  private rootOf(spec: em.ISpecialization): em.IEntity {
    const mapping = spec.mapping as em.ISpecializationMapping | undefined
    const root = mapping?.domain as em.IEntity | undefined
    if (!root) {
      throw new Error(`Specialization '${spec.name}' has no mapping naming its root entity.`)
    }
    if (this.context.store.isTypeOf(root, em.Subtype)) {
      throw new Error(
        `eer-to-relational v1 maps one-level hierarchies only; '${spec.name}' is rooted in subtype '${root.name}'.`,
      )
    }
    return root
  }

  /** The hierarchy an entity is the root of, if any. */
  private hierarchyOfRoot(e: em.IEntity): em.ISpecialization | undefined {
    const store = this.context.store
    const sm = ((e.mappings ?? []) as em.IMapping[]).find((m) => store.isTypeOf(m, em.SpecializationMapping))
    return (sm as em.ISpecializationMapping | undefined)?.specialization as em.ISpecialization | undefined
  }

  /** An abstract root under TablePerClass gets no table of its own. */
  private skipsOwnTable(e: em.IEntity): boolean {
    if (!e.isAbstract) return false
    const spec = this.hierarchyOfRoot(e)
    return spec !== undefined && this.strategyOf(spec) === "tpc"
  }

  private tableNameOf(e: em.IEntity): string {
    return this.applyNaming(e.name)
  }

  // ── topological emission order ───────────────────────────────────────

  /** Kahn's sort over the table-producing units: a weak entity depends
   * on the unit holding its owner's table, a hierarchy on its root's
   * unit. Ties keep source order; a cycle is a clear error. */
  private sortUnits(entities: em.IEntity[], hierarchies: em.ISpecialization[]): Unit[] {
    const store = this.context.store
    const units: Unit[] = []
    const byKey = new Map<string, Unit>()
    const unitKeyOfEntity = (e: em.IEntity): string => {
      if (store.isTypeOf(e, em.Subtype)) {
        return `h:${((e as em.ISubtype).supertype as em.ISpecialization).name}`
      }
      return `e:${e.name}`
    }
    for (const e of entities) {
      const u: Unit = { key: `e:${e.name}`, kind: "entity", element: e, deps: [] }
      if (store.isTypeOf(e, em.Weak)) {
        u.deps.push(unitKeyOfEntity(this.ownerOf(e as em.IWeak)))
      }
      if (store.isTypeOf(e, em.Aggregation)) {
        for (const m of ((e as em.IAggregation).agrMapp ?? []) as em.IAggregationMapping[]) {
          u.deps.push(unitKeyOfEntity(m.domain as em.IEntity))
        }
      }
      units.push(u)
      byKey.set(u.key, u)
    }
    for (const h of hierarchies) {
      const root = this.rootOf(h)
      const u: Unit = { key: `h:${h.name}`, kind: "hierarchy", element: h, deps: [`e:${root.name}`] }
      units.push(u)
      byKey.set(u.key, u)
    }
    const externalDeps = (u: Unit) => u.deps.filter((d) => byKey.has(d))
    const emitted: Unit[] = []
    const done = new Set<string>()
    let remaining = units.slice()
    while (remaining.length > 0) {
      const ready = remaining.filter((u) => externalDeps(u).every((d) => done.has(d)))
      if (ready.length === 0) {
        throw new Error(
          `Cyclic ownership among: ${remaining.map((u) => u.key).join(", ")}; a weak entity chain must be acyclic.`,
        )
      }
      for (const u of ready) {
        emitted.push(u)
        done.add(u.key)
      }
      remaining = remaining.filter((u) => !done.has(u.key))
    }
    return emitted
  }

  // ── retained fixed logic and naming ──────────────────────────────────

  @VarPoint("PrimaryKeyStrategy")
  primaryKeyStrategy(a: em.IAttribute): boolean {
    throw new Error("Not implemented VarOptions for VarPoint PrimaryKeyStrategy")
  }

  @Default()
  @VarOption("primaryKeyStrategy", Option("UseAutoIncrement"))
  useAutoIncrement(a: em.IAttribute): boolean {
    return a.isKey ? true : false
  }

  @VarOption("primaryKeyStrategy", Option("UseManualIncrement"))
  useManualIncrement(a: em.IAttribute): boolean {
    return false
  }

  @VarPoint("NamingConvention")
  applyNaming(name: string): string {
    throw new Error("Not implemented VarOptions for VarPoint NamingConvention")
  }

  @VarOption("applyNaming", Option("CamelCase"))
  applyCamelCaseNaming(name: string): string {
    return name.replace(/_/g, "")
  }

  @Default()
  @VarOption("applyNaming", Option("SnakeCase"))
  applySnakeCaseNaming(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
      .toLowerCase()
  }

  private getColumnType(domain: em.IDomain): string {
    const base = domain.baseType as string | undefined
    return this.typeOfName(base ?? String(domain.name))
  }

  /** The one primitive-name-to-SQL-type mapping. */
  private typeOfName(name: string): string {
    const domainName = name.toLowerCase()
    switch (domainName) {
      case "string":
        return "VARCHAR(255)"
      case "number":
      case "integer":
      case "int":
        return "INTEGER"
      case "float":
      case "double":
        return "DOUBLE"
      case "boolean":
      case "bool":
        return "BOOLEAN"
      case "date":
        return "DATE"
      case "datetime":
      case "timestamp":
        return "TIMESTAMP"
      case "text":
        return "TEXT"
      case "bigint":
        return "BIGINT"
      default:
        return "VARCHAR(255)"
    }
  }
}
