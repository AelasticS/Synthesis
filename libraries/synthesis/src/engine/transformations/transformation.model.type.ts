import * as t from "@aelastics/types"
import {Model, ModelElement } from "../../metamodel-core";

export const TrSchema = t.schema("TrSchema");

// meta level
export const M2M_Transformation = t.subtype(Model, {
    from: t.string, // source metamodel full name (path)
    to: t.string    // destination metamodel full name (path)
}, "M2M_Transformation", TrSchema);

export const E2E_Transformation = t.subtype(ModelElement, {
    fromType: t.string, // source metamodel element full name (path)
    toType: t.string    // destination metamodel element full name (path)
}, "E2E_Transformation", TrSchema);


export type IM2M_Transformation = t.TypeOf<typeof M2M_Transformation>
export type IE2E_Transformation = t.TypeOf<typeof E2E_Transformation>
