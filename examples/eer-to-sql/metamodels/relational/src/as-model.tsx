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
 * The relational metamodel as a model, mirroring the rich content of
 * model.ts: tables with columns, foreign keys (composite capable via
 * ForeignKeyColumn pairs), and indexes. Its role is to stand for the
 * source metamodel of the Rel to DDL transformation so the DDL binding
 * model has a real sourceModel to reference, the same way ER_Bindings
 * references ERMetamodel.
 */
export const RELModel = (store: ModelStore): ExprNode<t.ITypeModel> => (
  <TypeModel name="RELMetamodel" store={store}>
    <TypeString name="string"></TypeString>
    <TypeBoolean name="boolean"></TypeBoolean>

    <TypeObject name="Domain">
      <Property name="domainType">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="domainCheck">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="domainDefault">
        <PropertyDomain $refByName="string" />
      </Property>
    </TypeObject>

    <TypeObject name="Column">
      <Property name="type">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="columnDomain" domain={<TypeObject $refByName="Domain" />} />
      <Property name="isKey">
        <PropertyDomain $refByName="boolean" />
      </Property>
      <Property name="isNullable">
        <PropertyDomain $refByName="boolean" />
      </Property>
      <Property name="isAutoincrement">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="ForeignKeyColumn">
      <Property name="fkColumn" domain={<TypeObject $refByName="Column" />} />
      <Property name="refColumn" domain={<TypeObject $refByName="Column" />} />
    </TypeObject>

    <TypeObject name="ForeignKey">
      <Property name="fkPairs"
                domain={<TypeArray name="ArrayOfForeignKeyColumns" elementType={<TypeObject $refByName="ForeignKeyColumn" />} />}
      />
      <Property name="fkIsUnique">
        <PropertyDomain $refByName="boolean" />
      </Property>
      <Property name="fkOnDelete">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="fkOnUpdate">
        <PropertyDomain $refByName="string" />
      </Property>
      {/* referencedTable omitted: Table is defined below and this
          simplified mirror keeps definition order acyclic */}
    </TypeObject>

    <TypeObject name="Index">
      <Property name="indexColumns"
                domain={<TypeArray name="ArrayOfIndexColumns" elementType={<TypeObject $refByName="Column" />} />}
      />
      <Property name="indexIsUnique">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="Table">
      <Property name="tableColumns"
                domain={<TypeArray name="ArrayOfColumns" elementType={<TypeObject $refByName="Column" />} />}
      />
      <Property name="foreignKeys"
                domain={<TypeArray name="ArrayOfForeignKeys" elementType={<TypeObject $refByName="ForeignKey" />} />}
      />
      <Property name="indexes"
                domain={<TypeArray name="ArrayOfIndexes" elementType={<TypeObject $refByName="Index" />} />}
      />
    </TypeObject>

    <TypeObject name="RelSchema">
      <Property name="tables"
                domain={<TypeArray name="ArrayOfTables" elementType={<TypeObject $refByName="Table" />} />}
      />
    </TypeObject>
  </TypeModel>
)
