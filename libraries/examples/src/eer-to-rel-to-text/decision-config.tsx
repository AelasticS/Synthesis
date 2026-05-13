/** @jsx createExprNode */

import { createExprNode } from "@synthesis/jsx-runtime"
import { ExprNode } from "@synthesis/jsx-runtime"
import { ModelStore } from "@synthesis/engine"
import { Model, Element } from "@synthesis/jsx-runtime"

import { ElementIssue, GlobalIssue, Option } from "@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components"
import { BindingModel } from "@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model-components"
import {
  ElementChoice,
  Choice,
  ConfigurationModel,
  GlobalChoice,
} from "@synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model-components"
import * as cm from "@synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model"

/**
 * Configuration model for the Persons EER source. Selects:
 *   - snake_case naming convention (model-level)
 *   - auto-increment primary keys for Person
 *   - foreign-key mapping for the worksIn relationship
 *
 * The naming choice is what makes the generated SQL columns appear as
 * `person_id` / `organization_name` rather than `personId` / `organizationName`.
 */
export const PersonsSchemaConfig = (store: ModelStore): ExprNode<cm.IConfigurationModel> => (
  <ConfigurationModel
    name="PersonsSchemaConfig"
    sourceModel={<Model $refByName="//www.aelastics.org/Persons" />}
    bindingModel={<BindingModel $refByName="//www.aelastics.org/ER_Bindings" />}
    store={store}
  >
    <GlobalChoice
      name="SnakeCaseNaming"
      choices={[
        <Choice
          name="UseSnakeCase"
          issue={<GlobalIssue $refByName="//www.aelastics.org/RelationSchemaDesign/NamingConvention" />}
          selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/SnakeCase" />}
          justification="Snake case is conventional for SQL identifiers."
          consequences="Generated DDL identifiers will be lower_snake_case."
        />,
      ]}
    />

    <ElementChoice
      name="PersonPrimaryKey"
      element={<Element $refByName="//www.aelastics.org/Persons/Person" />}
      choices={[
        <Choice
          name="UseAutoIncrement"
          issue={<ElementIssue $refByName="//www.aelastics.org/RelationSchemaDesign/PrimaryKeyStrategy" />}
          selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/UseAutoIncrement" />}
        />,
      ]}
    />

    <ElementChoice
      name="WorksInForeignKeyMapping"
      element={<Element $refByName="//www.aelastics.org/Persons/worksIn" />}
      choices={[
        <Choice
          name="UseForeignKey"
          issue={<ElementIssue $refByName="//www.aelastics.org/RelationSchemaDesign/OneToManyStrategy" />}
          selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/ForeignKey" />}
        />,
      ]}
    />
  </ConfigurationModel>
)
