import { Model as GenericModel, ModelElement, IModel, IModelElement } from "@synthesis/metamodel-core"
import { CpxTemplate, ExprNode, Template, WithRefProps, ModelStore } from "@synthesis/engine"

export type IModelProps = WithRefProps<IModel> & {
  store?: ModelStore;
};

export const Model: CpxTemplate<IModelProps, IModel> = (props) => {
  return new ExprNode(GenericModel, props, undefined)
}

export const Element: Template<IModelElement> = (props) => {
  return new ExprNode(ModelElement, props, undefined)
}