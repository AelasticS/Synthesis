/** @jsx createExprNode */

/**
 * The higher-order row-history template, one granularity above
 * withAuditColumns (design/row-history.md): a table step in, a
 * table-SET step out, the base table followed by its derived history
 * table. It is pure target-domain and derives the history table by
 * introspecting the base table's expression node, so it composes with
 * whatever produced that node; the audit columns appended inside the
 * wrapped step are captured like any other column.
 *
 * The history table is identified like a weak entity, base key plus a
 * temporal discriminator, but is deliberately NOT existence-dependent:
 * it carries no foreign keys at all, because history outlives the
 * deletion of the base row and a snapshot of a past state must not be
 * rejected by current referential constraints.
 */
import { createExprNode } from "@aelastics/synthesis/jsx"
import type { ExprNode } from "@aelastics/synthesis/jsx"
import * as rmT from "relational-metamodel/model"
import { Column, Domain as RelDomain, PrimaryKey, Table } from "relational-metamodel"

/** The real columns of a table node: Column children carrying props,
 * not the $refByName references a PrimaryKey or Index holds. */
export const columnNodesOf = (table: ExprNode<rmT.ITable>): ExprNode<rmT.IColumn>[] =>
  (table.childArray.flat(Infinity) as ExprNode<any>[]).filter(
    (n) => n?.type === rmT.Column && (n.props as { $refByName?: string }).$refByName === undefined,
  ) as ExprNode<rmT.IColumn>[]

const primaryKeyNodeOf = (table: ExprNode<rmT.ITable>): ExprNode<rmT.IPrimaryKey> | undefined =>
  (table.childArray.flat(Infinity) as ExprNode<any>[]).find(
    (n) => n?.type === rmT.PrimaryKey,
  ) as ExprNode<rmT.IPrimaryKey> | undefined

/** A history copy of a column node: same name, type, nullability, and
 * domain reference; autoincrement stripped, because history rows
 * arrive with their values. */
export const copiedHistoryColumn = (c: ExprNode<rmT.IColumn>): ExprNode<rmT.IColumn> => {
  const p = c.props as { name?: string; type?: string; isNullable?: boolean; domain?: ExprNode<rmT.IDomain> }
  const domainRef = (p.domain?.props as { $refByName?: string } | undefined)?.$refByName
  return (
    <Column
      name={String(p.name)}
      type={String(p.type)}
      isNullable={p.isNullable === true}
      isAutoincrement={false}
      {...(domainRef !== undefined ? { domain: <RelDomain $refByName={domainRef} /> } : {})}
    />
  )
}

export const withHistoryTable = (discriminator: () => ExprNode<rmT.IColumn>) =>
  (table: () => ExprNode<rmT.ITable>) =>
    (): ExprNode<rmT.ITable>[] => {
      const base = table()
      const baseName = String((base.props as { name?: string }).name)
      const historyName = `${baseName}_history`
      const disc = discriminator()
      const keyRefs = (primaryKeyNodeOf(base)?.childArray.flat(Infinity) ?? []) as ExprNode<rmT.IColumn>[]
      return [
        base,
        <Table name={historyName} historyOf={<Table $refByName={baseName} />}>
          {columnNodesOf(base).map((c) => copiedHistoryColumn(c))}
          {disc}
          <PrimaryKey name={`pk_${historyName}`}>
            {keyRefs.map((k) => (
              <Column $refByName={String((k.props as { $refByName?: string }).$refByName)} />
            ))}
            <Column $refByName={String((disc.props as { name?: string }).name)} />
          </PrimaryKey>
        </Table>,
      ]
    }
