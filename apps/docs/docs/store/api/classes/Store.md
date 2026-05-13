# Class: Store

Defined in: [store/Store.ts:28](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L28)

## Extends

- `AbstractStore`

## Constructors

### new Store()

> **new Store**(`server`?): [`Store`](Store.md)

Defined in: [store/Store.ts:36](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L36)

#### Parameters

##### server?

[`ServerProxy`](ServerProxy.md)

#### Returns

[`Store`](Store.md)

#### Overrides

`AbstractStore.constructor`

## Properties

### eventLog

> **eventLog**: `EventLog`

Defined in: [store/Store.ts:30](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L30)

***

### instances

> `protected` `readonly` **instances**: `Map`\<`string`, `IStoreObject`\<`ObjectLiteral`\>\>

Defined in: [store/Store.ts:33](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L33)

***

### repo

> `protected` **repo**: [`Repository`](Repository.md)\<`any`\>

Defined in: [store/Store.ts:31](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L31)

***

### schemas

> `readonly` **schemas**: `Map`\<`string`, `TypeSchema`\>

Defined in: [store/Store.ts:29](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L29)

#### Overrides

`AbstractStore.schemas`

***

### server?

> `protected` `optional` **server**: [`ServerProxy`](ServerProxy.md)

Defined in: [store/Store.ts:32](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L32)

## Methods

### add()

> **add**\<`T`\>(`obj`): `void`

Defined in: [store/Store.ts:86](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L86)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### obj

`T`

#### Returns

`void`

***

### clear()

> **clear**(`clearSchema`): `void`

Defined in: [store/Store.ts:44](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L44)

clear all instances and event log

#### Parameters

##### clearSchema

`boolean` = `false`

#### Returns

`void`

#### Overrides

`AbstractStore.clear`

***

### create()

> **create**\<`P`\>(`type`, `initValue`?): `IStoreObject`\<`P`\>

Defined in: [store/Store.ts:68](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L68)

#### Type Parameters

• **P** *extends* `ObjectLiteral`

#### Parameters

##### type

`ObjectType`\<`any`, `any`\>

##### initValue?

`Partial`\<`P`\>

#### Returns

`IStoreObject`\<`P`\>

***

### deepCreate()

> **deepCreate**\<`T`\>(`type`, `initValue`): `IStoreObject`\<`T`\>

Defined in: [store/Store.ts:76](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L76)

#### Type Parameters

• **T** *extends* `ObjectLiteral`

#### Parameters

##### type

`ObjectType`\<`any`, `any`\>

##### initValue

`Partial`\<`T`\>

#### Returns

`IStoreObject`\<`T`\>

***

### delete()

> **delete**\<`T`\>(`object`): `void`

Defined in: [store/Store.ts:102](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L102)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### object

`T`

#### Returns

`void`

***

### fetchObjectByID()

> **fetchObjectByID**(`type`, `id`): `Promise`\<`undefined` \| `IStoreObject`\<`ObjectLiteral`\>\>

Defined in: [store/Store.ts:56](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L56)

#### Parameters

##### type

`Any`

##### id

`string`

#### Returns

`Promise`\<`undefined` \| `IStoreObject`\<`ObjectLiteral`\>\>

***

### getObjectByID()

> **getObjectByID**\<`T`\>(`id`): `undefined` \| `T`

Defined in: [store/Store.ts:52](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L52)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### id

`string`

#### Returns

`undefined` \| `T`

#### Overrides

`AbstractStore.getObjectByID`

***

### getType()

> **getType**\<`T`\>(`obj`): `ObjectType`\<`any`, `any`\>

Defined in: [common/abstract-store.ts:44](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/common/abstract-store.ts#L44)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### obj

`T`

#### Returns

`ObjectType`\<`any`, `any`\>

#### Inherited from

`AbstractStore.getType`

***

### getTypeSchemaName()

> `protected` **getTypeSchemaName**\<`T`\>(`obj`): `string`

Defined in: [common/abstract-store.ts:29](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/common/abstract-store.ts#L29)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### obj

`T`

#### Returns

`string`

#### Inherited from

`AbstractStore.getTypeSchemaName`

***

### getTypeSchemaOfObject()

> `protected` **getTypeSchemaOfObject**\<`T`\>(`obj`): `TypeSchema`

Defined in: [common/abstract-store.ts:35](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/common/abstract-store.ts#L35)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### obj

`T`

#### Returns

`TypeSchema`

#### Inherited from

`AbstractStore.getTypeSchemaOfObject`

***

### persist()

> **persist**(): `Promise`\<`void`\>

Defined in: [store/Store.ts:66](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L66)

#### Returns

`Promise`\<`void`\>

***

### registerTypeSchema()

> **registerTypeSchema**(`schema`): `void`

Defined in: [common/abstract-store.ts:24](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/common/abstract-store.ts#L24)

#### Parameters

##### schema

`TypeSchema`

#### Returns

`void`

#### Inherited from

`AbstractStore.registerTypeSchema`

***

### remove()

> **remove**\<`T`\>(`obj`): `void`

Defined in: [store/Store.ts:97](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Store.ts#L97)

#### Type Parameters

• **T** *extends* `ObjectLiteral`

#### Parameters

##### obj

`T`

#### Returns

`void`
