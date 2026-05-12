# Class: NullType

Defined in: [simple-types/Null.ts:11](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/simple-types/Null.ts#L11)

Abstract class representing a generic data type with validation and transformation capabilities.
It supports operations across three types of data representations: natural, graph, and tree DTOs.

## Extends

- [`SimpleType`](SimpleType.md)\<`null`, `null`, `null`\>

## Constructors

### new NullType()

> **new NullType**(`name`, `typeCategory`, `schema`): [`NullType`](NullType.md)

Defined in: [simple-types/Null.ts:13](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/simple-types/Null.ts#L13)

#### Parameters

##### name

`string`

##### typeCategory

[`TypeCategory`](../type-aliases/TypeCategory.md)

##### schema

[`TypeSchema`](TypeSchema.md)

#### Returns

[`NullType`](NullType.md)

#### Overrides

[`SimpleType`](SimpleType.md).[`constructor`](SimpleType.md#constructors)

## Properties

### \_G

> `readonly` **\_G**: `null`

Defined in: [type/Type.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L56)

#### Inherited from

[`SimpleType`](SimpleType.md).[`_G`](SimpleType.md#_g)

***

### \_T

> `readonly` **\_T**: `null`

Defined in: [type/Type.ts:58](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L58)

#### Inherited from

[`SimpleType`](SimpleType.md).[`_T`](SimpleType.md#_t)

***

### \_V

> `readonly` **\_V**: `null`

Defined in: [type/Type.ts:54](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L54)

#### Inherited from

[`SimpleType`](SimpleType.md).[`_V`](SimpleType.md#_v)

***

### derivedFrom?

> `optional` **derivedFrom**: [`Type`](Type.md)\<`any`, `any`, `any`\>

Defined in: [type/Type.ts:68](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L68)

#### Inherited from

[`SimpleType`](SimpleType.md).[`derivedFrom`](SimpleType.md#derivedfrom)

***

### isSystemType

> `readonly` **isSystemType**: `boolean` = `false`

Defined in: [type/Type.ts:64](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L64)

#### Inherited from

[`SimpleType`](SimpleType.md).[`isSystemType`](SimpleType.md#issystemtype)

***

### name

> `readonly` **name**: `string`

Defined in: [type/Type.ts:60](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L60)

#### Inherited from

[`SimpleType`](SimpleType.md).[`name`](SimpleType.md#name-1)

***

### ownerSchema

> **ownerSchema**: [`TypeSchema`](TypeSchema.md)

Defined in: [type/Type.ts:66](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L66)

#### Inherited from

[`SimpleType`](SimpleType.md).[`ownerSchema`](SimpleType.md#ownerschema)

***

### typeCategory

> `readonly` **typeCategory**: [`TypeCategory`](../type-aliases/TypeCategory.md)

Defined in: [type/Type.ts:62](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L62)

#### Inherited from

[`SimpleType`](SimpleType.md).[`typeCategory`](SimpleType.md#typecategory-1)

## Accessors

### fullPathName

#### Get Signature

> **get** **fullPathName**(): `string`

Defined in: [type/Type.ts:136](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L136)

Returns the full path name of the type, including its path from the root schema.

##### Returns

`string`

#### Inherited from

[`SimpleType`](SimpleType.md).[`fullPathName`](SimpleType.md#fullpathname)

## Methods

### addChild()

> **addChild**(`parent`, `child`, `n`): `void`

Defined in: [simple-types/SimpleType.ts:14](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/simple-types/SimpleType.ts#L14)

Abstract method to add a child to a parent object within the context of a node.
Must be implemented by subclasses to define how children are added to parent instances.

#### Parameters

##### parent

`any`

The parent object to add a child to.

##### child

`any`

The child object to add.

##### n

[`Node`](Node.md)

The node context for adding the child.

#### Returns

`void`

#### Inherited from

[`SimpleType`](SimpleType.md).[`addChild`](SimpleType.md#addchild)

***

### addValidator()

> **addValidator**(`validator`): `this`

Defined in: [type/Type.ts:173](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L173)

Adds a validator to this type.

#### Parameters

##### validator

`Validator`\<`null`\>

The validator to add.

#### Returns

`this`

this instance for chaining.

#### Inherited from

[`SimpleType`](SimpleType.md).[`addValidator`](SimpleType.md#addvalidator)

***

### checkValidators()

> **checkValidators**(`value`): `ServiceResult`\<`boolean`\>

Defined in: [type/Type.ts:189](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L189)

Checks the validators for the given value, accumulating errors.

#### Parameters

##### value

`any`

The value to check.

#### Returns

`ServiceResult`\<`boolean`\>

A ServiceResult indicating success or failure with detailed errors.

#### Inherited from

[`SimpleType`](SimpleType.md).[`checkValidators`](SimpleType.md#checkvalidators)

***

### children()

> **children**(`i`, `n`): `Generator`\<\[`null`, [`Any`](../type-aliases/Any.md), `Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>\]\>

Defined in: [simple-types/SimpleType.ts:16](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/simple-types/SimpleType.ts#L16)

Abstract method to iterate over children of a given value within a node.
Must be implemented by subclasses to handle specific child iteration logic.

#### Parameters

##### i

`null`

The instance whose children to iterate over.

##### n

[`Node`](Node.md)

The node context for the iteration.

#### Returns

`Generator`\<\[`null`, [`Any`](../type-aliases/Any.md), `Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>\]\>

A generator yielding tuples of child values, their types, and extra information.

#### Inherited from

[`SimpleType`](SimpleType.md).[`children`](SimpleType.md#children)

***

### createInstance()

> **createInstance**(`input`?): `unknown`

Defined in: [type/Type.ts:339](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L339)

Creates a new instance of the type, potentially using a provided input as the basis.

#### Parameters

##### input?

`any`

Optional input to use as the basis for the new instance.

#### Returns

`unknown`

The newly created instance.

#### Inherited from

[`SimpleType`](SimpleType.md).[`createInstance`](SimpleType.md#createinstance)

***

### derive()

> **derive**(`name`?, `schema`?): `this`

Defined in: [type/Type.ts:151](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L151)

Derives a new type from this type.

#### Parameters

##### name?

`string`

The name of the new derived type, optional.

##### schema?

[`TypeSchema`](TypeSchema.md) = `DefaultSchema`

The schema for the new type, defaults to DefaultSchema if not provided.

#### Returns

`this`

A new instance of the derived type.

#### Inherited from

[`SimpleType`](SimpleType.md).[`derive`](SimpleType.md#derive)

***

### doTransformation()

> **doTransformation**\<`A`\>(`t`, `input`, `initObj`?, `resetAcc`?, `typeLevel`?): \[`A`, [`WhatToDo`](../namespaces/Trans/type-aliases/WhatToDo.md)\]

Defined in: [simple-types/SimpleType.ts:20](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/simple-types/SimpleType.ts#L20)

Abstract method to handle the transformation process.
Must be implemented by subclasses to define specific transformation behaviors.

#### Type Parameters

• **A**

#### Parameters

##### t

[`IProcessor`](../namespaces/Trans/interfaces/IProcessor.md)

The processor to use for transformation.

##### input

The input data or node.

`null` | [`Node`](Node.md)

##### initObj?

`A`

The initial object to start with.

##### resetAcc?

`boolean` = `false`

Whether to reset the accumulator.

##### typeLevel?

`boolean` = `false`

Whether the transformation should consider type level specifics.

#### Returns

\[`A`, [`WhatToDo`](../namespaces/Trans/type-aliases/WhatToDo.md)\]

A tuple containing the transformed data and the next action.

#### Inherited from

[`SimpleType`](SimpleType.md).[`doTransformation`](SimpleType.md#dotransformation)

***

### fromDtoGraph()

> **fromDtoGraph**(`input`): `null`

Defined in: [type/Type.ts:329](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L329)

Converts an input graph-formatted Data Transfer Object back into the natural value type.

#### Parameters

##### input

`null`

The graph DTO to convert.

#### Returns

`null`

The converted natural value type.

#### Inherited from

[`SimpleType`](SimpleType.md).[`fromDtoGraph`](SimpleType.md#fromdtograph)

***

### init()

> **init**(`n`): `null`

Defined in: [simple-types/Null.ts:20](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/simple-types/Null.ts#L20)

Abstract method to initialize and create an empty instance of the type.
Must be implemented by subclasses to define how new instances are created.

#### Parameters

##### n

[`Node`](Node.md)

The node context for the initialization.

#### Returns

`null`

An initialized, empty instance of the type.

#### Overrides

[`SimpleType`](SimpleType.md).[`init`](SimpleType.md#init)

***

### isOfType()

> **isOfType**(`t`): `boolean`

Defined in: [type/Type.ts:164](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L164)

Checks if this type is of or derived from another type.

#### Parameters

##### t

[`Type`](Type.md)\<`any`, `any`, `any`\>

The type to check against.

#### Returns

`boolean`

true if this type is or derives from the given type.

#### Inherited from

[`SimpleType`](SimpleType.md).[`isOfType`](SimpleType.md#isoftype)

***

### isSimple()

> **isSimple**(): `boolean`

Defined in: [simple-types/SimpleType.ts:7](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/simple-types/SimpleType.ts#L7)

Abstract method to determine if the type is simple.

#### Returns

`boolean`

#### Inherited from

[`SimpleType`](SimpleType.md).[`isSimple`](SimpleType.md#issimple)

***

### toDtoGraph()

> **toDtoGraph**(`input`): `null`

Defined in: [type/Type.ts:319](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L319)

Converts an input object of natural value type into a graph-formatted Data Transfer Object.

#### Parameters

##### input

`null`

The input object to convert.

#### Returns

`null`

The converted graph DTO.

#### Inherited from

[`SimpleType`](SimpleType.md).[`toDtoGraph`](SimpleType.md#todtograph)

***

### transduce()

> **transduce**\<`A`\>(`t`, `input`, `initObj`?, `resetAcc`?, `typeLevel`?): `A`

Defined in: [type/Type.ts:227](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L227)

Transforms the input data using the specified processor.

#### Type Parameters

• **A**

#### Parameters

##### t

[`IProcessor`](../namespaces/Trans/interfaces/IProcessor.md)

The processor to use for transformation.

##### input

`any`

The input data or node.

##### initObj?

`A`

The initial object to start with.

##### resetAcc?

`boolean`

Whether to reset the accumulator.

##### typeLevel?

`boolean` = `false`

Whether the transformation should consider type level specifics.

#### Returns

`A`

The transformed data.

#### Inherited from

[`SimpleType`](SimpleType.md).[`transduce`](SimpleType.md#transduce)

***

### validate()

> **validate**(`input`): `ServiceResult`\<`boolean`\>

Defined in: [type/Type.ts:307](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L307)

Simplifies the process of validating a value, directly returning a service result indicating success or failure.

#### Parameters

##### input

`null`

The input value to validate.

#### Returns

`ServiceResult`\<`boolean`\>

A ServiceResult indicating whether the input is valid, along with detailed error information if not.

#### Inherited from

[`SimpleType`](SimpleType.md).[`validate`](SimpleType.md#validate)

***

### validateAndReport()

> **validateAndReport**(`input`): \[`boolean`, `any`\]

Defined in: [type/Type.ts:281](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L281)

Validates the input value and reports any errors encountered.

#### Parameters

##### input

`null`

The input value to validate.

#### Returns

\[`boolean`, `any`\]

A tuple indicating whether validation passed and any error object associated with failures.

#### Inherited from

[`SimpleType`](SimpleType.md).[`validateAndReport`](SimpleType.md#validateandreport)

***

### sanitizeName()

> `static` **sanitizeName**(`name`): `string`

Defined in: [type/Type.ts:119](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L119)

#### Parameters

##### name

`string`

#### Returns

`string`

#### Inherited from

[`SimpleType`](SimpleType.md).[`sanitizeName`](SimpleType.md#sanitizename)
