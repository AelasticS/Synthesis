// @synthesis/examples — root barrel.
//
// Each example sub-folder wraps its transformation as a Runnable (from
// @synthesis/runner). This file aggregates them into a single registry so
// downstream consumers (currently the CLI) can list, describe, and execute
// examples by id.

import { RunnableRegistry } from "@synthesis/runner";

import { runnable as eerToRelSmall } from "./eer-to-rel-small/runnable";
import { runnable as eerToRelWithDecisions } from "./eer-to-rel-with-decisions/runnable";
import { runnable as decisionBinding } from "./decision-binding/runnable";
import { runnable as decisionsFullProcess } from "./decisions-full-process/runnable";
import { runnable as sourceToDecisionBinding } from "./source-to-decision-binding/runnable";
import { runnable as typesToText } from "./types-to-text/runnable";

export const examplesRegistry = new RunnableRegistry();
examplesRegistry.register(eerToRelSmall);
examplesRegistry.register(eerToRelWithDecisions);
examplesRegistry.register(decisionBinding);
examplesRegistry.register(decisionsFullProcess);
examplesRegistry.register(sourceToDecisionBinding);
examplesRegistry.register(typesToText);

export {
  eerToRelSmall,
  eerToRelWithDecisions,
  decisionBinding,
  decisionsFullProcess,
  sourceToDecisionBinding,
  typesToText,
};
