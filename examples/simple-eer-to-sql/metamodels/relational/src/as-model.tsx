/** @jsx createExprNode */

import { ModelStore } from "@aelastics/synthesis/store"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { createExprNode } from "@aelastics/synthesis/jsx"
import {
  Property,
  PropertyDomain,
  TypeArray,
  TypeModel,
  TypeObject,
} from "@aelastics/synthesis/metamodels/types/components"
import * as t from "@aelastics/synthesis/metamodels/types/model"
import { TypeBoolean, TypeString } from "@aelastics/synthesis/metamodels/types/predefined-types"

/**
 * The simple relational metamodel as a model, mirroring the content of
 * REL.meta.model.type.ts: tables with columns, foreign keys (composite
 * capable, via ForeignKeyColumn pairs), and indexes. Links that would
 * point forward to a type defined later (Column.indexes, the
 * referencedTable of a ForeignKey) are omitted so definition order
 * stays acyclic.
 */
export const RELModel = (store: ModelStore): ExprNode<t.ITypeModel> => (
  <TypeModel name="RELMetamodel" store={store}>
    <TypeString name="string"></TypeString>
    <TypeBoolean name="boolean"></TypeBoolean>

    <TypeObject name="Domain">
      <Property name="domainType">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="domainDefault">
        <PropertyDomain $refByName="string" />
      </Property>
    </TypeObject>

    <TypeObject name="Column">
      <Property name="columnDomain" domain={<TypeObject $refByName="Domain" />} />
      <Property name="isKey">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="Index">
      <Property name="indexColumns"
                domain={<TypeArray name="ArrayOfIndexColumns" elementType={<TypeObject $refByName="Column" />} />}
      />
      <Property name="indexIsUnique">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="ForeignKeyColumn">
      <Property name="fkColumn" domain={<TypeObject $refByName="Column" />} />
      <Property name="refColumn" domain={<TypeObject $refByName="Column" />} />
    </TypeObject>

    <TypeObject name="ForeignKey">
      <Property name="fkColumns"
                domain={<TypeArray name="ArrayOfForeignKeyColumns" elementType={<TypeObject $refByName="ForeignKeyColumn" />} />}
      />
      <Property name="fkIsUnique">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="Table" isNamespace={true}>
      <Property name="tableColumns"
                domain={<TypeArray name="ArrayOfColumns" elementType={<TypeObject $refByName="Column" />} />}
      />
      <Property name="tableIndexes"
                domain={<TypeArray name="ArrayOfIndexes" elementType={<TypeObject $refByName="Index" />} />}
      />
      <Property name="foreignKeys"
                domain={<TypeArray name="ArrayOfForeignKeys" elementType={<TypeObject $refByName="ForeignKey" />} />}
      />
    </TypeObject>

    <TypeObject name="RelSchema">
      <Property name="tables"
                domain={<TypeArray name="ArrayOfTables" elementType={<TypeObject $refByName="Table" />} />}
      />
    </TypeObject>
  </TypeModel>
)
