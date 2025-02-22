import { describe, it } from 'mocha';
import { expect } from 'chai';
import { wrapWithProxy, unwrapProxy } from '../../src/utils/wrap-proxy';
import { ArgumentError } from '../../src';

describe('Utils', () => {
  describe('wrapWithProxy', () => {
    it('wraps value', () => {
      let t = { test: 'foo' };
      const wrapped = wrapWithProxy(() => t);
      expect(wrapped).to.not.be.equal(t);
      expect(wrapped.test).to.equal('foo');
      t.test = 'bar';
      expect(wrapped.test).to.equal('bar');
      t = { test: 'baz' };
      expect(wrapped.test).to.equal('baz');
    });

    it('throws error if value undefined', () => {
      const wrapped = wrapWithProxy<{ test: string } | undefined>(() => undefined);
      expect(() => wrapped.test).to.throw(
        ArgumentError,
        'wrapped value should be defined, got undefined instead',
      );
    });

    it('can call private method', () => {
      class Entity {
        readonly t = 5;

        #bar(): number {
          return this.t;
        }

        foo(): number {
          return this.#bar();
        }
      }

      const entity = new Entity();
      const wrapped = wrapWithProxy(() => entity);
      expect(wrapped.foo()).to.equal(5);
    });
  });

  describe('unwrapProxy', () => {
    const t = { test: 'foo' };

    it('unwraps proxy to value', () => {
      const wrapped = wrapWithProxy(() => t);
      expect(unwrapProxy(wrapped)).to.equal(t);
    });

    it('does nothing if not wrapped', () => {
      expect(unwrapProxy(t)).to.equal(t);
    });
  });
});
