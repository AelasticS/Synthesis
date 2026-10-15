/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2023.
 *
 * DecisionAwareM2M: a decision-aware specialization of the engine's
 * abstractM2M. It carries an optional configuration model and a
 * per-element decision stack. The resolutions of variability points are
 * recorded by @VarPoint on the invocation that executes the chosen
 * option, so the engine builds the whole trace; this class only adds the
 * configuration model in use to the trace model.
 */

import {IModel} from "../../../metamodel-core"
import {createExprNode, Model} from "../../../jsx-runtime"
import {
    abstractM2M,
    IM2M,
    M2MContext,
    ModelStore,
    Stack,
} from "../../../engine"
import {IConfigurationModel, IChoice} from "../3.configuration-model/configuration-meta.model"

export class DecisionAwareM2MContext<P = undefined> extends M2MContext<P> {
    // Stack of choices currently in scope for the element being transformed.
    // @VarPoint pushes per-element choices; option methods read the top of the
    // stack via eval-operators.
    public currentElementDecision: Stack<IChoice[]> = new Stack<IChoice[]>()
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

    /** The configuration model in use is referenced on the trace model. */
    protected override traceModelProps(): Record<string, unknown> {
        return {
            config: this.configModel ? <Model $refByName={this.fullElementRef(this.configModel)} /> : null,
        }
    }
}
