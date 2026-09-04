/** @jsx createExprNode */
/*
 * Connection property candidates: one JSX tag may declare an ordered
 * list of parent properties; the first one present on the parent's type
 * wins. Lets the same tag connect into a single-valued containment on
 * one parent (Root.body) and an array on another (Item.children).
 */
import * as t from "@aelastics/types"
import {
  createExprNode,
  Context,
  ExprNode,
  Template,
  CpxTemplate,
  IStore,
  WithRefProps,
  defaultConnectionInfo,
} from "../../jsx-runtime"
import { Model, ModelElement } from "../../metamodel-core"
import { ModelStore } from "../index"

const S = t.schema("ConnCandidatesTestSchema")

const Item = t.subtype(
  ModelElement,
  {
    children: t.arrayOf(t.link(S, "Item")),
  },
  "Item",
  S
)

const Root = t.subtype(
  Model,
  {
    // Optional at the type level because the parent is created before
    // its child connects (a mandatory object prop would be auto-initialized
    // and the reconnect guard would refuse the real connection).
    body: t.optional(t.link(S, "Item")),
  },
  "Root",
  S
)

type IItem = t.TypeOf<typeof Item>
type IRoot = t.TypeOf<typeof Root>

type IRootProps = WithRefProps<IRoot> & { store?: IStore }

const RootC: CpxTemplate<IRootProps, IRoot> = (props) => {
  return new ExprNode(Root, props, undefined)
}

const ItemC: Template<IItem> = (props) => {
  return new ExprNode(Item, props, {
    ...defaultConnectionInfo(["body", "children"]),
    isReconnectAllowed: false,
  })
}

describe("connection property candidates", () => {
  it("connects via the first candidate the parent's type declares", () => {
    const store = new ModelStore()
    const root = (
      <RootC name="R" store={store}>
        <ItemC name="a">
          <ItemC name="b" />
        </ItemC>
      </RootC>
    ).render(new Context()) as IRoot

    const a = root.body as IItem
    expect(a).toBeDefined()
    expect(a.name).toBe("a")
    expect(((a.children ?? []) as IItem[]).map((c) => c.name)).toEqual(["b"])
  })

  it("refuses a second top-level block when reconnect is not allowed", () => {
    const store = new ModelStore()
    expect(() =>
      (
        <RootC name="R2" store={store}>
          <ItemC name="x" />
          <ItemC name="y" />
        </RootC>
      ).render(new Context())
    ).toThrow()
  })
})
