# Class: CumulativeError

Defined in: [Result.ts:158](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-result/src/Result.ts#L158)

Cumulative error class

## Extends

- [`ServiceError`](ServiceError.md)

## Constructors

### new CumulativeError()

> **new CumulativeError**(`code`, `message`, `errors`): [`CumulativeError`](CumulativeError.md)

Defined in: [Result.ts:161](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-result/src/Result.ts#L161)

#### Parameters

##### code

[`ErrorCode`](../type-aliases/ErrorCode.md)

##### message

`string`

##### errors

`Error`[] = `[]`

#### Returns

[`CumulativeError`](CumulativeError.md)

#### Overrides

[`ServiceError`](ServiceError.md).[`constructor`](ServiceError.md#constructors)

## Properties

### code

> `readonly` **code**: [`ErrorCode`](../type-aliases/ErrorCode.md)

Defined in: [Result.ts:127](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-result/src/Result.ts#L127)

#### Inherited from

[`ServiceError`](ServiceError.md).[`code`](ServiceError.md#code-1)

***

### errors

> `readonly` **errors**: [`ServiceError`](ServiceError.md)[] = `[]`

Defined in: [Result.ts:159](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-result/src/Result.ts#L159)

***

### message

> `readonly` **message**: `string`

Defined in: [Result.ts:126](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-result/src/Result.ts#L126)

#### Inherited from

[`ServiceError`](ServiceError.md).[`message`](ServiceError.md#message-1)

***

### name

> `readonly` **name**: `string`

Defined in: [Result.ts:125](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-result/src/Result.ts#L125)

custom error code

#### Inherited from

[`ServiceError`](ServiceError.md).[`name`](ServiceError.md#name-1)

## Methods

### toServiceError()

> `static` **toServiceError**(`error`): [`ServiceError`](ServiceError.md)

Defined in: [Result.ts:145](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-result/src/Result.ts#L145)

Capture standard Javascript/Typescript error in the framework
- subclass of Error is treated as an error code of created ServiceError

#### Parameters

##### error

`Error` | [`ServiceError`](ServiceError.md)

#### Returns

[`ServiceError`](ServiceError.md)

#### Inherited from

[`ServiceError`](ServiceError.md).[`toServiceError`](ServiceError.md#toserviceerror)
