import * as ddm from './decision-meta.model';
import { ModelStore } from '../../../engine';
import { CpxTemplate, ExprNode, Template, WithRefProps } from "../../../jsx-runtime";

export type IDecisionModelProps = WithRefProps<ddm.IDecisionModel> & {
    store?: ModelStore;
};

export const DecisionModel: CpxTemplate<IDecisionModelProps, ddm.IDecisionModel> = (props) => {
    return new ExprNode(ddm.DecisionModel, props, undefined);
};

export const Option: Template<ddm.IOption> = (props) => {
    return new ExprNode(ddm.Option, props, 'options');
}

export const ElementLevelIssue: Template<ddm.IElementLevelIssue> = (props) => {
    return new ExprNode(ddm.ElementLevelIssue, props, 'issues');
}

export const ModelLevelIssue: Template<ddm.IModelLevelIssue> = (props) => {
    return new ExprNode(ddm.ModelLevelIssue, props, 'issues');
}

export const ElementLevelSubIssue: Template<ddm.IElementLevelIssue> = (props) => {
    return new ExprNode(ddm.ElementLevelIssue, props, 'subIssues');
}

export const ModelLevelSubIssue: Template<ddm.IModelLevelIssue> = (props) => {
    return new ExprNode(ddm.ModelLevelIssue, props, 'subIssues');
}

export const Dependency: Template<ddm.IDependency> = (props) => {
    return new ExprNode(ddm.Constraint, props, undefined);
}

export const OpeningOption: Template<ddm.IOpeningOption> = (props) => {
    return new ExprNode(ddm.OpeningOption, props, 'options');
}


