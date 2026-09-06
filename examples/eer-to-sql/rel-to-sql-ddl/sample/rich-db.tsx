/** @jsx createExprNode */

/*
 * The rich relational authoring pass: real foreign keys (one composite),
 * an index, and the short per-table column names the Table namespace
 * allows (three tables each own an "id"-style column set without any
 * qualification). The suite smoke imports this sample on every run, so
 * a broken authoring path or reference resolution fails the gate.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { RelSchema, Table, Column, Domain, ForeignKey, ForeignKeyColumn, Index, PrimaryKey } from 'relational-metamodel'
import type * as t from 'relational-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'relational-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Rich relational schema: composite foreign keys, an index, per-table column names'
} as const

export default (store: ModelStore): ExprNode<t.IRelSchema> => (
  <RelSchema name="RichDb" store={store}>
    {/* a wired domain: named type with check and default; the column
        referencing it keeps its resolved SQL type string */}
    <Domain name="money" type="DECIMAL(10,2)" check="VALUE >= 0" defaultValue="0" />

    <Table name="book">
      <Column name="id" type="INTEGER" isNullable={false} isAutoincrement={true} />
      <Column name="title" type="VARCHAR(255)" isNullable={true} isAutoincrement={false} />
      <Column name="price" type="DECIMAL(10,2)" isNullable={true} isAutoincrement={false}
        domain={<Domain $refByName="money" />} />
      <PrimaryKey name="pk_book">
        <Column $refByName="id" />
      </PrimaryKey>
    </Table>

    {/* a history table: identified like a weak entity (base key plus
        the temporal discriminator) but deliberately without a foreign
        key, because history outlives the deletion of the base row; the
        historyOf link is what tells the DDL layer to emit the capture
        trigger */}
    <Table name="book_history" historyOf={<Table $refByName="book" />}>
      <Column name="id" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <Column name="title" type="VARCHAR(255)" isNullable={true} isAutoincrement={false} />
      <Column name="price" type="DECIMAL(10,2)" isNullable={true} isAutoincrement={false}
        domain={<Domain $refByName="money" />} />
      <Column name="valid_from" type="TIMESTAMP" isNullable={false} isAutoincrement={false} />
      <PrimaryKey name="pk_book_history">
        <Column $refByName="id" />
        <Column $refByName="valid_from" />
      </PrimaryKey>
    </Table>

    <Table name="copy">
      {/* composite primary key: the owning book plus the copy number */}
      <Column name="book_id" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <Column name="no" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <PrimaryKey name="pk_copy">
        <Column $refByName="book_id" />
        <Column $refByName="no" />
      </PrimaryKey>
      <ForeignKey name="fk_copy_book" isUnique={false}
        referencedTable={<Table $refByName="book" />}>
        {/* the first Column reference fills fkColumn, the second refColumn */}
        <ForeignKeyColumn name="p1">
          <Column $refByName="book_id" />
          <Column $refByName="book/id" />
        </ForeignKeyColumn>
      </ForeignKey>
    </Table>

    <Table name="loan">
      <Column name="copy_book_id" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <Column name="copy_no" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <Column name="due" type="DATE" isNullable={true} isAutoincrement={false} />
      {/* composite foreign key to copy's two-column primary key */}
      <ForeignKey name="fk_loan_copy" isUnique={false}
        onDelete="Cascade" onUpdate="Restrict"
        referencedTable={<Table $refByName="copy" />}>
        <ForeignKeyColumn name="p1">
          <Column $refByName="copy_book_id" />
          <Column $refByName="copy/book_id" />
        </ForeignKeyColumn>
        <ForeignKeyColumn name="p2">
          <Column $refByName="copy_no" />
          <Column $refByName="copy/no" />
        </ForeignKeyColumn>
      </ForeignKey>
      <Index name="ix_loan_copy" isUnique={false}>
        <Column $refByName="copy_book_id" />
        <Column $refByName="copy_no" />
      </Index>
    </Table>
  </RelSchema>
)
