/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'
import type * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'

export const $synth = {
  kind: 'model',
  metamodel: '@synthesis/standard-metamodels/relational',
  author: 'Your Name',
  version: '0.1.0',
  description: 'Sample input model for the starter transformation'
} as const

export default (store: ModelStore): ExprNode<rmT.IRelSchema> => (
  <RelSchema name="ExampleDb" content="" MDA_level="M1" store={store}>
    {/* Element names are unique across the whole model, so columns
        carry table-qualified names. */}
    <Table name="item">
      <Column name="item_id" type="INTEGER" isKey={true} isForeignKey={false} isNullable={false} isAutoincrement={true} />
      <Column name="item_name" type="VARCHAR(255)" isKey={false} isForeignKey={false} isNullable={false} isAutoincrement={false} />
    </Table>
  </RelSchema>
)
