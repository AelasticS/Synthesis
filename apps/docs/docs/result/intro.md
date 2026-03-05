---
sidebar_position: 1
---

# aelastics-result

Framework for handling results of software services — typed success/failure without exceptions.

## Installation

```bash
npm install aelastics-result
```

## Quick start

```typescript
import { success, failure, isSuccess } from 'aelastics-result';

const result = success(42);

if (isSuccess(result)) {
  console.log(result.value); // 42
}

const err = failure('NOT_FOUND', 'Item not found');
```

## API Reference

See the auto-generated [API Reference](./api/) for full details.
