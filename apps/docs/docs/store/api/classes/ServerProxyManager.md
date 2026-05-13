# Class: ServerProxyManager

Defined in: [server-proxy/ServerProxyManager.ts:20](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxyManager.ts#L20)

ServerProxyManager is used to manager and manage multiple api-server-proxy serverProxies.
It also provides useful factory methods to simplify api-server-proxy serverProxy creation.

## Constructors

### new ServerProxyManager()

> **new ServerProxyManager**(): [`ServerProxyManager`](ServerProxyManager.md)

#### Returns

[`ServerProxyManager`](ServerProxyManager.md)

## Properties

### serverProxies

> `protected` `readonly` **serverProxies**: [`ServerProxy`](ServerProxy.md)[] = `[]`

Defined in: [server-proxy/ServerProxyManager.ts:28](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxyManager.ts#L28)

ListOf of serverProxies registered in this serverProxy manager.

## Methods

### create()

Creates a new serverProxy based on the given serverProxy options and registers it in the manager.
ServerProxy won't be connected automatically, you'll need to manually call connect method

#### Call Signature

> **create**(): [`ServerProxy`](ServerProxy.md)

Defined in: [server-proxy/ServerProxyManager.ts:57](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxyManager.ts#L57)

create server based on default options from environment varaiables

##### Returns

[`ServerProxy`](ServerProxy.md)

#### Call Signature

> **create**(`options`): [`ServerProxy`](ServerProxy.md)

Defined in: [server-proxy/ServerProxyManager.ts:62](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxyManager.ts#L62)

create server based on given options

##### Parameters

###### options

[`ConnectionOptions`](../interfaces/ConnectionOptions.md)

##### Returns

[`ServerProxy`](ServerProxy.md)

***

### get()

> **get**(`name`): [`ServerProxy`](ServerProxy.md)

Defined in: [server-proxy/ServerProxyManager.ts:46](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxyManager.ts#L46)

Gets registered serverProxy with the given publicAttr.
If serverProxy publicAttr is not given then it will get a default serverProxy.
Throws error if serverProxy with the given publicAttr was not found.

#### Parameters

##### name

`string` = `'default'`

#### Returns

[`ServerProxy`](ServerProxy.md)

***

### getDefaultConnectionOptions()

> **getDefaultConnectionOptions**(): [`ConnectionOptions`](../interfaces/ConnectionOptions.md)

Defined in: [server-proxy/ServerProxyManager.ts:96](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxyManager.ts#L96)

#### Returns

[`ConnectionOptions`](../interfaces/ConnectionOptions.md)

***

### has()

> **has**(`name`): `boolean`

Defined in: [server-proxy/ServerProxyManager.ts:37](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ServerProxyManager.ts#L37)

Checks if serverProxy with the given publicAttr exist in the manager.

#### Parameters

##### name

`string`

#### Returns

`boolean`
