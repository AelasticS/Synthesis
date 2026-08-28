/** @jsx createExprNode */

import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import type { ModelStore } from '@synthesis/engine'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'
import type * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'

export const $synth = {
  kind: 'model',
  metamodel: '@synthesis/standard-metamodels/relational',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample relational schema: import it to try the rel-copy example'
} as const

export default (store: ModelStore): ExprNode<rmT.IRelSchema> => (
  <RelSchema name="LibraryDb" content="" MDA_level="M1" store={store}>
    {/* Element names are unique across the whole model in the store's
        naming scheme, so columns carry table-qualified names — the same
        convention the eer-to-relational naming decisions generate. */}
    <Table name="book">
      <Column name="book_id" type="int" isKey={true} isForeignKey={false} isNullable={false} isAutoincrement={true} />
      <Column name="book_title" type="varchar(255)" isKey={false} isForeignKey={false} isNullable={false} isAutoincrement={false} />
      <Column
        name="book_author_id"
        type="int"
        isKey={false}
        isForeignKey={true}
        isNullable={false}
        isAutoincrement={false}
        references="author"
      />
    </Table>
    <Table name="author">
      <Column name="author_id" type="int" isKey={true} isForeignKey={false} isNullable={false} isAutoincrement={true} />
      <Column name="author_name" type="varchar(255)" isKey={false} isForeignKey={false} isNullable={false} isAutoincrement={false} />
    </Table>
  </RelSchema>
)
