# Class: EntityReference\<T\>

Defined in: [special-types/ObjectReference.ts:26](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/special-types/ObjectReference.ts#L26)

Abstract class representing a generic data type with validation and transformation capabilities.
It supports operations across three types of data representations: natural, graph, and tree DTOs.

## Extends

- [`ComplexType`](ComplexType.md)\<`TypeOfKey`\<`T`\>, `DtoObjectReference`\<`T`\>, `DtoTypeOfKey`\<`T`\>\>

## Type Parameters

• **T** *extends* [`ObjectType`](ObjectType.md)\<`any`, readonly `string`[]\>

## Constructors

### new EntityReference()

> **new EntityReference**\<`T`\>(`name`, `obj`, `schema`): [`EntityReference`](EntityReference.md)\<`T`\>

Defined in: [special-types/ObjectReference.ts:34](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/special-types/ObjectReference.ts#L34)

#### Parameters

##### name

`string`

##### obj

`T`

##### schema

[`TypeSchema`](TypeSchema.md)

#### Returns

[`EntityReference`](EntityReference.md)\<`T`\>

#### Overrides

[`ComplexType`](ComplexType.md).[`constructor`](ComplexType.md#constructors)

## Properties

### \_G

> `readonly` **\_G**: `DtoObjectReference`

Defined in: [type/Type.ts:56](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L56)

#### Inherited from

[`ComplexType`](ComplexType.md).[`_G`](ComplexType.md#_g)

***

### \_T

> `readonly` **\_T**: `DtoTypeOfKey`

Defined in: [type/Type.ts:58](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L58)

#### Inherited from

[`ComplexType`](ComplexType.md).[`_T`](ComplexType.md#_t)

***

### \_tag

> `readonly` **\_tag**: `"Reference"` = `"Reference"`

Defined in: [special-types/ObjectReference.ts:32](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/special-types/ObjectReference.ts#L32)

***

### \_V

> `readonly` **\_V**: `TypeOfKey`

Defined in: [type/Type.ts:54](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L54)

#### Inherited from

[`ComplexType`](ComplexType.md).[`_V`](ComplexType.md#_v)

***

### derivedFrom?

> `optional` **derivedFrom**: [`Type`](Type.md)\<`any`, `any`, `any`\>

Defined in: [type/Type.ts:68](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L68)

#### Inherited from

[`ComplexType`](ComplexType.md).[`derivedFrom`](ComplexType.md#derivedfrom)

***

### isSystemType

> `readonly` **isSystemType**: `boolean` = `false`

Defined in: [type/Type.ts:64](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L64)

#### Inherited from

[`ComplexType`](ComplexType.md).[`isSystemType`](ComplexType.md#issystemtype)

***

### name

> `readonly` **name**: `string`

Defined in: [type/Type.ts:60](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L60)

#### Inherited from

[`ComplexType`](ComplexType.md).[`name`](ComplexType.md#name-1)

***

### ownerSchema

> **ownerSchema**: [`TypeSchema`](TypeSchema.md)

Defined in: [type/Type.ts:66](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L66)

#### Inherited from

[`ComplexType`](ComplexType.md).[`ownerSchema`](ComplexType.md#ownerschema)

***

### referencedType

> `readonly` **referencedType**: `T`

Defined in: [special-types/ObjectReference.ts:31](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/special-types/ObjectReference.ts#L31)

***

### typeCategory

> `readonly` **typeCategory**: [`TypeCategory`](../type-aliases/TypeCategory.md)

Defined in: [type/Type.ts:62](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L62)

#### Inherited from

[`ComplexType`](ComplexType.md).[`typeCategory`](ComplexType.md#typecategory-1)

## Accessors

### fullPathName

#### Get Signature

> **get** **fullPathName**(): `string`

Defined in: [type/Type.ts:136](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L136)

Returns the full path name of the type, including its path from the root schema.

##### Returns

`string`

#### Inherited from

[`ComplexType`](ComplexType.md).[`fullPathName`](ComplexType.md#fullpathname)

## Methods

### addChild()

> **addChild**(`parent`, `child`, `n`): `void`

Defined in: [special-types/ObjectReference.ts:39](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/special-types/ObjectReference.ts#L39)

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

#### Overrides

[`ComplexType`](ComplexType.md).[`addChild`](ComplexType.md#addchild)

***

### addValidator()

> **addValidator**(`validator`): `this`

Defined in: [type/Type.ts:173](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L173)

Adds a validator to this type.

#### Parameters

##### validator

`Validator`\<`TypeOfKey`\<`T`\>\>

The validator to add.

#### Returns

`this`

this instance for chaining.

#### Inherited from

[`ComplexType`](ComplexType.md).[`addValidator`](ComplexType.md#addvalidator)

***

### checkValidators()

> **checkValidators**(`value`): `ServiceResult`\<`boolean`\>

Defined in: [type/Type.ts:189](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L189)

Checks the validators for the given value, accumulating errors.

#### Parameters

##### value

`any`

The value to check.

#### Returns

`ServiceResult`\<`boolean`\>

A ServiceResult indicating success or failure with detailed errors.

#### Inherited from

[`ComplexType`](ComplexType.md).[`checkValidators`](ComplexType.md#checkvalidators)

***

### children()

> **children**(`value`, `n`): `Generator`\<\[`TypeOfKey`\<`T`\>, [`Any`](../type-aliases/Any.md), `Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>\]\>

Defined in: [special-types/ObjectReference.ts:43](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/special-types/ObjectReference.ts#L43)

Abstract method to iterate over children of a given value within a node.
Must be implemented by subclasses to handle specific child iteration logic.

#### Parameters

##### value

`TypeOfKey`\<`T`\>

##### n

[`Node`](Node.md)

The node context for the iteration.

#### Returns

`Generator`\<\[`TypeOfKey`\<`T`\>, [`Any`](../type-aliases/Any.md), `Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>\]\>

A generator yielding tuples of child values, their types, and extra information.

#### Overrides

[`ComplexType`](ComplexType.md).[`children`](ComplexType.md#children)

***

### createInstance()

> **createInstance**(`input`?): `unknown`

Defined in: [type/Type.ts:339](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L339)

Creates a new instance of the type, potentially using a provided input as the basis.

#### Parameters

##### input?

`any`

Optional input to use as the basis for the new instance.

#### Returns

`unknown`

The newly created instance.

#### Inherited from

[`ComplexType`](ComplexType.md).[`createInstance`](ComplexType.md#createinstance)

***

### derive()

> **derive**(`name`?, `schema`?): `this`

Defined in: [type/Type.ts:151](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L151)

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

[`ComplexType`](ComplexType.md).[`derive`](ComplexType.md#derive)

***

### doTransformation()

> **doTransformation**\<`A`\>(`t`, `input`, `initObj`?, `resetAcc`?, `typeLevel`?): \[`A`, [`WhatToDo`](../namespaces/Trans/type-aliases/WhatToDo.md)\]

Defined in: [complex-types/ComplexType.ts:10](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/complex-types/ComplexType.ts#L10)

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

[`Node`](Node.md) | `TypeOfKey`\<`T`\>

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

[`ComplexType`](ComplexType.md).[`doTransformation`](ComplexType.md#dotransformation)

***

### fromDtoGraph()

> **fromDtoGraph**(`input`): `TypeOfKey`

Defined in: [type/Type.ts:329](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L329)

Converts an input graph-formatted Data Transfer Object back into the natural value type.

#### Parameters

##### input

`DtoObjectReference`

The graph DTO to convert.

#### Returns

`TypeOfKey`

The converted natural value type.

#### Inherited from

[`ComplexType`](ComplexType.md).[`fromDtoGraph`](ComplexType.md#fromdtograph)

***

### init()

> **init**(`n`): `TypeOfKey`\<`T`\>

Defined in: [special-types/ObjectReference.ts:54](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/special-types/ObjectReference.ts#L54)

Abstract method to initialize and create an empty instance of the type.
Must be implemented by subclasses to define how new instances are created.

#### Parameters

##### n

[`Node`](Node.md)

The node context for the initialization.

#### Returns

`TypeOfKey`\<`T`\>

An initialized, empty instance of the type.

#### Overrides

[`ComplexType`](ComplexType.md).[`init`](ComplexType.md#init)

***

### isOfType()

> **isOfType**(`t`): `boolean`

Defined in: [type/Type.ts:164](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L164)

Checks if this type is of or derived from another type.

#### Parameters

##### t

[`Type`](Type.md)\<`any`, `any`, `any`\>

The type to check against.

#### Returns

`boolean`

true if this type is or derives from the given type.

#### Inherited from

[`ComplexType`](ComplexType.md).[`isOfType`](ComplexType.md#isoftype)

***

### isSimple()

> **isSimple**(): `boolean`

Defined in: [complex-types/ComplexType.ts:6](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/complex-types/ComplexType.ts#L6)

Abstract method to determine if the type is simple.

#### Returns

`boolean`

#### Inherited from

[`ComplexType`](ComplexType.md).[`isSimple`](ComplexType.md#issimple)

***

### toDtoGraph()

> **toDtoGraph**(`input`): `DtoObjectReference`

Defined in: [type/Type.ts:319](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L319)

Converts an input object of natural value type into a graph-formatted Data Transfer Object.

#### Parameters

##### input

`TypeOfKey`

The input object to convert.

#### Returns

`DtoObjectReference`

The converted graph DTO.

#### Inherited from

[`ComplexType`](ComplexType.md).[`toDtoGraph`](ComplexType.md#todtograph)

***

### transduce()

> **transduce**\<`A`\>(`t`, `input`, `initObj`?, `resetAcc`?, `typeLevel`?): `A`

Defined in: [type/Type.ts:227](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L227)

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

[`ComplexType`](ComplexType.md).[`transduce`](ComplexType.md#transduce)

***

### validate()

> **validate**(`input`): `ServiceResult`\<`boolean`\>

Defined in: [type/Type.ts:307](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L307)

Simplifies the process of validating a value, directly returning a service result indicating success or failure.

#### Parameters

##### input

`TypeOfKey`

The input value to validate.

#### Returns

`ServiceResult`\<`boolean`\>

A ServiceResult indicating whether the input is valid, along with detailed error information if not.

#### Inherited from

[`ComplexType`](ComplexType.md).[`validate`](ComplexType.md#validate)

***

### validateAndReport()

> **validateAndReport**(`input`): \[`boolean`, `any`\]

Defined in: [type/Type.ts:281](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L281)

Validates the input value and reports any errors encountered.

#### Parameters

##### input

`TypeOfKey`

The input value to validate.

#### Returns

\[`boolean`, `any`\]

A tuple indicating whether validation passed and any error object associated with failures.

#### Inherited from

[`ComplexType`](ComplexType.md).[`validateAndReport`](ComplexType.md#validateandreport)

***

### sanitizeName()

> `static` **sanitizeName**(`name`): `string`

Defined in: [type/Type.ts:119](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/type/Type.ts#L119)

#### Parameters

##### name

`string`

#### Returns

`string`

#### Inherited from

[`ComplexType`](ComplexType.md).[`sanitizeName`](ComplexType.md#sanitizename)
