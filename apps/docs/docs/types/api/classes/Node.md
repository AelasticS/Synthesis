# Class: Node

Defined in: [common/Node.ts:14](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L14)

Represents a node in a data structure that is aware of its type and annotations.

## Constructors

### new Node()

> **new Node**(`i`, `t`, `acc`?, `e`?, `parent`?, `typeLevel`?): [`Node`](Node.md)

Defined in: [common/Node.ts:35](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L35)

Constructs a new Node.

#### Parameters

##### i

`any`

The instance data of the node.

##### t

[`Any`](../type-aliases/Any.md)

The type descriptor of the node.

##### acc?

`any`

Accumulator for carrying additional data.

##### e?

`Partial` = `...`

Extra info associated with the node.

##### parent?

[`Node`](Node.md)

The parent node in the hierarchy, if any.

##### typeLevel?

`boolean` = `false`

Indicates if the node processing is at type level.

#### Returns

[`Node`](Node.md)

## Properties

### acc?

> `optional` **acc**: `any`

Defined in: [common/Node.ts:17](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L17)

***

### annotationProcessor

> **annotationProcessor**: `Map`\<[`TypedAnnotation`](../namespaces/AnnotationTypes/interfaces/TypedAnnotation.md), `AnnotationProcessor`\>

Defined in: [common/Node.ts:22](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L22)

***

### extra

> **extra**: `Partial`

Defined in: [common/Node.ts:19](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L19)

***

### instance

> **instance**: `any`

Defined in: [common/Node.ts:15](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L15)

***

### parent?

> `optional` **parent**: [`Node`](Node.md)

Defined in: [common/Node.ts:20](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L20)

***

### type

> **type**: [`Any`](../type-aliases/Any.md)

Defined in: [common/Node.ts:16](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L16)

***

### typeLevel

> **typeLevel**: `boolean`

Defined in: [common/Node.ts:18](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L18)

***

### visited

> **visited**: `VisitedNodes`

Defined in: [common/Node.ts:21](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L21)

## Accessors

### isRevisited

#### Get Signature

> **get** **isRevisited**(): `boolean`

Defined in: [common/Node.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L56)

Returns whether the node has been revisited.

##### Returns

`boolean`

#### Set Signature

> **set** **isRevisited**(`b`): `void`

Defined in: [common/Node.ts:63](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L63)

Sets the revisited status of the node.

##### Parameters

###### b

`boolean`

##### Returns

`void`

## Methods

### getAnnotationProcessor()

> **getAnnotationProcessor**(`a`): `undefined` \| `AnnotationProcessor`

Defined in: [common/Node.ts:83](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L83)

Retrieves the AnnotationProcessor for a given annotation type.

#### Parameters

##### a

[`TypedAnnotation`](../namespaces/AnnotationTypes/interfaces/TypedAnnotation.md)

The annotation type.

#### Returns

`undefined` \| `AnnotationProcessor`

The corresponding AnnotationProcessor, if present.

***

### getCurrentAnnotationElement()

> **getCurrentAnnotationElement**(`a`): `any`

Defined in: [common/Node.ts:73](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L73)

Retrieves the current annotation element for a given annotation type.

#### Parameters

##### a

[`TypedAnnotation`](../namespaces/AnnotationTypes/interfaces/TypedAnnotation.md)

The annotation type.

#### Returns

`any`

The current annotation element, if any.

***

### makeNode()

> `static` **makeNode**(`input`, `type`, `acc`, `e`?, `parent`?, `typeLevel`?): [`Node`](Node.md)

Defined in: [common/Node.ts:99](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/Node.ts#L99)

Factory method to create a Node. Reuses existing Node if input is already a Node,
otherwise creates a new Node based on provided parameters.

#### Parameters

##### input

`any`

The input data or existing Node.

##### type

[`Any`](../type-aliases/Any.md)

The type descriptor.

##### acc

`any`

Accumulator for carrying additional data.

##### e?

`Partial`\<\{ `childExtra`: \{\}; `index`: `number`; `optional`: `boolean`; `parentInstance`: `any`; `parentResult`: `any`; `parentType`: [`Any`](../type-aliases/Any.md); `propName`: `string`; `role`: `RoleType`; \}\>

Extra info, defaults to undefined.

##### parent?

[`Node`](Node.md)

The parent Node, if any.

##### typeLevel?

`boolean` = `false`

Indicates if the node processing is at type level.

#### Returns

[`Node`](Node.md)

A new or existing Node instance.
