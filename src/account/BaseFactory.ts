import Node from '../Node.js';
import AccountBase from './Base.js';

/**
 * A factory class that generates instances of AccountBase by index.
 * @category account
 */
export default abstract class AccountBaseFactory {
  /**
   * Get an instance of AccountBase for a given account index.
   * @param accountIndex - Index of account
   */
  abstract initialize(accountIndex: number): Promise<AccountBase>;

  /**
   * Discovers accounts in set that already have been used (has any on-chain transactions).
   * It returns an empty array if none of accounts been used.
   * If a used account is preceded by an unused account then it would be ignored.
   * @param node - Instance of Node to get account information from
   */
  async discover(node: Node): Promise<AccountBase[]> {
    let index = 0;
    const result = [];
    let account;
    do {
      if (account != null) result.push(account);
      account = await this.initialize(index);
      index += 1;
    } while (
      await node.getAccountByPubkey(account.address).then(
        () => true,
        () => false,
      )
    );
    return result;
  }
}
