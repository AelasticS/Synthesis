---
sidebar_position: 1
---

# @aelastics/types

Runtime type system for TypeScript — define, validate, and transform typed data structures.

## Installation

```bash
npm install @aelastics/types
```

## Quick start

```typescript
import * as t from '@aelastics/types';

const User = t.object({
  id: t.number,
  name: t.string,
});

type IUser = t.TypeOf<typeof User>;
```

## API Reference

See the auto-generated [API Reference](./api/) for full details.
