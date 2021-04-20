/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import { rlp, hash } from './crypto'

const NODE_TYPES = {
  branch: 1,
  extension: 2,
  leaf: 3
}

function nodeType (node) {
  if (node.length === 17) {
    return NODE_TYPES.branch
  }
  if (node.length === 2) {
    const nibble = node[0].toString('hex')[0]
    if (nibble === '0' || nibble === '1') {
      return NODE_TYPES.extension
    }
    if (nibble === '2' || nibble === '3') {
      return NODE_TYPES.leaf
    }
  }
}

function decodePath (path) {
  if (path[0] === '0' || path[0] === '2') {
    return path.slice(2)
  }
  if (path[0] === '1' || path[0] === '3') {
    return path.slice(1)
  }
}

/**
 * Deserialize Merkle Patricia Tree
 * @rtype (binary: Array) => Object
 * @param {Array} binary - Binary
 * @return {Object} Merkle Patricia Tree
 */
export function deserialize (binary) {
  return {
    rootHash: binary[0].toString('hex'),
    nodes: binary[1].reduce((prev, node) => ({
      ...prev,
      [node[0].toString('hex')]: node[1]
    }), {})
  }
}

/**
 * Serialize Merkle Patricia Tree
 * @rtype (tree: Object) => Array
 * @param {Object} tree - Merkle Patricia Tree
 * @return {Array} Binary
 */
export function serialize (tree) {
  return [
    Buffer.from(tree.rootHash, 'hex'),
    Object.entries(tree.nodes).map(([mptHash, value]) => ([
      Buffer.from(mptHash, 'hex'),
      value
    ]))
  ]
}

/**
 * Retrieve value from Merkle Patricia Tree
 * @rtype (tree: Object, key: String) => Buffer
 * @param {Object} tree - Merkle Patricia Tree
 * @param {String} key - The key of the element to retrieve
 * @return {Buffer} Value associated to the specified key
 */
export function get (tree, key, hash) {
  const node = hash ? tree.nodes[hash] : tree.nodes[tree.rootHash]
  const type = nodeType(node)
  if (type === NODE_TYPES.branch) {
    if (key.length) {
      const nextHash = node[parseInt(key[0], 16)].toString('hex')
      return get(tree, key.substr(1), nextHash)
    }
    return node[16]
  }
  if (type === NODE_TYPES.extension) {
    const path = decodePath(node[0].toString('hex'))
    if (key.substr(0, path.length) === path) {
      return get(tree, key.substr(path.length), node[1].toString('hex'))
    }
  }
  if (type === NODE_TYPES.leaf) {
    if (node[0].toString('hex').substr(1) === key) {
      return node[1]
    }
  }
}

function nodeHash (node) {
  return Buffer.from(hash(rlp.encode(node))).toString('hex')
}

/**
 * Verify if rootHash of Merkle Patricia Tree is correct
 * @rtype (tree: Object) => Boolean
 * @param {Object} tree - Merkle Patricia Tree
 * @return {Boolean} Boolean indicating whether or not rootHash is correct
 */
export function verify (tree, key, verified = []) {
  const hash = key || tree.rootHash
  if (verified.includes(hash)) {
    return true
  }
  const node = tree.nodes[hash]
  const type = nodeType(node)
  if (nodeHash(node) !== hash) {
    return false
  }
  verified.push(hash)
  if (type === NODE_TYPES.branch) {
    return !node.some((n, i) => {
      const nextKey = n.toString('hex')
      if (i < 16) {
        return !verify(tree, nextKey, verified)
      }
      return false
    })
  }
  if (type === NODE_TYPES.extension) {
    return verify(tree, node[1].toString('hex'), verified)
  }
  return true
}
