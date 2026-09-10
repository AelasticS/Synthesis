/** @jsx createExprNode */

/**
 * Relational schema to Mermaid erDiagram text, the suite's diagram of
 * the mapping's OUTPUT: chained after eer-to-relational, different
 * configurations of the same source become visibly different diagrams.
 * One document per schema: an attribute block per table (type-first
 * lines, the type made Mermaid-safe, PK and FK marks read from the
 * PrimaryKey element and the foreign key pairs, a "nullable" comment
 * on nullable columns), then one line per foreign key (the referenced
 * side exactly-one, the owner side zero-or-more, or zero-or-one when
 * the key is unique; identifying exactly when every fk column is a
 * member of the owner's primary key, the weak-entity and
 * joined-subtype shapes), then one dashed one-to-one line per
 * historyOf link, which is deliberately not a foreign key. Domains and
 * indexes are diagram noise and are skipped. The logic is fixed: a
 * diagram renderer has no open design questions at this scale, so the
 * manifest declares no parts and the CLI runs it without configuration
 * flags.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M } from '@aelastics/synthesis/m2m'
import { M2T, Doc, P } from '@aelastics/synthesis/m2t'
import type { M2T_Model } from '@aelastics/synthesis/m2t'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as rmT from 'relational-metamodel/model'

export class RelToMermaid extends abstractM2M<rmT.IRelSchema, M2T_Model> {
  constructor(store: ModelStore) {
    super(store)
  }

  topRule(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, M2T_Model> {
    const store = this.context.store
    // Domains are elements too; the Table filter takes only tables.
    const tables = (s.elements ?? []).filter((el) => store.isTypeOf(el, rmT.Table)) as rmT.ITable[]
    const fks = tables.flatMap((tab) => (tab.foreignKeys ?? []) as rmT.IForeignKey[])
    const histories = tables.filter((tab) => tab.historyOf !== undefined && tab.historyOf !== null)
    return (
      <M2T name={`${s.name}_mermaid`}>
        <Doc name={`${s.name}.mmd`}>
          <P>{'erDiagram'}</P>
          {tables.flatMap((tab) => this.tableBlock(tab))}
          {fks.map((fk) => this.foreignKeyLine(fk))}
          {histories.map((tab) => this.historyLine(tab))}
        </Doc>
      </M2T>
    )
  }

  /** One attribute line per column; key-ness IS membership in the
   * PrimaryKey element and foreign-key-ness IS appearing as an
   * fkColumn pair, read from those elements, never stored twice. */
  private tableBlock(tab: rmT.ITable): ExprNode<any>[] {
    const pkColumns = ((tab.primaryKey as rmT.IPrimaryKey | undefined)?.columns ?? []) as rmT.IColumn[]
    const fkColumns = new Set(
      ((tab.foreignKeys ?? []) as rmT.IForeignKey[]).flatMap((fk) =>
        ((fk.fkColumns ?? []) as rmT.IForeignKeyColumn[]).map((p) => p.fkColumn as rmT.IColumn)
      )
    )
    return [
      <P>{`  ${tab.name} {`}</P>,
      ...((tab.columns ?? []) as rmT.IColumn[]).map((c) => (
        <P>{`    ${this.columnLine(c, pkColumns.includes(c), fkColumns.has(c))}`}</P>
      )),
      <P>{'  }'}</P>,
    ]
  }

  /** Mermaid's type-first order: type word, column name, key marks, a
   * "nullable" comment on nullable columns and nothing otherwise. */
  private columnLine(c: rmT.IColumn, isPk: boolean, isFk: boolean): string {
    const parts = [this.mermaidType(String(c.type)), String(c.name)]
    if (isPk && isFk) parts.push('PK, FK')
    else if (isPk) parts.push('PK')
    else if (isFk) parts.push('FK')
    if (c.isNullable) parts.push('"nullable"')
    return parts.join(' ')
  }

  /** A Mermaid attribute type allows no spaces and no commas: the SQL
   * type keeps its parentheses (VARCHAR(255) is valid as is) but drops
   * spaces, and a comma inside parentheses becomes an underscore, so
   * DECIMAL(10,2) renders as DECIMAL(10_2). */
  private mermaidType(sqlType: string): string {
    return sqlType
      .replaceAll(' ', '')
      .replace(/\(([^)]*)\)/g, (_m, inner: string) => `(${inner.replaceAll(',', '_')})`)
  }

  /** The referenced side is exactly-one; the owner side is zero-or-more,
   * or zero-or-one when the key is unique. The line is identifying
   * (solid) exactly when every fk column is a member of the owner's
   * primary key: the dependent's identity derives from the reference,
   * the weak-entity and joined-subtype shapes. */
  private foreignKeyLine(fk: rmT.IForeignKey): ExprNode<any> {
    const owner = fk.ownerTable as rmT.ITable | undefined
    const referenced = fk.referencedTable as rmT.ITable | undefined
    const pairs = (fk.fkColumns ?? []) as rmT.IForeignKeyColumn[]
    if (!owner || !referenced || pairs.length === 0) {
      throw new Error(`ForeignKey '${fk.name}' is incomplete; a diagram cannot draw a dangling reference.`)
    }
    const pkColumns = ((owner.primaryKey as rmT.IPrimaryKey | undefined)?.columns ?? []) as rmT.IColumn[]
    const identifying = pairs.every((p) => pkColumns.includes(p.fkColumn as rmT.IColumn))
    const ownerGlyph = fk.isUnique === true ? '|o' : '}o'
    return (
      <P>{`  ${owner.name} ${ownerGlyph}${identifying ? '--' : '..'}|| ${referenced.name} : ${fk.name}`}</P>
    )
  }

  /** The historyOf link is deliberately not a foreign key (history
   * outlives the deletion of the base row), so it renders as a dashed
   * one-to-one line, never as a reference. */
  private historyLine(tab: rmT.ITable): ExprNode<any> {
    return <P>{`  ${tab.name} ||..|| ${(tab.historyOf as rmT.ITable).name} : historyOf`}</P>
  }
}
