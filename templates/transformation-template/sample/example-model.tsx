/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { RelSchema, Table, Column } from 'rel-tutorial-metamodel'
import type * as rmT from 'rel-tutorial-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'rel-tutorial-metamodel',
  author: 'Your Name',
  version: '0.1.0',
  description: 'Sample input model for the starter transformation'
} as const

export default (store: ModelStore): ExprNode<rmT.IRelSchema> => (
  <RelSchema name="ExampleDb" content="" MDA_level="M1" store={store}>
    {/* Element names are unique across the whole model, so columns
        carry table-qualified names. */}
    <Table name="item">
      <Column name="item_id" type="INTEGER" isKey={true} isNullable={false} isAutoincrement={true} />
      <Column name="item_name" type="VARCHAR(255)" isKey={false} isNullable={false} isAutoincrement={false} />
    </Table>
    {/* A foreign key is a column whose `references` link points at the
        primary key column it refers to; there is no isForeignKey flag. */}
    <Table name="order_line">
      <Column name="line_id" type="INTEGER" isKey={true} isNullable={false} isAutoincrement={true} />
      <Column
        name="line_item_fk"
        type="INTEGER"
        isKey={false}
        isNullable={false}
        isAutoincrement={false}
        references={<Column $refByName="item_id" />}
      />
    </Table>
  </RelSchema>
)
