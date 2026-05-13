# Class: Aggregate\<R, ID\>

Defined in: [store/Aggregate.ts:49](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L49)

Aggreagate - DDD aggregate is a cluster of domain objects that can be treated as a single unit.

## Extends

- `Base`\<`ID`\>

## Type Parameters

• **R** *extends* `ObjectLiteral`

• **ID** = `string`

## Constructors

### new Aggregate()

> **new Aggregate**\<`R`, `ID`\>(`rootType`, `root`?, `server`?): [`Aggregate`](Aggregate.md)\<`R`, `ID`\>

Defined in: [store/Aggregate.ts:56](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L56)

#### Parameters

##### rootType

`ObjectType`\<`any`, `any`\>

##### root?

`IStoreObject`\<`R`\>

##### server?

[`ServerProxy`](ServerProxy.md)

#### Returns

[`Aggregate`](Aggregate.md)\<`R`, `ID`\>

#### Overrides

`Base<ID>.constructor`

## Properties

### eventLog

> **eventLog**: `EventLog`

Defined in: [store/Base.ts:20](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L20)

#### Inherited from

`Base.eventLog`

***

### repo

> `protected` **repo**: [`Repository`](Repository.md)\<`Any`\>

Defined in: [store/Base.ts:21](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L21)

#### Inherited from

`Base.repo`

***

### root

> **root**: `undefined` \| `IStoreObject`\<`R`\>

Defined in: [store/Aggregate.ts:54](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L54)

***

### rootType

> `readonly` **rootType**: `ObjectType`\<`any`, `any`\>

Defined in: [store/Aggregate.ts:51](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L51)

***

### server?

> `protected` `optional` **server**: [`ServerProxy`](ServerProxy.md)

Defined in: [store/Base.ts:19](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L19)

#### Inherited from

`Base.server`

## Methods

### create()

> **create**\<`P`\>(`type`, `initValue`?): `IStoreObject`\<`P`\>

Defined in: [store/Base.ts:51](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L51)

#### Type Parameters

• **P** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### type

`ObjectType`\<`any`, `any`\>

##### initValue?

`Partial`\<`P`\>

#### Returns

`IStoreObject`\<`P`\>

#### Inherited from

`Base.create`

***

### createRoot()

> **createRoot**(`initValue`?): `IStoreObject`\<`R`\>

Defined in: [store/Aggregate.ts:67](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L67)

#### Parameters

##### initValue?

`Partial`\<`R`\>

#### Returns

`IStoreObject`\<`R`\>

***

### deepCreate()

> **deepCreate**\<`P`\>(`type`, `initValue`?): `IStoreObject`\<`P`\>

Defined in: [store/Base.ts:43](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L43)

#### Type Parameters

• **P** *extends* `ObjectLiteral`

#### Parameters

##### type

`ObjectType`\<`any`, `any`\>

##### initValue?

`Partial`\<`P`\>

#### Returns

`IStoreObject`\<`P`\>

#### Inherited from

`Base.deepCreate`

***

### delete()

> **delete**\<`T`\>(`object`): `void`

Defined in: [store/Base.ts:59](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L59)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### object

`T`

#### Returns

`void`

#### Inherited from

`Base.delete`

***

### exportDTO()

> **exportDTO**(): `undefined` \| `ObjectLiteral`

Defined in: [store/Aggregate.ts:101](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L101)

#### Returns

`undefined` \| `ObjectLiteral`

***

### exportToDTO()

> `protected` **exportToDTO**(`baseType`, `inputDTO`): `ObjectLiteral`

Defined in: [store/Base.ts:74](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L74)

#### Parameters

##### baseType

`ObjectType`\<`any`, `any`\>

##### inputDTO

`ObjectLiteral`

#### Returns

`ObjectLiteral`

#### Inherited from

`Base.exportToDTO`

***

### getTypeOfObject()

> **getTypeOfObject**\<`T`\>(`obj`): `Any`

Defined in: [store/Aggregate.ts:83](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L83)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### obj

`T`

#### Returns

`Any`

#### Overrides

`Base.getTypeOfObject`

***

### getTypeSchemaByFullName()

> **getTypeSchemaByFullName**(`schemaPath`): `undefined` \| `TypeSchema`

Defined in: [store/Aggregate.ts:77](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L77)

#### Parameters

##### schemaPath

`string`

#### Returns

`undefined` \| `TypeSchema`

#### Overrides

`Base.getTypeSchemaByFullName`

***

### getTypeSchemaFullName()

> `protected` **getTypeSchemaFullName**\<`T`\>(`obj`): `string`

Defined in: [store/Base.ts:27](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L27)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### obj

`T`

#### Returns

`string`

#### Inherited from

`Base.getTypeSchemaFullName`

***

### getTypeSchemaOfObject()

> **getTypeSchemaOfObject**\<`T`\>(`obj`): `TypeSchema`

Defined in: [store/Aggregate.ts:71](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L71)

#### Type Parameters

• **T** *extends* `IStoreObject`\<`ObjectLiteral`\>

#### Parameters

##### obj

`T`

#### Returns

`TypeSchema`

#### Overrides

`Base.getTypeSchemaOfObject`

***

### importDTO()

> **importDTO**(`initValue`): `IStoreObject`\<`ObjectLiteral`\>

Defined in: [store/Aggregate.ts:94](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L94)

#### Parameters

##### initValue

`ObjectLiteral`

#### Returns

`IStoreObject`\<`ObjectLiteral`\>

***

### importFromDTO()

> `protected` **importFromDTO**(`baseType`, `inputDTO`): `IStoreObject`\<`ObjectLiteral`\>

Defined in: [store/Base.ts:66](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Base.ts#L66)

#### Parameters

##### baseType

`ObjectType`\<`any`, `any`\>

##### inputDTO

`ObjectLiteral`

#### Returns

`IStoreObject`\<`ObjectLiteral`\>

#### Inherited from

`Base.importFromDTO`

***

### save()

> **save**(): `void`

Defined in: [store/Aggregate.ts:113](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/store/Aggregate.ts#L113)

Strategies:
 1. subtypes collapsed into supertype/expanded into separte
 2. all relationships collapsed into one super rel/expanded into separte rels
 3. all attaributes are collapsed

#### Returns

`void`
