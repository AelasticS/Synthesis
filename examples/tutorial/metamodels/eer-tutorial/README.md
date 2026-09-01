# eer-tutorial-metamodel

The tutorial EER metamodel in its two stages: `basic` (entities, attributes, domains, relationships, used in Part 1 of the model-to-model tutorial) and `advanced` (the basic stage plus the Kernel and Weak entity subtypes, used from Part 2 on). The eer-tutorial-basic, eer-tutorial-advanced, and eer-tutorial-configuration-based examples transform models written in these languages.

Subpath convention: `eer-tutorial-metamodel/basic` and `eer-tutorial-metamodel/advanced` export the JSX template components flat, the `/model` suffix on either stage exports its data-type schemas, and `eer-tutorial-metamodel/advanced/as-model` exports the metamodel-as-model factory (`EERTutorialMetamodel`) that the configuration-based example renders into the store.
