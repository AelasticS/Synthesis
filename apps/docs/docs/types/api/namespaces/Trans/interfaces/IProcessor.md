# Interface: IProcessor

Defined in: [transducers/Processor.ts:15](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Processor.ts#L15)

Represents an interface for a processor.

## Methods

### init()

> **init**(`value`, `currNode`, ...`args`): \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

Defined in: [transducers/Processor.ts:23](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Processor.ts#L23)

Initializes the processor with a value.

#### Parameters

##### value

`any`

The initial value.

##### currNode

[`Node`](../../../classes/Node.md)

The current node.

##### args

...`any`[]

Additional arguments.

#### Returns

\[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

A tuple containing the processed result and the next action.

***

### result()

> **result**(`result`, `currNode`, ...`args`): \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

Defined in: [transducers/Processor.ts:33](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Processor.ts#L33)

Handles the result of a processing step.

#### Parameters

##### result

`any`

The result of the previous step.

##### currNode

[`Node`](../../../classes/Node.md)

The current node.

##### args

...`any`[]

Additional arguments.

#### Returns

\[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

A tuple containing the processed result and the next action.

***

### step()

> **step**(`result`, `currNode`, `item`, ...`args`): \[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

Defined in: [transducers/Processor.ts:43](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Processor.ts#L43)

Performs a processing step.

#### Parameters

##### result

`any`

The result of the previous step.

##### currNode

[`Node`](../../../classes/Node.md)

The current node.

##### item

`any`

The item to process.

##### args

...`any`[]

Additional arguments.

#### Returns

\[`any`, [`WhatToDo`](../type-aliases/WhatToDo.md)\]

A tuple containing the processed result and the next action.
