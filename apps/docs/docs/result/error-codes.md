---
sidebar_position: 3
---

# Errors & Error Codes

## ServiceError

`ServiceError` is the structured error type used throughout `@aelastics/result`.

```typescript
const err = new ServiceError(code, message, name?)
```

| Property | Type | Description |
|---|---|---|
| `code` | `ErrorCode` | Predefined category of the error |
| `message` | `string` | Human-readable description |
| `name` | `string` | Defaults to `code` if not provided |

```typescript
import { ServiceError } from '@aelastics/result'

const err = new ServiceError('ValidationError', 'Email format is invalid')
console.log(err.code)    // 'ValidationError'
console.log(err.message) // 'Email format is invalid'
console.log(err.name)    // 'ValidationError'

// Custom name
const err2 = new ServiceError('OperationFailed', 'Record locked', 'ConcurrencyError')
console.log(err2.name) // 'ConcurrencyError'
```

### Wrapping native JS errors

`ServiceError.toServiceError()` converts any native `Error` subclass into a `ServiceError`, mapping the JS error type to the closest `ErrorCode`:

```typescript
import { ServiceError } from '@aelastics/result'

try {
  null.property // throws TypeError
} catch (e) {
  const se = ServiceError.toServiceError(e as Error)
  console.log(se.code)    // 'TypeError'
  console.log(se.message) // 'Cannot read properties of null'
}
```

This conversion happens automatically when you pass a native `Error` to `failure()`.

---

## CumulativeError

`CumulativeError` groups multiple child errors under a single parent. Use it when an operation fails for several reasons that belong together conceptually.

```typescript
import { CumulativeError, ServiceError } from '@aelastics/result'

const childErrors = [
  new ServiceError('ValidationError', 'Email is required'),
  new ServiceError('ValidationError', 'Password too short'),
]

const cumulative = new CumulativeError('ValidationError', 'Form validation failed', childErrors)
console.log(cumulative.errors.length) // 2
console.log(cumulative.errors[0].message) // 'Email is required'
```

---

## ErrorCode Reference

`ErrorCode` is a union type of all predefined error categories:

| Code | When to use |
|---|---|
| `ValidationError` | Input data fails a validation rule |
| `ValidationError2` | Secondary validation (alternative severity or phase) |
| `TypeError` | Wrong type — maps from JS `TypeError` |
| `RangeError` | Value out of allowed range — maps from JS `RangeError` |
| `ReferenceError` | Invalid reference — maps from JS `ReferenceError` |
| `SyntaxError` | Parsing / syntax failure — maps from JS `SyntaxError` |
| `EvalError` | Eval-related failure — maps from JS `EvalError` |
| `URIError` | Malformed URI — maps from JS `URIError` |
| `InternalError` | Unexpected internal failure |
| `OperationFailed` | A business operation could not be completed |
| `OperationNotAllowed` | The operation is not permitted in the current state |
| `FeatureNotSupported` | The requested feature is not implemented |
| `UnknownError` | Fallback — used when no other code applies |

```typescript
import type { ErrorCode } from '@aelastics/result'

function classify(code: ErrorCode): string {
  switch (code) {
    case 'ValidationError':
    case 'ValidationError2':
      return 'User input problem'
    case 'OperationFailed':
    case 'OperationNotAllowed':
      return 'Business rule violation'
    default:
      return 'System error'
  }
}
```
