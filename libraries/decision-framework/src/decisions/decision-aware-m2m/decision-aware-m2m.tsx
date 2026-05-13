/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2023.
 *
 * DecisionAwareM2M — a decision-aware specialization of @synthesis/engine's
 * abstractM2M. It carries an optional configuration model, a per-element
 * decision stack, and a variability resolution stack. Trace rendering is
 * extended to emit VariabilityPoint / SpecializationPoint entries and a
 * DecisionAwareTraceModel that records the configuration in use.
 */

import { IModel, IModelElement } from "@synthesis/metamodel-core"
import {
  createExprNode,
  ExprNode,
  Element as CModelElement,
  Model,
} from "@synthesis/jsx-runtime"
import {
  abstractM2M,
  IM2M,
  M2MContext,
  ModelStore,
  RawTraceEntryData,
  Stack,
  _privatePop,
  _privatePush,
  TargetElement,
  TraceEntry,
} from "@synthesis/engine"
import { IConfigurationModel, IChoice } from "../3.configuration-model/configuration-meta.model"
import {
  IDecisionAwareTraceModel,
} from "../trace-extensions/trace-extensions.meta.model"
import * as tmC from "../trace-extensions/trace-extensions-components"

export interface IVarResolution {
  optionName: string
  choices: IChoice[]
}

// Decision-aware raw trace entry — carries the extra metadata needed to
// emit VariabilityPoint / SpecializationPoint trace JSX in createTraceModel().
export interface DecisionAwareRawTraceEntryData extends RawTraceEntryData {
  variabilityOption?: string
  choices?: IChoice[]
  specializationOption?: string
  sourceTypeName?: string
}

export class DecisionAwareM2MContext<P = undefined> extends M2MContext<P> {
  // Stack of choices currently in scope for the element being transformed.
  // @VarPoint pushes per-element choices; option methods read the top of the
  // stack via eval-operators.
  public currentElementDecision: Stack<IChoice[]> = new Stack<IChoice[]>()

  // Stack for nested VarPoint calls — VarPoint pushes/pops, E2E reads lastVarResolution
  public readonly varResolutionStack: Stack<IVarResolution> = new Stack<IVarResolution>()

  // Last VarResolution — set by VarPoint in finally, read and cleared by E2E
  public lastVarResolution?: IVarResolution

  // Override makeTrace to carry decision-aware metadata into raw entries.
  // The engine base just ignores the trailing args; here we store them so
  // createTraceModel() can emit the correct trace JSX subtypes.
  public override makeTrace(
    sourceModelElement: IModelElement,
    jsxElements: ExprNode<IModelElement>[],
    ruleName: string,
    ruleType: string,
    variabilityOption?: string,
    choices?: IChoice[],
    specializationOption?: string,
    sourceTypeName?: string,
  ) {
    if (ruleType === "VariabilityPoint" && (!variabilityOption || !choices)) {
      throw new Error("VariabilityPoint trace entry requires variabilityOption and choices")
    }

    if (ruleType === "SpecializationPoint" && !specializationOption) {
      throw new Error("SpecializationPoint trace entry requires specializationOption")
    }

    // Call base makeTrace to populate sourceIndex/jsxIndex bookkeeping and
    // add the base raw entry; then enrich the last entry with decision-aware
    // metadata.
    super.makeTrace(sourceModelElement, jsxElements, ruleName, ruleType)
    const last = this.rawTraceEntries[this.rawTraceEntries.length - 1] as DecisionAwareRawTraceEntryData
    last.variabilityOption = variabilityOption
    last.choices = choices
    last.specializationOption = specializationOption
    last.sourceTypeName = sourceTypeName
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
   * Decision-aware trace model rendering.
   *
   * Emits VariabilityPoint / SpecializationPoint trace entries when the raw
   * data carries the corresponding metadata, plus a DecisionAwareTraceModel
   * that records the configuration model in use.
   */
  protected override createTraceModel(): ExprNode<IDecisionAwareTraceModel> {
    const targetElementNamespace = this.context.output.instance
      ? `${this.context.output.instance.path}/${this.context.output.instance.name}`
      : ""

    const traceJSXEntries = this.context.rawTraceEntries.map((raw) => {
      const r = raw as DecisionAwareRawTraceEntryData
      const sourceElementNamespace = r.sourceModelElement.path

      const targetElements = r.jsxElements.map((jsx) => {
        let resolved = jsx
        while (resolved.isAbstract && resolved.subElement) {
          resolved = resolved.subElement
        }
        return (
          <TargetElement $refByName={`${targetElementNamespace}/${resolved.props.name}`} />
        )
      })

      if (r.ruleType === "VariabilityPoint") {
        return (
          <tmC.VarPointTraceEntry
            source={<CModelElement $refByName={`${sourceElementNamespace}/${r.sourceModelElement.name}`} />}
            rule={r.ruleName}
            ruleType={"VariabilityPoint"}
            variabilityOption={r.variabilityOption}
            choices={r.choices}
            targets={targetElements}
          />
        )
      } else if (r.ruleType === "SpecializationPoint") {
        return (
          <tmC.SpecPointTraceEntry
            source={<CModelElement $refByName={`${sourceElementNamespace}/${r.sourceModelElement.name}`} />}
            rule={r.ruleName}
            ruleType={"SpecializationPoint"}
            specializationOption={r.specializationOption}
            sourceType={r.sourceTypeName}
            targets={targetElements}
          />
        )
      } else {
        return (
          <TraceEntry
            source={<CModelElement $refByName={`${sourceElementNamespace}/${r.sourceModelElement.name}`} />}
            rule={r.ruleName}
            ruleType={"RegularRule"}
            targets={targetElements}
          />
        )
      }
    })

    return (
      <tmC.DecisionAwareTraceModel
        name={`${this.context.input.instance?.name} to ${this.context.output.instance?.name}`}
        store={this.context.store}
        timestamp={new Date().toISOString()}
        source={<Model $refByName={`${this.context.input.instance!.path}/${this.context.input.instance!.name}`} />}
        config={this.configModel ? <Model $refByName={`${this.configModel.path}/${this.configModel.name}`} /> : null}
        targets={[<Model $refByName={`${this.context.output.instance!.path}/${this.context.output.instance!.name}`} />]}
      >
        {traceJSXEntries}
      </tmC.DecisionAwareTraceModel>
    )
  }
}
