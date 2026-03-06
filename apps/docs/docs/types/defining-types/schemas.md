---
sidebar_position: 9
title: Type Schemas
---

A schema is a named container for type definitions. Every type belongs to
exactly one schema. Schemas can be nested: a schema can have a parent schema,
forming a hierarchy. The hierarchy is used to construct fully qualified type
paths for link resolution.

---

## The built-in schemas

Two schemas exist from the start:

| Export | Description |
|---|---|
| `System` | Root schema. All pre-defined types (`string`, `number`, etc.) live here. You cannot add types to `System` directly. |
| `DefaultSchema` | The top-level user schema. When you define a type without specifying a schema, it goes here. |

---

## `schema()` — create a named schema

```ts
schema(name, superSchema?)
```

Creates a new `TypeSchema`. If `superSchema` is omitted, `DefaultSchema` is
used as the parent.

```ts
import { schema } from '@aelastics/types'

const mySchema = schema('mySchema')
```

To create a sub-schema:

```ts
const subSchema = schema('subSchema', mySchema)
```

---

## Assigning types to a schema

Pass the schema as the last argument to any factory function. When omitted,
`DefaultSchema` is used.

```ts
import { entity, string, number, schema } from '@aelastics/types'

const mySchema = schema('mySchema')

const Department = entity(
  { name: string, headcount: number },
  ['name'],
  'Department',
  mySchema      // <-- assign to mySchema
)
```

---

## Schema paths and link resolution

Each type has a `fullPathName` that includes the schema hierarchy. For example,
a type named `Department` in `mySchema` (whose parent is `DefaultSchema`) has
the path `/mySchema/Department`.

`link(schema, path)` uses this path to locate the target type. The path passed
to `link` is relative to the given schema.

---

## Schema validation

Before running any operation on types that contain `link()` references, call
`schema.validate()`:

```ts
mySchema.validate()
```

This resolves all links registered in the schema and confirms that each path
points to a type that exists. If a link cannot be resolved, `validate` returns
a failure result listing the broken links. The schema is then sealed: no new
types can be added after validation.

For schemas that do not contain any `link()` calls this step is not required.

When using multiple schemas that reference each other, validate each schema
after all types are defined:

```ts
hrSchema.validate()
financeSchema.validate()
```

The order does not matter as long as all types are defined before any
`validate()` call runs.

---

## `TypeSchema` — the schema class

`TypeSchema` is the class of all schema instances. Key members:

| Member | Description |
|---|---|
| `name` | The schema's name |
| `absolutePathName` | Full path from the root, e.g. `/mySchema` |
| `getType(path)` | Look up a type by name or path |
| `validate()` | Resolve all links; returns `ServiceResult<boolean>` |

---

## Using multiple schemas

Schemas are useful for separating types into modules or domains and for
controlling which types a `link()` resolves within.

```ts
import { schema, entity, link, string, number } from '@aelastics/types'

const hrSchema      = schema('hr')
const financeSchema = schema('finance')

const Employee = entity(
  { name: string, employeeNumber: number },
  ['employeeNumber'],
  'Employee',
  hrSchema
)

const CostCenter = entity(
  {
    code:      string,
    manager:   link(hrSchema, 'Employee'),
  },
  ['code'],
  'CostCenter',
  financeSchema
)

hrSchema.validate()
financeSchema.validate()
```

A link in `financeSchema` can target a type in `hrSchema` because `link` takes
the schema to search in as its first argument, regardless of which schema owns
the link type.
