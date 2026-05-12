# Class: ServerRequest\<CmdType, QueryType\>

Defined in: [server-proxy/ServerRequestResponse.ts:34](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L34)

## Type Parameters

• **CmdType**

• **QueryType**

## Constructors

### new ServerRequest()

> **new ServerRequest**\<`CmdType`, `QueryType`\>(`options`, `queries`?, `cmds`?): [`ServerRequest`](ServerRequest.md)\<`CmdType`, `QueryType`\>

Defined in: [server-proxy/ServerRequestResponse.ts:40](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L40)

#### Parameters

##### options

`string` = `''`

##### queries?

`ServerQuery`\<`QueryType`\>[]

##### cmds?

`ServerCommand`\<`CmdType`\>[]

#### Returns

[`ServerRequest`](ServerRequest.md)\<`CmdType`, `QueryType`\>

## Properties

### request

> `readonly` **request**: `IRequestType`\<`CmdType`, `QueryType`\>

Defined in: [server-proxy/ServerRequestResponse.ts:35](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L35)

## Methods

### addCommand()

> **addCommand**(`cmd`): `this`

Defined in: [server-proxy/ServerRequestResponse.ts:52](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L52)

#### Parameters

##### cmd

`ServerCommand`\<`CmdType`\>

#### Returns

`this`

***

### addQuery()

> **addQuery**(`q`): `this`

Defined in: [server-proxy/ServerRequestResponse.ts:59](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L59)

#### Parameters

##### q

`ServerQuery`\<`QueryType`\>

#### Returns

`this`

***

### isValid()

> **isValid**(): `ServiceResult`\<`boolean`\>

Defined in: [server-proxy/ServerRequestResponse.ts:36](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L36)

#### Returns

`ServiceResult`\<`boolean`\>
