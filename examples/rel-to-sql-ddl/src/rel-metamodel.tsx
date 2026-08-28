/** @jsx createExprNode */

import { ModelStore } from "@synthesis/engine"
import { ExprNode } from "@synthesis/jsx-runtime"
import { createExprNode } from "@synthesis/jsx-runtime"
import {
  Property,
  PropertyDomain,
  TypeArray,
  TypeModel,
  TypeObject,
} from "@synthesis/standard-metamodels/types-metamodel/components"
import * as t from "@synthesis/standard-metamodels/types-metamodel/model"
import { TypeBoolean, TypeString } from "@synthesis/standard-metamodels/types-metamodel/predefined-types"

/**
 * Minimal relational metamodel model, mirroring er-metamodel.tsx of the
 * eer-to-relational example. Its role here is to stand for the source
 * metamodel of the Rel to DDL transformation so the DDL binding model
 * has a real sourceModel to reference, the same way ER_Bindings
 * references ERMetamodel.
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
