/**
 * CompilerPool module
 * @module @aeternity/aepp-sdk/es/contract/compiler-pool
 * @export CompilerPool
 * @example import CompilerPool from '@aeternity/aepp-sdk/es/contract/compiler-pool'
 */

import AsyncInit from '../../utils/async-init'
import Compiler from '../compiler/compiler'
import { COMPILER_METHODS, prepareCompilerObject } from './helper'

/**
 * Compiler Pool Stamp
 * This stamp allow you to make basic manipulation(add, remove, select) on list of copmiler
 * @function
 * @alias module:@aeternity/aepp-sdk/es/contract/compiler-pool
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Array} [options.nodes] - Array with Compiler instances
 * @return {Object} CompilerPool instance
 */
export const CompilerPool = AsyncInit.compose({
  async init ({ compilers = [], compilerUrl = this.compilerUrl, forceCompatibility = false } = {}) {
    this.compilerPool = new Map()
    this.validateCompilers(compilers)

    compilers.forEach(node => {
      const { name, instance } = node
      this.compilerPool.set(name, prepareCompilerObject(name, instance))
    })
    if (compilers.length) this.selectCompiler(compilers[0].name)

    // DEPRECATED. TODO Remove deprecated param
    // Prevent BREAKING CHANGES. Support for init params `compilerUrl`
    if (compilerUrl) {
      this.addCompiler('default', await Compiler({ compilerUrl, forceCompatibility }), true)
    }
    COMPILER_METHODS.forEach(m => {
      this[m] = (...args) => {
        if (!this.isCompilerConnected()) throw new Error('Compiler is not connected')
        return this.selectedCompiler.instance[m](...args)
      }
    })
  },
  methods: {
    /**
     * Add Compiler
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype (name: String, nodeInstance: Object, select: Boolean) => Void
     * @param {String} name - Node name
     * @param {Object} nodeInstance - Node instance
     * @param {Boolean} select - Select this node as current
     * @return {Void}
     * @example
     * nodePool.addNode('testNode', awaitNode({ url, internalUrl }), true) // add and select new node with name 'testNode'
     */
    addCompiler (name, nodeInstance, select = false) {
      if (this.compilerPool.has(name)) throw new Error(`Node with name ${name} already exist`)

      this.validateCompilers([{ name, instance: nodeInstance }])

      this.compilerPool.set(name, prepareCompilerObject(name, nodeInstance))
      if (select || !this.selectedCompiler) {
        this.selectCompiler(name)
      }
    },
    /**
     * Select Node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype (name: String) => Void
     * @param {String} name - Node name
     * @return {Void}
     * @example
     * nodePool.selectNode('testNode')
     */
    selectCompiler (name) {
      if (!this.compilerPool.has(name)) throw new Error(`Node with name ${name} not in pool`)

      this.selectedCompiler = this.compilerPool.get(name)
    },
    /**
     * Check if you have selected node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype () => Boolean
     * @return {Boolean}
     * @example
     * nodePool.isNodeConnected()
     */
    isCompilerConnected () {
      return !!this.selectedCompiler.instance
    },
    /**
     * Get information about node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype () => Object
     * @return {Object}
     * @example
     * nodePool.getNodeInfo() // { name, version, networkId, protocol, ... }
     */
    getCompilerInfo () {
      if (!this.isCompilerConnected()) throw new Error('Can not get compiler info. Compiler is not connected')
      return {
        name: this.selectedCompiler.name,
        ...this.selectedCompiler.instance.getCompilerInfo()
      }
    },
    /**
     * Get array of available nodes
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype () => Object[]
     * @return {Object[]}
     * @example
     * nodePool.getNodesInPool()
     */
    getCompilersInPool () {
      return Array.from(this.compilerPool.entries()).map(([name, compiler]) => ({
        name,
        ...compiler.instance.getCompilerInfo()
      }))
    },
    validateCompilers (compilers) {
      // const nodeProps = ['Swagger', 'api', 'consensusProtocolVersion', 'genesisHash', 'methods']
      // nodes.forEach((node, index) => {
      //   if (typeof node !== 'object') throw new Error('Node must be an object with "name" and "instance" props')
      //   if (['name', 'instance'].find(k => !node[k])) throw new Error(`Node object on index ${index} must contain node "name" and "ins"`)
      //   if (!node.instance || typeof node.instance !== 'object' || nodeProps.find(prop => !(prop in node.instance))) {
      //     throw new Error('Invalid node instance object')
      //   }
      // })
    }
  },
  props: {
    selectedCompiler: {}
  }
})

export default CompilerPool
