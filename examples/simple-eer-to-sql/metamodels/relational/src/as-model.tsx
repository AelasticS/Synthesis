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
 * REL.meta.model.type.ts: tables with flat columns (type, key and
 * foreign-key flags, optional reference, nullability, autoincrement),
 * and domains.
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
      <Property name="type">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="isKey">
        <PropertyDomain $refByName="boolean" />
      </Property>
      <Property name="isForeignKey">
        <PropertyDomain $refByName="boolean" />
      </Property>
      <Property name="references">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="isNullable">
        <PropertyDomain $refByName="boolean" />
      </Property>
      <Property name="isAutoincrement">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="Table" isNamespace={true}>
      <Property name="tableColumns"
                domain={<TypeArray name="ArrayOfColumns" elementType={<TypeObject $refByName="Column" />} />}
      />
    </TypeObject>

    <TypeObject name="RelSchema">
      <Property name="tables"
                domain={<TypeArray name="ArrayOfTables" elementType={<TypeObject $refByName="Table" />} />}
      />
    </TypeObject>
  </TypeModel>
)
