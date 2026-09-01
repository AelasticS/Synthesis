/** @jsx createExprNode */

/**
 * The tutorial relational metamodel expressed as a types-metamodel
 * model. It ships with the transformation as a manifest part and is
 * rendered into the store before the decision and binding models, so the
 * binding model has a real sourceModel to reference.
 *
 * Only the concepts the binding model has to name are declared here. The
 * transformation itself works against the real metamodel package
 * (@synthesis/standard-metamodels/rel-tutorial); this model is the
 * vocabulary the decision machinery talks about, not a second definition
 * of the language.
 */
import type { ModelStore } from '@aelastics/synthesis/store'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { createExprNode } from '@aelastics/synthesis/jsx'
import {
  Property,
  PropertyDomain,
  TypeArray,
  TypeModel,
  TypeObject
} from '@aelastics/synthesis/metamodels/types/components'
import type * as t from '@aelastics/synthesis/metamodels/types/model'
import { TypeBoolean, TypeString } from '@aelastics/synthesis/metamodels/types/predefined-types'

export const RelTutorialMetamodel = (store: ModelStore): ExprNode<t.ITypeModel> => (
  <TypeModel name="RelTutorialMetamodel" store={store}>
    <TypeString name="string"></TypeString>
    <TypeBoolean name="boolean"></TypeBoolean>

    {/* A column carries its SQL type and its key, nullability and
        autoincrement flags. `references` is deliberately absent: the
        binding model does not need it, and a metamodel part declares
        only the vocabulary the decisions talk about. */}
    <TypeObject name="Column">
      <Property name="type">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="isKey">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="Table">
      <Property
        name="columns"
        domain={<TypeArray name="ArrayOfColumns" elementType={<TypeObject $refByName="Column" />} />}
      />
    </TypeObject>

    <TypeObject name="RelSchema">
      <Property
        name="tables"
        domain={<TypeArray name="ArrayOfTables" elementType={<TypeObject $refByName="Table" />} />}
      />
    </TypeObject>
  </TypeModel>
)
