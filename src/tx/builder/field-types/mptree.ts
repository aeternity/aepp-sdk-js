import { encode as rlpEncode, Input } from 'rlp';
import { Tag } from '../constants';
import { hash } from '../../../utils/crypto';
import {
  MerkleTreeHashMismatchError,
  MissingNodeInTreeError,
  UnknownPathNibbleError,
  UnexpectedTsError,
  UnknownNodeLengthError,
  InternalError,
} from '../../../utils/errors';
import {
  decode, encode, Encoded, Encoding,
} from '../../../utils/encoder';
import type { unpackTx } from '..';
import type { TxUnpacked } from '../schema.generated';

enum NodeType {
  Branch,
  Extension,
  Leaf,
}

type MPTreeBinary = [Buffer, Array<[Buffer, Buffer[]]>];

class MPTree<E extends Encoding, T extends Tag> {
  readonly #rootHash: string;

  #isComplete = true;

  get isComplete(): boolean {
    return this.#isComplete;
  }

  readonly #nodes: { [key: string]: Buffer[] };

  readonly #encoding: E;

  readonly #tag: T;

  readonly #unpackTx: typeof unpackTx;

  static #nodeHash(node: Input): string {
    return Buffer.from(hash(rlpEncode(node))).toString('hex');
  }

  /**
   * Deserialize Merkle Patricia Tree
   * @param binary - Binary
   * @param tag - Tag to use to decode value
   * @param unpTx - Implementation of unpackTx use to decode values
   * @returns Merkle Patricia Tree
   */
  constructor(binary: MPTreeBinary, encoding: E, tag: T, unpTx: typeof unpackTx) {
    this.#encoding = encoding;
    this.#tag = tag;
    this.#unpackTx = unpTx;
    this.#rootHash = binary[0].toString('hex');
    this.#nodes = Object.fromEntries(
      binary[1].map((node) => [node[0].toString('hex'), node[1]]),
    );

    if (this.#nodes[this.#rootHash] == null) {
      if (Object.keys(this.#nodes).length !== 0) {
        throw new MissingNodeInTreeError('Can\'t find a node by root hash');
      }
      this.#isComplete = false;
      return;
    }
    Object.entries(this.#nodes).forEach(([key, node]) => {
      if (MPTree.#nodeHash(node) !== key) throw new MerkleTreeHashMismatchError();
      const { type } = MPTree.#parseNode(node);
      switch (type) {
        case NodeType.Branch:
          node
            .slice(0, 16)
            .filter((n) => n.length)
            .forEach((n) => {
              // TODO: enable after resolving https://github.com/aeternity/aeternity/issues/4066
              // if (n.length !== 32) {
              //   throw new ArgumentError('MPTree branch item length', 32, n.length);
              // }
              if (this.#nodes[n.toString('hex')] == null) this.#isComplete = false;
            });
          break;
        case NodeType.Extension:
          if (this.#nodes[node[1].toString('hex')] == null) {
            throw new MissingNodeInTreeError('Can\'t find a node by hash in extension node');
          }
          break;
        case NodeType.Leaf:
          break;
        default:
          throw new InternalError(`Unknown MPTree node type: ${type}`);
      }
    });
  }

  isEqual(tree: MPTree<E, T>): boolean {
    return this.#rootHash === tree.#rootHash;
  }

  static #parseNode(node: Buffer[]): { type: NodeType; value?: Buffer; path?: string } {
    switch (node.length) {
      case 17:
        return {
          type: NodeType.Branch,
          ...node[16].length !== 0 && { value: node[16] },
        };
      case 2: {
        const nibble = node[0][0] >> 4; // eslint-disable-line no-bitwise
        if (nibble > 3) throw new UnknownPathNibbleError(nibble);
        const type = nibble <= 1 ? NodeType.Extension : NodeType.Leaf;
        const slice = [0, 2].includes(nibble) ? 2 : 1;
        return {
          type,
          ...type === NodeType.Leaf && { value: node[1] },
          path: node[0].toString('hex').slice(slice),
        };
      }
      default:
        throw new UnknownNodeLengthError(node.length);
    }
  }

  /**
   * Serialize Merkle Patricia Tree
   * @returns Binary
   */
  serialize(): MPTreeBinary {
    return [
      Buffer.from(this.#rootHash, 'hex'),
      Object.entries(this.#nodes).map(([mptHash, value]) => ([
        Buffer.from(mptHash, 'hex'),
        value,
      ])),
    ];
  }

  /**
   * Retrieve value from Merkle Patricia Tree
   * @param _key - The key of the element to retrieve
   * @returns Value associated to the specified key
   */
  #getRaw(_key: string): Buffer | undefined {
    let searchFrom = this.#rootHash;
    let key = _key;
    while (true) { // eslint-disable-line no-constant-condition
      const node = this.#nodes[searchFrom];
      if (node == null) {
        if (!this.isComplete) return undefined;
        throw new InternalError('Can\'t find node in complete tree');
      }
      const { type, value, path } = MPTree.#parseNode(node);
      switch (type) {
        case NodeType.Branch:
          if (key.length === 0) return value;
          searchFrom = node[+`0x${key[0]}`].toString('hex');
          key = key.substring(1);
          break;
        case NodeType.Extension:
          if (key.substring(0, path?.length) !== path) return undefined;
          searchFrom = node[1].toString('hex');
          key = key.substring(path.length);
          break;
        case NodeType.Leaf:
          if (path !== key) return undefined;
          return value;
        default:
          throw new InternalError(`Unknown MPTree node type: ${type}`);
      }
    }
  }

  /**
   * Retrieve value from Merkle Patricia Tree
   * @param key - The key of the element to retrieve
   * @returns Value associated to the specified key
   */
  get(key: Encoded.Generic<E>): TxUnpacked & { tag: T } | undefined {
    const d = this.#getRaw(decode(key).toString('hex'));
    if (d == null) return d;
    return this.#unpackTx(encode(d, Encoding.Transaction), this.#tag);
  }

  #entriesRaw(): Array<[string, Buffer]> {
    const entries: Array<[string, Buffer]> = [];
    const rec = (searchFrom: string, key: string): void => {
      const node = this.#nodes[searchFrom];
      if (node == null) {
        if (!this.isComplete) return;
        throw new InternalError('Can\'t find node in complete tree');
      }
      const { type, value, path } = MPTree.#parseNode(node);
      switch (type) {
        case NodeType.Branch:
          node
            .slice(0, 16)
            .map((t, idx): [typeof t, number] => [t, idx])
            .filter(([t]) => t.length)
            .forEach(([t, idx]) => rec(t.toString('hex'), key + idx.toString(16)));
          if (value != null) entries.push([key, value]);
          break;
        case NodeType.Extension:
          rec(node[1].toString('hex'), key + path);
          break;
        case NodeType.Leaf:
          if (value == null) throw new UnexpectedTsError();
          entries.push([key + path, value]);
          break;
        default:
          throw new InternalError(`Unknown MPTree node type: ${type}`);
      }
    };
    rec(this.#rootHash, '');
    return entries;
  }

  toObject(): Record<Encoded.Generic<E>, TxUnpacked & { tag: T }> {
    return Object.fromEntries(this.#entriesRaw()
      // TODO: remove after resolving https://github.com/aeternity/aeternity/issues/4066
      .filter(([k]) => this.#encoding !== Encoding.ContractAddress || k.length !== 66)
      .map(([k, v]) => [
        encode(Buffer.from(k, 'hex'), this.#encoding),
        this.#unpackTx(encode(v, Encoding.Transaction), this.#tag),
      ])) as Record<Encoded.Generic<E>, TxUnpacked & { tag: T }>;
  }
}

export default function genMPTreeField<E extends Encoding, T extends Tag>(encoding: E, tag: T): {
  serialize: (value: MPTree<E, T>) => MPTreeBinary;
  deserialize: (value: MPTreeBinary, o: { unpackTx: typeof unpackTx }) => MPTree<E, T>;
} {
  return {
    serialize(value) {
      return value.serialize();
    },

    deserialize(value, { unpackTx }) {
      return new MPTree(value, encoding, tag, unpackTx);
    },
  };
}
