import * as dm from './configuration-meta.model';
import { ModelStore } from '../../../engine';
import { CpxTemplate, ExprNode, Template, WithRefProps } from "../../../jsx-runtime";

export type IModelProps = WithRefProps<dm.IConfigurationModel> & {
    store?: ModelStore;
};

export const ConfigurationModel: CpxTemplate<IModelProps, dm.IConfigurationModel> = (props) => {
    return new ExprNode(dm.ConfigurationModel, props, undefined);
}

// export const SelectedOption = (option: IOption) => {
//     // Get the actual type instance for this specific option
//     const SelectedOptionType = dm.SelectedOption;


//     return (props: WithRefProps<dm.IBaseSelectedOption>) => {
//         // 
//         return new ExprNode(SelectedOptionType, props, 'selectedOptions');
//     };
// };

// export const SelectedOption: Template<dm.IChoice> = (props) => {
//     return new ExprNode(dm.Choice, props, 'selectedOptions');
// }

// Reference-only: points at an existing Choice (e.g. via $refByName) so
// serialized traces can tag a choice reference distinctly from a plain
// element reference. Not used to construct new choices as children of
// ConfigurationModel — ElementChoice/GlobalChoice do that.
export const Choice: Template<dm.IChoice> = (props) => {
    return new ExprNode(dm.Choice, props, undefined);
}

export const ElementChoice: Template<dm.IElementChoice> = (props) => {
    return new ExprNode(dm.ElementChoice, props, 'choices');
}

export const GlobalChoice: Template<dm.IGlobalChoice> = (props)=>{
    return new ExprNode(dm.GlobalChoice, props, 'choices');
}

