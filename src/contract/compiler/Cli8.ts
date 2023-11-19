import { resolve } from 'path';
import CompilerCli, { getPackagePath } from './Cli';

/**
 * @category contract
 */
export default class CompilerCli8 extends CompilerCli {
  /**
   * @param options - Options
   * @param options.ignoreVersion - Don't ensure that the compiler is supported
   */
  constructor(
    { ignoreVersion }: { ignoreVersion?: boolean } = {},
  ) {
    super(resolve(getPackagePath(), './bin/aesophia_cli_8'), { ignoreVersion });
  }
}
