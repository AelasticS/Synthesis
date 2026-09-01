/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"
import { Model, Element } from "@aelastics/synthesis/jsx"

import { ElementIssue, GlobalIssue, Option } from "@aelastics/synthesis/metamodels/decision"
import { BindingModel } from "@aelastics/synthesis/metamodels/binding"
import {
  ElementChoice,
  Choice,
  ConfigurationModel,
  GlobalChoice,
} from "@aelastics/synthesis/metamodels/configuration"
import * as cm from "@aelastics/synthesis/metamodels/configuration/model"

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
