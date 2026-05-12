# Class: Transducer

Defined in: [transducers/Transducer.ts:23](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L23)

## Constructors

### new Transducer()

> **new Transducer**(): [`Transducer`](Transducer.md)

#### Returns

[`Transducer`](Transducer.md)

## Properties

### processors

> **processors**: (`t`) => [`IProcessor`](../interfaces/IProcessor.md)[] = `[]`

Defined in: [transducers/Transducer.ts:24](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L24)

#### Parameters

##### t

[`IProcessor`](../interfaces/IProcessor.md)

#### Returns

[`IProcessor`](../interfaces/IProcessor.md)

***

### reducer

> **reducer**: `undefined` \| [`IProcessor`](../interfaces/IProcessor.md)

Defined in: [transducers/Transducer.ts:25](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L25)

## Accessors

### composed

#### Get Signature

> **get** **composed**(): (`xf`) => [`IProcessor`](../interfaces/IProcessor.md)

Defined in: [transducers/Transducer.ts:27](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L27)

##### Returns

`Function`

###### Parameters

###### xf

[`IProcessor`](../interfaces/IProcessor.md)

###### Returns

[`IProcessor`](../interfaces/IProcessor.md)

## Methods

### count()

> **count**(): [`IProcessor`](../interfaces/IProcessor.md)

Defined in: [transducers/Transducer.ts:120](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L120)

#### Returns

[`IProcessor`](../interfaces/IProcessor.md)

***

### do()

> **do**(`Ctor`, ...`args`): `this`

Defined in: [transducers/Transducer.ts:36](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L36)

#### Parameters

##### Ctor

[`IProcessorConstructor`](../type-aliases/IProcessorConstructor.md)

##### args

...`any`[]

#### Returns

`this`

***

### doFinally()

> **doFinally**(`processor`): [`IProcessor`](../interfaces/IProcessor.md)

Defined in: [transducers/Transducer.ts:31](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L31)

#### Parameters

##### processor

[`IProcessor`](../interfaces/IProcessor.md)

#### Returns

[`IProcessor`](../interfaces/IProcessor.md)

***

### doIf()

> **doIf**(`condition`, `Ctor`, ...`args`): `this`

Defined in: [transducers/Transducer.ts:46](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L46)

#### Parameters

##### condition

`boolean`

##### Ctor

[`IProcessorConstructor`](../type-aliases/IProcessorConstructor.md)

##### args

...`any`[]

#### Returns

`this`

***

### doWithAnnotations()

> **doWithAnnotations**(`Ctor`, ...`na`): `this`

Defined in: [transducers/Transducer.ts:96](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L96)

#### Parameters

##### Ctor

[`IProcessorConstructor`](../type-aliases/IProcessorConstructor.md)

##### na

...[`TypedAnnotation`](../../AnnotationTypes/interfaces/TypedAnnotation.md)[]

#### Returns

`this`

***

### filter()

> **filter**(`f`): `this`

Defined in: [transducers/Transducer.ts:64](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L64)

#### Parameters

##### f

(`item`, `currNode`) => `boolean`

#### Returns

`this`

***

### fromDtoGraph()

> **fromDtoGraph**(): `this`

Defined in: [transducers/Transducer.ts:109](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L109)

#### Returns

`this`

***

### map()

> **map**(`f`): `this`

Defined in: [transducers/Transducer.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L56)

#### Parameters

##### f

[`IMapFun`](../type-aliases/IMapFun.md)

#### Returns

`this`

***

### newInstance()

> **newInstance**(`initValues`?, `generateID`?): `this`

Defined in: [transducers/Transducer.ts:88](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L88)

create a new instance based on initValues as instance template

#### Parameters

##### initValues?

`any`

example:
   tr.create(
   { name:'John',
     parent: { name:'Tom'}
     children:[{name:'Ana}, {name:{Peter}}]
   }).Processor().

##### generateID?

() => `any`

#### Returns

`this`

***

### processAnnotations()

> **processAnnotations**(`annot`): `this`

Defined in: [transducers/Transducer.ts:92](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L92)

#### Parameters

##### annot

[`TypedAnnotation`](../../AnnotationTypes/interfaces/TypedAnnotation.md)

#### Returns

`this`

***

### recurse()

> **recurse**(`mode`): `this`

Defined in: [transducers/Transducer.ts:60](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L60)

#### Parameters

##### mode

`"accumulate"` | `"makeItem"`

#### Returns

`this`

***

### reduce()

> **reduce**\<`A`\>(`stepFn`, `initValue`): [`IProcessor`](../interfaces/IProcessor.md)

Defined in: [transducers/Transducer.ts:113](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L113)

#### Type Parameters

• **A**

#### Parameters

##### stepFn

[`Reducer`](../type-aliases/Reducer.md)\<`A`\>

##### initValue

`any`

#### Returns

[`IProcessor`](../interfaces/IProcessor.md)

***

### sum()

> **sum**(): [`IProcessor`](../interfaces/IProcessor.md)

Defined in: [transducers/Transducer.ts:124](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L124)

#### Returns

[`IProcessor`](../interfaces/IProcessor.md)

***

### toDtoGraph()

> **toDtoGraph**(): `this`

Defined in: [transducers/Transducer.ts:105](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L105)

#### Returns

`this`

***

### validate()

> **validate**(): `this`

Defined in: [transducers/Transducer.ts:72](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Transducer.ts#L72)

validate some value
returns hierarchy of errors

#### Returns

`this`
