# Class: ImmutableStore\<S\>

Defined in: [immutable/immutable-store.ts:35](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L35)

Implements an immutable state management store using Immer library to handle state updates immutably.
The store supports objects that are identifiable by unique IDs ("@@aelastics/ID").

## Type Parameters

• **S**

## Constructors

### new ImmutableStore()

> **new ImmutableStore**\<`S`\>(`rootType`): [`ImmutableStore`](ImmutableStore.md)\<`S`\>

Defined in: [immutable/immutable-store.ts:69](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L69)

Creates an instance of ImmutableStore.

#### Parameters

##### rootType

`AnyObjectType`

#### Returns

[`ImmutableStore`](ImmutableStore.md)\<`S`\>

## Properties

### rootType

> `readonly` **rootType**: `AnyObjectType`

Defined in: [immutable/immutable-store.ts:69](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L69)

## Methods

### cloneOperationContext()

> **cloneOperationContext**(): `void`

Defined in: [immutable/immutable-store.ts:44](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L44)

#### Returns

`void`

***

### createRoot()

> **createRoot**(`initialState`, `ID`?): `S`

Defined in: [immutable/immutable-store.ts:71](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L71)

#### Parameters

##### initialState

`S`

##### ID?

`string`

#### Returns

`S`

***

### getContext()

> **getContext**(): `OperationContext`\<`S`\>

Defined in: [immutable/immutable-store.ts:48](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L48)

#### Returns

`OperationContext`\<`S`\>

***

### getIdMap()

> **getIdMap**(): `Map`\<`string`, `any`\>

Defined in: [immutable/immutable-store.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L56)

#### Returns

`Map`\<`string`, `any`\>

***

### getIdMapWithDeleted()

> **getIdMapWithDeleted**(): `Map`\<`string`, `any`\>

Defined in: [immutable/immutable-store.ts:60](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L60)

#### Returns

`Map`\<`string`, `any`\>

***

### getState()

> **getState**(): `S`

Defined in: [immutable/immutable-store.ts:52](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L52)

#### Returns

`S`

***

### makeNewOperationContext()

> **makeNewOperationContext**(`state`?): `void`

Defined in: [immutable/immutable-store.ts:41](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L41)

#### Parameters

##### state?

`S`

#### Returns

`void`

***

### newObject()

> **newObject**\<`P`\>(`objectType`, `initProps`, `ID`?): `P`

Defined in: [immutable/immutable-store.ts:83](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L83)

Creates a new object of the specified type and initializes it with provided properties.

#### Type Parameters

• **P** *extends* `ImmutableObject`

#### Parameters

##### objectType

`AnyObjectType`

The type of the object to create.

##### initProps

`ObjectLiteral`

The initial properties of the object.

##### ID?

`string`

#### Returns

`P`

The newly created object.

***

### produce()

> **produce**(`f`): `S`

Defined in: [immutable/immutable-store.ts:98](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/immutable/immutable-store.ts#L98)

Applies a function to modify the store's state immutably.

#### Parameters

##### f

(`draft`) => `void`

A function that receives the current state as a draft and modifies it.

#### Returns

`S`
