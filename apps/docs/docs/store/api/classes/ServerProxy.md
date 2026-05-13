# Class: ServerProxy

Defined in: [server-proxy/ServerProxy.ts:28](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L28)

ServerProxy is an abstract class which represent a proxy to a specific api server.
You can have multiple serverProxies to multiple servers in your application.

 Proxy executes operations on a single server-proxy it connects to.

## Constructors

### new ServerProxy()

> **new ServerProxy**(`options`): [`ServerProxy`](ServerProxy.md)

Defined in: [server-proxy/ServerProxy.ts:66](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L66)

EntitySchema subscriber instances that are registered for this serverProxy.

#### Parameters

##### options

[`ConnectionOptions`](../interfaces/ConnectionOptions.md)

#### Returns

[`ServerProxy`](ServerProxy.md)

## Properties

### isConnected

> `readonly` **isConnected**: `false` = `false`

Defined in: [server-proxy/ServerProxy.ts:46](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L46)

Indicates if serverProxy is initialized or not.

***

### name

> `readonly` **name**: `string`

Defined in: [server-proxy/ServerProxy.ts:36](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L36)

ServerProxy publicAttr.

***

### options

> `readonly` **options**: [`ConnectionOptions`](../interfaces/ConnectionOptions.md)

Defined in: [server-proxy/ServerProxy.ts:41](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L41)

ServerProxy options.

## Methods

### afterConnect()

> **afterConnect**(): `Promise`\<`void`\>

Defined in: [server-proxy/ServerProxy.ts:100](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L100)

#### Returns

`Promise`\<`void`\>

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [server-proxy/ServerProxy.ts:108](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L108)

Closes serverProxy with the database.
Once serverProxy is closed, you cannot use manager and repositories or perform any operations except opening serverProxy again.

#### Returns

`Promise`\<`void`\>

***

### connect()

> **connect**(): `Promise`\<[`ServerProxy`](ServerProxy.md)\>

Defined in: [server-proxy/ServerProxy.ts:76](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L76)

Performs serverProxy to the server-proxy.

#### Returns

`Promise`\<[`ServerProxy`](ServerProxy.md)\>

***

### execute()

> **execute**(`request`): `Promise`\<[`ServerResponse`](ServerResponse.md)\<`unknown`\>\>

Defined in: [server-proxy/ServerProxy.ts:122](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L122)

Executes request

#### Parameters

##### request

[`ServerRequest`](ServerRequest.md)\<`unknown`, `unknown`\>

#### Returns

`Promise`\<[`ServerResponse`](ServerResponse.md)\<`unknown`\>\>

***

### getCommandMaker()

> **getCommandMaker**(): `CommandMaker`

Defined in: [server-proxy/ServerProxy.ts:128](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L128)

#### Returns

`CommandMaker`

***

### getServerRequest()

> **getServerRequest**\<`C`, `R`\>(`cmd`): [`ServerRequest`](ServerRequest.md)\<`C`, `R`\>

Defined in: [server-proxy/ServerProxy.ts:132](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxy.ts#L132)

#### Type Parameters

• **C**

• **R**

#### Parameters

##### cmd

`C`[]

#### Returns

[`ServerRequest`](ServerRequest.md)\<`C`, `R`\>
