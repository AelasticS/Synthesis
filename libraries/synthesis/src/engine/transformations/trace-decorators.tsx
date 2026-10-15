/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */

import { abstractM2M, IM2M } from "./abstractM2M"
import { IModel, IModelElement, ModelElement } from "../../metamodel-core"
import { ExprNode, ResolveElement } from "../../jsx-runtime"
import {
  __isVarPoint,
  __isSpecPoint,
  guardE2E,
  isPointMethod,
  appendDecoratorHistory,
} from "./decorator-guards"

// Re-export point sentinels — used by point decorators to stamp their wrappers
export { __isVarPoint, __isSpecPoint }

type Class<T = any> = new (...args: any[]) => T;

// Class decorator — parameter-free
export const M2M = () => {
  return function <T extends Class<IM2M<any, any, any, any>>>(target: T): T {
    const decorated = class extends target {
      constructor(...args: any[]) {
        super(...args)
      }
    }
    return decorated as unknown as T
  }
}

/**
 * Method decorator — adds end-to-end tracing to a transformation rule.
 *
 * @E2E must always be the outermost decorator so it sees the final result:
 *
 *   @E2E()                               ← outer: traces the final result
 *   @SpecPoint() / @VarPoint("issue")    ← inner: specialization / variability
 *   method(e: IEntity) { ... }
 *
 * Placing @SpecPoint or @VarPoint above @E2E will throw an error at decoration time.
 */
export const E2E = function() {
  return function (
    target: abstractM2M<IModel, IModel, any, any>,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const original = descriptor.value

    guardE2E(original, propertyKey)

    // Detect at decoration time whether a point decorator (@VarPoint, @SpecPoint, …)
    // is present, from the decorator history.
    const isPoint = isPointMethod(original)

    const wrapped = function(this: abstractM2M<any, any, any, any>, ...args: any[]) {
        const sourceModelElement = args[0]
        const context = this.context

        // The rule's input must be a model element: it is the source of
        // the trace record and the key for resolving its targets.
        if (
          sourceModelElement === null ||
          typeof sourceModelElement !== "object" ||
          !context.store.isTypeOf(sourceModelElement, ModelElement)
        ) {
          const got = sourceModelElement === null ? "null" : typeof sourceModelElement
          throw new Error(
            `@E2E "${propertyKey}": the first argument must be a ModelElement, got ${got}.`,
          )
        }

        // The invocation begins before the rule runs, so every call made
        // inside it records this rule as its parent. For a point, the
        // first option method entered is this rule's executed method.
        const invocation = context.beginInvocation(propertyKey, "rule", sourceModelElement as IModelElement)
        if (isPoint) context.pendingRule = invocation

        let result: ExprNode<any> | ExprNode<any>[] | null | undefined
        try {
          result = original.apply(this, args)
        } finally {
          context.pendingRule = undefined
          context.endInvocation()
        }

        if (!result) {
          context.discardInvocation(invocation)
          return null
        }

        // Normalize result to array
        const jsxElements: ExprNode<any>[] = Array.isArray(result) ? result : [result]

        // Filter out ResolveElements — they should not be traced
        const traceableElements = jsxElements.filter(el => !(el instanceof ResolveElement))
        if (traceableElements.length === 0) {
          context.discardInvocation(invocation)
          return jsxElements.length === 0 ? null : result
        }

        context.makeTrace(invocation, traceableElements)

        return result
      }
      // Mark the wrapper so @SpecPoint/@VarPoint can detect incorrect ordering
    appendDecoratorHistory(original, wrapped, "E2E")
    descriptor.value = wrapped
    return descriptor
  }
}