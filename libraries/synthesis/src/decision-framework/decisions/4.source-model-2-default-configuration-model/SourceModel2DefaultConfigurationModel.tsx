/** @jsx createExprNode */

import { createExprNode } from "../../../jsx-runtime"
import { abstractM2M } from "../../../engine"
import { ExprNode } from "../../../jsx-runtime"
import { E2E, ModelStore, M2M } from "../../../engine"
import { IModel, IModelElement, Model, ModelElement } from "../../../metamodel-core"

import * as dmT from "../1.decision-model/decision-meta.model"
import * as bmT from "../2.binding-model/binding-meta.model"

import * as cmT from "../3.configuration-model/configuration-meta.model"
import * as cmC from "../3.configuration-model/configuration-meta.model-components"
import { Choice } from "../3.configuration-model/configuration-meta.model-components"


export class SourceModelToDefaultConfigurationModel extends abstractM2M<IModel, cmT.IConfigurationModel, {
  "bindingModel": bmT.IBindingModel
}> {
  constructor(store: ModelStore, extra: { "bindingModel": bmT.IBindingModel }) {
    super(store, extra)
  }

  template(s: IModel) {
    return (
      <cmC.ConfigurationModel
        name={s.name + " Default Configuration Model"}
        description={s.description}
        sourceModel={s as IModel}
        bindingModel={this.extra?.bindingModel as bmT.IBindingModel}
      >

        {this.extra?.bindingModel.decisionModel.issues.filter((issue: dmT.IIssue) => {
          return this.context.store.isTypeOf(issue, dmT.ModelIssue)
        })
          .flatMap((issue) => this.issueWithChosenSubIssues(issue))
          .map((issue) => {
            return this.createGlobalChoice(issue)
          })}

        {s.elements.map((r) => {
          return this.createElementChoices(r as IModelElement)
        })}
      </cmC.ConfigurationModel>

    )
  }

  private createElementChoices(sourceModelElement: IModelElement): ExprNode<cmT.IDecision> | null {

    const decisionBindingElements = this.getBindingElementBySourceModelElement(sourceModelElement)
    // this shuld be one binding element for each source model element, but eventually it can be more than one, so we need to handle thats
    const choices = decisionBindingElements.flatMap((e) => {
      return e.issues
        .flatMap((issue) => this.issueWithChosenSubIssues(issue))
        .map((issue) => {
          return this.createChosenOptionForIssue(issue) as unknown as cmT.IChoice
        })
    })

    if (choices.length === 0) {
      return null
    }

    const type = this.context.store.getTypeOf(sourceModelElement)
    const scopedName = this.scopedNameOf(sourceModelElement)

    return (
      <cmC.ElementChoice
        name={`ec_${scopedName}`}
        description={`Decision for ${scopedName} of type ${type.name}`}
        element={sourceModelElement}
        choices={choices}
      >


      </cmC.ElementChoice>
    )
  }

  /** The element's name qualified by its scope chain: the path
   * segments below its model, joined by underscores. In a flat model
   * this is exactly the element's name; under name scopes it stays
   * unique where bare names repeat (three entities, each with an
   * attribute `id`). */
  private scopedNameOf(el: IModelElement): string {
    const name = String(el.name)
    // an element's `path` is the path of its enclosing scope, so the
    // element's own name is appended to form the qualified suffix
    const path = (el as { path?: string }).path
    const modelName = (el as { parentModel?: { name?: string } }).parentModel?.name
    if (!path || !modelName) return name
    const segments = path.split("/").filter((seg) => seg.length > 0)
    const idx = segments.indexOf(modelName)
    if (idx === -1) return name
    return [...segments.slice(idx + 1), name].join("_")
  }

  /** The option a default configuration chooses for an issue: the one
   * marked isDefault, or the first declared one. */
  private chosenOptionOf(issue: dmT.IIssue): dmT.IOption | undefined {
    return (
      issue.possibleOptions.find((o: dmT.IOption) => o.isDefault === true)
      ?? issue.possibleOptions[0]
    )
  }

  /** The issue followed, transitively, by the sub-issues its chosen
   * option opens: a CompositeOption's sub-issues are part of the path
   * the defaults actually take, so the generated configuration answers
   * them in the same decision context. Sub-issues behind unchosen
   * options stay quiet; if a later edit takes that path, the run-time
   * default fallback covers them. */
  private issueWithChosenSubIssues(issue: dmT.IIssue): dmT.IIssue[] {
    const chosen = this.chosenOptionOf(issue)
    const subIssues = ((chosen?.optionType as dmT.ICompositeOption | undefined)?.subIssues ?? []) as dmT.IIssue[]
    return [issue, ...subIssues.flatMap((sub) => this.issueWithChosenSubIssues(sub))]
  }

  private createChosenOptionForIssue(issue: dmT.IIssue): ExprNode<cmT.IChoice> {

    const defaultOption: dmT.IOption | undefined = this.chosenOptionOf(issue)

    // Ensure defaultOption is defined and of correct type
    if (!defaultOption) {
      throw new Error("No possible options available for issue: " + issue.label)
    }

    // Create the specific component for this option
    // const SelectedOptionForThisOption = dmC.SelectedOption(defaultOption);

    return (
      <cmC.Choice
        name={`c_${defaultOption.name}` + Math.random().toString(16).slice(2)}
        description={`Selected option is ${defaultOption.name}`}
        selectedOption={defaultOption as dmT.IOption}
        issue={(defaultOption as dmT.IOption).ParentIssue}
      >
      </cmC.Choice>
    )
  }

  private getBindingElementBySourceModelElement(sourceModelElement: IModelElement): bmT.IBindingElement[] {
    return this.extra?.bindingModel.bindings.filter((e) => {
      const type = this.context.store.getTypeOf(sourceModelElement)
      const fn = (e as bmT.IBindingElement).condition === undefined || new Function((e as bmT.IBindingElement).condition!)()

      const type2 = this.context.store.getAElasticsType(sourceModelElement);
      const a = this.context.store.isTypeOf(sourceModelElement, type);

      const res = (e as bmT.IBindingElement).element.name === type.name
        && (typeof fn !== "function" || (typeof fn === "function" && fn(sourceModelElement)))

      return res
    }) as bmT.IBindingElement[] || [] as bmT.IBindingElement[]
  }

  private createGlobalChoice(issue: dmT.IModelIssue) {
    return <cmC.GlobalChoice name={`gc_${issue.name}`}
                             choices={[this.createChosenOptionForIssue(issue) as unknown as cmT.IChoice]}

    />
  }
}