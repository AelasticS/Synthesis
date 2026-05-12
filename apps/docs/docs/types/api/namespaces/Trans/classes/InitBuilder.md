# Class: InitBuilder

Defined in: [transducers/ProcessorBuilder.ts:132](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L132)

## Extends

- `FunctionBuilder`\<[`IProcessor`](../interfaces/IProcessor.md)\[`"init"`\]\>

## Constructors

### new InitBuilder()

> **new InitBuilder**(): [`InitBuilder`](InitBuilder.md)

#### Returns

[`InitBuilder`](InitBuilder.md)

#### Inherited from

`FunctionBuilder<IProcessor["init"]>.constructor`

## Methods

### build()

> **build**(): (`value`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\][]

Defined in: [transducers/ProcessorBuilder.ts:127](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L127)

#### Returns

(`value`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\][]

#### Inherited from

`FunctionBuilder.build`

***

### onPredicate()

> **onPredicate**(`predicate`, `fun`): `this`

Defined in: [transducers/ProcessorBuilder.ts:101](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L101)

#### Parameters

##### predicate

\<`I`\>(...`a`) => `Boolean`

##### fun

(`value`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

#### Returns

`this`

#### Inherited from

`FunctionBuilder.onPredicate`

***

### onType()

> **onType**(`type`, `f`): `this`

Defined in: [transducers/ProcessorBuilder.ts:110](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L110)

#### Parameters

##### type

[`Any`](../../../type-aliases/Any.md)

##### f

(`value`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

#### Returns

`this`

#### Inherited from

`FunctionBuilder.onType`

***

### onTypeCategory()

> **onTypeCategory**(`cat`, `f`): `this`

Defined in: [transducers/ProcessorBuilder.ts:118](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L118)

#### Parameters

##### cat

[`TypeCategory`](../../../type-aliases/TypeCategory.md) | `"Simple"`

##### f

(`value`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

#### Returns

`this`

#### Inherited from

`FunctionBuilder.onTypeCategory`
