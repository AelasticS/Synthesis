/** @jsx createExprNode */
/*
 * The preset vocabulary: one choice builder and the standard-sql choice
 * set. A dialect preset is the standard set spread and overridden, the
 * level-one extension mechanism (composition in the authoring
 * language): the diff between a preset and the standard set IS the
 * dialect's definition.
 */
import { createExprNode, Model } from '@aelastics/synthesis/jsx';
import { BindingModel } from '@aelastics/synthesis/metamodels/binding';
import { ConfigurationModel, GlobalChoice } from '@aelastics/synthesis/metamodels/configuration';
import { Option } from '@aelastics/synthesis/metamodels/decision';
const DESIGN = '//www.aelastics.org/DdlGenerationDesign';
export const globalChoice = (issue, option) => (createExprNode(GlobalChoice, { name: `gc_${issue}`, selectedOption: createExprNode(Option, { "$refByName": `${DESIGN}/${option}` }) }));
/** The standard-sql choice set: portable SQL, every issue closed. */
export const standardSqlChoices = () => ({
    IdentifierQuoting: 'DoubleQuoted',
    ReferentialActions: 'NativeDdl',
    DomainHandling: 'EmitDomains',
    SqlDialect: 'StandardSql',
});
/** A whole preset model over a choice set. The source-model slot names
 * the relational metamodel: a preset configures models of a metamodel,
 * not one model, and the run accepts it for any input (its header
 * declares no source reference). */
export const presetModel = (name, choices) => (store) => (createExprNode(ConfigurationModel, { name: name, sourceModel: createExprNode(Model, { "$refByName": "//www.aelastics.org/RELMetamodel" }), bindingModel: createExprNode(BindingModel, { "$refByName": "//www.aelastics.org/Rel_Bindings" }), store: store }, Object.entries(choices).map(([issue, option]) => globalChoice(issue, option))));
//# sourceMappingURL=presets.js.map