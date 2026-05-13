import {
  Model as GenericModel,
  ModelElement,
  IModel,
  IModelElement,
} from "@synthesis/metamodel-core"
import { CpxTemplate, ExprNode, Template, WithRefProps } from "./element"
import { IStore } from "./istore"

/**
 * Props for the `<Model>` JSX wrapper. Carries an optional `store` —
 * required when the `<Model>` is the root of a JSX tree being rendered
 * standalone (the store needs to be present in context to allocate
 * the new model element).
 */
export type IModelProps = WithRefProps<IModel> & {
  store?: IStore
}

/**
 * JSX wrapper that produces a generic `IModel` ExprNode.
 */
export const Model: CpxTemplate<IModelProps, IModel> = (props) => {
  return new ExprNode(GenericModel, props, undefined)
}

/**
 * JSX wrapper that produces a generic `IModelElement` ExprNode.
 * Used as a polymorphic placeholder in transformation rules and trace
 * models where the concrete element type isn't known at template time.
 */
export const Element: Template<IModelElement> = (props) => {
  return new ExprNode(ModelElement, props, undefined)
}
