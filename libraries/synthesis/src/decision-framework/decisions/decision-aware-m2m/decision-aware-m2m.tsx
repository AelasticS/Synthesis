/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2023.
 *
 * DecisionAwareM2M: a decision-aware specialization of the engine's
 * abstractM2M. It carries an optional configuration model, a per-element
 * decision stack, and the run's resolution facts (every configuration
 * option resolved by a @VarPoint, nested consultations included). Trace
 * rendering is outcome-shaped: one entry per executed rule, each fact
 * attached to the entry of the element it was decided for, or to the
 * trace model itself (global issues, and element-scoped facts whose
 * element no rule transformed).
 */

import { IModel, IModelElement } from "../../../metamodel-core"
import {
  createExprNode,
  ExprNode,
  Element as CModelElement,
  Model,
} from "../../../jsx-runtime"
import {
  abstractM2M,
  IM2M,
  M2MContext,
  ModelStore,
  RawTraceEntryData,
  Stack,
} from "../../../engine"
import { IConfigurationModel, IChoice } from "../3.configuration-model/configuration-meta.model"
import { Choice as ChoiceRef } from "../3.configuration-model/configuration-meta.model-components"
import {
  IDecisionAwareTraceModel,
} from "../trace-extensions/trace-extensions.meta.model"
import * as tmC from "../trace-extensions/trace-extensions-components"

export interface IVarResolution {
  optionName: string
  choices: IChoice[]
}

// One resolved configuration outcome, recorded by @VarPoint at dispatch
// time. `issue` and `option` are decision-model names; `optionMethod`
// is the executed option method, used to attach the fact to the entry
// of the very rule that consulted it in the directly stacked case.
export interface IResolutionFact {
  issue: string
  option: string
  optionMethod: string
  element?: IModelElement
  choice?: IChoice
  byDefault: boolean
}

export class DecisionAwareM2MContext<P = undefined> extends M2MContext<P> {
  // Stack of choices currently in scope for the element being transformed.
  // @VarPoint pushes per-element choices; option methods read the top of the
  // stack via eval-operators.
  public currentElementDecision: Stack<IChoice[]> = new Stack<IChoice[]>()

  // Stack for nested VarPoint calls — VarPoint pushes/pops, E2E reads lastVarResolution
  public readonly varResolutionStack: Stack<IVarResolution> = new Stack<IVarResolution>()

  // Last VarResolution — set by VarPoint in finally; @E2E consumes it and
  // names the entry after the executed option method.
  public lastVarResolution?: IVarResolution

  // The run's resolution facts, deduplicated per (issue, element):
  // resolution is deterministic for a pair, so the first record stands.
  // This is what guarantees that every resolved option is recorded,
  // nested consultations included.
  public readonly resolutionFacts: IResolutionFact[] = []

  public recordResolution(fact: IResolutionFact): void {
    const existing = this.resolutionFacts.find(
      (f) => f.issue === fact.issue && f.element === fact.element,
    )
    if (!existing) {
      this.resolutionFacts.push(fact)
    }
  }
}

export interface IDecisionAwareM2M<
  S extends IModel,
  D extends IModel,
  EM extends { [key: string]: IModel } = {},
  CM extends IConfigurationModel = never,
  P = undefined
> extends IM2M<S, D, EM, P> {
  context: DecisionAwareM2MContext<P>
  configModel?: CM
}

export abstract class DecisionAwareM2M<
  S extends IModel,
  D extends IModel,
  EM extends { [key: string]: IModel } = {},
  CM extends IConfigurationModel = never,
  P = undefined
> extends abstractM2M<S, D, EM, P>
  implements IDecisionAwareM2M<S, D, EM, CM, P> {
  // Replace base context with the decision-aware subtype.
  public override context: DecisionAwareM2MContext<P> = new DecisionAwareM2MContext<P>()
  public configModel?: CM

  public constructor(store?: ModelStore, extra?: EM, configModel?: CM) {
    super(store, extra)
    if (store) this.context.pushStore(store)
    this.configModel = configModel
  }

  /**
   * Outcome-shaped decision-aware trace rendering.
   *
   * Emits one DecisionTraceEntry per executed rule and Resolution
   * elements for every recorded fact: on the entry whose source is the
   * fact's element (preferring the entry of the rule that consulted it,
   * the directly stacked case), or on the trace model for global issues
   * and for elements no rule transformed. The configuration model in
   * use is referenced on the trace model.
   */
  protected override createTraceModel(): ExprNode<IDecisionAwareTraceModel> {
    const data = this.traceEntryData()
    const facts = this.context.resolutionFacts

    const perRaw = new Map<RawTraceEntryData, IResolutionFact[]>()
    const attached = new Set<IResolutionFact>()
    for (const fact of facts) {
      if (!fact.element) continue
      const candidates = data.filter((d) => d.raw.sourceModelElement === fact.element)
      if (candidates.length === 0) continue
      const chosen = candidates.find((d) => d.raw.ruleName === fact.optionMethod) ?? candidates[0]
      const list = perRaw.get(chosen.raw)
      if (list) {
        list.push(fact)
      } else {
        perRaw.set(chosen.raw, [fact])
      }
      attached.add(fact)
    }
    const modelFacts = facts.filter((f) => !attached.has(f))

    // Resolution names live in the trace model's flat name scope; a
    // running counter keeps them unique and deterministic.
    let resolutionCounter = 0
    const resolutionNode = (fact: IResolutionFact, elementImplied: boolean) => {
      resolutionCounter += 1
      return (
        <tmC.Resolution
          name={`r${resolutionCounter}_${fact.issue}`}
          issue={fact.issue}
          option={fact.option}
          byDefault={fact.byDefault ? true : undefined}
          element={!elementImplied && fact.element
            ? <CModelElement $refByName={this.fullElementRef(fact.element)} />
            : undefined}
          choice={fact.choice
            ? <ChoiceRef $refByName={this.fullElementRef(fact.choice)} />
            : undefined}
        />
      )
    }

    const traceJSXEntries = data.map(({ raw, entryName, targetRefs }) => {
      const entryFacts = perRaw.get(raw) ?? []
      return (
        <tmC.DecisionTraceEntry
          name={entryName}
          rule={raw.ruleName}
          source={<CModelElement $refByName={this.fullElementRef(raw.sourceModelElement)} />}
          targets={targetRefs}
        >
          {entryFacts.map((f) => resolutionNode(f, f.element === raw.sourceModelElement))}
        </tmC.DecisionTraceEntry>
      )
    })

    return (
      <tmC.DecisionAwareTraceModel
        name={`${this.context.input.instance?.name} to ${this.context.output.instance?.name}`}
        store={this.context.store}
        timestamp={new Date().toISOString()}
        transformation={this.transformationName()}
        source={<Model $refByName={this.fullElementRef(this.context.input.instance!)} />}
        config={this.configModel ? <Model $refByName={this.fullElementRef(this.configModel)} /> : null}
        targets={[<Model $refByName={this.fullElementRef(this.context.output.instance!)} />]}
      >
        {modelFacts.map((f) => resolutionNode(f, false))}
        {traceJSXEntries}
      </tmC.DecisionAwareTraceModel>
    )
  }
}
