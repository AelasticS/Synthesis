import type { IModelElement } from "../metamodel-core"
import type { ExprNode } from "./element"

/**
 * Minimal contract that an M2M context exposes to the JSX runtime.
 * The engine's `M2MContext` implements this interface;
 * jsx-runtime references this interface instead of `M2MContext`
 * directly to avoid a circular dependency.
 */
export interface IM2MContext {
  /**
   * Called by `ExprNode.render` after a child JSX element has been
   * rendered into a concrete model element, so the M2M context can
   * record the (jsxElement -> modelElement) mapping used by the
   * trace model and `Resolve`.
   */
  resolveTargetForJSX(
    jsxElement: ExprNode<IModelElement>,
    modelElement: IModelElement
  ): void

  /**
   * Used by `Resolve` to locate the target model element for a given
   * source element and (optionally) a rule name. Returns `undefined`
   * if no target was registered for the source.
   */
  resolveTarget(
    source: IModelElement,
    ruleName?: string
  ): IModelElement | undefined
}

/**
 * Runtime check used in place of `instanceof M2MContext`. A `Context`
 * is an `IM2MContext` if it carries the two functions above.
 */
export function isM2MContext(value: unknown): value is IM2MContext {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as IM2MContext).resolveTargetForJSX === "function" &&
    typeof (value as IM2MContext).resolveTarget === "function"
  )
}
