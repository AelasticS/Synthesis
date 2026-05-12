# Class: ServerResponse\<QueryResponseType\>

Defined in: [server-proxy/ServerRequestResponse.ts:68](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L68)

## Type Parameters

• **QueryResponseType**

## Constructors

### new ServerResponse()

> **new ServerResponse**\<`QueryResponseType`\>(): [`ServerResponse`](ServerResponse.md)\<`QueryResponseType`\>

Defined in: [server-proxy/ServerRequestResponse.ts:74](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L74)

#### Returns

[`ServerResponse`](ServerResponse.md)\<`QueryResponseType`\>

## Properties

### cmdResponse

> **cmdResponse**: `ServiceResult`\<`boolean`\>[] = `[]`

Defined in: [server-proxy/ServerRequestResponse.ts:69](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L69)

***

### isSuccess

> **isSuccess**: `boolean` = `false`

Defined in: [server-proxy/ServerRequestResponse.ts:72](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L72)

***

### queryResponse

> **queryResponse**: `ServiceResult`\<`QueryResponseType`\>[] = `[]`

Defined in: [server-proxy/ServerRequestResponse.ts:70](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L70)

## Accessors

### errors

#### Get Signature

> **get** **errors**(): `ServiceError`[]

Defined in: [server-proxy/ServerRequestResponse.ts:75](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L75)

##### Returns

`ServiceError`[]

***

### value

#### Get Signature

> **get** **value**(): `QueryResponseType`[]

Defined in: [server-proxy/ServerRequestResponse.ts:90](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-store/src/server-proxy/ServerRequestResponse.ts#L90)

##### Returns

`QueryResponseType`[]
