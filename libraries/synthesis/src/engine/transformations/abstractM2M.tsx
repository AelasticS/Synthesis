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
} from "../../jsx-runtime"
import * as tm from "./transformation.model.type"
import { ModelStore } from "./../index"
import * as tmT from "./trace/trace-meta.model"
import * as tmC from "./trace/trace-meta.model-components"
import { Element as CModelElement, Model } from "../../jsx-runtime"
import { TargetElement } from "./trace/trace-meta.model-components"

type IODescr = { type?: t.Any; instance?: IModel; jsx?: string }
type TransformationDescr = {
  type?: tm.IM2M_Transformation
  instance?: tm.IM2M_Trace
}

export interface ISpecResolution {
  optionName: string
  sourceTypeName: string
}

// Lightweight runtime record for resolve lookups (sourceIndex, jsxIndex).
// The full trace info (source, ruleType, timestamps)
// lives in rawTraceEntries and is rendered into a persistent TraceModel lazily.
export interface TraceEntryRecord {
  rule: string // for lookup by ruleName
  targets: IModelElement[] // populated by resolveTargetForJSX during render
  _jsxElements: ExprNode<IModelElement>[] // for resolveJSXElement / resolveAllJSXElements
}

// Raw data stored during template() execution; converted to trace JSX
// in createTraceModel() when output.instance is available. `ruleName`
// is the EXECUTED concrete method (a dispatched option method when a
// point decorator routed the call). `record` links the runtime lookup
// record whose `targets` the renderer fills with the actual created
// elements, so trace references can carry their real full paths.
export interface RawTraceEntryData {
  sourceModelElement: IModelElement
  jsxElements: ExprNode<IModelElement>[]
  ruleName: string
  record: TraceEntryRecord
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
  public readonly sourceIndex: Map<IModelElement, TraceEntryRecord[]> = new Map()

  // Fast O(1) lookup by JSX element — private, used only by resolveTargetForJSX().
  // One JSX node may belong to several entries (a rule's result embedded
  // in an enclosing rule's result registers with both), and every one of
  // them must receive the resolved target.
  private readonly jsxIndex: Map<ExprNode<IModelElement>, TraceEntryRecord[]> = new Map()

  // Raw trace data collected during template(); converted to JSX lazily in createTraceModel()
  public readonly rawTraceEntries: RawTraceEntryData[] = []

  // Last SpecResolution — set by SpecPoint wrapper, read and cleared by E2E.
  // SpecPoint lives in engine; its resolution is consumed here.
  public lastSpecResolution?: ISpecResolution

  // param is used to keep additional information during transformation
  // passed from transform() method of abstractM2M
  public param?:P

  constructor() {
    super()
  }

  public makeTrace(
    sourceModelElement: IModelElement,
    jsxElements: ExprNode<IModelElement>[],
    ruleName: string,
  ) {
    const entry: TraceEntryRecord = {
      rule: ruleName,
      targets: [],
      _jsxElements: jsxElements,
    }

    // Store raw data — JSX entries will be created lazily in createTraceModel()
    // when output.instance is available and entry.targets are resolved.
    this.rawTraceEntries.push({
      sourceModelElement,
      jsxElements,
      ruleName,
      record: entry,
    })

    // sourceIndex
    const existing = this.sourceIndex.get(sourceModelElement)
    if (existing) {
      existing.push(entry)
    } else {
      this.sourceIndex.set(sourceModelElement, [entry])
    }

    // jsxIndex — register each JSX element from the array
    for (const jsx of jsxElements) {
      const entries = this.jsxIndex.get(jsx)
      if (entries) {
        entries.push(entry)
      } else {
        this.jsxIndex.set(jsx, [entry])
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

    const entry = ruleName ? entries.find((e) => e.rule === ruleName) : entries[0]
    if (!entry) return undefined

    if (targetType) {
      return entry.targets.find((target) => this.store.isTypeOf(target, targetType))
    }

    return entry.targets[0]
  }

  public resolveAllTargets(source: IModelElement, ruleName?: string, targetType?: t.Any): IModelElement[] {
    const entries = this.sourceIndex.get(source)
    if (!entries) return []

    const entry = ruleName ? entries.find((e) => e.rule === ruleName) : entries[0]
    if (!entry) return []

    if (targetType) {
      return entry.targets.filter((target) => this.store.isTypeOf(target, targetType))
    }

    return entry.targets
  }

  public resolveJSXElement(input: IModelElement, ruleName?: string, targetType?: t.Any): ExprNode<IModelElement> {
    const entries = this.sourceIndex.get(input)
    if (!entries) throw new Error(`Target JSXElement for ${input} source model element does not exist!`)

    const entry = ruleName ? entries.find((e) => e.rule === ruleName) : entries[0]

    if (!entry || entry._jsxElements.length === 0) {
      throw new Error(`Target JSXElement for ${input} source model element does not exist!`)
    }

    if (targetType) {
      const idx = entry.targets.findIndex((target) => this.store.isTypeOf(target, targetType))
      if (idx === -1) {
        throw new Error(
          `Target JSXElement of type ${targetType.name} for ${input} source model element does not exist!`
        )
      }
      return entry._jsxElements[idx]
    }

    return entry._jsxElements[0]
  }

  public resolveAllJSXElements(input: IModelElement, ruleName?: string, targetType?: t.Any): ExprNode<IModelElement>[] {
    const entries = this.sourceIndex.get(input)
    if (!entries) throw new Error(`Target JSXElements for ${input} source model element do not exist!`)

    const entry = ruleName ? entries.find((e) => e.rule === ruleName) : entries[0]

    if (!entry || entry._jsxElements.length === 0) {
      throw new Error(`Target JSXElements for ${input} source model element do not exist!`)
    }

    if (targetType) {
      return entry._jsxElements.filter((_, idx) => this.store.isTypeOf(entry.targets[idx], targetType))
    }

    return entry._jsxElements
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

    const tagName = element.name ?? element.type.name

    // Build props string
    const propsStr = this.formatJsxProps(element.props, level, indent)

    // Collect renderable children
    const childLines: string[] = []
    for (const child of element.childArray) {
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
   * Assembles the per-entry data shared by all trace model builders:
   * a deterministic entry name (rule and source, disambiguated per
   * repeated execution of the same pair) and the target references.
   * Targets come from the actual created elements recorded during
   * render, so their references carry real full paths (correct under
   * nested namespaces); rules that produced only references (grafts)
   * fall back to the reference names on their result expressions.
   */
  protected traceEntryData(): Array<{
    raw: RawTraceEntryData
    entryName: string
    targetRefs: any[]
  }> {
    const targetElementNamespace = this.context.output.instance
      ? `${this.context.output.instance.path}/${this.context.output.instance.name}`
      : ""
    const nameCounts = new Map<string, number>()

    return this.context.rawTraceEntries.map((raw) => {
      const base = `${raw.ruleName}_${raw.sourceModelElement.name}`
      const n = (nameCounts.get(base) ?? 0) + 1
      nameCounts.set(base, n)
      const entryName = n === 1 ? base : `${base}_${n}`

      let targetRefs: any[]
      if (raw.record.targets.length > 0) {
        targetRefs = raw.record.targets.map((el) => (
          <TargetElement $refByName={this.fullElementRef(el)} />
        ))
      } else {
        targetRefs = raw.jsxElements.flatMap((jsx) => {
          // For abstract elements (from @SpecPoint), the rendered element
          // is the subElement; the abstract element itself is never created.
          let resolved = jsx
          while (resolved.isAbstract && resolved.subElement) {
            resolved = resolved.subElement
          }
          const props = resolved.props as { name?: string; $refByName?: string }
          const name = props.name ?? props.$refByName
          if (name === undefined) {
            return []
          }
          const ref = String(name).startsWith("//") ? String(name) : `${targetElementNamespace}/${name}`
          return [<TargetElement $refByName={ref} />]
        })
      }

      return { raw, entryName, targetRefs }
    })
  }

  /**
   * Builds the trace JSX tree for the current transformation: the
   * outcome record. One entry per executed rule, named for its
   * (rule, source) identity; the rule field carries the executed
   * concrete method. Decision-aware subclasses override this to attach
   * configuration resolutions.
   */
  protected createTraceModel(): ExprNode<tmT.ITraceModel> {
    const traceJSXEntries = this.traceEntryData().map(({ raw, entryName, targetRefs }) => (
      <tmC.TraceEntry
        name={entryName}
        rule={raw.ruleName}
        source={<CModelElement $refByName={this.fullElementRef(raw.sourceModelElement)} />}
        targets={targetRefs}
      />
    ))

    return (
      <tmC.TraceModel
        name={`${this.context.input.instance?.name} to ${this.context.output.instance?.name}`}
        store={this.context.store}
        timestamp={new Date().toISOString()}
        transformation={this.transformationName()}
        source={<Model $refByName={this.fullElementRef(this.context.input.instance!)} />}
        targets={[<Model $refByName={this.fullElementRef(this.context.output.instance!)} />]}
      >
        {traceJSXEntries}
      </tmC.TraceModel>
    )
  }
}
