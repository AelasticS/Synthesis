import * as g from "../metamodel-core"
import { IStore } from "./istore"
import { IStack, ArrayStack } from "./stack"
import { INamespace } from "../metamodel-core"

/**
 * Top-level namespace name used when no explicit namespace is pushed.
 * Mirrors `Config.TOP_NAME_DOMAIN` in the engine, kept local
 * here so jsx-runtime carries no engine dependency.
 */
const TOP_NAME_DOMAIN = "www.aelastics.org"

let maxlocalID: number = 0

// TODO: add resolve function (similar to resolve/resolveOne in QVT)

export class Context {
  // TODO: remove multiple stores, add store in constructor
  public readonly storeStack: IStack<IStore> = new ArrayStack()
  public readonly modelStack: IStack<g.IModel> = new ArrayStack()
  public readonly namespaceStack: IStack<g.INamespace> = new ArrayStack() // used to resolve names

  constructor() {

    // TODO : add initial nameaspace using store!
    const topNamespace: INamespace = {
      name: TOP_NAME_DOMAIN,
      label: TOP_NAME_DOMAIN,
      elements: [],
      path: "",
    } as unknown as INamespace

    this.namespaceStack.push(topNamespace)
  }

  // used to generate unique names, if ommited during creation of model elements
  public get generateID(): string {
    return (++maxlocalID).toString()
  }

  public get store(): IStore {
    try {
      return this.storeStack.peek()
    } catch (e: any) {
      throw new Error("No store in the context!")
    }
  }

  public pushStore = (s: IStore) => {
    this.storeStack.push(s)
  }

  public popStore = () => {
    this.storeStack.pop()
  }

  public get currentModel(): g.IModel | undefined {
    try {
      return this.modelStack.peek()
    } catch (e: any) {
      return undefined
    }
  }

  public pushModel = (m: g.IModel) => {
    this.modelStack.push(m)
    // model is also namespace
    this.namespaceStack.push(m)
  }

  public popModel = () => {
    const m = this.modelStack.pop()
    // remove namespacess within the model
    while (this.namespaceStack.peek() != m) {
      this.namespaceStack.pop()
    }
    // model is also namespace
    this.namespaceStack.pop()
  }

  public get currentNamespace(): g.INamespace | undefined {
    try {
      return this.namespaceStack.peek()
    } catch (e: any) {
      return undefined
    }
  }

  public pushNamespace = (m: g.INamespace) => {
    this.namespaceStack.push(m)
  }

  public popNamespace = () => {
    this.namespaceStack.pop()
  }
}
