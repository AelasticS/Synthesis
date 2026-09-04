import { Context, ExprNode } from "../../jsx-runtime";
import * as g from "../../metamodel-core";
import { ModelStore } from '../index'

describe("should correctly find fully qualified name of model elements from references", () => {
  const store = new ModelStore();
  const ctx = new Context();

  let ns1 = { name: "www.aelastics.com", path: "" } as unknown as g.INamespace;
  ctx.namespaceStack.push(ns1);

  it("should correctly find fully qualified name from absolute path with protocol", () => {
    const path = "jsx-file://www.aelastics.com/n1/n2"; // absolute path with protocol
    const name = ExprNode.getFullPathName(path, ctx);
    expect(name === "//www.aelastics.com/n1/n2").toBeTruthy;
  });

  it("should correctly find fully qualified name from  absolute path without protocol", () => {
    const path = "//aelastics.com/n1/n2"; // absolute path without protocol
    const name = ExprNode.getFullPathName(path, ctx);
    expect(name === "//www.aelastics.com/n1/n2").toBeTruthy;
  });

  it("should correctly find fully qualified name from  relative path with name", () => {
    const path = "../../n2"; // relative path with name
    const name = ExprNode.getFullPathName(path, ctx);
    expect(name === "//www.aelastics.com/n1/n2").toBeTruthy;
  });

  it("should correctly find fully qualified name from  relative path with name", () => {
    const path = "n0/n1/n2"; //
    const name = ExprNode.getFullPathName(path, ctx);
    expect(name === "//www.aelastics.com/n1/n2").toBeTruthy;
  });

  it("should correctly find fully qualified name from  relative path with point", () => {
    const path = "./n0/n1/n2";
    const name = ExprNode.getFullPathName(path, ctx);
    expect(name === "//www.aelastics.com/n1/n2").toBeTruthy;
  });

  it("should correctly find fully qualified name from  relative path with slash", () => {
    const path = "/n1/n2";
    const name = ExprNode.getFullPathName(path, ctx);
    expect(name === "//www.aelastics.com/n1/n2").toBeTruthy;
  });

  it("should return empy name on emty url", () => {
    const path = " "; // empty path
    const name = ExprNode.getFullPathName(path, ctx);
    expect(name === "").toBeTruthy;
  });
});
