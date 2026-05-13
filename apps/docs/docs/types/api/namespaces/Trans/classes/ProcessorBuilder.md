# Class: ProcessorBuilder

Defined in: [transducers/ProcessorBuilder.ts:12](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L12)

## Constructors

### new ProcessorBuilder()

> **new ProcessorBuilder**(): [`ProcessorBuilder`](ProcessorBuilder.md)

#### Returns

[`ProcessorBuilder`](ProcessorBuilder.md)

## Methods

### build()

> **build**(): [`IProcessorConstructor`](../type-aliases/IProcessorConstructor.md)

Defined in: [transducers/ProcessorBuilder.ts:88](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L88)

#### Returns

[`IProcessorConstructor`](../type-aliases/IProcessorConstructor.md)

***

### onInit()

> **onInit**(`f`): [`ProcessorBuilder`](ProcessorBuilder.md)

Defined in: [transducers/ProcessorBuilder.ts:17](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L17)

#### Parameters

##### f

(`value`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

| (`value`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\][]

#### Returns

[`ProcessorBuilder`](ProcessorBuilder.md)

***

### onResult()

> **onResult**(`f`): [`ProcessorBuilder`](ProcessorBuilder.md)

Defined in: [transducers/ProcessorBuilder.ts:26](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L26)

#### Parameters

##### f

(`result`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

| (`result`, `currNode`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\][]

#### Returns

[`ProcessorBuilder`](ProcessorBuilder.md)

***

### onStep()

> **onStep**(`f`): [`ProcessorBuilder`](ProcessorBuilder.md)

Defined in: [transducers/ProcessorBuilder.ts:22](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/ProcessorBuilder.ts#L22)

#### Parameters

##### f

(`result`, `currNode`, `item`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

| (`result`, `currNode`, `item`, ...`args`) => \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\][]

#### Returns

[`ProcessorBuilder`](ProcessorBuilder.md)
