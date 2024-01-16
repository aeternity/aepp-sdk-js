#!/usr/bin/env -S ts-node --transpileOnly
import { writeFileSync } from 'fs';
import { basename } from 'path';
import ts, { factory, IntersectionTypeNode, TypeNode } from 'typescript';
import { txSchema } from '../src/tx/builder/schema';
import { Tag as TxTag } from '../src/tx/builder/constants';
import { DelegationTag, schemas as delegationSchema } from '../src/tx/builder/delegation/schema';

function generate(isDelegation: boolean): void {
  const prefix = isDelegation ? 'Dlg' : 'Tx';
  const destPath = `src/tx/builder/${isDelegation ? 'delegation/' : ''}schema.generated.ts`;
  const [Tag, schemas] = isDelegation ? [DelegationTag, delegationSchema] : [TxTag, txSchema];
  const typesToGenerate = ['Params', ...isDelegation ? [] : ['ParamsAsync'], 'Unpacked'];

  const sourceFile = ts.createSourceFile(basename(destPath), '', ts.ScriptTarget.Latest);

  function addTsDocCategory<T extends ts.Node>(node: T): T {
    return ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      `*\n * @category ${isDelegation ? 'delegation signature' : 'transaction builder'}\n `,
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
            factory.createIdentifier(`${prefix}Params`),
            factory.createIdentifier(`${prefix}ParamsComplex`),
          ),
          ...isDelegation ? [] : [
            factory.createImportSpecifier(
              false,
              factory.createIdentifier('TxParamsAsync'),
              factory.createIdentifier('TxParamsAsyncComplex'),
            ),
          ],
          factory.createImportSpecifier(
            false,
            factory.createIdentifier(`${prefix}Unpacked`),
            factory.createIdentifier(`${prefix}UnpackedComplex`),
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
          isDelegation ? factory.createIdentifier('DelegationTag') : undefined,
          factory.createIdentifier('Tag'),
        )]),
      ),
      factory.createStringLiteral(isDelegation ? './schema' : './constants'),
      undefined,
    ),
    ...schemas.map((schema) => {
      const tag = Tag[schema.tag.constValue];
      const version = schema.version.constValue;
      const name = `${tag}${version}`;
      return typesToGenerate.map((kind) => {
        const isVersionOptional = schema.version.constValueOptional && kind !== 'Unpacked';
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
            [factory.createHeritageClause(
              ts.SyntaxKind.ExtendsKeyword,
              [factory.createExpressionWithTypeArguments(
                factory.createIdentifier(`${prefix}${kind}${name}Type`),
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
    ...typesToGenerate.map((kind) => (
      factory.createTypeAliasDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier(prefix + kind),
        undefined,
        factory.createUnionTypeNode(schemas.map((schema) => {
          const tag = Tag[schema.tag.constValue];
          const version = schema.version.constValue;
          const name = `${tag}${version}`;
          return factory.createTypeReferenceNode(factory.createIdentifier(`${prefix}${kind}${name}`));
        })),
      )
    ))
      .map((node) => addTsDocCategory(node)),
  ]);

  const result = `/* eslint-disable */
// This file generated by \`npm run build:generate\`, don't edit manually.

${ts.createPrinter().printList(ts.ListFormat.MultiLine, list, sourceFile)}`;

  writeFileSync(destPath, result);
}

generate(true);
generate(false);
