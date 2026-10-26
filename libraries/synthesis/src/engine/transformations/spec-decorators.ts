// https://luckylibora.medium.com/typescript-method-decorators-in-depth-problems-and-solutions-74387d51e6a

import { Any } from "@aelastics/types";
import { IModelElement } from "../../metamodel-core";
import { ExprNode } from "../../jsx-runtime";
import { abstractM2M } from "./abstractM2M";
import {
  __isSpecPoint,
  guardSpecPoint,
  guardSpecOption,
  appendDecoratorHistory,
} from "./decorator-guards";

// https://stackoverflow.com/questions/55179461/reflection-in-javascript-how-to-intercept-an-object-for-function-enhancement-d

const __SpecPoint = "__SpecPoint";

export interface ISpecOption {
  specMethod: string;
  inputType: Any;
}

// An option together with the class prototype that declared it, so a
// subclass can tell its own options from inherited ones.
interface IRegisteredOption extends ISpecOption {
  declaredOn: object;
}

type SpecRegistry = { [pointName: string]: IRegisteredOption[] };

/**
 * Returns the option registry owned by the class whose prototype is
 * `target`, creating it on first use. A new registry starts as a copy of
 * the inherited one with every option list copied as well, so options
 * added here never reach the parent class or sibling subclasses.
 */
function ownRegistry(target: any): SpecRegistry {
  if (Object.prototype.hasOwnProperty.call(target, __SpecPoint)) {
    return target[__SpecPoint];
  }
  const inherited: SpecRegistry = target[__SpecPoint] ?? {};
  const registry: SpecRegistry = {};
  for (const pointName of Object.keys(inherited)) {
    registry[pointName] = [...inherited[pointName]];
  }
  target[__SpecPoint] = registry;
  return registry;
}

/**
 * Picks the option a point dispatches to for an element of type `aType`.
 * An option is applicable when `aType` is its declared type or a subtype
 * of it. Among the applicable options the most specific one wins: the one
 * whose type is a subtype of every other applicable option's type.
 * Declaration order plays no role, so applicable options without a unique
 * most specific one are an error. Returns undefined when no option is
 * applicable.
 */
function selectOption(pointName: string, aType: Any, options: ISpecOption[]): ISpecOption | undefined {
  const applicable = options.filter((o) => aType.isOfType(o.inputType));
  const mostSpecific = applicable.filter((o) =>
    applicable.every((other) => other === o || o.inputType.isOfType(other.inputType))
  );
  if (applicable.length > 0 && mostSpecific.length !== 1) {
    const competing = applicable.map((o) => `'${o.specMethod}' (${o.inputType.name})`).join(", ");
    throw new Error(
      `@SpecPoint '${pointName}': no unique most specific option for type '${aType.name}' ` +
        `among ${competing}.`
    );
  }
  return mostSpecific[0];
}

/**
 * Method decorator — marks a transformation rule as a specialization point.
 *
 * Required decorator ordering (when combined with @E2E):
 *
 *   @E2E()          ← outer (applied second) — handles tracing
 *   @SpecPoint()    ← inner (applied first)  — handles specialization
 *   Entity2Table(e: IEntity) { ... }
 *
 * @E2E must be outermost so it sees the final specialized result.
 * Placing @SpecPoint above @E2E will throw an error at decoration time.
 */
export const SpecPoint = () => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Detect incorrect ordering: if descriptor.value is already an @E2E wrapper,
    // then @SpecPoint is being applied AFTER @E2E (SpecPoint is outer, E2E is inner).
    // Also guards against @SpecPoint + @VarPoint combination.
    guardSpecPoint(descriptor.value, propertyKey);

    // Read from descriptor.value (not target[propertyKey]) to preserve any inner decorator wrappers.
    const original: (...a: any[]) => ExprNode<any> | ExprNode<any>[] | undefined | null = descriptor.value;

    descriptor.value = function (this: abstractM2M<any, any>, ...args: any[]) {
      const a: IModelElement = args[0];
      const aType = this.context.store.getTypeOf(a);

      const options: ISpecOption[] = (this as any)[__SpecPoint][propertyKey] ?? [];
      const option = selectOption(propertyKey, aType, options);

      if (!option) {
        throw new Error(`No specialized method found`);
      }

      // The enclosing @E2E rule's pending slot belongs to the option this
      // point dispatches to, not to anything the base skeleton happens to
      // call first: hold it back while the skeleton runs.
      const rule = this.context.pendingRule;
      this.context.pendingRule = undefined;

      // get result from original method (the base skeleton, if any)
      let orgResult = original.apply(this, args);
      this.context.pendingRule = rule;
      // get result from specialized method
      let specResult = (this as any)[option.specMethod](...args);

      // A point whose base returns nothing is a pure dispatcher: the
      // option's result is returned as is (one expression, an array of
      // expressions, or any other value). The merge below exists solely
      // to combine a base skeleton with an option refinement.
      if (orgResult === undefined || orgResult === null) {
        return specResult;
      }

      if (Array.isArray(orgResult)) {
        throw new Error(
          `@SpecPoint '${propertyKey}': the base rule returned an array; a base skeleton ` +
            `must be a single expression. Return nothing to make the point a pure dispatcher.`
        );
      }

      if (Array.isArray(specResult)) {
        throw new Error(
          `@SpecPoint '${propertyKey}': option '${option.specMethod}' returned an array, ` +
            `but the point provides a base skeleton to merge. Make the point a pure ` +
            `dispatcher (base returns nothing) to allow array results.`
        );
      }

      // connect corresponding results (elements)
      orgResult.subElement = specResult;
      orgResult.isAbstract = true;

      // return result from original method
      return orgResult;
    };

    // Mark the wrapper so @E2E can detect at decoration time that this method is a SpecPoint
    (descriptor.value as any)[__isSpecPoint] = true;
    appendDecoratorHistory(original, descriptor.value, "SpecPoint");

    // Keep options already registered for this point: inherited ones, and
    // ones written above the point in this class.
    const registry = ownRegistry(target);
    registry[propertyKey] = registry[propertyKey] ?? [];

    return descriptor;
  };
};

// method decorator
export const SpecOption = (methodName: string, type: Any) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // @SpecOption must be the only decorator on the method: it traces the
    // option itself (below), so @E2E, a point or another option decorator
    // would duplicate or conflict with that.
    guardSpecOption(descriptor.value, propertyKey)

    // The point may be declared further down the class, so create its
    // list if it does not exist yet.
    const registry = ownRegistry(target);
    const options = (registry[methodName] = registry[methodName] ?? []);
    const option: IRegisteredOption = { specMethod: propertyKey, inputType: type, declaredOn: target };
    const sameType = options.findIndex((o) => o.inputType === type);
    if (sameType < 0) {
      options.push(option);
    } else if (options[sameType].declaredOn === target) {
      // Two options for the same type can never be told apart by dispatch:
      // reject the second one now rather than at the first matching element.
      throw new Error(
        `@SpecOption '${propertyKey}': @SpecPoint '${methodName}' already has option ` +
          `'${options[sameType].specMethod}' for type '${type.name}'.`
      );
    } else {
      // An inherited option for the same type: this class overrides it.
      options[sameType] = option;
    }

    // The option is a traced function call: absorbed into the enclosing
    // @E2E rule's invocation when it is that rule's executed method,
    // otherwise an Invocation of its own. Registration above uses the
    // method name, so wrapping does not affect dispatch.
    const original = descriptor.value;
    descriptor.value = function (this: abstractM2M<any, any>, ...args: any[]) {
      const entry = this.context.enterOption(propertyKey, args[0]);
      try {
        return original.apply(this, args);
      } finally {
        this.context.exitOption(entry);
      }
    };
    appendDecoratorHistory(original, descriptor.value, "SpecOption", { specPointMethod: methodName });
    return descriptor;
  };
};
