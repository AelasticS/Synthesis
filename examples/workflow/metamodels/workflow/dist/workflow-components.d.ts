import * as w from "./workflow.meta.model.type.js";
import { CpxTemplate, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx";
export type IModelProps = WithRefProps<w.IWorkflowModel> & {
    store?: IStore;
};
export declare const WorkflowModel: CpxTemplate<IModelProps, w.IWorkflowModel>;
export declare const DocumentType: Template<w.IDocumentType>;
export declare const Task: Template<w.ITask>;
export declare const Process: Template<w.IProcess>;
export declare const Sequence: Template<w.ISequence>;
export declare const Parallel: Template<w.IParallel>;
export declare const Choice: Template<w.IChoice>;
export declare const Branch: Template<w.IBranch>;
export declare const Loop: Template<w.ILoop>;
export declare const Document: Template<w.IDocument>;
export declare const Invoke: Template<w.IInvocation>;
export declare const SubProcess: Template<w.IInvocation>;
