# Class: StepBuilder

Defined in: [transducers/ProcessorBuilder.ts:134](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L134)

## Extends

- `FunctionBuilder`\<[`IProcessor`](../interfaces/IProcessor.md)\[`"step"`\]\>

## Constructors

### new StepBuilder()

> **new StepBuilder**(): [`StepBuilder`](StepBuilder.md)

#### Returns

[`StepBuilder`](StepBuilder.md)

#### Inherited from

`FunctionBuilder<IProcessor["step"]>.constructor`

## Methods

### build()

> **build**(): (`result`, `currNode`, `item`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\][]

Defined in: [transducers/ProcessorBuilder.ts:127](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L127)

#### Returns

(`result`, `currNode`, `item`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\][]

#### Inherited from

`FunctionBuilder.build`

***

### onPredicate()

> **onPredicate**(`predicate`, `fun`): `this`

Defined in: [transducers/ProcessorBuilder.ts:101](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L101)

#### Parameters

##### predicate

\<`I`\>(...`a`) => `Boolean`

##### fun

(`result`, `currNode`, `item`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

#### Returns

`this`

#### Inherited from

`FunctionBuilder.onPredicate`

***

### onType()

> **onType**(`type`, `f`): `this`

Defined in: [transducers/ProcessorBuilder.ts:110](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L110)

#### Parameters

##### type

[`Any`](../../../type-aliases/Any.md)

##### f

(`result`, `currNode`, `item`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

#### Returns

`this`

#### Inherited from

`FunctionBuilder.onType`

***

### onTypeCategory()

> **onTypeCategory**(`cat`, `f`): `this`

Defined in: [transducers/ProcessorBuilder.ts:118](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L118)

#### Parameters

##### cat

[`TypeCategory`](../../../type-aliases/TypeCategory.md) | `"Simple"`

##### f

(`result`, `currNode`, `item`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

#### Returns

`this`

#### Inherited from

`FunctionBuilder.onTypeCategory`
