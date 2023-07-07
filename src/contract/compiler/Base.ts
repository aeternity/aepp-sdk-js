import { Encoded } from '../../utils/encoder';

interface FunctionAci {
  arguments: any[];
  name: string;
  payable: boolean;
  returns: any;
  stateful: boolean;
}

export type Aci = Array<{
  contract?: {
    name: string;
    event?: any;
    functions: FunctionAci[];
    kind: string; // known values: 'contract_main'
    payable: boolean;
    typedefs: any[];
  };
}>;

/**
 * A base class for all compiler implementations
 */
export default abstract class CompilerBase {
  /**
   * Compile contract by contract's path
   * Available only in Node.js
   * @param path - Path to contract source code
   * @returns ACI and bytecode
   */
  abstract compile(path: string): Promise<{
    bytecode: Encoded.ContractBytearray;
    aci: Aci;
  }>;

  /**
   * Compile contract by contract's source code
   * @param sourceCode - Contract source code as string
   * @param fileSystem - A map of contract filename to the corresponding contract source code to
   * include into the main contract
   * @example
   * ```js
   * {
   *   'library.aes': 'namespace TestLib =\n  function sum(x: int, y: int) : int = x + y'
   * }
   * ```
   * @returns ACI and bytecode
   */
  abstract compileBySourceCode(
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<{
    bytecode: Encoded.ContractBytearray;
    aci: Aci;
  }>;

  /**
   * Generate contract's ACI by contract's path
   * Available only in Node.js
   * @param path - Path to contract source code
   * @returns ACI
   */
  abstract generateAci(path: string): Promise<Aci>;

  /**
   * Generate contract's ACI by contract's source code
   * @param sourceCode - Contract source code as string
   * @param fileSystem - A map of contract filename to the corresponding contract source code to
   * include into the main contract
   * @example
   * ```js
   * {
   *   'library.aes': 'namespace TestLib =\n  function sum(x: int, y: int) : int = x + y'
   * }
   * ```
   * @returns ACI
   */
  abstract generateAciBySourceCode(
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<Aci>;

  /**
   * Verify that a contract bytecode is the result of compiling the given source code
   * Available only in Node.js
   * @param bytecode - Contract bytecode to verify
   * @param path - Path to contract source code
   * @returns ACI and bytecode
   */
  abstract validate(bytecode: Encoded.ContractBytearray, path: string): Promise<boolean>;

  /**
   * Verify that a contract bytecode is the result of compiling the given source code
   * @param bytecode - Contract bytecode to verify
   * @param sourceCode - Contract source code as string
   * @param fileSystem - A map of contract filename to the corresponding contract source code to
   * include into the main contract
   * @example
   * ```js
   * {
   *   'library.aes': 'namespace TestLib =\n  function sum(x: int, y: int) : int = x + y'
   * }
   * ```
   */
  abstract validateBySourceCode(
    bytecode: Encoded.ContractBytearray,
    sourceCode: string,
    fileSystem?: Record<string, string>,
  ): Promise<boolean>;

  /**
   * @returns Compiler version
   */
  abstract version(): Promise<string>;
}
