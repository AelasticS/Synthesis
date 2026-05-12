# Class: Subtype\<P, SP, S\>

Defined in: [complex-types/Subtype.ts:12](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L12)

Abstract class representing a generic data type with validation and transformation capabilities.
It supports operations across three types of data representations: natural, graph, and tree DTOs.

## Extends

- [`ObjectType`](ObjectType.md)\<`P` & `SP`, `S`\[`"identifier"`\]\>

## Type Parameters

• **P** *extends* `InterfaceDecl`

• **SP** *extends* `InterfaceDecl`

• **S** *extends* [`ObjectType`](ObjectType.md)\<`InterfaceDecl`, `any`\>

## Constructors

### new Subtype()

> **new Subtype**\<`P`, `SP`, `S`\>(`name`, `baseType`, `superType`, `schema`): [`Subtype`](Subtype.md)\<`P`, `SP`, `S`\>

Defined in: [complex-types/Subtype.ts:23](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L23)

#### Parameters

##### name

`string`

##### baseType

`P`

##### superType

[`ObjectType`](ObjectType.md)\<`InterfaceDecl`, `S`\[`"identifier"`\]\>

##### schema

[`TypeSchema`](TypeSchema.md)

#### Returns

[`Subtype`](Subtype.md)\<`P`, `SP`, `S`\>

#### Overrides

[`ObjectType`](ObjectType.md).[`constructor`](ObjectType.md#constructors)

## Properties

### \_G

> `readonly` **\_G**: `DtoGraphInterface`

Defined in: [type/Type.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L56)

#### Inherited from

[`ObjectType`](ObjectType.md).[`_G`](ObjectType.md#_g)

***

### \_identifier

> `readonly` **\_identifier**: `S`\[`"identifier"`\]

Defined in: [complex-types/ObjectType.ts:60](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L60)

#### Inherited from

[`ObjectType`](ObjectType.md).[`_identifier`](ObjectType.md#_identifier)

***

### \_T

> `readonly` **\_T**: `DtoTreeInterface`

Defined in: [type/Type.ts:58](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L58)

#### Inherited from

[`ObjectType`](ObjectType.md).[`_T`](ObjectType.md#_t)

***

### \_V

> `readonly` **\_V**: `Interface`

Defined in: [type/Type.ts:54](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L54)

#### Inherited from

[`ObjectType`](ObjectType.md).[`_V`](ObjectType.md#_v)

***

### derivedFrom?

> `optional` **derivedFrom**: [`Type`](Type.md)\<`any`, `any`, `any`\>

Defined in: [type/Type.ts:68](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L68)

#### Inherited from

[`ObjectType`](ObjectType.md).[`derivedFrom`](ObjectType.md#derivedfrom)

***

### extraProps

> `readonly` **extraProps**: `P`

Defined in: [complex-types/Subtype.ts:19](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L19)

***

### ID

> **ID**: `{ [k in string]: TypeOf<(P & SP)[k]> }`

Defined in: [complex-types/ObjectType.ts:57](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L57)

#### Inherited from

[`ObjectType`](ObjectType.md).[`ID`](ObjectType.md#id)

***

### ID\_DTO

> **ID\_DTO**: `{ [k in string]: DtoGraphInterface<(P & SP)[k]["_G"]> }`

Defined in: [complex-types/ObjectType.ts:58](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L58)

#### Inherited from

[`ObjectType`](ObjectType.md).[`ID_DTO`](ObjectType.md#id_dto)

***

### ID\_DTO\_TREE

> **ID\_DTO\_TREE**: `{ [k in string]: DtoTreeTypeOf<(P & SP)[k]> }`

Defined in: [complex-types/ObjectType.ts:59](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L59)

#### Inherited from

[`ObjectType`](ObjectType.md).[`ID_DTO_TREE`](ObjectType.md#id_dto_tree)

***

### interfaceDecl

> `readonly` **interfaceDecl**: `P` & `SP`

Defined in: [complex-types/ObjectType.ts:61](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L61)

#### Inherited from

[`ObjectType`](ObjectType.md).[`interfaceDecl`](ObjectType.md#interfacedecl-1)

***

### inverseCollection

> **inverseCollection**: `Map`\<`string`, \{ `propName`: `string`; `propType`: [`TypeCategory`](../type-aliases/TypeCategory.md); `type`: [`ObjectType`](ObjectType.md)\<`any`, \[\]\>; \}\>

Defined in: [complex-types/ObjectType.ts:65](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L65)

#### Inherited from

[`ObjectType`](ObjectType.md).[`inverseCollection`](ObjectType.md#inversecollection)

***

### isSystemType

> `readonly` **isSystemType**: `boolean` = `false`

Defined in: [type/Type.ts:64](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L64)

#### Inherited from

[`ObjectType`](ObjectType.md).[`isSystemType`](ObjectType.md#issystemtype)

***

### keys

> `readonly` **keys**: `string`[]

Defined in: [complex-types/ObjectType.ts:62](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L62)

#### Inherited from

[`ObjectType`](ObjectType.md).[`keys`](ObjectType.md#keys)

***

### len

> `readonly` **len**: `number`

Defined in: [complex-types/ObjectType.ts:64](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L64)

#### Inherited from

[`ObjectType`](ObjectType.md).[`len`](ObjectType.md#len)

***

### name

> `readonly` **name**: `string`

Defined in: [type/Type.ts:60](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L60)

#### Inherited from

[`ObjectType`](ObjectType.md).[`name`](ObjectType.md#name-1)

***

### ownerSchema

> **ownerSchema**: [`TypeSchema`](TypeSchema.md)

Defined in: [type/Type.ts:66](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L66)

#### Inherited from

[`ObjectType`](ObjectType.md).[`ownerSchema`](ObjectType.md#ownerschema)

***

### superProps

> `readonly` **superProps**: `SP`

Defined in: [complex-types/Subtype.ts:20](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L20)

***

### superType

> `readonly` **superType**: [`ObjectType`](ObjectType.md)\<`InterfaceDecl`, `S`\[`"identifier"`\]\>

Defined in: [complex-types/Subtype.ts:18](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L18)

***

### typeCategory

> `readonly` **typeCategory**: [`TypeCategory`](../type-aliases/TypeCategory.md)

Defined in: [type/Type.ts:62](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L62)

#### Inherited from

[`ObjectType`](ObjectType.md).[`typeCategory`](ObjectType.md#typecategory)

***

### types

> `readonly` **types**: [`Any`](../type-aliases/Any.md)[]

Defined in: [complex-types/ObjectType.ts:63](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L63)

#### Inherited from

[`ObjectType`](ObjectType.md).[`types`](ObjectType.md#types)

## Accessors

### allInverse

#### Get Signature

> **get** **allInverse**(): `Map`\<`string`, \{ `propName`: `string`; `propType`: [`TypeCategory`](../type-aliases/TypeCategory.md); `type`: [`ObjectType`](ObjectType.md)\<`any`, \[\]\>; \}\>

Defined in: [complex-types/Subtype.ts:59](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L59)

##### Returns

`Map`\<`string`, \{ `propName`: `string`; `propType`: [`TypeCategory`](../type-aliases/TypeCategory.md); `type`: [`ObjectType`](ObjectType.md)\<`any`, \[\]\>; \}\>

#### Overrides

[`ObjectType`](ObjectType.md).[`allInverse`](ObjectType.md#allinverse)

***

### allProperties

#### Get Signature

> **get** **allProperties**(): `Map`\<`string`, [`Any`](../type-aliases/Any.md)\>

Defined in: [complex-types/Subtype.ts:44](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L44)

##### Returns

`Map`\<`string`, [`Any`](../type-aliases/Any.md)\>

#### Overrides

[`ObjectType`](ObjectType.md).[`allProperties`](ObjectType.md#allproperties)

***

### fullPathName

#### Get Signature

> **get** **fullPathName**(): `string`

Defined in: [type/Type.ts:136](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L136)

Returns the full path name of the type, including its path from the root schema.

##### Returns

`string`

#### Inherited from

[`ObjectType`](ObjectType.md).[`fullPathName`](ObjectType.md#fullpathname)

***

### identifier

#### Get Signature

> **get** **identifier**(): `S`\[`"identifier"`\]

Defined in: [complex-types/Subtype.ts:33](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L33)

##### Returns

`S`\[`"identifier"`\]

#### Overrides

[`ObjectType`](ObjectType.md).[`identifier`](ObjectType.md#identifier-1)

***

### isEntity

#### Get Signature

> **get** **isEntity**(): `boolean`

Defined in: [complex-types/ObjectType.ts:91](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L91)

##### Returns

`boolean`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isEntity`](ObjectType.md#isentity)

## Methods

### addChild()

> **addChild**(`parent`, `child`, `n`): `void`

Defined in: [complex-types/ObjectType.ts:128](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L128)

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

[`ObjectType`](ObjectType.md).[`addChild`](ObjectType.md#addchild)

***

### addValidator()

> **addValidator**(`validator`): `this`

Defined in: [type/Type.ts:173](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L173)

Adds a validator to this type.

#### Parameters

##### validator

`Validator`\<`Interface`\<`P` & `SP`\>\>

The validator to add.

#### Returns

`this`

this instance for chaining.

#### Inherited from

[`ObjectType`](ObjectType.md).[`addValidator`](ObjectType.md#addvalidator)

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

[`ObjectType`](ObjectType.md).[`checkValidators`](ObjectType.md#checkvalidators)

***

### children()

> **children**(`object`, `n`): `Generator`\<\[`Interface`\<`P` & `SP`\>, [`Any`](../type-aliases/Any.md), `Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>\]\>

Defined in: [complex-types/ObjectType.ts:132](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L132)

Abstract method to iterate over children of a given value within a node.
Must be implemented by subclasses to handle specific child iteration logic.

#### Parameters

##### object

`Interface`\<`P` & `SP`\>

##### n

[`Node`](Node.md)

The node context for the iteration.

#### Returns

`Generator`\<\[`Interface`\<`P` & `SP`\>, [`Any`](../type-aliases/Any.md), `Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>\]\>

A generator yielding tuples of child values, their types, and extra information.

#### Inherited from

[`ObjectType`](ObjectType.md).[`children`](ObjectType.md#children)

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

[`ObjectType`](ObjectType.md).[`createInstance`](ObjectType.md#createinstance)

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

[`ObjectType`](ObjectType.md).[`derive`](ObjectType.md#derive)

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

[`Node`](Node.md) | `Interface`\<`P` & `SP`\>

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

[`ObjectType`](ObjectType.md).[`doTransformation`](ObjectType.md#dotransformation)

***

### fromDtoGraph()

> **fromDtoGraph**(`input`): `Interface`

Defined in: [type/Type.ts:329](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L329)

Converts an input graph-formatted Data Transfer Object back into the natural value type.

#### Parameters

##### input

`DtoGraphInterface`

The graph DTO to convert.

#### Returns

`Interface`

The converted natural value type.

#### Inherited from

[`ObjectType`](ObjectType.md).[`fromDtoGraph`](ObjectType.md#fromdtograph)

***

### getPropsInfo()

> **getPropsInfo**(): \[`string`[], [`Any`](../type-aliases/Any.md)[], `number`\]

Defined in: [complex-types/Subtype.ts:52](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L52)

#### Returns

\[`string`[], [`Any`](../type-aliases/Any.md)[], `number`\]

#### Overrides

[`ObjectType`](ObjectType.md).[`getPropsInfo`](ObjectType.md#getpropsinfo)

***

### getTypeOfProp()

> **getTypeOfProp**(`name`): `undefined` \| [`Any`](../type-aliases/Any.md)

Defined in: [complex-types/ObjectType.ts:112](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L112)

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`Any`](../type-aliases/Any.md)

#### Inherited from

[`ObjectType`](ObjectType.md).[`getTypeOfProp`](ObjectType.md#gettypeofprop)

***

### init()

> **init**(`n`): `Interface`\<`P` & `SP`\>

Defined in: [complex-types/ObjectType.ts:116](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ObjectType.ts#L116)

Abstract method to initialize and create an empty instance of the type.
Must be implemented by subclasses to define how new instances are created.

#### Parameters

##### n

[`Node`](Node.md)

The node context for the initialization.

#### Returns

`Interface`\<`P` & `SP`\>

An initialized, empty instance of the type.

#### Inherited from

[`ObjectType`](ObjectType.md).[`init`](ObjectType.md#init)

***

### isOfType()

> **isOfType**(`t`): `boolean`

Defined in: [complex-types/Subtype.ts:37](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/Subtype.ts#L37)

Checks if this type is of or derived from another type.

#### Parameters

##### t

[`Type`](Type.md)\<`any`, `any`, `any`\>

The type to check against.

#### Returns

`boolean`

true if this type is or derives from the given type.

#### Overrides

[`ObjectType`](ObjectType.md).[`isOfType`](ObjectType.md#isoftype)

***

### isSimple()

> **isSimple**(): `boolean`

Defined in: [complex-types/ComplexType.ts:6](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/complex-types/ComplexType.ts#L6)

Abstract method to determine if the type is simple.

#### Returns

`boolean`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isSimple`](ObjectType.md#issimple)

***

### toDtoGraph()

> **toDtoGraph**(`input`): `DtoGraphInterface`

Defined in: [type/Type.ts:319](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L319)

Converts an input object of natural value type into a graph-formatted Data Transfer Object.

#### Parameters

##### input

`Interface`

The input object to convert.

#### Returns

`DtoGraphInterface`

The converted graph DTO.

#### Inherited from

[`ObjectType`](ObjectType.md).[`toDtoGraph`](ObjectType.md#todtograph)

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

[`ObjectType`](ObjectType.md).[`transduce`](ObjectType.md#transduce)

***

### validate()

> **validate**(`input`): `ServiceResult`\<`boolean`\>

Defined in: [type/Type.ts:307](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L307)

Simplifies the process of validating a value, directly returning a service result indicating success or failure.

#### Parameters

##### input

`Interface`

The input value to validate.

#### Returns

`ServiceResult`\<`boolean`\>

A ServiceResult indicating whether the input is valid, along with detailed error information if not.

#### Inherited from

[`ObjectType`](ObjectType.md).[`validate`](ObjectType.md#validate)

***

### validateAndReport()

> **validateAndReport**(`input`): \[`boolean`, `any`\]

Defined in: [type/Type.ts:281](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/Type.ts#L281)

Validates the input value and reports any errors encountered.

#### Parameters

##### input

`Interface`

The input value to validate.

#### Returns

\[`boolean`, `any`\]

A tuple indicating whether validation passed and any error object associated with failures.

#### Inherited from

[`ObjectType`](ObjectType.md).[`validateAndReport`](ObjectType.md#validateandreport)

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

[`ObjectType`](ObjectType.md).[`sanitizeName`](ObjectType.md#sanitizename)
