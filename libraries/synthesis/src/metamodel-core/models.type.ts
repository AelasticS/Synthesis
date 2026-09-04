/*
 * Copyright (c) AelasticS 2019.
 *
 * The semantic core: what is INSIDE a model. Everything about a model
 * as an ARTIFACT (conformance, version, ownership, storage,
 * relationships between models) lives in the envelope around the
 * serialized model (the $synth header and manifest today, a model
 * repository row tomorrow), never here.
 */

import * as t from "@aelastics/types";
import { NameType, DescriptionType } from "./basic.type";
import { declareNamespace } from "./namespace";

export const ModelSchema = t.schema("RepModelSchema");

export const ModelElement = t.entity({
    // name must be RegExp("^[a-zA-Z0-9_.-]+$"); normalized at creation
    // (whitespace stripped), unique per name scope
    name: NameType,
    // label preserves the pre-normalization name for display ("Approve 1"
    // when name became "Approve1"); backfilled from name by the store
    label: t.optional(t.string),
    description: t.optional(DescriptionType),
    // the full path of the enclosing name scope, set by the store
    path: t.optional(t.string),
    parentModel: t.optional(t.link(ModelSchema, 'Model')),
}, ['name'] as const, "ModelElement", ModelSchema);

export const Model = t.subtype(ModelElement, {
    elements: t.arrayOf(ModelElement),
}, "Model", ModelSchema);

t.inverseProps(ModelElement, 'parentModel', Model, 'elements')

// A model scopes the names of its elements; further concepts opt in
// with their own declareNamespace call in their metamodel module.
declareNamespace(Model)

export type IModelElement = t.TypeOf<typeof ModelElement>
export type IModel = t.TypeOf<typeof Model>
/** @deprecated Namespace is a classification, not a type: declare
 * concepts with declareNamespace and test with isNamespaceType. */
export type INamespace = IModelElement
