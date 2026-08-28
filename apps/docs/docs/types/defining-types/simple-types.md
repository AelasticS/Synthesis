---
sidebar_position: 1
title: Simple Types
---

Simple types represent scalar values: strings, numbers, booleans, dates, and a
few special singleton types. The library exports pre-defined instances for the
most common ones. You do not call a factory to get them; you import them
directly and use them as property types.

---

## Pre-defined instances

```ts
import {
  string, number, boolean, date,
  nullType, undefinedType, voidType
} from '@aelastics/types'
```

| Export | TypeScript value type | Description |
|---|---|---|
| `string` | `string` | Any string value |
| `number` | `number` | Any number value |
| `boolean` | `boolean` | `true` or `false` |
| `date` | `Date` | JavaScript `Date` object |
| `nullType` | `null` | The single value `null` |
| `undefinedType` | `undefined` | The single value `undefined` |
| `voidType` | `void` | Used for properties with no meaningful value |

These are system types. You cannot add validators to them directly. Use
`derive()` to create a constrained variant instead.

---

## Optional convenience instances

```ts
import { optionalString, optionalNumber, optionalBoolean } from '@aelastics/types'
```

These are pre-defined `optional(string)`, `optional(number)`, and
`optional(boolean)` instances. They are useful when you want to mark a
single property as optional without calling `optional()` yourself.

---

## Literal types

`literal(value)` creates a type that only accepts exactly one value. The value
must be a string, number, or boolean.

```ts
import { literal } from '@aelastics/types'

const active   = literal('active')
const inactive = literal('inactive')
const zero     = literal(0)
```

Literal types are most useful as discriminator properties in tagged unions.

---

## Deriving constrained types

System types like `string` and `number` are sealed: you cannot add validators
to them. To create a constrained variant, call `.derive()`:

```ts
const Age = number.derive('Age')
const Name = string.derive('Name')
```

`derive(name?, schema?)` creates a new type that inherits the base type's
validators and can have more added. The new type appears in the schema under
the given name.

You can chain constraint methods directly on the returned type:

```ts
const Specialization = string
  .derive('Specialization')
  .oneOf(['Surgeon', 'Cardiologist', 'Internist'])

const PositiveAge = number
  .derive('PositiveAge')
  .positive
  .greaterThan(0)
  .lessThan(150)
```

---

## `NumberType` constraint methods

All methods return the same type instance, so they chain.

| Method | Signature | Description |
|---|---|---|
| `inRange` | `(start, end)` | Value must be within `[start, end]` |
| `greaterThan` | `(x)` | Value must be `> x` |
| `greaterThanOrEqual` | `(x)` | Value must be `>= x` |
| `lessThan` | `(x)` | Value must be `< x` |
| `lessThanOrEqual` | `(x)` | Value must be `<= x` |
| `equal` | `(expected)` | Value must equal `expected` |
| `.integer` | getter | Value must be an integer |
| `.finite` | getter | Value must be finite |
| `.infinite` | getter | Value must be infinite |
| `.positive` | getter | Value must be `> 0` |
| `.negative` | getter | Value must be `< 0` |
| `.integerOrInfinite` | getter | Value must be integer or infinite |
| `.uint8` | getter | Integer in `[0, 255]` |
| `.uint16` | getter | Integer in `[0, 65535]` |
| `.uint32` | getter | Integer in `[0, 4294967295]` |
| `.int8` | getter | Integer in `[-128, 127]` |
| `.int16` | getter | Integer in `[-32768, 32767]` |
| `.int32` | getter | Integer in `[-2147483648, 2147483647]` |

---

## `StringType` constraint methods

| Method | Signature | Description |
|---|---|---|
| `length` | `(n)` | String must have exactly `n` characters |
| `minLength` | `(n)` | String length must be `>= n` |
| `maxLength` | `(n)` | String length must be `<= n` |
| `matches` | `(regExp)` | String must match the regular expression |
| `startsWith` | `(s)` | String must start with `s` |
| `endsWith` | `(s)` | String must end with `s` |
| `includes` | `(s)` | String must contain `s` |
| `oneOf` | `(list)` | String must be one of the values in `list` |
| `equals` | `(expected)` | String must equal `expected` |
| `.empty` | getter | String must be `''` |
| `.nonEmpty` | getter | String must not be `''` |
| `.alphanumeric` | getter | Only letters, digits, and underscores |
| `.word` | getter | Only ASCII letters |
| `.alphabetical` | getter | Only letters and spaces, at least two characters |
| `.numeric` | getter | String representation of an integer (with optional sign) |
| `.lowercase` | getter | Non-empty string in lowercase |
| `.uppercase` | getter | Non-empty string in uppercase |
| `.email` | getter | Must match a standard email address pattern |
