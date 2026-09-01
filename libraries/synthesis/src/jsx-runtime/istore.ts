import type * as t from "@aelastics/types"
import type {
  IModel,
  IModelElement,
  INamespace,
} from "../metamodel-core"

/**
 * Minimal contract for a model store as seen by the JSX runtime's
 * `Context` and `ExprNode.create`. The engine's `ModelStore`
 * implements this interface. Keeping the surface small lets jsx-runtime
 * carry no engine-side state and avoids importing engine internals.
 */
export interface IStore {
  /**
   * Returns a previously created element by its full path name
   * (i.e. the value produced by `getNameWithPath`).
   */
  getByName(name: string): IModelElement | undefined

  /**
   * Returns a previously created element by its store-assigned id.
   */
  getByID(id: string): IModelElement | undefined

  /**
   * Creates a new model in the store, optionally registering it inside
   * an owner model and a namespace.
   */
  newModel<T extends IModel>(
    type: t.ObjectType<any, any>,
    initValue: Partial<T>,
    ownerModel?: IModel,
    namespace?: INamespace
  ): T

  /**
   * Creates a new namespace, optionally registering it inside an owner
   * model and a parent namespace.
   */
  newNamespace(
    type: t.ObjectType<any, any>,
    initValue: Partial<INamespace>,
    ownerModel?: IModel,
    namespace?: INamespace
  ): INamespace

  /**
   * Creates a new model element inside a given model and namespace.
   */
  newModelElement<E extends IModelElement>(
    model: Partial<IModel>,
    namespace: INamespace,
    type: t.ObjectType<any, any>,
    initValue: Partial<E>
  ): E

  /**
   * Returns the full qualified name (i.e. `path/name`) for an element.
   */
  getNameWithPath(el: IModelElement): string

  /**
   * Returns the registered @aelastics/types object type for a model element.
   * Used by transformation rules to inspect runtime types.
   */
  getTypeOf(e: IModelElement): t.AnyObjectType

  /**
   * Checks whether a model element is an instance of a given @aelastics/types
   * type (or a subtype thereof).
   */
  isTypeOf(e: IModelElement, type: t.Any): boolean

  /**
   * Returns the `@@aelastics/type` tag of an element, split on `/`.
   */
  getAElasticsType(e: any): String[]
}
