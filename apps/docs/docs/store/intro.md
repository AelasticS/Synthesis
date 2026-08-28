---
sidebar_position: 1
---

# @aelastics/store

MobX-based reactive store built on top of `@aelastics/types`.

## Installation

```bash
npm install @aelastics/store
```

## Quick start

```typescript
import { createStore } from '@aelastics/store';
import * as t from '@aelastics/types';

const UserType = t.object({ id: t.number, name: t.string });
const store = createStore(UserType);
```

## Runtime type conformance

Every object produced by `store.deepCreate(type, init)` is tagged with its
type at the `@@aelastics/type` property. The property setters and array
observers installed by the store use this tag to validate that values
assigned to entity-typed properties conform to the property's declared
type.

This means the following all throw a `ValidationError` from the store:

```typescript
const place = store.deepCreate(PlaceType, { ... });
const peter = store.deepCreate(PersonType, { ... });

peter.parent = place;            // throws: PlaceType is not a PersonType
peter.children.push(place);      // throws: array element wrong type
peter.children.push({ name: 'x' }); // throws: missing @@aelastics/type tag
```

The check accepts the property's declared type **or any subtype** of it.
Subtype substitutability works across schemas: the value's tagged type
is resolved via the universal `t.System` schema, so a subtype declared
in one schema can be assigned to a property whose declared type lives
in another schema.

Validation runs only on user-initiated assignments. The store's
inverse-property maintenance writes to the prefixed backing field
directly and bypasses the setter, so it is never re-validated and never
throws spuriously.

Properties whose declared type is not an entity type (`string`, `number`,
`Map`, intersections, unions, etc.) are not validated by this mechanism;
their correctness is enforced at TypeScript compile time.

## API Reference

See the auto-generated [API Reference](./api/) for full details.
