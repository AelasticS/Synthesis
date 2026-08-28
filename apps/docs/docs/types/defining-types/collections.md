---
sidebar_position: 3
title: Collections
---

:::note Coming soon
The current release exports only `arrayOf`. Map and set collection types (`mapOf`, `setOf`) are planned and will be documented once implemented.
:::

---

## `arrayOf()`: typed array

```ts
arrayOf(element, name?, schema?)
```

Creates an array type whose elements all have the type given by `element`. The
element can be any type descriptor: a simple type, an object type, a tagged
union, another array, or a link.

```ts
import { object, arrayOf, string, number } from '@aelastics/types'

const Tag = object({ label: string }, 'Tag')

const Article = object(
  {
    title: string,
    wordCount: number,
    tags: arrayOf(Tag, 'TagArray'),
  },
  'Article'
)
```

```ts
import { TypeOf } from '@aelastics/types'

type IArticle = TypeOf<typeof Article>
// { title: string; wordCount: number; tags: Array<{ label: string }> }
```

---

## Naming the array type

The second argument gives the array type a name inside the schema. When
omitted, a name is generated automatically from the element type name:
`ArrayOf_<elementName>`.

If you define the same array type more than once with the same name and the
same element type, `arrayOf` returns the existing instance rather than creating
a new one. Calling it again with the same name but a different element type
throws.

---

## Arrays of links

Arrays often hold references to types defined elsewhere in the schema. Use
`link()` as the element type:

```ts
import { object, arrayOf, link, string, schema } from '@aelastics/types'

const mySchema = schema('mySchema')

const Person = object(
  {
    name:     string,
    children: arrayOf(link(mySchema, 'Person'), 'PersonArray', mySchema),
  },
  'Person',
  mySchema
)
```

---

## Adding validators to an array type

Validators on an `ArrayType` receive the whole array as their value, so they
can check length, uniqueness, ordering, or any other aggregate property:

```ts
const NonEmptyTags = arrayOf(Tag, 'NonEmptyTags')

NonEmptyTags.addValidator({
  predicate: (value) => value.length > 0,
  message:   (v, label) => `${label}: must have at least one tag`,
})
```

Validators on the element type run separately for each element during
traversal. You do not need to loop manually.

---

## DTO representation

In graph DTO form (`toDtoGraph`), an array value is wrapped in a `ref` envelope
alongside the serialized elements:

```ts
{ ref: { id, category, typeName }, array: [...] }
```

Each element is serialized according to its own type. If an element is an
object, it gets its own `ref` with an auto-generated `id`, and shared
references are collapsed to just the `ref` on subsequent occurrences.
