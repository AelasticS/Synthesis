/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { RelSchema, Table, Column, ForeignKey, ForeignKeyColumn, Index, PrimaryKey } from 'relational-metamodel'
import type * as t from 'relational-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'relational-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample relational schema with a real foreign key and an index: import it to try the rel-to-sql-ddl example'
} as const satisfies SynthHeaderInput

export default (store: ModelStore): ExprNode<t.IRelSchema> => (
  <RelSchema name="LibraryDb" store={store}>
    <Table name="author">
      <Column name="id" type="INTEGER" isNullable={false} isAutoincrement={true} />
      <Column name="name" type="VARCHAR(255)" isNullable={false} isAutoincrement={false} />
      <PrimaryKey name="pk_author">
        <Column $refByName="id" />
      </PrimaryKey>
    </Table>
    <Table name="book">
      <Column name="id" type="INTEGER" isNullable={false} isAutoincrement={true} />
      <Column name="title" type="VARCHAR(255)" isNullable={false} isAutoincrement={false} />
      <Column name="author_id" type="INTEGER" isNullable={true} isAutoincrement={false} />
      <PrimaryKey name="pk_book">
        <Column $refByName="id" />
      </PrimaryKey>
      <ForeignKey name="fk_book_author" isUnique={false}
        referencedTable={<Table $refByName="author" />}>
        <ForeignKeyColumn name="fk_book_author_p1">
          <Column $refByName="author_id" />
          <Column $refByName="author/id" />
        </ForeignKeyColumn>
      </ForeignKey>
      <Index name="ix_fk_book_author" isUnique={false}>
        <Column $refByName="author_id" />
      </Index>
    </Table>
  </RelSchema>
)
