/** @jsx createExprNode */
/**
 * The tutorial relational metamodel expressed as a types-metamodel
 * model. It ships with the transformation as a manifest part and is
 * rendered into the store before the decision and binding models, so the
 * binding model has a real sourceModel to reference.
 *
 * Only the concepts the binding model has to name are declared here. The
 * transformation itself works against the real metamodel package
 * (rel-tutorial-metamodel); this model is the
 * vocabulary the decision machinery talks about, not a second definition
 * of the language.
 */
import type { ModelStore } from '@aelastics/synthesis/store';
import type { ExprNode } from '@aelastics/synthesis/jsx';
import type * as t from '@aelastics/synthesis/metamodels/types/model';
export declare const RelTutorialMetamodel: (store: ModelStore) => ExprNode<t.ITypeModel>;
