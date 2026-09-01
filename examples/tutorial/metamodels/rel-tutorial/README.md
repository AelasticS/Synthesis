# rel-tutorial-metamodel

The simplified relational metamodel used throughout the developer-guide tutorial: a schema of tables and columns, deliberately small so the transformations stay readable. It is the target of the model-to-model tutorial examples and the source of the model-to-text (SQL) tutorial examples, including their configuration-based variants.

Subpath convention: the bare specifier `rel-tutorial-metamodel` exports the JSX template components flat, `rel-tutorial-metamodel/model` exports the data-type schemas, and `rel-tutorial-metamodel/as-model` exports the metamodel-as-model factory (`RelTutorialMetamodel`) that configuration-based transformations render into the store.
