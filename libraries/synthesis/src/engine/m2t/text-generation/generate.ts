import {
  M2T_Model,
  IDocument,
  IDocElement,
  ISection,
  IDirectory,
  isDirectory,
  isParagraph,
  IM2T_Item,
  M2T_Item,
} from "../index";
import { GenContext } from "./gen-context";
import { GenResult, ItemResult } from "./gen-result";
import { failure, success } from "@aelastics/result";
import { createDir, createFile } from "./fs-operations";
import { ModelStore } from "./../../index";

/**
 *  Options for generating text
 */
export type Options = {
  rootDir?: string;
  mode?: "real" | "mock";
  indent?: boolean;
};

/**
 * Generate text files specified by a M2T model
 * @param store
 * @param m  - model specifying text genaration
 * @param options - generation options
 * @returns
 */
export const generate = async (
  store: ModelStore,
  m: M2T_Model,
  options?: Options
): Promise<GenResult> => {
  const acting: boolean = false,
    rootDir: string = "output";
  const ctx = new GenContext(store, options);
  try {
    if (ctx.realMode)
      // create top dir
      createDir(ctx.rootDir);
  } catch (e) {
    const res: ItemResult = {
      itemID: "-1",
      itemPath: ctx.rootDir,
      itemType: "Dir",
      outcome: failure(e as Error),
    };
    ctx.result.results.push(res);
    ctx.result.noFailures++;
    return ctx.result;
  }

  // generate model elements; top-level items sit directly in the generation
  // root, so their path relative to it starts out empty
  for (const item of m.items) {
    await generateItem(item, ctx.rootDir, "", ctx);
  }

  return ctx.result;
};

/**
 *  Generate directories and files specified by a file system model
 *
 * @param acting - if true, generate with an effect on real file system; otherwise do nothing
 * @param rootDir - the start of directory hierarchy
 * @returns - results of execution; returned even if acting param is false
 */

/**
 * Join an item name onto the path of its parent, relative to the generation
 * root. Items directly in the root carry an empty parent path.
 */
const joinRelPath = (relPath: string, name: string) =>
  relPath === "" ? name : `${relPath}/${name}`;

/**
 *
 * @param i
 * @param path - absolute path of the parent directory, used for real-mode writes
 * @param relPath - path of the parent directory relative to the generation root
 * @param ctx
 * @returns
 */
const generateItem = async (
  i: IM2T_Item,
  path: string,
  relPath: string,
  ctx: GenContext
) =>
  isDirectory(i)
    ? generateDirectory(i, path, relPath, ctx)
    : generateDocument(<IDocument>i, path, relPath, ctx);

const generateDirectory = async (
  dir: IDirectory,
  path: string,
  relPath: string,
  ctx: GenContext
) => {

  const currPath = `${path}/${dir.name}`;
  const currRelPath = joinRelPath(relPath, dir.name);

  try {
    if (ctx.realMode) await createDir(currPath);
    const res: ItemResult = {
      itemID: `${dir.path}/${dir.name}`,
      itemPath: currRelPath,
      itemType: "Dir",
      outcome: success("successfully created"),
    };
    ctx.result.results.push(res);
    ctx.result.noSuccesses++;
  } catch (e) {
    const res: ItemResult = {
      itemID: `${dir.path}/${dir.name}`,
      itemPath: currRelPath,
      itemType: "Dir",
      outcome: failure(e as Error),
    };
    ctx.result.results.push(res);
    ctx.result.noFailures++;
    return; // stop generation further for this dir
  }

  // execute files in the directory
  for (const item of dir.items) {
    await generateItem(item, currPath, currRelPath, ctx);
  }
};

/**
 *
 * @param doc
 * @param path - absolute path of the parent directory, used for real-mode writes
 * @param relPath - path of the parent directory relative to the generation root
 * @param ctx
 */
const generateDocument = async (
  doc: IDocument,
  path: string,
  relPath: string,
  ctx: GenContext
) => {
  const currRelPath = joinRelPath(relPath, doc.name);
  try {
    let buffer: Array<string> = [];
    doc.elements.forEach((s) => buffer.push(generateFileElement(s)));
    const text = buffer.join("");
    const currPath = `${path}/${doc.name}`;
    if (ctx.realMode) await createFile(currPath, text);

    const res: ItemResult = {
      itemID: `${doc.path}/${doc.name}`,
      itemPath: currRelPath,
      itemType: "Doc",
      outcome: success(text),
    };
    ctx.result.results.push(res);
    ctx.result.noSuccesses++;
  } catch (e) {
    const res: ItemResult = {
      itemID: `${doc.path}/${doc.name}`,
      itemPath: currRelPath,
      itemType: "Doc",
      outcome: failure(e as Error),
    };
    ctx.result.results.push(res);
    ctx.result.noFailures++;
  }
};

/**
 *
 * @param input
 * @returns
 */

//TODO: add print context and indentation level to arguments to generateFileElement
//TODO: fix indent when paragraph is multiline
const generateFileElement = (input: IDocElement): string =>
  isParagraph(input)
    ? `${input.txtContent}\n`
    : generateSection(<ISection>input);

const generateSection = (input: ISection): string => {
  let buffer: Array<string> = [];
  input.elements.forEach((s) => buffer.push(generateFileElement(s)));
  return buffer.join("");
};

/**
 * Get a result about a specific directory or file
 * @param res - result about execeuting
 * @param id
 * @returns
 */
export const getResultByItemID = (res: GenResult, id: string) => {
  const r = res.results.find((item) => item.itemID === id);
  return r ? r.outcome : undefined;
};

/**
 * Get a result about a specific directory or file, addressed by its path
 * relative to the generation root, for example "TopDir/Subdir1/Doc1.txt".
 * A document directly in the root is addressed by its bare name.
 * @param res - result about executing
 * @param path
 * @returns
 */
export const getResultByItemPath = (res: GenResult, path: string) => {
  const r = res.results.find((item) => item.itemPath === path);
  return r ? r.outcome : undefined;
};
