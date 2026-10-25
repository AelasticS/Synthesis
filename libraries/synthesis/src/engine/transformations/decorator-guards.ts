/**
 * decorator-guards.ts
 *
 * Central registry for decorator history and compatibility guards.
 *
 * Guard rules (enforced at decoration time via decorator history):
 *
 *   Transformation methods:
 *     @E2E                       — alone
 *     @E2E  above @VarPoint      — E2E outer (applied second)
 *     @E2E  above @SpecPoint     — E2E outer (applied second)
 *     @VarPoint                  — alone
 *     @SpecPoint                 — alone
 *
 *   Option methods:
 *     @VarOption                 — alone
 *     @Default  above @VarOption — Default outer (applied second)
 *     @SpecOption                — alone
 *
 *   Everything else → throws at decoration time.
 */

// ─── Sentinels ────────────────────────────────────────────────────────────────
// String keys stamped onto wrapper functions.
// Stamped by the point decorators; guard logic and point detection use
// decorator history instead.

export const __isVarPoint = "__isVarPoint"
export const __isSpecPoint = "__isSpecPoint"

// ─── Internal helper ──────────────────────────────────────────────────────────

export function hasSentinel(fn: any, sentinel: string): boolean {
  return !!fn && !!(fn as Record<string, unknown>)[sentinel]
}

// ─── Decorator history ────────────────────────────────────────────────────────
//
// Every decorator records itself in a __decoratorHistory array on the function
// object. Wrapping decorators copy the history from the original to the new
// wrapper before appending themselves — so the full chain is always visible to
// any outer decorator, regardless of how many wrappers are in between.
//
// This makes guard logic robust: a guard never needs to check whether a
// sentinel "survived" through intermediate wrappers — it reads the history.

export interface DecoratorRecord {
  /** Canonical decorator name, e.g. "E2E", "VarPoint", "VarOption". */
  name: string
  /** Optional metadata useful for error messages and diagnostics. */
  meta?: Record<string, any>
}

const __decoratorHistory = "__decoratorHistory"

/** Returns the full decoration history of `fn`, oldest-first. */
export function getHistory(fn: any): DecoratorRecord[] {
  return (fn as any)?.[__decoratorHistory] ?? []
}

/** Returns true if a decorator with the given name appears anywhere in the history. */
export function hasInHistory(fn: any, name: string): boolean {
  return getHistory(fn).some((r) => r.name === name)
}

/**
 * For NON-WRAPPING decorators (@VarOption, @SpecOption, @Default, …).
 * Appends a record to the existing function — no new wrapper is created.
 */
export function recordDecorator(fn: any, name: string, meta?: Record<string, any>): void {
  if (!fn) return
  if (!(fn as any)[__decoratorHistory]) {
    ;(fn as any)[__decoratorHistory] = []
  }
  const record: DecoratorRecord = meta ? { name, meta } : { name }
  ;(fn as any)[__decoratorHistory].push(record)
}

/**
 * For WRAPPING decorators (@E2E, @VarPoint, @SpecPoint, …).
 * Copies the history from `original` to `wrapper`, then appends this decorator.
 * Must be called after the wrapper function is created, before returning the descriptor.
 */
export function appendDecoratorHistory(
  original: any,
  wrapper: any,
  name: string,
  meta?: Record<string, any>,
): void {
  const inherited: DecoratorRecord[] = original?.[__decoratorHistory]
    ? [...original[__decoratorHistory]]
    : []
  const record: DecoratorRecord = meta ? { name, meta } : { name }
  inherited.push(record)
  ;(wrapper as any)[__decoratorHistory] = inherited
}

// ─── Point detection ──────────────────────────────────────────────────────────

/**
 * Used by @E2E at *decoration* time: true when `fn` is a point method
 * (@VarPoint, @SpecPoint), read from the decorator history.
 */
export function isPointMethod(fn: any): boolean {
  return hasInHistory(fn, "VarPoint") || hasInHistory(fn, "SpecPoint")
}

// ─── Guards ───────────────────────────────────────────────────────────────────
//
// All guards read from decorator history — no hardcoded sentinel lookups.
//
// Valid combinations per method:
//
//   Transformation methods:
//     @E2E                           — alone
//     @E2E  above @VarPoint          — E2E is outer (applied second)
//     @E2E  above @SpecPoint         — E2E is outer (applied second)
//     @VarPoint                      — alone
//     @SpecPoint                     — alone
//
//   Option methods:
//     @VarOption                     — alone
//     @Default  above @VarOption     — Default is outer (applied second)
//     @SpecOption                    — alone
//
//   Everything else → throws at decoration time.

/** Helper: throws a standardised error when a combination is invalid. */
function invalidCombination(
  appliedDecorator: string,
  propertyKey: string,
  foundInHistory: string[],
  hint: string,
): never {
  const found = foundInHistory.map((n) => `@${n}`).join(", ")
  throw new Error(
    `@${appliedDecorator} on "${propertyKey}" cannot be combined with ${found}.\n${hint}`,
  )
}

/**
 * Run at decoration time of @E2E.
 * Valid history states when E2E is applied:
 *   []            — @E2E alone
 *   ["VarPoint"]  — @E2E above @VarPoint
 *   ["SpecPoint"] — @E2E above @SpecPoint
 */
export function guardE2E(fn: any, propertyKey: string): void {
  const names = getHistory(fn).map((r) => r.name)
  if (names.length === 0) return
  if (names.length === 1 && (names[0] === "VarPoint" || names[0] === "SpecPoint")) return
  invalidCombination("E2E", propertyKey, names,
    "Valid: @E2E alone, @E2E above @VarPoint, or @E2E above @SpecPoint.")
}

/**
 * Run at decoration time of @VarPoint.
 * @VarPoint must be the innermost decorator (history must be empty when applied).
 */
export function guardVarPoint(fn: any, propertyKey: string, issue: string): void {
  const names = getHistory(fn).map((r) => r.name)
  if (names.length === 0) return
  invalidCombination("VarPoint", propertyKey, names,
    "Valid: @VarPoint alone, or @E2E above @VarPoint.")
}

/**
 * Run at decoration time of @SpecPoint.
 * @SpecPoint must be the innermost decorator (history must be empty when applied).
 */
export function guardSpecPoint(fn: any, propertyKey: string): void {
  const names = getHistory(fn).map((r) => r.name)
  if (names.length === 0) return
  invalidCombination("SpecPoint", propertyKey, names,
    "Valid: @SpecPoint alone, or @E2E above @SpecPoint.")
}

/**
 * Run at decoration time of @VarOption.
 * Must be the innermost decorator — only @Default may be placed above it.
 */
export function guardVarOption(fn: any, propertyKey: string): void {
  const names = getHistory(fn).map((r) => r.name)
  if (names.length === 0) return
  invalidCombination("VarOption", propertyKey, names,
    "Valid: @VarOption alone, or @Default above @VarOption.")
}

/**
 * Run at decoration time of @SpecOption.
 * Must be the only decorator on the method.
 */
export function guardSpecOption(fn: any, propertyKey: string): void {
  const names = getHistory(fn).map((r) => r.name)
  if (names.length === 0) return
  invalidCombination("SpecOption", propertyKey, names,
    "Valid: @SpecOption alone.")
}

/**
 * Run at decoration time of @Default.
 * @Default must be placed directly above @VarOption:
 *   history must contain exactly ["VarOption"] when @Default is applied.
 */
export function guardDefault(fn: any, propertyKey: string): void {
  const names = getHistory(fn).map((r) => r.name)
  if (names.length === 1 && names[0] === "VarOption") return
  if (!names.includes("VarOption")) {
    throw new Error(
      `@Default on "${propertyKey}" requires @VarOption below it.\n` +
      `  Correct order:\n    @Default()\n    @VarOption("method", condition)\n    ${propertyKey}(...) { ... }`,
    )
  }
  invalidCombination("Default", propertyKey, names,
    "Valid: @Default directly above @VarOption only.")
}
