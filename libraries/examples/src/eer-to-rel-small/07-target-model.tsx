/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"
import {
  Column,
  RelSchema,
  Table,
} from "@synthesis/standard-metamodels/relational/components-legacy"

export const RelationalSchema_Company = (store: ModelStore) => (
  <RelSchema name="CompanyRelationalSchema" store={store}>
    <Table name="person">
      <Column name="person_id" type="INTEGER" isKey={true} />
      <Column name="name" type="VARCHAR" />
    </Table>

    <Table name="company">
      <Column name="company_id" type="INTEGER" isKey={true} />
      <Column name="company_name" type="VARCHAR" />
    </Table>

    <Table name="employment">
      <Column name="person_id"
              type="INTEGER"
              isForeignKey={true}
              isKey={true}
              references={<Column $refByName="//www.aelastics.org/CompanyRelationalSchema/person/person_id" />}
      />
      <Column name="company_id"
              type="INTEGER"
              isForeignKey={true}
              isKey={true}
              references={<Column $refByName="//www.aelastics.org/CompanyRelationalSchema/company/company_id" />} />
    </Table>
  </RelSchema>
)
