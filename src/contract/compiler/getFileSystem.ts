import { readFile } from 'fs/promises';
import { dirname, resolve, basename } from 'path';
import { InternalError } from '../../utils/errors';

const defaultIncludes = [
  'List.aes', 'Option.aes', 'String.aes',
  'Func.aes', 'Pair.aes', 'Triple.aes',
  'BLS12_381.aes', 'Frac.aes', 'Set.aes',
  'Bitwise.aes',
];
const includeRegExp = /^include\s*"([\w/.-]+)"/mi;
const includesRegExp = new RegExp(includeRegExp.source, `${includeRegExp.flags}g`);

async function getFileSystemRec(
  root: string,
  relative: string,
): Promise<Record<string, string>> {
  const sourceCode = await readFile(resolve(root, relative), 'utf8');
  const filesystem: Record<string, string> = {};
  await Promise.all((sourceCode.match(includesRegExp) ?? [])
    .map((include) => {
      const m = include.match(includeRegExp);
      if (m?.length !== 2) throw new InternalError('Unexpected match length');
      return m[1];
    })
    .filter((include) => !defaultIncludes.includes(include))
    .map(async (include) => {
      const includePath = resolve(root, include);
      filesystem[include] = await readFile(includePath, 'utf8');
      Object.assign(filesystem, await getFileSystemRec(root, include));
    }));
  return filesystem;
}

/**
 * Reads all files included in the provided contract
 * Available only in Node.js
 * @param path - a path to the main contract source code
 */
export default async function getFileSystem(path: string): Promise<Record<string, string>> {
  return getFileSystemRec(dirname(path), basename(path));
}
