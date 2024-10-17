#!/usr/bin/env -S tsx
import { writeFileSync } from 'fs';
import { basename } from 'path';
import ts, { factory, IntersectionTypeNode, TypeNode } from 'typescript';

function generate(
  prefix: string,
  folder: string,
  Tag: any,
  schemas: any,
  generateAsync: boolean,
  category: string,
  tagName: string | null,
  tagInConstants: boolean,
): void {
  const destPath = `src/tx/builder/${folder}schema.generated.ts`;
  const typesToGenerate = ['Params', ...(generateAsync ? ['ParamsAsync'] : []), 'Unpacked'];

  const sourceFile = ts.createSourceFile(basename(destPath), '', ts.ScriptTarget.Latest);

  function addTsDocCategory<T extends ts.Node>(node: T): T {
    return ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      `*\n * @category ${category}\n `,
      true,
    );
  }

  // workaround to fix "An interface can only extend an object type or intersection of object types
  // with statically known members." while building test/environment/typescript (uses ts decl files)
  // TODO: figure out why union is not converted to a single item it case of Tag.Account v2 and v1
  function reAddVersion(node: TypeNode, version: number): IntersectionTypeNode {
    return factory.createIntersectionTypeNode([
      factory.createTypeReferenceNode(factory.createIdentifier('Omit'), [
        node,
        factory.createLiteralTypeNode(factory.createStringLiteral('version')),
      ]),
      factory.createTypeLiteralNode([
        factory.createPropertySignature(
          undefined,
          factory.createIdentifier('version'),
          factory.createToken(ts.SyntaxKind.QuestionToken),
          factory.createLiteralTypeNode(factory.createNumericLiteral(version)),
        ),
      ]),
    ]);
  }

  const list = factory.createNodeArray([
    factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(
            false,
            factory.createIdentifier(`${prefix}Params`),
            factory.createIdentifier(`${prefix}ParamsComplex`),
          ),
          ...(generateAsync
            ? [
                factory.createImportSpecifier(
                  false,
                  factory.createIdentifier('TxParamsAsync'),
                  factory.createIdentifier('TxParamsAsyncComplex'),
                ),
              ]
            : []),
          factory.createImportSpecifier(
            false,
            factory.createIdentifier(`${prefix}Unpacked`),
            factory.createIdentifier(`${prefix}UnpackedComplex`),
          ),
        ]),
      ),
      factory.createStringLiteral('./schema.js'),
      undefined,
    ),
    factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(
            false,
            tagName == null ? undefined : factory.createIdentifier(tagName),
            factory.createIdentifier('Tag'),
          ),
        ]),
      ),
      factory.createStringLiteral(tagInConstants ? './constants.js' : './schema.js'),
      undefined,
    ),
    ...schemas
      .map((schema) => {
        const tag = Tag[schema.tag.constValue];
        const version = schema.version.constValue;
        const name = `${tag}${version}`;
        return typesToGenerate
          .map((kind) => {
            const isVersionOptional =
              schema.version.constValueOptional === true && kind !== 'Unpacked';
            const innerType = factory.createIntersectionTypeNode([
              factory.createTypeReferenceNode(
                factory.createIdentifier(`${prefix}${kind}Complex`),
                undefined,
              ),
              factory.createTypeLiteralNode([
                factory.createPropertySignature(
                  undefined,
                  factory.createIdentifier('tag'),
                  undefined,
                  factory.createTypeReferenceNode(
                    factory.createQualifiedName(
                      factory.createIdentifier('Tag'),
                      factory.createIdentifier(tag),
                    ),
                    undefined,
                  ),
                ),
                factory.createPropertySignature(
                  undefined,
                  factory.createIdentifier('version'),
                  undefined,
                  factory.createLiteralTypeNode(factory.createNumericLiteral(version)),
                ),
              ]),
            ]);
            return [
              factory.createTypeAliasDeclaration(
                undefined,
                factory.createIdentifier(`${prefix}${kind}${name}Type`),
                undefined,
                isVersionOptional ? reAddVersion(innerType, version) : innerType,
              ),
              factory.createInterfaceDeclaration(
                [factory.createToken(ts.SyntaxKind.ExportKeyword)],
                factory.createIdentifier(`${prefix}${kind}${name}`),
                undefined,
                [
                  factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
                    factory.createExpressionWithTypeArguments(
                      factory.createIdentifier(`${prefix}${kind}${name}Type`),
                      undefined,
                    ),
                  ]),
                ],
                [],
              ),
            ];
          })
          .flat()
          .map((node) => addTsDocCategory(node));
      })
      .flat(),
    ...typesToGenerate
      .map((kind) =>
        factory.createTypeAliasDeclaration(
          [factory.createToken(ts.SyntaxKind.ExportKeyword)],
          factory.createIdentifier(prefix + kind),
          undefined,
          factory.createUnionTypeNode(
            schemas.map((schema) => {
              const tag = Tag[schema.tag.constValue];
              const version = schema.version.constValue;
              const name = `${tag}${version}`;
              return factory.createTypeReferenceNode(
                factory.createIdentifier(`${prefix}${kind}${name}`),
              );
            }),
          ),
        ),
      )
      .map((node) => addTsDocCategory(node)),
  ]);

  const result = `/* eslint-disable */
// This file generated by \`npm run build:generate\`, don't edit manually.

${ts.createPrinter().printList(ts.ListFormat.MultiLine, list, sourceFile)}`;

  writeFileSync(destPath, result);
}

(async () => {
  const { DelegationTag, schemas: delegationSchema } = await import(
    '../src/tx/builder/delegation/schema'
  );
  generate(
    'Dlg',
    'delegation/',
    DelegationTag,
    delegationSchema,
    false,
    'delegation signature',
    'DelegationTag',
    false,
  );

  const { EntryTag } = await import('../src/tx/builder/entry/constants');
  const { schemas: entrySchema } = await import('../src/tx/builder/entry/schema');
  generate('Ent', 'entry/', EntryTag, entrySchema, false, 'entry builder', 'EntryTag', true);

  const { Tag: TxTag } = await import('../src/tx/builder/constants');
  const { txSchema } = await import('../src/tx/builder/schema');
  generate('Tx', '', TxTag, txSchema, true, 'transaction builder', null, true);
})();
