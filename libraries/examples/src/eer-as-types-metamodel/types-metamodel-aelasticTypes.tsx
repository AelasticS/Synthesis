/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx-runtime"
import { ExprNode } from "@aelastics/synthesis/jsx-runtime"
import * as t from "@aelastics/synthesis/metamodels/types/model"
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
} from "@aelastics/synthesis/metamodels/types/components"
import { Context } from "@aelastics/synthesis/jsx-runtime"
import { ModelStore, P } from "@aelastics/synthesis/engine"

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