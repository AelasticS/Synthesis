/** @jsx createExprNode */

import { createExprNode } from "@synthesis/jsx-runtime"
import { ExprNode } from "@synthesis/jsx-runtime"
import * as t from "@synthesis/standard-metamodels/types-metamodel/model"
import {
    TypeObject,
    Property,
    TypeSupertype,
    TypeModel,
    TypeSubtype,
    TypeOptional,
    TypeOfOptional,
    PropertyDomain, TypeObjectReference, TypeArray, ArrayElementType,
    TypeEntity,
} from "@synthesis/standard-metamodels/types-metamodel/components"
import { Context } from "@synthesis/jsx-runtime"
import { ModelStore, P } from "@synthesis/engine"

const store = new ModelStore();

export const aelasticsTypesModel: ExprNode<t.ITypeModel> = (

    <TypeModel name="AelasticsTypes" store={store}>
        <TypeObject name="Type" />

        <TypeObject name="Optional">
            <Property name="optionalType">
                <PropertyDomain $refByName="Type" />
            </Property>
        </TypeObject>

    </TypeModel>
);