/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
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
import { Context } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"
import { P } from "@aelastics/synthesis/m2t"

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