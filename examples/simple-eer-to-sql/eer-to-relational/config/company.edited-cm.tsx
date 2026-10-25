/** @jsx createExprNode */

import {createExprNode, Element, Model} from '@aelastics/synthesis/jsx'
import {BindingModel} from '@aelastics/synthesis/metamodels/binding'
import {ConfigurationModel, ElementLevelChoice, ModelLevelChoice} from '@aelastics/synthesis/metamodels/configuration'
import {Option} from '@aelastics/synthesis/metamodels/decision'

export const $synth = {
    kind: 'configuration-model',
    metamodel: '@aelastics/synthesis/metamodels/configuration/model',
    author: 'Dejan Stojimirovic',
    version: '0.1.0',
    description: 'Default configuration for simple-eer-to-relational company',
} as const

export default (store) => (
    <ConfigurationModel
        name="CompanySchemaDefaultConfigurationModel"
        sourceModel={<Model $refByName="//www.aelastics.org/CompanySchema"/>}
        bindingModel={<BindingModel $refByName="//www.aelastics.org/ER_Bindings"/>}
        store={store}
    >
        <ModelLevelChoice
            name="gc_NamingConvention"
            selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/SnakeCase"/>}
        />
        <ElementLevelChoice
            name="ec_Person_personId_PrimaryKeyStrategy"
            element={<Element $refByName="//www.aelastics.org/CompanySchema/Person/personId"/>}
            selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/UseAutoIncrement"/>}
        />
        <ElementLevelChoice
            name="ec_Company_companyId_PrimaryKeyStrategy"
            element={<Element $refByName="//www.aelastics.org/CompanySchema/Company/companyId"/>}
            selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/UseAutoIncrement"/>}
        />
        <ElementLevelChoice
            name="ec_Employment_OneToManyStrategy"
            element={<Element $refByName="//www.aelastics.org/CompanySchema/Employment"/>}
            selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/JoinTable"/>}
            assumptions={"Join table avoids nulls; most persons in this domain are unemployed."}
            justification={"Join tables handle optional relationships cleanly without null values."}
            consequences={"Join table avoids nulls; most persons in this domain are unemployed; A new join table will manage the Person-Employment relationship."}
        />
    </ConfigurationModel>
)
