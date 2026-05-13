# Class: TypeSchema

Defined in: [type/TypeSchema.ts:18](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L18)

Schema is a a container of types and other (sub)schemas
 Types and subschemas can be shared among schemas!

## Constructors

### new TypeSchema()

> **new TypeSchema**(`name`, `superSchema`?): [`TypeSchema`](TypeSchema.md)

Defined in: [type/TypeSchema.ts:28](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L28)

#### Parameters

##### name

`string`

##### superSchema?

[`TypeSchema`](TypeSchema.md)

#### Returns

[`TypeSchema`](TypeSchema.md)

## Properties

### \_subSchemas

> **\_subSchemas**: `Map`\<`string`, [`TypeSchema`](TypeSchema.md)\>

Defined in: [type/TypeSchema.ts:21](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L21)

***

### \_superSchema

> **\_superSchema**: `undefined` \| [`TypeSchema`](TypeSchema.md)

Defined in: [type/TypeSchema.ts:22](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L22)

***

### \_types

> **\_types**: `Map`\<`string`, [`Any`](../type-aliases/Any.md)\>

Defined in: [type/TypeSchema.ts:20](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L20)

***

### name

> `readonly` **name**: `string`

Defined in: [type/TypeSchema.ts:19](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L19)

## Accessors

### absolutePathName

#### Get Signature

> **get** **absolutePathName**(): `string`

Defined in: [type/TypeSchema.ts:57](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L57)

##### Returns

`string`

***

### isValid

#### Get Signature

> **get** **isValid**(): `boolean`

Defined in: [type/TypeSchema.ts:61](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L61)

##### Returns

`boolean`

***

### path

#### Get Signature

> **get** **path**(): `string`

Defined in: [type/TypeSchema.ts:44](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L44)

##### Returns

`string`

***

### validateStatus

#### Get Signature

> **get** **validateStatus**(): `ValidateStatusEnum`

Defined in: [type/TypeSchema.ts:65](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L65)

##### Returns

`ValidateStatusEnum`

## Methods

### addLink()

> **addLink**(`l`): `void`

Defined in: [type/TypeSchema.ts:40](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L40)

#### Parameters

##### l

[`LinkType`](LinkType.md)

#### Returns

`void`

***

### addType()

> **addType**(`t`): `void`

Defined in: [type/TypeSchema.ts:69](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L69)

#### Parameters

##### t

[`Any`](../type-aliases/Any.md)

#### Returns

`void`

***

### generateName()

> **generateName**(`base`): `string`

Defined in: [type/TypeSchema.ts:36](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L36)

#### Parameters

##### base

`string`

#### Returns

`string`

***

### getType()

> **getType**(`path`): `undefined` \| [`Any`](../type-aliases/Any.md)

Defined in: [type/TypeSchema.ts:98](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L98)

#### Parameters

##### path

`string`

#### Returns

`undefined` \| [`Any`](../type-aliases/Any.md)

***

### validate()

> **validate**(): `ServiceResult`\<`boolean`\>

Defined in: [type/TypeSchema.ts:121](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/TypeSchema.ts#L121)

#### Returns

`ServiceResult`\<`boolean`\>
