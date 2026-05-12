# Class: Repository\<T\>

Defined in: [store/Repository.ts:28](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/store/Repository.ts#L28)

## Type Parameters

• **T** *extends* `t.Any`

## Constructors

### new Repository()

> **new Repository**\<`T`\>(`eventLog`?): [`Repository`](Repository.md)\<`T`\>

Defined in: [store/Repository.ts:30](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/store/Repository.ts#L30)

#### Parameters

##### eventLog?

`EventLog`

#### Returns

[`Repository`](Repository.md)\<`T`\>

## Properties

### eventLog

> `readonly` **eventLog**: `undefined` \| `EventLog`

Defined in: [store/Repository.ts:29](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/store/Repository.ts#L29)

## Methods

### create()

> **create**\<`P`\>(`baseType`, `init`?): `IStoreObject`\<`P`\>

Defined in: [store/Repository.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/store/Repository.ts#L56)

#### Type Parameters

• **P** *extends* `ObjectLiteral`

#### Parameters

##### baseType

`ObjectType`\<`any`, `any`\>

##### init?

`Partial`\<`P`\>

#### Returns

`IStoreObject`\<`P`\>

***

### deepCreate()

> **deepCreate**\<`P`\>(`baseType`, `init`?): `IStoreObject`\<`P`\>

Defined in: [store/Repository.ts:34](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/store/Repository.ts#L34)

#### Type Parameters

• **P** *extends* `ObjectLiteral`

#### Parameters

##### baseType

`ObjectType`\<`any`, `any`\>

##### init?

`Partial`\<`P`\>

#### Returns

`IStoreObject`\<`P`\>

***

### delete()

> **delete**(`objectType`, `obj`): `void`

Defined in: [store/Repository.ts:93](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/store/Repository.ts#L93)

#### Parameters

##### objectType

`ObjectType`\<`any`, `any`\>

##### obj

`Interface`\<`any`\>

#### Returns

`void`

***

### exportToDTO()

> **exportToDTO**(`objType`, `obj`): `ObjectLiteral`

Defined in: [store/Repository.ts:75](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/store/Repository.ts#L75)

#### Parameters

##### objType

`ObjectType`\<`any`, `any`\>

##### obj

`ObjectLiteral`

#### Returns

`ObjectLiteral`

***

### importFromDTO()

> **importFromDTO**\<`P`\>(`baseType`, `inputDTO`): `IStoreObject`\<`P`\>

Defined in: [store/Repository.ts:84](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/store/Repository.ts#L84)

#### Type Parameters

• **P** *extends* `ObjectLiteral`

#### Parameters

##### baseType

`ObjectType`\<`any`, `any`\>

##### inputDTO

`ObjectLiteral`

#### Returns

`IStoreObject`\<`P`\>
