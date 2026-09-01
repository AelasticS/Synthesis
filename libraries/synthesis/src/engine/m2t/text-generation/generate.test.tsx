/** @jsx createExprNode */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { createExprNode } from "./../../index";
import { getValue } from "@aelastics/result";
import {
  generate,
  M2T,
  getResultByItemPath,
  M2T_Model,
  IParagraph,
  ISection,
} from "../index";
import { Dir, Doc, P, Sec } from "../index";
import { IDirectory, IDocument } from "../index";
import { ModelStore, Context, ExprNode } from "./../../index";

const testStore = new ModelStore();

let testDoc1Element: ExprNode<IDocument> = (
  <Doc name="TestDoc1.txt">
    <P>paragraph 1</P>
    <P>paragraph 2</P>
  </Doc>
);

let testDoc2Element: ExprNode<IDocument> = (
  <Doc name="TestDoc2.txt">
    <P>{`some text for Math.log2(8)=${Math.log2(8)}`}</P>
  </Doc>
);

let dir1Element: ExprNode<IDirectory> = (
  <Dir name="directory1">
    {testDoc1Element}
    <Dir name="subDir1">{testDoc2Element}</Dir>
  </Dir>
);

let testModel1_Element: ExprNode<M2T_Model> = (
  <M2T name="test model1" store={testStore}>
    {testDoc1Element}
  </M2T>
);

let testModel2_Element: ExprNode<M2T_Model> = (
  <M2T name="test model2" store={testStore}>
    {testDoc2Element}
  </M2T>
);

let Doc1TopDir = (
  <Doc name="Doc.txt">
    <P>Title Doc1</P>
    <Sec name="Chapter 1">
      <Sec name="Subchapter 1.1">
        <P>text of Subchapter 1.1</P>
      </Sec>
      <P>text of at end of Chapter 1</P>
    </Sec>
    <Sec name="Chapter 2">
      <Sec name="Subchapter 2.1">
        <P>text of Subchapter 2.1</P>
      </Sec>
    </Sec>
    <P>Conclusions</P>
    <Sec $refByName="Chapter 1">
        <P>sdfdfsfdsfsdsfdsdsf</P>
    </Sec>
  </Doc>
);

let testModel3_Element: ExprNode<M2T_Model> = (
  <M2T name="test model3" store={testStore}>
    <Dir name="TopDir">
      {Doc1TopDir}
      <Dir name="Subdir1">
        <Doc name="Doc1.txt">
          <P>Title Doc1</P>
          <P>Conclusions</P>
        </Doc>
      </Dir>
      <Dir name="Subdir2"></Dir>
    </Dir>
  </M2T>
);

const nestedStore = new ModelStore();

let nestedModel_Element: ExprNode<M2T_Model> = (
  <M2T name="nested model" store={nestedStore}>
    <Doc name="Top.txt">
      <P>at the root</P>
    </Doc>
    <Dir name="TopDir">
      <Doc name="InTop.txt">
        <P>one level down</P>
      </Doc>
      <Dir name="Subdir1">
        <Doc name="Deep.txt">
          <P>two levels down</P>
        </Doc>
      </Dir>
    </Dir>
  </M2T>
);

// A model is the only namespace the store recognizes, so all of a model's
// elements share one flat name scope and a single M2T model cannot yet
// declare two documents called README.md (see the namespace entry in
// design/engine-follow-ups.md). The two directories are therefore authored
// as separate models and generated together.
const sameNameStore = new ModelStore();

let entitiesModel_Element: ExprNode<M2T_Model> = (
  <M2T name="entities model" store={sameNameStore}>
    <Dir name="entities">
      <Doc name="README.md">
        <P>the entities readme</P>
      </Doc>
    </Dir>
  </M2T>
);

let relationsModel_Element: ExprNode<M2T_Model> = (
  <M2T name="relations model" store={sameNameStore}>
    <Dir name="relations">
      <Doc name="README.md">
        <P>the relations readme</P>
      </Doc>
    </Dir>
  </M2T>
);

describe("test text generation", () => {
  // it("should generate correct document content for testModel1", async () => {
  //     const testDoc1: M2T_Model = testModel1_Element.render(new Context());
  //     const res = await generate(testStore, testDoc1, {rootDir:"TXT_Output", mode:"real"})
  //     expect(res.noSuccesses).toEqual(1)
  //     expect(res.noFailures).toEqual(0)
  //     let s = res.results[0].outcome
  //     //@ts-ignore
  //     expect(s.value).toEqual("paragraph 1\nparagraph 2\n")
  //     //@ts-ignore
  //     expect(getResultByItemPath(res,"TestDoc1.txt")?.value).toEqual("paragraph 1\nparagraph 2\n")

  // });

  it("should generate correct document content for testModel1", async () => {
    const testDoc1: M2T_Model = testModel3_Element.render(new Context());
    const res = await generate(testStore, testDoc1, {
      rootDir: "TXT_Output2",
      mode: "real",
    });
    expect(res.noFailures).toEqual(0);

    // paths are reported relative to the generation root, so the nesting the
    // model declares survives into the result
    expect(res.results.map((r) => r.itemPath)).toEqual([
      "TopDir",
      "TopDir/Doc.txt",
      "TopDir/Subdir1",
      "TopDir/Subdir1/Doc1.txt",
      "TopDir/Subdir2",
    ]);

    // real mode writes the files where those paths say they are; generate
    // must not resolve before its writes finish
    for (const item of res.results) {
      expect(existsSync(join("TXT_Output2", item.itemPath))).toBeTruthy();
    }
    expect(readFileSync(join("TXT_Output2", "TopDir", "Subdir1", "Doc1.txt"), "utf-8")).toEqual(
      "Title Doc1\nConclusions\n"
    );
  });

  it("should report each item by its path relative to the generation root", async () => {
    const nested: M2T_Model = nestedModel_Element.render(new Context());
    const res = await generate(nestedStore, nested);
    expect(res.noFailures).toEqual(0);
    expect(res.noSuccesses).toEqual(5);

    // a document at the root keeps its bare name; deeper ones carry the
    // directories above them
    expect(res.results.map((r) => r.itemPath)).toEqual([
      "Top.txt",
      "TopDir",
      "TopDir/InTop.txt",
      "TopDir/Subdir1",
      "TopDir/Subdir1/Deep.txt",
    ]);

    expect(getValue(getResultByItemPath(res, "Top.txt")!)).toEqual("at the root\n");
    expect(getValue(getResultByItemPath(res, "TopDir/InTop.txt")!)).toEqual("one level down\n");
    expect(getValue(getResultByItemPath(res, "TopDir/Subdir1/Deep.txt")!)).toEqual(
      "two levels down\n"
    );
  });

  it("should keep same-named documents in different directories apart", async () => {
    const entities: M2T_Model = entitiesModel_Element.render(new Context());
    const relations: M2T_Model = relationsModel_Element.render(new Context());
    const sameName = {
      ...entities,
      items: [...entities.items, ...relations.items],
    } as M2T_Model;
    const res = await generate(sameNameStore, sameName);
    expect(res.noFailures).toEqual(0);

    const docPaths = res.results.filter((r) => r.itemType === "Doc").map((r) => r.itemPath);
    expect(docPaths).toEqual(["entities/README.md", "relations/README.md"]);
    expect(new Set(docPaths).size).toEqual(2);

    // each path addresses its own document rather than whichever was reported first
    expect(getValue(getResultByItemPath(res, "entities/README.md")!)).toEqual(
      "the entities readme\n"
    );
    expect(getValue(getResultByItemPath(res, "relations/README.md")!)).toEqual(
      "the relations readme\n"
    );
  });
});
