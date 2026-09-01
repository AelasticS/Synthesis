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
 * Minimal relational metamodel model, mirroring `er-metamodel.tsx` of the
 * eer-to-rel-small example. Its role here is to stand for the source
 * metamodel of the Rel->DDL transformation so the DDL binding model has a
 * real `sourceModel` to reference — the same way `ER_Bindings` references
 * `ERMetamodel`.
 */
export const RELModel = (store: ModelStore): ExprNode<t.ITypeModel> => (
  <TypeModel name="RELMetamodel" store={store}>
    <TypeString name="string"></TypeString>
    <TypeBoolean name="boolean"></TypeBoolean>

    <TypeObject name="Column">
      <Property name="type">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="isKey">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="Table">
      <Property name="columns"
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
