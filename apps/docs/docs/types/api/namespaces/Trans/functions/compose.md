# Function: compose()

> **compose**(...`fns`): (`x`) => `any`

Defined in: [transducers/Processor.ts:79](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-types/src/transducers/Processor.ts#L79)

Composes a sequence of functions into a single function.
Each function is passed the return value of the preceding function.

## Parameters

### fns

...(`y`) => `any`[]

An array of functions to compose.

## Returns

`Function`

A function that represents the composition of the input functions.

### Parameters

#### x

`any`

### Returns

`any`
