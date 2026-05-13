# Interface: ConnectionOptions

Defined in: [server-proxy/ConnectionOptions.ts:19](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ConnectionOptions.ts#L19)

IConnectionOptions is set of serverProxy options shared by all database types.

## Properties

### password

> `readonly` **password**: `string`

Defined in: [server-proxy/ConnectionOptions.ts:50](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ConnectionOptions.ts#L50)

api-server-proxy password.

***

### port

> `readonly` **port**: `string`

Defined in: [server-proxy/ConnectionOptions.ts:40](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ConnectionOptions.ts#L40)

api-server-proxy host port.

***

### serverName

> `readonly` **serverName**: `string`

Defined in: [server-proxy/ConnectionOptions.ts:30](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ConnectionOptions.ts#L30)

Connection publicAttr. If serverProxy publicAttr is not given then it will be called "default".
Different serverProxies must have different names.

***

### serverType

> `readonly` **serverType**: `string`

Defined in: [server-proxy/ConnectionOptions.ts:24](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ConnectionOptions.ts#L24)

Database serverType. This value is required.

***

### serverUrl

> `readonly` **serverUrl**: `string`

Defined in: [server-proxy/ConnectionOptions.ts:35](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ConnectionOptions.ts#L35)

Connection serverUrl to api-server-proxy.

***

### username

> `readonly` **username**: `string`

Defined in: [server-proxy/ConnectionOptions.ts:45](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/server-proxy/ConnectionOptions.ts#L45)

api-server-proxy username.
