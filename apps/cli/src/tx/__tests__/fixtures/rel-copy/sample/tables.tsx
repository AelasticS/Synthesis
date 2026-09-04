/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { RelSchema, Table, Column } from 'rel-tutorial-metamodel'
import type * as rmT from 'rel-tutorial-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'rel-tutorial-metamodel',
  author: 'Test Author <test@example.org>',
  version: '0.1.0',
  description: 'Minimal rel-tutorial schema feeding the rel-copy fixture in chain tests'
} as const

export default (store: ModelStore): ExprNode<rmT.IRelSchema> => (
  <RelSchema name="Tables" store={store}>
    <Table name="Author">
      <Column name="authorId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
      <Column name="authorName" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
    </Table>
    <Table name="Book">
      <Column name="bookId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
      <Column
        name="authorId_FK"
        type="INTEGER"
        isKey={false}
        isAutoincrement={false}
        isNullable={false}
        references={<Column $refByName="authorId" />}
      />
    </Table>
  </RelSchema>
)
