/** @jsx createExprNode */
/*
 * Namespace classification: a metamodel concept declared with
 * declareNamespace scopes its children's names. Equal names coexist in
 * different scopes, bare references resolve innermost-first with
 * outward probing to the model, and duplicates within one scope still
 * fail. Nothing subtypes a Namespace type; the classification is the
 * only mechanism.
 */
import * as t from "@aelastics/types"
import { createExprNode, Context, ExprNode } from "../../jsx-runtime"
import type { CpxTemplate, IStore, Template, WithRefProps } from "../../jsx-runtime"
import { allowedAsTopLevelElement } from "../../jsx-runtime"
import { ModelStore } from "../index"
import { Model, ModelElement, declareNamespace, isNamespaceType } from "../../metamodel-core"

const Schema = t.schema("NsScopeSchema")

const Crate = t.subtype(Model, {}, "Crate", Schema)
const Box = t.subtype(ModelElement, {
  items: t.arrayOf(t.link(Schema, "Thing")),
}, "Box", Schema)
const Thing = t.subtype(ModelElement, {
  tag: t.optional(t.string),
  ref: t.optional(t.link(Schema, "Thing")),
}, "Thing", Schema)

declareNamespace(Box)

type ICrate = t.TypeOf<typeof Crate>
type IBox = t.TypeOf<typeof Box>
type IThing = t.TypeOf<typeof Thing>

const CrateC: CpxTemplate<WithRefProps<ICrate> & { store?: IStore }, ICrate> = (props) => {
  return new ExprNode(Crate, props, undefined)
}
const BoxC: Template<IBox> = (props) => {
  return new ExprNode(Box, props, undefined)
}
const ThingC: Template<IThing> = (props) => {
  return new ExprNode(Thing, props, allowedAsTopLevelElement("items"))
}

describe("namespace classification", () => {
  it("classifies via the supertype chain, without a Namespace type", () => {
    expect(isNamespaceType(Box)).toBe(true)
    expect(isNamespaceType(Thing)).toBe(false)
    expect(isNamespaceType(Model)).toBe(true)
    expect(isNamespaceType(Crate)).toBe(true)
  })

  const store = new ModelStore()
  const crate = (
    <CrateC name="M" store={store}>
      <ThingC name="id" tag="crate-id" />
      <ThingC name="glob" tag="global" />
      <BoxC name="A">
        <ThingC name="id" tag="a" />
      </BoxC>
      <BoxC name="B">
        <ThingC name="id" tag="b" />
      </BoxC>
      <BoxC name="C">
        <ThingC name="id" tag="c" />
        <ThingC name="user" ref={<ThingC $refByName="id" />} />
        <ThingC name="user2" ref={<ThingC $refByName="glob" />} />
      </BoxC>
    </CrateC>
  ).render(new Context()) as ICrate

  it("lets equal names coexist in different scopes, with nested paths", () => {
    const aId = store.getByName("//www.aelastics.org/M/A/id") as IThing
    const bId = store.getByName("//www.aelastics.org/M/B/id") as IThing
    const crateId = store.getByName("//www.aelastics.org/M/id") as IThing
    expect(aId?.tag).toBe("a")
    expect(bId?.tag).toBe("b")
    expect(crateId?.tag).toBe("crate-id")
    expect(aId.path).toBe("//www.aelastics.org/M/A")
  })

  it("keeps flat model ownership and the scoped containment", () => {
    const names = ((crate.elements ?? []) as IThing[]).map((e) => e.name)
    // every element, nested or not, is owned by the model
    expect(names.filter((n) => n === "id").length).toBe(4)
    const boxA = ((crate.elements ?? []) as IBox[]).find(
      (e) => e.name === "A" && store.isTypeOf(e, Box),
    ) as IBox
    expect(((boxA.items ?? []) as IThing[]).map((i) => i.tag)).toEqual(["a"])
  })

  it("resolves a bare reference innermost-first (lexical shadowing)", () => {
    const user = store.getByName("//www.aelastics.org/M/C/user") as IThing
    expect((user.ref as IThing)?.tag).toBe("c")
  })

  it("probes enclosing scopes outward up to the model", () => {
    const user2 = store.getByName("//www.aelastics.org/M/C/user2") as IThing
    expect((user2.ref as IThing)?.tag).toBe("global")
  })

  it("still refuses duplicate names within one scope", () => {
    const dupStore = new ModelStore()
    expect(() =>
      (
        <CrateC name="D" store={dupStore}>
          <BoxC name="A">
            <ThingC name="id" />
            <ThingC name="id" />
          </BoxC>
        </CrateC>
      ).render(new Context()),
    ).toThrow(/Duplicate name/)
  })
})
