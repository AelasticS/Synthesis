---
sidebar_position: 2
---

# Usage Guide

## Creating Results

### Successful result

```typescript
import { success } from '@aelastics/result'

const result = success(42)
const stringResult = success('hello')
const objectResult = success({ id: 1, name: 'Alice' })
```

### Failed result — single error

```typescript
import { failure, ServiceError } from '@aelastics/result'

const result = failure(new ServiceError('ValidationError', 'Email is required'))
```

### Failed result — multiple errors at once

```typescript
import { failures, ServiceError } from '@aelastics/result'

const result = failures([
  new ServiceError('ValidationError', 'Email is required'),
  new ServiceError('ValidationError', 'Name must be at least 2 characters'),
])
```

### Wrapping a native JS error

```typescript
import { failure } from '@aelastics/result'

try {
  JSON.parse(badInput)
} catch (e) {
  return failure(e as Error) // ServiceError.toServiceError() is called automatically
}
```

---

## Checking Outcomes

Use the type guards `isSuccess` and `isFailure` to narrow the type:

```typescript
import { isSuccess, isFailure } from '@aelastics/result'

const result = findUser('123')

if (isSuccess(result)) {
  // result.value is typed as User here
  console.log(result.value.name)
}

if (isFailure(result)) {
  // result.errors is ServiceError[] here
  result.errors.forEach(e => console.error(`[${e.code}] ${e.message}`))
}
```

Or extract without narrowing:

```typescript
import { getValue, getErrors } from '@aelastics/result'

const value = getValue(result)   // User | undefined
const errors = getErrors(result) // ServiceError[] | undefined
```

---

## Accumulating Errors

When validating an object with multiple fields, collect all errors before returning — don't stop at the first one:

```typescript
import { success, failures, addError, isFailure, ServiceError } from '@aelastics/result'
import type { ServiceResult, Failure } from '@aelastics/result'

function validateUser(input: unknown): ServiceResult<User> {
  const errs: ServiceError[] = []

  if (!input.email) errs.push(new ServiceError('ValidationError', 'Email is required'))
  if (!input.name)  errs.push(new ServiceError('ValidationError', 'Name is required'))
  if (input.age < 0) errs.push(new ServiceError('RangeError', 'Age must be non-negative'))

  if (errs.length > 0) return failures(errs)
  return success(input as User)
}
```

Or add errors incrementally to an existing failure:

```typescript
import { failure, addError, ServiceError } from '@aelastics/result'

let result = failure(new ServiceError('ValidationError', 'First error'))
addError(result as Failure, new ServiceError('ValidationError', 'Second error'))
```

---

## Composing Operations

Chain multiple operations where each can fail:

```typescript
import { success, failure, isFailure, ServiceError } from '@aelastics/result'
import type { ServiceResult } from '@aelastics/result'

function parseId(raw: string): ServiceResult<number> {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return failure(new ServiceError('ValidationError', `Invalid id: ${raw}`))
  return success(n)
}

function findUser(id: number): ServiceResult<User> {
  const user = db.get(id)
  if (!user) return failure(new ServiceError('OperationFailed', `User ${id} not found`))
  return success(user)
}

function getUsername(raw: string): ServiceResult<string> {
  const idResult = parseId(raw)
  if (isFailure(idResult)) return idResult  // propagate failure

  const userResult = findUser(idResult.value)
  if (isFailure(userResult)) return userResult

  return success(userResult.value.name)
}
```

---

## Using with async/await

`ServiceResult` composes naturally with `Promise`:

```typescript
async function loadUser(id: string): Promise<ServiceResult<User>> {
  try {
    const user = await db.findById(id)
    if (!user) return failure(new ServiceError('OperationFailed', 'User not found'))
    return success(user)
  } catch (e) {
    return failure(e as Error)
  }
}

// Caller
const result = await loadUser('123')
if (isSuccess(result)) {
  console.log(result.value)
}
```

---

## Migrating from try/catch

Before:

```typescript
function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero')
  return a / b
}

try {
  const result = divide(10, 0)
} catch (e) {
  console.error(e.message)
}
```

After:

```typescript
import { success, failure, isFailure, ServiceError } from '@aelastics/result'

function divide(a: number, b: number): ServiceResult<number> {
  if (b === 0) return failure(new ServiceError('OperationFailed', 'Division by zero'))
  return success(a / b)
}

const result = divide(10, 0)
if (isFailure(result)) {
  console.error(result.errors[0].message)
}
```
