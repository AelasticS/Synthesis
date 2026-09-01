/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import { RelSchema, Table, Column } from 'relational-metamodel'
import type * as rmT from 'relational-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'relational-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample relational schema: import it to try the rel-to-sql-ddl example'
} as const

export default (store: ModelStore): ExprNode<rmT.IRelSchema> => (
  <RelSchema name="LibraryDb" content="" MDA_level="M1" store={store}>
    {/* Element names are unique across the whole model in the store's
        naming scheme, so columns carry table-qualified names, the same
        convention that the eer-to-relational naming decisions generate. */}
    <Table name="book">
      <Column name="book_id" type="INTEGER" isKey={true} isForeignKey={false} isNullable={false} isAutoincrement={true} />
      <Column name="book_title" type="VARCHAR(255)" isKey={false} isForeignKey={false} isNullable={false} isAutoincrement={false} />
      <Column
        name="book_author_id"
        type="INTEGER"
        isKey={false}
        isForeignKey={true}
        isNullable={false}
        isAutoincrement={false}
        references="author"
      />
    </Table>
    <Table name="author">
      <Column name="author_id" type="INTEGER" isKey={true} isForeignKey={false} isNullable={false} isAutoincrement={true} />
      <Column name="author_name" type="VARCHAR(255)" isKey={false} isForeignKey={false} isNullable={false} isAutoincrement={false} />
    </Table>
  </RelSchema>
)
