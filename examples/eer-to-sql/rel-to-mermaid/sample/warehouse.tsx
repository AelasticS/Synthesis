/** @jsx createExprNode */

/*
 * A compact warehouse exercising every diagram convention: a composite
 * primary key (batch), a column that is both primary and foreign key
 * (batch.product_id, an identifying line), a composite non-identifying
 * foreign key (shipment_item), a nullable DECIMAL(10,2) column (the
 * comma normalization), a history table with historyOf, and a domain
 * and an index that the diagram deliberately skips.
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
  description: 'A compact warehouse: composite keys, a history table, a nullable DECIMAL column'
} as const

export default (store: ModelStore): ExprNode<t.IRelSchema> => (
  <RelSchema name="Warehouse" store={store}>
    {/* the diagram skips domains; the column keeps its resolved type */}
    <Domain name="money" type="DECIMAL(10,2)" check="VALUE >= 0" defaultValue="0" />

    <Table name="product">
      <Column name="id" type="INTEGER" isNullable={false} isAutoincrement={true} />
      <Column name="name" type="VARCHAR(255)" isNullable={false} isAutoincrement={false} />
      <Column name="price" type="DECIMAL(10,2)" isNullable={true} isAutoincrement={false}
        domain={<Domain $refByName="money" />} />
      <PrimaryKey name="pk_product">
        <Column $refByName="id" />
      </PrimaryKey>
    </Table>

    {/* the history table: keyed by the base key plus the temporal
        discriminator, deliberately without a foreign key, because
        history outlives the deletion of the base row */}
    <Table name="product_history" historyOf={<Table $refByName="product" />}>
      <Column name="id" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <Column name="name" type="VARCHAR(255)" isNullable={false} isAutoincrement={false} />
      <Column name="price" type="DECIMAL(10,2)" isNullable={true} isAutoincrement={false}
        domain={<Domain $refByName="money" />} />
      <Column name="valid_from" type="TIMESTAMP" isNullable={false} isAutoincrement={false} />
      <PrimaryKey name="pk_product_history">
        <Column $refByName="id" />
        <Column $refByName="valid_from" />
      </PrimaryKey>
    </Table>

    <Table name="batch">
      {/* composite primary key: the owning product plus the batch number;
          product_id is also the foreign key, so the line is identifying */}
      <Column name="product_id" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <Column name="no" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <PrimaryKey name="pk_batch">
        <Column $refByName="product_id" />
        <Column $refByName="no" />
      </PrimaryKey>
      <ForeignKey name="fk_batch_product" isUnique={false}
        referencedTable={<Table $refByName="product" />}>
        {/* the first Column reference fills fkColumn, the second refColumn */}
        <ForeignKeyColumn name="p1">
          <Column $refByName="product_id" />
          <Column $refByName="product/id" />
        </ForeignKeyColumn>
      </ForeignKey>
    </Table>

    <Table name="shipment_item">
      <Column name="id" type="INTEGER" isNullable={false} isAutoincrement={true} />
      <Column name="batch_product_id" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <Column name="batch_no" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <Column name="qty" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <PrimaryKey name="pk_shipment_item">
        <Column $refByName="id" />
      </PrimaryKey>
      {/* composite foreign key to batch's two-column primary key; its
          columns are outside this table's key, so the line is dashed */}
      <ForeignKey name="fk_shipment_item_batch" isUnique={false}
        referencedTable={<Table $refByName="batch" />}>
        <ForeignKeyColumn name="p1">
          <Column $refByName="batch_product_id" />
          <Column $refByName="batch/product_id" />
        </ForeignKeyColumn>
        <ForeignKeyColumn name="p2">
          <Column $refByName="batch_no" />
          <Column $refByName="batch/no" />
        </ForeignKeyColumn>
      </ForeignKey>
      {/* the diagram skips indexes */}
      <Index name="ix_shipment_item_batch" isUnique={false}>
        <Column $refByName="batch_product_id" />
        <Column $refByName="batch_no" />
      </Index>
    </Table>
  </RelSchema>
)
