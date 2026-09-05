# eer-tutorial-metamodel

The tutorial EER metamodel in its three stages: `basic` (entities, attributes, domains, relationships, used in Part 1 of the model-to-model tutorial), `advanced` (the basic stage plus the Kernel and Weak entity subtypes, used in Parts 2 and 3), and `name-scopes` (the basic stage plus `declareNamespace(Entity)`, so attribute names are unique per entity, used in Part 4). The eer-tutorial-basic, eer-tutorial-advanced, eer-tutorial-configuration-based, and eer-tutorial-name-scopes examples transform models written in these languages.

Subpath convention: `eer-tutorial-metamodel/basic`, `eer-tutorial-metamodel/advanced`, and `eer-tutorial-metamodel/name-scopes` export the JSX template components flat, the `/model` suffix on any stage exports its data-type schemas, and `eer-tutorial-metamodel/advanced/as-model` exports the metamodel-as-model factory (`EERTutorialMetamodel`) that the configuration-based example renders into the store.
