---
sidebar_position: 1
---

# @aelastics/result

Typed service results with cumulative error reporting. The compiler enforces that every failure is handled.

## The Problem

Services can fail for multiple independent reasons at the same time. REST API input validation is a typical example. A thrown exception captures only one failure at a time:

```typescript
// Throws on the first problem found. All other errors are lost.
function validateOrder(order: Order): void {
  if (!order.customerId) throw new Error('Customer is required')
  if (order.items.length === 0) throw new Error('Order must have items')
  if (order.total < 0) throw new Error('Total cannot be negative')
}
```

The caller receives one error, fixes it, resubmits, and discovers the next. This is bad for API consumers and hides the true state of the input.

A second problem: exceptions are invisible in type signatures. There is no way to tell from `validateOrder`'s signature that it can fail. Callers must read the implementation to find out, and the compiler cannot help.

## The Solution

`@aelastics/result` makes failure an explicit, cumulative part of the return type. A `Failure` carries a list of errors collected in one pass:

```typescript
function validateOrder(order: Order): ServiceResult<Order> {
  const errs: ServiceError[] = []

  if (!order.customerId)        errs.push(new ServiceError('ValidationError', 'Customer is required'))
  if (order.items.length === 0) errs.push(new ServiceError('ValidationError', 'Order must have items'))
  if (order.total < 0)          errs.push(new ServiceError('RangeError', 'Total cannot be negative'))

  if (errs.length > 0) return failures(errs)
  return success(order)
}
```

The caller receives all errors at once. Nothing is hidden in the type signature.

On the caller side, the type system makes it impossible to ignore failure. You cannot access the value without first narrowing the type:

```typescript
const result = validateOrder(order)

// Compile error. Property 'value' does not exist on type 'Failure'.
console.log(result.value)

// Must check first. The compiler narrows the type inside each branch.
if (isSuccess(result)) {
  processOrder(result.value) // result.value is Order here
} else {
  // result.errors is ServiceError[]. All problems, not just the first.
  result.errors.forEach(e => console.error(`[${e.code}] ${e.message}`))
}
```

This is the same discipline that `Option<T>` and `Maybe` types enforce in Rust, Haskell, and Kotlin, applied to the failure case. The compiler is your safety net.

## Installation

```bash
npm install @aelastics/result
```

## Quick Start

```typescript
import { success, failure, isSuccess, isFailure, ServiceError, getValue, getErrors } from '@aelastics/result'

const ok = success(42)
const err = failure(new ServiceError('ValidationError', 'Invalid input'))

if (isSuccess(ok)) {
  console.log(ok.value) // 42
}

if (isFailure(err)) {
  console.log(err.errors[0].message) // 'Invalid input'
}

const value = getValue(ok)    // 42 | undefined
const errors = getErrors(err) // ServiceError[] | undefined
```

## What's Inside

| Export | Description |
|---|---|
| `ServiceResult<T>` | `Success<T> \| Failure`, the core union type |
| `success(value)` | Create a successful result |
| `failure(error)` | Create a failed result from one error |
| `failures(errors)` | Create a failed result from multiple errors |
| `isSuccess(result)` | Type guard, narrows to `Success<T>` |
| `isFailure(result)` | Type guard, narrows to `Failure` |
| `getValue(result)` | Extract value or `undefined` |
| `getErrors(result)` | Extract errors array or `undefined` |
| `addError(failure, error)` | Add an error to an existing failure |
| `ServiceError` | Structured error with code, message, name |
| `CumulativeError` | Groups multiple child errors under one parent |
| `ErrorCode` | Union type of predefined error codes |

## API Reference

See the auto-generated [API Reference](./api/) for full details.
