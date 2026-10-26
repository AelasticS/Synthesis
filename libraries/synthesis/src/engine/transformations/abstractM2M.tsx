/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2023.
 */

import * as t from "@aelastics/types"
import { IModel, IModelElement } from "../../metamodel-core"
import {
  createExprNode,
  Context,
  ExprNode,
  ResolveElement,
  IM2MContext,
  Model
} from "../../jsx-runtime"
import * as tm from "./transformation.model.type"
import { ModelStore } from "./../index"
import * as tmT from "./trace/trace-meta.model"
import * as tmC from "./trace/trace-meta.model-components"

type IODescr = { type?: t.Any; instance?: IModel; jsx?: string }
type TransformationDescr = {
  type?: tm.IM2M_Transformation
}

// One consultation of a variability point: which option executed, whether
// it ran as the @Default fallback, and the configuration choices
// considered (including those whose condition was not satisfied).
export interface ResolutionData {
  issue: string
  option: string
  byDefault: boolean
  choices: IModelElement[]
}

// One executed function call. "rule" is an @E2E method; "plain" is an
// option method executed outside any @E2E rule. `function` is the
// EXECUTED concrete method (a dispatched option method when a point
// decorator routed the call). `parent` is the invocation on top of the
// call stack when this one began.
//
// A rule is also the runtime lookup record for resolve calls
// (sourceIndex, jsxIndex): `jsxElements` is its result, and `targets`
// is filled by resolveTargetForJSX during render with the actual created
// elements, so trace references can carry their real full paths. A rule
// is traced once makeTrace() has set its result.
export interface InvocationRecord {
  function: string
  kind: "rule" | "plain"
  parent?: InvocationRecord
  source?: IModelElement
  jsxElements: ExprNode<IModelElement>[]
  targets: IModelElement[]
  resolutions: ResolutionData[]
  discarded?: boolean
}

// Handle returned by enterOption(): `owned` is false when the option was
// absorbed into the enclosing @E2E rule's invocation.
export interface OptionEntry {
  invocation: InvocationRecord
  owned: boolean
}

export const _privatePop = Symbol("privatePop")
export const _privatePush = Symbol("privatePush")

export class Stack<T> {
  private stack: Array<T> = []

  private [_privatePop]: () => T | undefined = () => {
    return this.stack.pop()
  }

  private [_privatePush]: (element: T) => void = (element: T) => {
    this.stack.push(element)
  }

  public peek(): T | undefined {
    return this.stack[this.stack.length - 1]
  }

  public isEmpty(): boolean {
    return this.stack.length === 0
  }

  public depth(): number {
    return this.stack.length
  }
}

export class M2MContext<P = undefined> extends Context implements IM2MContext {

  public input: IODescr = {}
  public output: IODescr = {}
  public transformation: TransformationDescr = {}
  public traceModel?: ExprNode<tmT.ITraceModel>
  // The trace model serialized to JSX notation, kept by transform() the
  // way output.jsx keeps the target model's serialization, so hosts can
  // persist the trace without reaching into protected machinery.
  public traceJsx?: string

  // Fast O(1) lookup by source element
  public readonly sourceIndex: Map<IModelElement, InvocationRecord[]> = new Map()

  // Fast O(1) lookup by JSX element — private, used only by resolveTargetForJSX().
  // One JSX node may belong to several entries (a rule's result embedded
  // in an enclosing rule's result registers with both), and every one of
  // them must receive the resolved target.
  private readonly jsxIndex: Map<ExprNode<IModelElement>, InvocationRecord[]> = new Map()


  // Call stack of traced invocations: the top is the parent of the next
  // invocation that begins. `invocations` keeps them in start order, so a
  // parent always precedes its children.
  public readonly invocationStack: Stack<InvocationRecord> = new Stack()
  public readonly invocations: InvocationRecord[] = []

  // Set by @E2E when its method is a point: the first option method
  // entered is the executed rule, so it is absorbed into this invocation
  // instead of starting an invocation of its own.
  public pendingRule?: InvocationRecord

  // Set by @VarPoint just before it calls the chosen option; taken by the
  // option wrapper and attached to the invocation that executes it.
  public pendingResolution?: ResolutionData

  // param is used to keep additional information during transformation
  // passed from transform() method of abstractM2M
  public param?:P

  constructor() {
    super()
  }

  public beginInvocation(
    functionName: string,
    kind: "rule" | "plain",
    source?: IModelElement,
  ): InvocationRecord {
    const invocation: InvocationRecord = {
      function: functionName,
      kind,
      parent: this.invocationStack.peek(),
      source,
      jsxElements: [],
      targets: [],
      resolutions: [],
    }
    this.invocations.push(invocation)
    this.invocationStack[_privatePush](invocation)
    return invocation
  }

  public endInvocation(): void {
    this.invocationStack[_privatePop]()
  }

  // An @E2E call that produced nothing traceable leaves no record; its
  // children are re-attached to its own parent.
  public discardInvocation(invocation: InvocationRecord): void {
    invocation.discarded = true
    for (const other of this.invocations) {
      if (other.parent === invocation) other.parent = invocation.parent
    }
  }

  /**
   * Called by option wrappers (@VarOption, @SpecOption) on entry. When the
   * option is the direct target of an @E2E point, it is absorbed into
   * that rule's invocation (the rule's `function` becomes the executed
   * option method); otherwise it begins an invocation of its own.
   */
  public enterOption(functionName: string, source?: unknown): OptionEntry {
    const resolution = this.pendingResolution
    this.pendingResolution = undefined

    const rule = this.pendingRule
    this.pendingRule = undefined

    let entry: OptionEntry
    if (rule) {
      rule.function = functionName
      entry = { invocation: rule, owned: false }
    } else {
      const el = source as { name?: unknown } | undefined
      const named = el && typeof el === "object" && typeof el.name === "string"
      entry = {
        invocation: this.beginInvocation(functionName, "plain", named ? (source as IModelElement) : undefined),
        owned: true,
      }
    }
    if (resolution) entry.invocation.resolutions.push(resolution)
    return entry
  }

  public exitOption(entry: OptionEntry): void {
    if (entry.owned) this.endInvocation()
  }

  // Records the result of an @E2E rule and registers it for resolve
  // lookups. Its targets are filled in during render.
  public makeTrace(invocation: InvocationRecord, jsxElements: ExprNode<IModelElement>[]) {
    invocation.jsxElements = jsxElements

    // sourceIndex
    const existing = this.sourceIndex.get(invocation.source!)
    if (existing) {
      existing.push(invocation)
    } else {
      this.sourceIndex.set(invocation.source!, [invocation])
    }

    // jsxIndex — register each JSX element from the array
    for (const jsx of jsxElements) {
      const entries = this.jsxIndex.get(jsx)
      if (entries) {
        entries.push(invocation)
      } else {
        this.jsxIndex.set(jsx, [invocation])
      }
    }
  }

  public resolveTargetForJSX(jsxElement: ExprNode<IModelElement>, modelElement: IModelElement): void {
    const entries = this.jsxIndex.get(jsxElement)
    if (entries) {
      for (const entry of entries) {
        entry.targets.push(modelElement)
      }
    }
  }

  public resolveTarget(source: IModelElement, ruleName?: string, targetType?: t.Any): IModelElement | undefined {
    const entries = this.sourceIndex.get(source)
    if (!entries) return undefined

    const entry = ruleName ? entries.find((e) => e.function === ruleName) : entries[0]
    if (!entry) return undefined

    if (targetType) {
      return entry.targets.find((target) => this.store.isTypeOf(target, targetType))
    }

    return entry.targets[0]
  }

  public resolveAllTargets(source: IModelElement, ruleName?: string, targetType?: t.Any): IModelElement[] {
    const entries = this.sourceIndex.get(source)
    if (!entries) return []

    const entry = ruleName ? entries.find((e) => e.function === ruleName) : entries[0]
    if (!entry) return []

    if (targetType) {
      return entry.targets.filter((target) => this.store.isTypeOf(target, targetType))
    }

    return entry.targets
  }

  public resolveJSXElement(input: IModelElement, ruleName?: string, targetType?: t.Any): ExprNode<IModelElement> {
    const entries = this.sourceIndex.get(input)
    if (!entries) throw new Error(`Target JSXElement for ${input} source model element does not exist!`)

    const entry = ruleName ? entries.find((e) => e.function === ruleName) : entries[0]

    if (!entry || entry.jsxElements.length === 0) {
      throw new Error(`Target JSXElement for ${input} source model element does not exist!`)
    }

    if (targetType) {
      const idx = entry.targets.findIndex((target) => this.store.isTypeOf(target, targetType))
      if (idx === -1) {
        throw new Error(
          `Target JSXElement of type ${targetType.name} for ${input} source model element does not exist!`
        )
      }
      return entry.jsxElements[idx]
    }

    return entry.jsxElements[0]
  }

  public resolveAllJSXElements(input: IModelElement, ruleName?: string, targetType?: t.Any): ExprNode<IModelElement>[] {
    const entries = this.sourceIndex.get(input)
    if (!entries) throw new Error(`Target JSXElements for ${input} source model element do not exist!`)

    const entry = ruleName ? entries.find((e) => e.function === ruleName) : entries[0]

    if (!entry || entry.jsxElements.length === 0) {
      throw new Error(`Target JSXElements for ${input} source model element do not exist!`)
    }

    if (targetType) {
      return entry.jsxElements.filter((_, idx) => this.store.isTypeOf(entry.targets[idx], targetType))
    }

    return entry.jsxElements
  }
}

export interface IM2M<
  S extends IModel,
  D extends IModel,
  EM extends { [key: string]: IModel } = {},
  P = undefined
> {
  context: M2MContext<P>
  extra?: EM

  main(props: S): ExprNode<S, D>

  transform(source: S): D
}

export abstract class abstractM2M<
  S extends IModel,
  D extends IModel,
  EM extends { [key: string]: IModel } = {},
  P = undefined
> implements IM2M<S, D, EM, P> {
  // transformation type
  public context: M2MContext<P> = new M2MContext<P>()
  // EM / extra: reserved for additional input models. The engine does
  // not read it yet; callers pass {} or nothing.
  public extra?: EM

  public constructor(store?: ModelStore, extra?: EM) {
    if (store) this.context.pushStore(store)
    this.extra = extra
  }

  abstract main(props: S): ExprNode<S, D>

  public transform(source: S, param?: P): D {
    this.context.param = param
    const targetJSXTree = this.main(source)
    const targetModel = targetJSXTree.render<D>(this.context)

    this.context.input.instance = source
    this.context.output.instance = targetModel

    // Infer types from runtime objects — supplement M2M_Transformation.
    // Wrapped in try/catch: cross-schema transformations may not have all types
    // registered in the same schema context, so getTypeOf may fail for the output.
    try {
      this.context.input.type = this.context.store.getTypeOf(source)
      this.context.output.type = this.context.store.getTypeOf(targetModel)
      if (this.context.transformation.type) {
        this.context.transformation.type.from = this.context.input.type!.name
        this.context.transformation.type.to = this.context.output.type!.name
      }
    } catch (_e) {
      // Type inference failed for cross-schema types — from/to remain unset
    }

    this.context.traceModel = this.createTraceModel()
    this.context.traceJsx = this.renderToJsx(this.context.traceModel)
    this.context.traceModel.render<tmT.ITraceModel>(this.context)

    // Serialize the target model to JSX notation
    this.context.output.jsx = this.renderToJsx(targetJSXTree)

    return targetModel
  }

  /**
   * Serializes an ExprNode<> JSX tree into a human-readable JSX string.
   * Traverses the element tree directly — no annotations needed.
   */
  protected renderToJsx(element: ExprNode<any>, level: number = 0, indent: number = 2): string {
    if (!element) return ""

    const lines: string[] = []
    const pad = " ".repeat(level * indent)

    // Handle ResolveElement specially
    if (element instanceof ResolveElement) {
      const resolveProps = element.props as any
      const inputName = resolveProps.input?.name ?? "unknown"
      const ruleAttr = resolveProps.ruleName ? ` ruleName="${resolveProps.ruleName}"` : ""
      lines.push(`${pad}<Resolve input={${inputName}}${ruleAttr}>`)
      lines.push(`${pad}${" ".repeat(indent)}{(target) => ...}`)
      lines.push(`${pad}</Resolve>`)
      return lines.join("\n")
    }

    // A @SpecPoint base skeleton is never created itself: render creates
    // the option's element (subElement) with the skeleton's props merged
    // under the option's, and with both children lists. Serialize that
    // merged element. Children are collected by identity, because render
    // also appends the option's children to the skeleton's list.
    let concrete: ExprNode<any> = element
    let props = element.props
    const children: unknown[] = [...element.childArray]
    while (concrete.isAbstract && concrete.subElement) {
      concrete = concrete.subElement
      props = { ...props, ...concrete.props }
      for (const child of concrete.childArray) if (!children.includes(child)) children.push(child)
    }

    const tagName = concrete.name ?? concrete.type.name

    // Build props string
    const propsStr = this.formatJsxProps(props, level, indent)

    // Collect renderable children
    const childLines: string[] = []
    for (const child of children) {
      if (child === null || child === undefined) continue
      if (typeof child === "string") {
        childLines.push(`${" ".repeat((level + 1) * indent)}${child}`)
      } else if (Array.isArray(child)) {
        for (const el of child) {
          if (el && el instanceof ExprNode) {
            childLines.push(this.renderToJsx(el, level + 1, indent))
          }
        }
      } else if (typeof child === "function") {
        childLines.push(`${" ".repeat((level + 1) * indent)}{() => ...}`)
      } else if (child instanceof ExprNode) {
        childLines.push(this.renderToJsx(child, level + 1, indent))
      }
    }

    if (childLines.length === 0) {
      lines.push(`${pad}<${tagName}${propsStr} />`)
    } else {
      lines.push(`${pad}<${tagName}${propsStr}>`)
      lines.push(...childLines)
      lines.push(`${pad}</${tagName}>`)
    }

    return lines.join("\n")
  }

  /**
   * Formats element props as JSX attribute string.
   * Skips internal infrastructure props (store) and handles
   * refs, primitives, nested Element values and arrays.
   */
  protected formatJsxProps(props: any, _level: number = 0, indent: number = 2): string {
    if (!props) return ""

    const skipKeys = new Set(["store", "children"])
    const parts: string[] = []

    for (const [key, value] of Object.entries(props)) {
      if (skipKeys.has(key)) continue
      if (value === undefined || value === null) continue

      if (value instanceof ExprNode) {
        // Inline nested Element prop — render compactly
        const inlineJsx = this.renderToJsx(value, 0, indent).trim()
        parts.push(`${key}={${inlineJsx}}`)
      } else if (typeof value === "string") {
        parts.push(`${key}="${value}"`)
      } else if (typeof value === "number" || typeof value === "boolean") {
        parts.push(`${key}={${value}}`)
      } else if (Array.isArray(value)) {
        const items = value.map((v) => {
          if (v instanceof ExprNode) return this.renderToJsx(v, 0, indent).trim()
          if (typeof v === "string") return `"${v}"`
          if (typeof v === "object" && v !== null && "name" in v) return v.name
          return String(v)
        })
        parts.push(`${key}={[${items.join(", ")}]}`)
      } else if (typeof value === "object") {
        // Object references (e.g. $ref pointing to IModelElement)
        if ("name" in value) {
          parts.push(`${key}={${(value as any).name}}`)
        } else {
          parts.push(`${key}={...}`)
        }
      }
    }

    return parts.length > 0 ? " " + parts.join(" ") : ""
  }

  /** The absolute store reference of an element: its full path. */
  protected fullElementRef(el: { path?: string; name: string }): string {
    return `${el.path}/${el.name}`
  }

  /**
   * The transformation's name for the trace record. Class decorators
   * (@M2M) wrap the class in an anonymous subclass, so walk the
   * prototype chain past decorator wrappers to the authored name.
   */
  protected transformationName(): string {
    let ctor: any = this.constructor
    while (ctor && (ctor.name === "" || ctor.name === "decorated") && Object.getPrototypeOf(ctor)) {
      ctor = Object.getPrototypeOf(ctor)
    }
    return ctor?.name || "transformation"
  }

  /**
   * Assembles the per-invocation data shared by all trace model
   * builders, in start order (a parent precedes its children, so a
   * parent reference always resolves to an already created element):
   * a deterministic name (function and source, disambiguated per repeated
   * execution), the parent's name and, for rules, the target references.
   * Targets come from the actual created elements recorded during
   * render, so their references carry real full paths (correct under
   * nested namespaces); rules that produced only references (grafts)
   * fall back to the reference names on their result expressions.
   */
  protected invocationData(): Array<{
    invocation: InvocationRecord
    name: string
    parentName?: string
    targetRefs: any[]
  }> {
    const targetElementNamespace = this.context.output.instance
      ? `${this.context.output.instance.path}/${this.context.output.instance.name}`
      : ""
    const nameCounts = new Map<string, number>()
    const names = new Map<InvocationRecord, string>()

    const result: ReturnType<abstractM2M<S, D, EM, P>["invocationData"]> = []
    for (const invocation of this.context.invocations) {
      // a rule without a recorded outcome, or a discarded call, leaves no trace
      if (invocation.discarded || (invocation.kind === "rule" && invocation.jsxElements.length === 0)) continue

      const sourceName = invocation.source?.name
      const base = sourceName ? `${invocation.function}_${sourceName}` : invocation.function
      const n = (nameCounts.get(base) ?? 0) + 1
      nameCounts.set(base, n)
      const name = n === 1 ? base : `${base}_${n}`
      names.set(invocation, name)

      let targetRefs: any[] = []
      if (invocation.kind === "rule") {
        if (invocation.targets.length > 0) {
          targetRefs = invocation.targets.map((el) => (
            <tmC.TargetElement $refByName={this.fullElementRef(el)} />
          ))
        } else {
          targetRefs = invocation.jsxElements.flatMap((jsx) => {
            // For abstract elements (from @SpecPoint), the rendered element
            // is the subElement; the abstract element itself is never created.
            let resolved = jsx
            while (resolved.isAbstract && resolved.subElement) {
              resolved = resolved.subElement
            }
            const props = resolved.props as { name?: string; $refByName?: string }
            const targetName = props.name ?? props.$refByName
            if (targetName === undefined) {
              return []
            }
            const ref = String(targetName).startsWith("//") ? String(targetName) : `${targetElementNamespace}/${targetName}`
            return [<tmC.TargetElement $refByName={ref} />]
          })
        }
      }

      result.push({
        invocation,
        name,
        parentName: invocation.parent ? names.get(invocation.parent) : undefined,
        targetRefs,
      })
    }
    return result
  }

  /** Extra props for the trace model element; decision-aware subclasses add the configuration. */
  protected traceModelProps(): Record<string, unknown> {
    return {}
  }

  /**
   * Builds the trace JSX tree for the current transformation: one
   * RuleInvocation per executed @E2E rule (its `function` is the
   * executed concrete method) and one Invocation per option method
   * executed outside any rule, linked through `parent`. Each carries the
   * Resolutions of the variability points it executed.
   */
  protected createTraceModel(): ExprNode<tmT.ITraceModel> {
    // Resolution names live in the trace model's flat name scope; a
    // running counter keeps them unique and deterministic.
    let resolutionCounter = 0
    const traceJSXEntries = this.invocationData().map(({ invocation, name, parentName, targetRefs }) => {
      const resolutions = invocation.resolutions.map((r) => {
        resolutionCounter += 1
        return (
          <tmC.Resolution
            name={`r${resolutionCounter}_${r.option}`}
            byDefault={r.byDefault}
            choices={r.choices.map((c) => <tmC.ChoiceRef $refByName={this.fullElementRef(c)} />)}
          />
        )
      })
      const parent = parentName ? <tmC.Invocation $refByName={parentName} /> : undefined

      return invocation.kind === "rule" ? (
        <tmC.RuleInvocation
          name={name}
          function={invocation.function}
          parent={parent}
          source={<tmC.SourceElement $refByName={this.fullElementRef(invocation.source!)} />}
          targets={targetRefs}
        >
          {resolutions}
        </tmC.RuleInvocation>
      ) : (
        <tmC.Invocation name={name} function={invocation.function} parent={parent}>
          {resolutions}
        </tmC.Invocation>
      )
    })

    return (
      <tmC.TraceModel
        name={`${this.context.input.instance?.name} to ${this.context.output.instance?.name}`}
        store={this.context.store}
        timestamp={new Date().toISOString()}
        transformation={this.transformationName()}
        source={<Model $refByName={this.fullElementRef(this.context.input.instance!)} />}
        targets={[<Model $refByName={this.fullElementRef(this.context.output.instance!)} />]}
        {...this.traceModelProps()}
      >
        {traceJSXEntries}
      </tmC.TraceModel>
    )
  }
}
