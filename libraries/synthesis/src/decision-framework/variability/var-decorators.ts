// https://luckylibora.medium.com/typescript-method-decorators-in-depth-problems-and-solutions-74387d51e6a

import { _privatePop, _privatePush } from "../../engine"
import {
  __isVarPoint,
  guardVarPoint,
  guardVarOption,
  guardDefault,
  appendDecoratorHistory,
  recordDecorator,
} from "../../engine"
// import * as tcM from "../decisions/3.transformation-configuration/transformation-configuration-meta.model";  // import decision model types for decision model transformation
import * as tcM from "./../decisions/3.configuration-model/configuration-meta.model"
import { DecisionAwareM2M } from "../decisions/decision-aware-m2m/decision-aware-m2m"
import { EvalCondition } from "./eval-operators"

// https://stackoverflow.com/questions/55179461/reflection-in-javascript-how-to-intercept-an-object-for-function-enhancement-d

interface IVarOption {
  methodName: string
  evalCondition: EvalCondition
  isDefault?: boolean
  // The decision-model option name, when the condition was built with
  // Option("..."). Used so the trace records outcomes in decision
  // language, not method names.
  optionName?: string
}

const __VarOptionRef = "__VarOptionRef"

type DecoratedMethod = ((this: any, ...args: any[]) => any) & {
  [__VarOptionRef]?: string
  [key: string]: unknown
}

// WeakMap registry: prototype → (varPointName → IVarOption[])
// Decouples option registration from the function object so that outer decorators
// (e.g. @E2E) can freely wrap a @VarPoint method without destroying the options bucket.
const varPointRegistry = new WeakMap<object, Map<string, IVarOption[]>>()

const isVarPoint = (target: object, methodName: string): boolean =>
  varPointRegistry.get(target)?.has(methodName) ?? false

const getRegisteredVarOptions = (target: object, methodName: string): IVarOption[] | undefined =>
  varPointRegistry.get(target)?.get(methodName)

const registerVarPoint = (target: object, propertyKey: string): void => {
  if (!varPointRegistry.has(target)) {
    varPointRegistry.set(target, new Map())
  }
  const map = varPointRegistry.get(target)!
  if (!map.has(propertyKey)) {
    map.set(propertyKey, [])
  }
}

const registerVarOption = (target: object, varPointName: string, varOption: IVarOption): void => {
  getRegisteredVarOptions(target, varPointName)?.push(varOption)
}

const setVarOptionReference = (method: DecoratedMethod, methodName: string): void => {
  method[__VarOptionRef] = methodName
}

const getVarOptionReference = (method: DecoratedMethod | undefined): string | undefined =>
  method?.[__VarOptionRef]

// Element-scoped decisions match by object identity first (the
// configuration's `element` is a link to the very source element), with
// the generated uuid `id` as the serialization-safe equality; both ids
// must be present for the id comparison to count.
const isSameElement = (a: any, b: any): boolean => {
  if (a === undefined || b === undefined) return false
  return a === b || (a?.id !== undefined && b?.id !== undefined && a.id === b.id)
}

const resolveConfiguredChoices = (
  transformation: DecisionAwareM2M<any, any, any, tcM.IConfigurationModel>,
  element: any,
): tcM.IChoice[] => {
  const currentContext = transformation.context
  const choices = transformation.configModel?.choices || []

  return choices.filter(
    (c: tcM.IChoice) =>
      !currentContext.store.isTypeOf(c, tcM.ElementLevelChoice)
      || (
        currentContext.store.isTypeOf(c, tcM.ElementLevelChoice)
        && isSameElement((c as unknown as tcM.IElementLevelChoice).element, element)
      ),
  )
}

const evaluateVarOption = (
  varOption: IVarOption,
  context: {
    self: any
    configChoices: tcM.IChoice[]
    element: any
    currentContext: DecisionAwareM2M<any, any, any, tcM.IConfigurationModel>["context"]
  },
): boolean => {
  return varOption.evalCondition.call(
    context.self,
    context.configChoices,
    context.element,
    context.currentContext,
  )
}

const selectVarOption = (
  varOptions: IVarOption[],
  context: {
    self: any
    configChoices: tcM.IChoice[]
    element: any
    currentContext: DecisionAwareM2M<any, any, any, tcM.IConfigurationModel>["context"]
  },
): IVarOption | undefined => {
  // First matching non-default option wins; otherwise fall back to the default option.
  const matchingVarOption = varOptions.find((varOption) => !varOption.isDefault && evaluateVarOption(varOption, context))

  return matchingVarOption || varOptions.find((varOption) => varOption.isDefault)
}

const invokeVarOption = (self: any, varOption: IVarOption, args: any[]) => {
  return self[varOption.methodName](...args)
}

/**
 * Method decorator — marks a transformation rule as a variability point.
 *
 * Required decorator ordering (when combined with @E2E):
 *
 *   @E2E()                ← outer (applied second) — handles tracing
 *   @VarPoint("issue")    ← inner (applied first)  — handles variability
 *   method(e: IEntity) { ... }
 *
 * @E2E must be outermost so it sees the VarPoint's result.
 * Placing @VarPoint above @E2E will throw an error at decoration time.
 */
export const VarPoint = (_issue: string) => {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // Register the options bucket in the WeakMap registry keyed by (prototype, propertyKey).
    // This allows outer decorators (e.g. @E2E) to wrap this method without breaking registration.
    registerVarPoint(target, propertyKey)

    // Throw error if @VarPoint wraps @E2E, or is combined with @SpecPoint.
    const original = descriptor.value
    guardVarPoint(original, propertyKey, _issue)

    descriptor.value = function(this: any, ...args: any[]) {
      const transformation = this as DecisionAwareM2M<any, any, any, tcM.IConfigurationModel>
      const currentContext = transformation.context
      const element = args[0]
      const configChoices = resolveConfiguredChoices(transformation, element)
      // VarOptions are looked up from the registry at call time, not from the function object.
      const varOptions = getRegisteredVarOptions(target, propertyKey) || []

      // Keep context stack balanced even if condition evaluation or option method throws.
      currentContext.currentElementDecision[_privatePush](configChoices)

      try {
        const chosenVarOption = selectVarOption(varOptions, {
          self: this,
          configChoices,
          element,
          currentContext,
        })

        if (!chosenVarOption) {
          throw new Error(`No option condition evaluated to true and no default option provided`)
        }

        // The resolution of this consultation, handed to the option
        // wrapper through the context: it attaches to the invocation that
        // executes the chosen option (the enclosing @E2E rule's own, or an
        // Invocation of the option's). `choices` are the configuration
        // choices for this issue in scope, including those whose option
        // did not run; `byDefault` is true when no condition was met and
        // the @Default option ran. The issue is recovered from the
        // option's parentIssue backlink (auto-wired by the renderer,
        // declared as Issue.options' inverse).
        currentContext.pendingResolution = {
          issue: _issue,
          option: chosenVarOption.optionName ?? chosenVarOption.methodName,
          byDefault: !!chosenVarOption.isDefault,
          choices: configChoices.filter(
            (c: any) => c?.selectedOption?.parentIssue?.name === _issue,
          ),
        }

        return invokeVarOption(this, chosenVarOption, args)
      } finally {
        // never leaks past the call, even if no option wrapper took it
        currentContext.pendingResolution = undefined
        currentContext.currentElementDecision[_privatePop]()
      }
    }

    // Mark the wrapper so @E2E can detect at decoration time that this method is a VarPoint
    ;(descriptor.value as any)[__isVarPoint] = true
    appendDecoratorHistory(original, descriptor.value, "VarPoint", { issue: _issue })

    return descriptor
  }
}

// method decorator
export const VarOption = (
  methodName: string,
  option?: EvalCondition
) => {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // @VarOption must not be placed above @E2E — would cause duplicate trace entries.
    guardVarOption(descriptor.value, propertyKey)

    // The option is a traced function call: absorbed into the enclosing
    // @E2E rule's invocation when it is that rule's executed method,
    // otherwise an Invocation of its own. It also takes the resolution
    // left by its @VarPoint. Registration uses the method name, so
    // wrapping does not affect dispatch.
    const original = descriptor.value
    descriptor.value = function(this: any, ...args: any[]) {
      const entry = (this as DecisionAwareM2M<any, any, any, any>).context.enterOption(propertyKey, args[0])
      try {
        return original.apply(this, args)
      } finally {
        (this as DecisionAwareM2M<any, any, any, any>).context.exitOption(entry)
      }
    }

    // Use registry lookup — independent of what's currently in target[methodName],
    // so @E2E or any other decorator wrapping the VarPoint method doesn't break registration.
    if (isVarPoint(target, methodName)) {
      if (!option) {
        throw new Error(`VarOption("${methodName}") requires EvalCondition, for example Option("...")`)
      }

      registerVarOption(target, methodName, {
        methodName: propertyKey,
        evalCondition: option,
        optionName: (option as EvalCondition & { optionName?: string }).optionName,
      })

      // Čuvaj referencu na VarPoint metodu na ovoj metodi (potrebno za @Default)
      setVarOptionReference(descriptor.value as DecoratedMethod, methodName)
    }
    appendDecoratorHistory(original, descriptor.value, "VarOption", { varPointMethod: methodName })
    return descriptor
  }
}

export const Default = () => {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    guardDefault(descriptor.value, propertyKey)

    // Reads __VarOptionRef set by @VarOption, then registers via registry (not target[ref]).
    const varOptionRef = getVarOptionReference(descriptor.value as DecoratedMethod)

    if (varOptionRef && isVarPoint(target, varOptionRef)) {
      // Mark the already-registered VarOption as default instead of adding a duplicate entry.
      const existing = getRegisteredVarOptions(target, varOptionRef)?.find((v) => v.methodName === propertyKey)
      if (existing) {
        existing.isDefault = true
      }
    }

    recordDecorator(descriptor.value, "Default")
    return descriptor
  }
}
