---
sidebar_position: 1
---

# aelastics-store

MobX-based reactive store built on top of `aelastics-types`.

## Installation

```bash
npm install aelastics-store
```

## Quick start

```typescript
import { createStore } from 'aelastics-store';
import * as t from 'aelastics-types';

const UserType = t.object({ id: t.number, name: t.string });
const store = createStore(UserType);
```

## API Reference

See the auto-generated [API Reference](./api/) for full details.
