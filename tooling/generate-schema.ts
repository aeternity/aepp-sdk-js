#!/usr/bin/env -S ts-node --transpileOnly
import { writeFileSync } from 'fs';
import { basename } from 'path';
import ts, { factory, IntersectionTypeNode, TypeNode } from 'typescript';
import { txSchema } from '../src/tx/builder/schema';
import { Tag } from '../src/tx/builder/constants';

const destPath = 'src/tx/builder/schema.generated.ts';

const sourceFile = ts.createSourceFile(basename(destPath), '', ts.ScriptTarget.Latest);

function addTsDocCategory<T extends ts.Node>(node: T): T {
  return ts.addSyntheticLeadingComment(
    node,
    ts.SyntaxKind.MultiLineCommentTrivia,
    '*\n * @category transaction builder\n ',
    true,
  );
}

// workaround to fix "An interface can only extend an object type or intersection of object types
// with statically known members." while building test/environment/typescript (uses ts decl files)
// TODO: figure out why union is not converted to a single item it case of Tag.Account v2 and v1
function reAddVersion(node: TypeNode, version: number): IntersectionTypeNode {
  return factory.createIntersectionTypeNode([
    factory.createTypeReferenceNode(
      factory.createIdentifier('Omit'),
      [
        node,
        factory.createLiteralTypeNode(factory.createStringLiteral('version')),
      ],
    ),
    factory.createTypeLiteralNode([factory.createPropertySignature(
      undefined,
      factory.createIdentifier('version'),
      factory.createToken(ts.SyntaxKind.QuestionToken),
      factory.createLiteralTypeNode(factory.createNumericLiteral(version)),
    )]),
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
          factory.createIdentifier('TxParams'),
          factory.createIdentifier('TxParamsComplex'),
        ),
        factory.createImportSpecifier(
          false,
          factory.createIdentifier('TxParamsAsync'),
          factory.createIdentifier('TxParamsAsyncComplex'),
        ),
        factory.createImportSpecifier(
          false,
          factory.createIdentifier('TxUnpacked'),
          factory.createIdentifier('TxUnpackedComplex'),
        ),
      ]),
    ),
    factory.createStringLiteral('./schema'),
    undefined,
  ),
  factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([factory.createImportSpecifier(
        false,
        undefined,
        factory.createIdentifier('Tag'),
      )]),
    ),
    factory.createStringLiteral('./constants'),
    undefined,
  ),
  ...txSchema.map((schema) => {
    const tag = Tag[schema.tag.constValue];
    const version = schema.version.constValue;
    const name = `${tag}${version}`;
    return ['TxParams', 'TxParamsAsync', 'TxUnpacked'].map((kind) => {
      const isVersionOptional = schema.version.constValueOptional && kind !== 'TxUnpacked';
      const innerType = factory.createIntersectionTypeNode([
        factory.createTypeReferenceNode(
          factory.createIdentifier(`${kind}Complex`),
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
          factory.createIdentifier(`${kind}${name}Type`),
          undefined,
          isVersionOptional ? reAddVersion(innerType, version) : innerType,
        ),
        factory.createInterfaceDeclaration(
          [factory.createToken(ts.SyntaxKind.ExportKeyword)],
          factory.createIdentifier(`${kind}${name}`),
          undefined,
          [factory.createHeritageClause(
            ts.SyntaxKind.ExtendsKeyword,
            [factory.createExpressionWithTypeArguments(
              factory.createIdentifier(`${kind}${name}Type`),
              undefined,
            )],
          )],
          [],
        ),
      ];
    })
      .flat()
      .map((node) => addTsDocCategory(node));
  }).flat(),
  ...['TxParams', 'TxParamsAsync', 'TxUnpacked'].map((kind) => (
    factory.createTypeAliasDeclaration(
      [factory.createToken(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier(kind),
      undefined,
      factory.createUnionTypeNode(txSchema.map((schema) => {
        const tag = Tag[schema.tag.constValue];
        const version = schema.version.constValue;
        const name = `${tag}${version}`;
        return factory.createTypeReferenceNode(factory.createIdentifier(`${kind}${name}`));
      })),
    )
  ))
    .map((node) => addTsDocCategory(node)),
]);

const result = `/* eslint-disable */
// This file generated by \`npm run build:generate\`, don't edit manually.

${ts.createPrinter().printList(ts.ListFormat.MultiLine, list, sourceFile)}`;

writeFileSync(destPath, result);
