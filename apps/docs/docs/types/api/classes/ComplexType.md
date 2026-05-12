# Class: `abstract` ComplexType\<V, G, T\>

Defined in: [complex-types/ComplexType.ts:5](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ComplexType.ts#L5)

Abstract class representing a generic data type with validation and transformation capabilities.
It supports operations across three types of data representations: natural, graph, and tree DTOs.

## Extends

- [`Type`](Type.md)\<`V`, `G`, `T`\>

## Extended by

- [`ObjectType`](ObjectType.md)
- [`ArrayType`](ArrayType.md)
- [`TaggedUnionType`](TaggedUnionType.md)
- [`EntityReference`](EntityReference.md)

## Type Parameters

• **V**

• **G**

• **T**

## Constructors

### new ComplexType()

> **new ComplexType**\<`V`, `G`, `T`\>(`name`, `typeCategory`, `schema`, `validator`?): [`ComplexType`](ComplexType.md)\<`V`, `G`, `T`\>

Defined in: [type/Type.ts:80](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L80)

Constructs a new Type instance.

#### Parameters

##### name

`string`

The name of the type, unique within its schema. See below naming rules.

##### typeCategory

[`TypeCategory`](../type-aliases/TypeCategory.md)

The category of the type, which helps in defining its behavior and properties.

##### schema

[`TypeSchema`](TypeSchema.md)

The schema to which this type belongs.

##### validator?

`Validator`\<`V`\>

Optional validator to apply to values of this type.

#### Returns

[`ComplexType`](ComplexType.md)\<`V`, `G`, `T`\>

#### Inherited from

[`Type`](Type.md).[`constructor`](Type.md#constructors)

## Properties

### \_G

> `readonly` **\_G**: `G`

Defined in: [type/Type.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L56)

#### Inherited from

[`Type`](Type.md).[`_G`](Type.md#_g)

***

### \_T

> `readonly` **\_T**: `T`

Defined in: [type/Type.ts:58](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L58)

#### Inherited from

[`Type`](Type.md).[`_T`](Type.md#_t)

***

### \_V

> `readonly` **\_V**: `V`

Defined in: [type/Type.ts:54](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L54)

#### Inherited from

[`Type`](Type.md).[`_V`](Type.md#_v)

***

### derivedFrom?

> `optional` **derivedFrom**: [`Type`](Type.md)\<`any`, `any`, `any`\>

Defined in: [type/Type.ts:68](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L68)

#### Inherited from

[`Type`](Type.md).[`derivedFrom`](Type.md#derivedfrom)

***

### isSystemType

> `readonly` **isSystemType**: `boolean` = `false`

Defined in: [type/Type.ts:64](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L64)

#### Inherited from

[`Type`](Type.md).[`isSystemType`](Type.md#issystemtype)

***

### name

> `readonly` **name**: `string`

Defined in: [type/Type.ts:60](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L60)

#### Inherited from

[`Type`](Type.md).[`name`](Type.md#name-1)

***

### ownerSchema

> **ownerSchema**: [`TypeSchema`](TypeSchema.md)

Defined in: [type/Type.ts:66](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L66)

#### Inherited from

[`Type`](Type.md).[`ownerSchema`](Type.md#ownerschema)

***

### typeCategory

> `readonly` **typeCategory**: [`TypeCategory`](../type-aliases/TypeCategory.md)

Defined in: [type/Type.ts:62](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L62)

#### Inherited from

[`Type`](Type.md).[`typeCategory`](Type.md#typecategory-1)

## Accessors

### fullPathName

#### Get Signature

> **get** **fullPathName**(): `string`

Defined in: [type/Type.ts:136](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L136)

Returns the full path name of the type, including its path from the root schema.

##### Returns

`string`

#### Inherited from

[`Type`](Type.md).[`fullPathName`](Type.md#fullpathname)

## Methods

### addChild()

> `abstract` **addChild**(`parent`, `child`, `n`): `void`

Defined in: [type/Type.ts:274](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L274)

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

[`Type`](Type.md).[`addChild`](Type.md#addchild)

***

### addValidator()

> **addValidator**(`validator`): `this`

Defined in: [type/Type.ts:173](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L173)

Adds a validator to this type.

#### Parameters

##### validator

`Validator`\<`V`\>

The validator to add.

#### Returns

`this`

this instance for chaining.

#### Inherited from

[`Type`](Type.md).[`addValidator`](Type.md#addvalidator)

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

[`Type`](Type.md).[`checkValidators`](Type.md#checkvalidators)

***

### children()

> `abstract` **children**(`i`, `n`): `Generator`\<\[`V`, [`Any`](../type-aliases/Any.md), `Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>\]\>

Defined in: [type/Type.ts:257](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L257)

Abstract method to iterate over children of a given value within a node.
Must be implemented by subclasses to handle specific child iteration logic.

#### Parameters

##### i

`V`

The instance whose children to iterate over.

##### n

[`Node`](Node.md)

The node context for the iteration.

#### Returns

`Generator`\<\[`V`, [`Any`](../type-aliases/Any.md), `Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>\]\>

A generator yielding tuples of child values, their types, and extra information.

#### Inherited from

[`Type`](Type.md).[`children`](Type.md#children)

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

[`Type`](Type.md).[`createInstance`](Type.md#createinstance)

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

[`Type`](Type.md).[`derive`](Type.md#derive)

***

### doTransformation()

> **doTransformation**\<`A`\>(`t`, `input`, `initObj`?, `resetAcc`?, `typeLevel`?): \[`A`, [`WhatToDo`](../namespaces/Trans/type-aliases/WhatToDo.md)\]

Defined in: [complex-types/ComplexType.ts:10](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ComplexType.ts#L10)

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

[`Node`](Node.md) | `V`

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

#### Overrides

[`Type`](Type.md).[`doTransformation`](Type.md#dotransformation)

***

### fromDtoGraph()

> **fromDtoGraph**(`input`): `V`

Defined in: [type/Type.ts:329](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L329)

Converts an input graph-formatted Data Transfer Object back into the natural value type.

#### Parameters

##### input

`G`

The graph DTO to convert.

#### Returns

`V`

The converted natural value type.

#### Inherited from

[`Type`](Type.md).[`fromDtoGraph`](Type.md#fromdtograph)

***

### init()

> `abstract` **init**(`n`): `V`

Defined in: [type/Type.ts:265](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L265)

Abstract method to initialize and create an empty instance of the type.
Must be implemented by subclasses to define how new instances are created.

#### Parameters

##### n

[`Node`](Node.md)

The node context for the initialization.

#### Returns

`V`

An initialized, empty instance of the type.

#### Inherited from

[`Type`](Type.md).[`init`](Type.md#init)

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

[`Type`](Type.md).[`isOfType`](Type.md#isoftype)

***

### isSimple()

> **isSimple**(): `boolean`

Defined in: [complex-types/ComplexType.ts:6](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ComplexType.ts#L6)

Abstract method to determine if the type is simple.

#### Returns

`boolean`

#### Overrides

[`Type`](Type.md).[`isSimple`](Type.md#issimple)

***

### toDtoGraph()

> **toDtoGraph**(`input`): `G`

Defined in: [type/Type.ts:319](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L319)

Converts an input object of natural value type into a graph-formatted Data Transfer Object.

#### Parameters

##### input

`V`

The input object to convert.

#### Returns

`G`

The converted graph DTO.

#### Inherited from

[`Type`](Type.md).[`toDtoGraph`](Type.md#todtograph)

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

[`Type`](Type.md).[`transduce`](Type.md#transduce)

***

### validate()

> **validate**(`input`): `ServiceResult`\<`boolean`\>

Defined in: [type/Type.ts:307](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L307)

Simplifies the process of validating a value, directly returning a service result indicating success or failure.

#### Parameters

##### input

`V`

The input value to validate.

#### Returns

`ServiceResult`\<`boolean`\>

A ServiceResult indicating whether the input is valid, along with detailed error information if not.

#### Inherited from

[`Type`](Type.md).[`validate`](Type.md#validate)

***

### validateAndReport()

> **validateAndReport**(`input`): \[`boolean`, `any`\]

Defined in: [type/Type.ts:281](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L281)

Validates the input value and reports any errors encountered.

#### Parameters

##### input

`V`

The input value to validate.

#### Returns

\[`boolean`, `any`\]

A tuple indicating whether validation passed and any error object associated with failures.

#### Inherited from

[`Type`](Type.md).[`validateAndReport`](Type.md#validateandreport)

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

[`Type`](Type.md).[`sanitizeName`](Type.md#sanitizename)
