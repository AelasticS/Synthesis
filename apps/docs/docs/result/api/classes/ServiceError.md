# Class: ServiceError

Defined in: [Result.ts:123](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-result/src/Result.ts#L123)

Service error class

## Extended by

- [`CumulativeError`](CumulativeError.md)

## Constructors

### new ServiceError()

> **new ServiceError**(`code`, `message`, `name`): [`ServiceError`](ServiceError.md)

Defined in: [Result.ts:129](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-result/src/Result.ts#L129)

#### Parameters

##### code

[`ErrorCode`](../type-aliases/ErrorCode.md)

##### message

`string`

##### name

`string` = `code`

#### Returns

[`ServiceError`](ServiceError.md)

## Properties

### code

> `readonly` **code**: [`ErrorCode`](../type-aliases/ErrorCode.md)

Defined in: [Result.ts:127](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-result/src/Result.ts#L127)

***

### message

> `readonly` **message**: `string`

Defined in: [Result.ts:126](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-result/src/Result.ts#L126)

***

### name

> `readonly` **name**: `string`

Defined in: [Result.ts:125](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-result/src/Result.ts#L125)

custom error code

## Methods

### toServiceError()

> `static` **toServiceError**(`error`): [`ServiceError`](ServiceError.md)

Defined in: [Result.ts:145](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-result/src/Result.ts#L145)

Capture standard Javascript/Typescript error in the framework
- subclass of Error is treated as an error code of created ServiceError

#### Parameters

##### error

`Error` | [`ServiceError`](ServiceError.md)

#### Returns

[`ServiceError`](ServiceError.md)
