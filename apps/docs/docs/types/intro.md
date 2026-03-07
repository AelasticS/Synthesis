---
sidebar_position: 1
---

# @aelastics/types

Runtime type system for TypeScript. Define, validate, and transform typed data structures.

The framework draws inspiration from [io-ts](https://github.com/gcanti/io-ts) and shares goals with [Zod](https://zod.dev/). The project was [started in March 2019](https://gitlab.com/sinisa_neskovic/dynamic-types) on GitLab and [moved to GitHub](https://github.com/AelasticS/aelastics) in March 2020, about a year before Zod's first release. Where Zod focuses on schema validation and parsing, `@aelastics/types` goes further. Beyond validation, it provides graph transducers for structural data processing (DFS traversal with customizable node and edge processors) and type annotations for attaching domain metadata. These features make it suitable not just for input validation but also for model-driven transformations, serialization pipelines, and code generation workflows.

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
