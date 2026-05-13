# Class: ObjectObservable

Defined in: [eventLog/ObservableTransformer.ts:18](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/eventLog/ObservableTransformer.ts#L18)

## Implements

- `IProcessor`

## Constructors

### new ObjectObservable()

> **new ObjectObservable**(`xf`): [`ObjectObservable`](ObjectObservable.md)

Defined in: [eventLog/ObservableTransformer.ts:21](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/eventLog/ObservableTransformer.ts#L21)

#### Parameters

##### xf

`IProcessor`

#### Returns

[`ObjectObservable`](ObjectObservable.md)

## Methods

### init()

> **init**(`value`, `currNode`): \[`any`, `WhatToDo`\]

Defined in: [eventLog/ObservableTransformer.ts:25](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/eventLog/ObservableTransformer.ts#L25)

Initializes the processor with a value.

#### Parameters

##### value

`any`

The initial value.

##### currNode

`Node`

The current node.

#### Returns

\[`any`, `WhatToDo`\]

A tuple containing the processed result and the next action.

#### Implementation of

`ITransformer.init`

***

### result()

> **result**(`result`, `currNode`): \[`any`, `WhatToDo`\]

Defined in: [eventLog/ObservableTransformer.ts:45](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/eventLog/ObservableTransformer.ts#L45)

Handles the result of a processing step.

#### Parameters

##### result

`any`

The result of the previous step.

##### currNode

`Node`

The current node.

#### Returns

\[`any`, `WhatToDo`\]

A tuple containing the processed result and the next action.

#### Implementation of

`ITransformer.result`

***

### step()

> **step**(`result`, `currNode`, `item`): \[`any`, `WhatToDo`\]

Defined in: [eventLog/ObservableTransformer.ts:54](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/eventLog/ObservableTransformer.ts#L54)

Performs a processing step.

#### Parameters

##### result

`any`

The result of the previous step.

##### currNode

`Node`

The current node.

##### item

`any`

The item to process.

#### Returns

\[`any`, `WhatToDo`\]

A tuple containing the processed result and the next action.

#### Implementation of

`ITransformer.step`
