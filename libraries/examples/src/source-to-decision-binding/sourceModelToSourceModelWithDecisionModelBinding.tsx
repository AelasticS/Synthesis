/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { abstractM2M } from "@aelastics/synthesis/m2m"
import { ExprNode, Resolve } from "@aelastics/synthesis/jsx"
import { Context } from "@aelastics/synthesis/jsx"
import { E2E, M2M, SpecPoint, SpecOption } from "@aelastics/synthesis/m2m"
import { ModelStore } from "@aelastics/synthesis/store"
import { IModel, IModelElement, Model, ModelElement } from "@aelastics/synthesis/metamodel"
import * as gdmT from "@aelastics/synthesis/metamodels/decision/model"
import * as gdmC from "@aelastics/synthesis/metamodels/decision"

import * as dbmT from "@aelastics/synthesis/metamodels/binding/model"
import * as dbmC from "@aelastics/synthesis/metamodels/binding"


export class SourceModelToSourceModelWithDecisionModelBinding extends abstractM2M<IModel, dbmT.IBindingModel, {
  "bindingModel": dbmT.IBindingModel
}> {
  constructor(store: ModelStore, extra?: { "bindingModel": dbmT.IBindingModel }) {
    super(store, extra)
  }

  template(s: IModel) {
    return (
      <dbmC.BindingModel
        name={s.name + " Decision Template Binding Model"}
        description={s.description}
      >
        {s.elements.map((r) => {
          const bindingElements: dbmT.IBindingElement[] = this.getBindingElementBySourceModelElement(r as IModelElement)

          const issues: gdmT.IIssue[] = bindingElements.flatMap((e) => {
            return e.issues
          })

          return (
            <dbmC.BindingElement
              name={`Decision for ${r.name}`}
              description={`Decision for ${r.name}`}
              issues={issues}
              condition="return (e) => true"
              // sourceModelElementRef={<ModelElement $refByName={`${r.path}/${r.name}`} />}
              // TODO there is no component for ModelElement
            />
          )

        })}
      </dbmC.BindingModel>

    )
  }

  private getBindingElementBySourceModelElement(sourceModelElement: IModelElement): dbmT.IBindingElement[] {
    return this.extra?.bindingModel.elements.filter((e) => {
      const type = this.context.store.getTypeOf(sourceModelElement)
      const fn = (e as dbmT.IBindingElement).condition === undefined || new Function((e as dbmT.IBindingElement).condition!)()

      const res = (e as dbmT.IBindingElement).element.name === type.name
        && (typeof fn !== "function" || (typeof fn === "function" && fn(sourceModelElement)))

      return res
    }) as dbmT.IBindingElement[] || [] as dbmT.IBindingElement[]
  }

}