---
sidebar_position: 2
---

# Creating JSX Components

Before you can build model instances with JSX, each metamodel type needs a JSX component. A component is a small function that tells the framework three things: which metamodel type to instantiate, what props to pass, and which parent property this element should connect to when nested inside another element.

## JSX Pragma Setup

Every file that uses JSX for model construction must declare the custom JSX pragma:

```typescript
/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx'
```

This tells TypeScript to route JSX expressions through `createExprNode` instead of React's `createElement`. When you write `<Kernel name="Person">`, TypeScript compiles it into `createExprNode(Kernel, { name: "Person" })`, which calls your `Kernel` component function.

## Defining JSX Components

The pattern is similar to React. In React, you define a component function and then use it as a JSX tag (`<MyButton>`). In Synthesis, you define a component function for each metamodel type and then use it as a JSX tag (`<Attribute>`). Each component represents a model element type. When you nest components inside each other in JSX, the framework connects them through the associations defined in the metamodel.

| React | Synthesis |
|---|---|
| Component renders to DOM nodes | Component creates model elements in the store |
| Props describe UI attributes | Props describe model element properties |
| Children are nested DOM elements | Children are nested model elements connected via metamodel associations |
| `<div className="x">` | `<Attribute name="Age">` |

A component is a function that returns `new ExprNode(type, props, connectionInfo)`. The `connectionInfo` tells the framework which metamodel association to use when connecting this element to its parent in a JSX expression:

```typescript
import { ExprNode, Template } from '@aelastics/synthesis/jsx'
import * as e from './EER.meta.model.type'

export const Attribute: Template<e.IAttribute> = (props) => {
  return new ExprNode(e.Attribute, props, 'attributes')
}
```

The three arguments to `new ExprNode()`:

| Argument | What it does |
|---|---|
| `e.Attribute` | The metamodel type this JSX element creates instances of |
| `props` | Property values passed through from JSX attributes |
| `'attributes'` | The **connection info**: which property on the parent this element attaches to |

## Connection Info: How Parent-Child Nesting Works

The third argument is the most important thing to get right. It controls what happens when you nest one element inside another in JSX.

Consider this JSX:

```tsx
<Kernel name="Person">
  <Attribute name="Age" />
</Kernel>
```

When this is rendered, the framework needs to know how to connect the Attribute to its parent Kernel. The connection info `'attributes'` on the Attribute component tells it: "attach me to the parent's `attributes` property."

This works because the `Entity` type in the metamodel declares:

```typescript
export const Entity = t.subtype(ERConcept, {
  attributes: t.arrayOf(Attribute),  // <-- 'attributes' is the property name
}, "Entity", EERModel_TypeSchema)
```

The connection info string must match a property name in the parent's metamodel type definition. The framework checks the property type to decide how to connect:

- **Array property** (like `t.arrayOf(Attribute)`): the child is pushed into the array.
- **Single-valued property** (like `attrDomain: Domain`): the child is assigned directly.

### When to use `undefined`

Pass `undefined` as connection info for elements that are top-level in the model and do not attach to a specific parent property. These elements are added to the model's general `elements` collection instead (via `store.newModelElement`).

Root model/schema components and top-level entity types typically use `undefined`:

```typescript
// Root schema: no parent to connect to
export const EERSchema: CpxTemplate<IModelProps, e.IEERSchema> = (props) => {
  return new ExprNode(e.EERSchema, props, undefined)
}

// Kernel entity: top-level element in the model, not a child of a specific property
export const Kernel: Template<e.IKernel> = (props) => {
  return new ExprNode(e.Kernel, { objectClassification: "Kernel", ...props }, undefined)
}
```

### When the element can appear in BOTH contexts: `allowedAsTopLevelElement`

Some components are used both **nested** inside a structural parent (where a connector propName is required) and **at top level** of a Model/Namespace (where the element should land in the model's `elements` collection automatically, with no parent property to connect through). A static JSX tag cannot statically know which context it's in.

For these cases, declare the connector propName **and** opt the component in to top-level placement using the `allowedAsTopLevelElement` helper:

```typescript
import { allowedAsTopLevelElement, Element, Template } from '@aelastics/synthesis/jsx'

// Sequence can be nested in another Node (connects via 'children')
// OR appear at the top of a Process/Model (no 'children' on Process; goes to model.elements)
export const Sequence: Template<bpmn.ISequence> = (props) => {
  return new ExprNode(bpmn.Sequence, props, allowedAsTopLevelElement('children'))
}
```

When the parent's type schema has the declared propName (nested case), the runtime connects via that property. When it does not, the runtime accepts the missing propName as valid **only because** the JSX tag explicitly opted in AND the parent is a Namespace AND the child is a ModelElement; the child is then stored in `parent.elements` by `store.newModelElement`.

Without the opt-in, a missing propName on the parent throws (see below).

### One tag, several parents: ordered candidates

`propName` also accepts an ordered list of candidates, built with
`defaultConnectionInfo`, which fills in the default flags around it:

```typescript
import { defaultConnectionInfo, ExprNode, Template } from '@aelastics/synthesis/jsx'

// A Domain is either model-level vocabulary (a direct child of the
// schema connects into `elements`) or an attribute's type (a child of
// an Attribute connects into `attrDomain`).
export const Domain: Template<e.IDomain> = (props) => {
  return new ExprNode(e.Domain, props, defaultConnectionInfo(["attrDomain", "elements"]))
}
```

Candidates are tried in order, and the first *available* property wins:

- A candidate the parent's type does not declare is skipped.
- An array property is always available; the child is pushed into it.
- A single-valued property that is still empty is available; the child
  is assigned to it.
- A single-valued property that is already filled is **reconnected**
  (the connection is replaced) by default. Set
  `isReconnectAllowed: false` on the connection info to make an
  occupied slot skip to the next candidate instead.

The last rule is what makes paired references work. The full
relational metamodel of the eer-to-sql example defines one `Column`
tag serving three contexts, and its foreign-key column pairs depend on
the occupied slot being skipped rather than replaced:

```typescript
// One Column tag for a Table's columns, a ForeignKeyColumn pair, and
// an Index's column list. With isReconnectAllowed false, the first
// Column reference under a pair fills fkColumn and the second fills
// refColumn instead of reconnecting the first.
export const Column: Template<r.IColumn> = (props) => {
  return new ExprNode(r.Column, props, {
    ...defaultConnectionInfo(["columns", "fkColumn", "refColumn"]),
    isReconnectAllowed: false,
  })
}
```

### The connection info determines the model graph

The relationship between your metamodel, your components, and the resulting model graph is direct:

| Metamodel declaration | Component definition | JSX usage | Result |
|---|---|---|---|
| `Entity { attributes: t.arrayOf(Attribute) }` | `Attribute` with `'attributes'` | `<Kernel><Attribute/></Kernel>` | Attribute pushed into entity's `attributes` array |
| `Attribute { attrDomain: Domain }` | `Domain` with `'attrDomain'` | `<Attribute><Domain/></Attribute>` | Domain assigned to attribute's `attrDomain` property |
| `RelSchema { ... }` | `Table` with `undefined` | `<RelSchema><Table/></RelSchema>` | Table added to schema's elements collection |
| `Table { columns: t.arrayOf(Column) }` | `Column` with `'columns'` | `<Table><Column/></Table>` | Column pushed into table's `columns` array |

### Runtime validation: missing or wrong propName throws

If the connection info string does not match any property in the parent's type, and the JSX tag has not opted in via `allowedAsTopLevelElement`, the runtime throws at render time with an informative error pointing to both the parent type and the missing property. Fix the metamodel (add the property), or change the connector propName, or (for tags that legitimately appear at top level too) use the opt-in helper.

Additionally, when a child is connected through a declared property, the underlying `@aelastics/store` verifies that the child element's runtime type is a subtype of the property's declared element type. Assigning the wrong type, e.g. a `Role` into a property declared as `arrayOf(Task)`, throws a `ValidationError` from the store. See [Runtime type conformance](../../store/intro.md#runtime-type-conformance) in the store documentation.

## References: From Trees to Graphs

JSX nesting naturally produces trees. But models are usually graphs. An element in one part of the tree may need to reference an element created in another part. The `$refByName` prop solves this. Instead of creating a new element, it looks up an existing one by name and uses it.

For example, suppose multiple attributes share the same domain. The domain is created once, and other attributes reference it by name:

```tsx
<EERSchema name="Persons" store={store}>
  <Kernel name="Person">
    <Attribute name="FirstName">
      <Domain name="string" />          {/* creates the "string" domain */}
    </Attribute>
    <Attribute name="LastName">
      <Domain $refByName="string" />    {/* references the existing "string" domain */}
    </Attribute>
  </Kernel>
</EERSchema>
```

The first `<Domain name="string" />` creates a new domain element in the store. The second `<Domain $refByName="string" />` does not create anything. It resolves the existing "string" domain by name and connects it to the "LastName" attribute's `attrDomain` property. The result is a graph: two attributes pointing to the same domain.

This is how `$refByName` turns a hierarchical JSX expression into a general graph-structured model. Any component defined with `Template` automatically supports `$refByName` in addition to its regular props. When `$refByName` is set, it must be the only prop on that element.

Resolution is scope-aware. In a metamodel that declares no name
scopes, a bare name matches against the model's single flat pool,
which is the behavior shown above. Once the metamodel declares scopes
(see [Name scopes](./building-models.md#name-scopes)), a bare name
resolves against the nearest enclosing scope first and is probed
outward to the model, and a path such as `Author/id` reaches into a
sibling scope, which no bare name can.

## Component Types

The framework provides two main component signatures:

| Type | When to use |
|---|---|
| `Template<P>` | Regular model elements (Attribute, Column, Task). Supports `$refByName` for referencing existing elements. |
| `CpxTemplate<P, R>` | Root model/schema elements where the props type includes extra fields (like `store`) not part of the rendered model interface. |

`Template` is what you use for most components. `CpxTemplate` is only needed for root-level components where the props you pass in differ from the model interface that comes out.

## Complete Example: EER Components

```typescript
import * as e from './EER.meta.model.type'
import { CpxTemplate, ExprNode, IStore, Template, WithRefProps } from '@aelastics/synthesis/jsx'

export type IModelProps = WithRefProps<e.IEERSchema> & { store?: IStore }

// Root schema (CpxTemplate: props include 'store', rendered type does not)
export const EERSchema: CpxTemplate<IModelProps, e.IEERSchema> = (props) => {
  return new ExprNode(e.EERSchema, props, undefined)
}

// Top-level entities (undefined: added to model's elements collection)
export const Kernel: Template<e.IKernel> = (props) => {
  return new ExprNode(e.Kernel, { objectClassification: "Kernel", ...props }, undefined)
}

export const Weak: Template<e.IWeak> = (props) => {
  return new ExprNode(e.Weak, { objectClassification: "Weak", ...props }, undefined)
}

// Attribute connects to parent's 'attributes' array
export const Attribute: Template<e.IAttribute> = (props) => {
  return new ExprNode(e.Attribute, props, 'attributes')
}

// Domain connects to parent's 'attrDomain' single property
export const Domain: Template<e.IDomain> = (props) => {
  return new ExprNode(e.Domain, props, 'attrDomain')
}
```

With these components defined, you can write:

```tsx
<EERSchema name="Persons" store={store}>
  <Kernel name="Person">
    <Attribute name="PersonName">
      <Domain name="string" />
    </Attribute>
  </Kernel>
</EERSchema>
```

The nesting directly mirrors the metamodel structure. `Domain` goes inside `Attribute` because it connects to `attrDomain`. `Attribute` goes inside `Kernel` because it connects to `attributes`. `Kernel` goes inside `EERSchema` because it is a top-level model element.

## Complete Example: Relational Components

```typescript
import * as r from './REL.meta.model.type'
import { CpxTemplate, ExprNode, IStore, Template, WithRefProps } from '@aelastics/synthesis/jsx'

export type IModelProps = WithRefProps<r.IRelSchema> & { store?: IStore }

export const RelSchema: CpxTemplate<IModelProps, r.IRelSchema> = (props) => {
  return new ExprNode(r.RelSchema, props, undefined)
}

// Table: top-level in the schema
export const Table: Template<r.ITable> = (props) => {
  return new ExprNode(r.Table, props, undefined)
}

// Column connects to parent Table's 'columns' array
export const Column: Template<r.IColumn> = (props) => {
  return new ExprNode(r.Column, props, 'columns')
}

// Index connects to parent Table's 'indexes' array
export const Index: Template<r.IIndex> = (props) => {
  return new ExprNode(r.Index, props, 'indexes')
}

// ForeignKey connects to parent Table's 'foreignKeys' array
export const ForeignKey: Template<r.IForeignKey> = (props) => {
  return new ExprNode(r.ForeignKey, props, 'foreignKeys')
}

// Domain connects to parent's 'domain' property
export const Domain: Template<r.IDomain> = (props) => {
  return new ExprNode(r.Domain, props, 'domain')
}
```

## Setting Default Props

Components can merge default property values before passing props to the Element. The Kernel and Weak components show this:

```typescript
export const Kernel: Template<e.IKernel> = (props) => {
  return new ExprNode(e.Kernel, { objectClassification: "Kernel", ...props }, undefined)
}
```

The spread `{ objectClassification: "Kernel", ...props }` sets a default value for `objectClassification` that the caller does not need to provide. The caller's props override the defaults if both are specified.

## Naming Convention

By convention, component files are named `<Metamodel>.jsx-comps.ts`:

- `EER.jsx-comps.ts` for the EER metamodel
- `REL.jsx-comps.ts` for the Relational metamodel

Import them with a namespace alias to keep JSX readable:

```typescript
import * as e from './EER.jsx-comps'
import * as r from './REL.jsx-comps'
```

This lets you write `<e.Kernel>` and `<r.Table>`, making it clear which metamodel each element belongs to.
