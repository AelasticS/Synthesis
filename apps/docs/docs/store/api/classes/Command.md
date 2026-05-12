# Class: `abstract` Command

Defined in: [server-proxy/CommandMaker.ts:38](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/CommandMaker.ts#L38)

## Constructors

### new Command()

> **new Command**(`objType`, `versioning`): [`Command`](Command.md)

Defined in: [server-proxy/CommandMaker.ts:46](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/CommandMaker.ts#L46)

#### Parameters

##### objType

`string`

##### versioning

`boolean` = `false`

#### Returns

[`Command`](Command.md)

## Properties

### firstObjID

> **firstObjID**: `ObjectProps`

Defined in: [server-proxy/CommandMaker.ts:42](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/CommandMaker.ts#L42)

***

### firstObjType

> `readonly` **firstObjType**: `string`

Defined in: [server-proxy/CommandMaker.ts:43](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/CommandMaker.ts#L43)

***

### operationType

> `readonly` **operationType**: `Operation`

Defined in: [server-proxy/CommandMaker.ts:40](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/CommandMaker.ts#L40)

***

### versioning

> `readonly` **versioning**: `boolean`

Defined in: [server-proxy/CommandMaker.ts:44](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/CommandMaker.ts#L44)

## Accessors

### secondObjID

#### Get Signature

> **get** **secondObjID**(): `undefined` \| `ObjectProps`

Defined in: [server-proxy/CommandMaker.ts:51](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/CommandMaker.ts#L51)

##### Returns

`undefined` \| `ObjectProps`

## Methods

### mergeWith()

> `abstract` **mergeWith**(`c`): `MergeResult`

Defined in: [server-proxy/CommandMaker.ts:55](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/CommandMaker.ts#L55)

#### Parameters

##### c

`OperationEvent`

#### Returns

`MergeResult`
