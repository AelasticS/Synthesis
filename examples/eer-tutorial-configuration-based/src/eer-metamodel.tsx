/** @jsx createExprNode */

/**
 * The tutorial EER metamodel expressed as a types-metamodel model. It
 * ships with the transformation as a manifest part and is rendered into
 * the store before the decision and binding models, so the binding model
 * can reference its concepts by absolute path.
 *
 * Only the concepts the binding model has to name are declared here.
 * The transformation itself works against the real metamodel package
 * (@synthesis/standard-metamodels/eer-tutorial/advanced); this model is
 * the vocabulary the decision machinery talks about, not a second
 * definition of the language.
 */
import type { ModelStore } from '@synthesis/engine'
import type { ExprNode } from '@synthesis/jsx-runtime'
import { createExprNode } from '@synthesis/jsx-runtime'
import {
  Property,
  PropertyDomain,
  TypeArray,
  TypeModel,
  TypeObject,
} from '@synthesis/standard-metamodels/types-metamodel/components'
import type * as t from '@synthesis/standard-metamodels/types-metamodel/model'
import { TypeBoolean, TypeString } from '@synthesis/standard-metamodels/types-metamodel/predefined-types'

export const EERTutorialMetamodel = (store: ModelStore): ExprNode<t.ITypeModel> => (
  <TypeModel name="EERTutorialMetamodel" store={store}>
    <TypeString name="string"></TypeString>
    <TypeBoolean name="boolean"></TypeBoolean>

    {/* A named value space an attribute draws from. */}
    <TypeObject name="Domain" />

    <TypeObject name="Attribute">
      <Property name="attrDomain">
        <PropertyDomain $refByName="Domain" />
      </Property>
      <Property name="isKey">
        <PropertyDomain $refByName="boolean" />
      </Property>
    </TypeObject>

    <TypeObject name="Entity">
      <Property
        name="attributes"
        domain={<TypeArray name="ArrayOfAttributes" elementType={<TypeObject $refByName="Attribute" />} />}
      />
    </TypeObject>

    {/* One end of a relationship: the entity it reaches and the
        cardinality bounds the binding model's condition reads. */}
    <TypeObject name="Role">
      <Property name="domain">
        <PropertyDomain $refByName="Entity" />
      </Property>
      <Property name="lb">
        <PropertyDomain $refByName="string" />
      </Property>
      <Property name="ub">
        <PropertyDomain $refByName="string" />
      </Property>
    </TypeObject>

    {/* The concept the OneToManyStrategy issue is bound to. */}
    <TypeObject name="Relationship">
      <Property
        name="roles"
        domain={<TypeArray name="ArrayOfRoles" elementType={<TypeObject $refByName="Role" />} />}
      />
    </TypeObject>
  </TypeModel>
)
