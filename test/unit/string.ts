import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { snakeToPascal, pascalToSnake } from '../../src/utils/string';

describe('Strings', () => {
  describe('converts case', () => {
    it('from snake to pascal', () => {
      expect(snakeToPascal('foo_bar_baz')).to.equal('fooBarBaz');
      expect(snakeToPascal('foo_bar_')).to.equal('fooBar_');
      expect(snakeToPascal('_bar_baz')).to.equal('BarBaz');
    });

    it('from pascal to snake', () => {
      expect(pascalToSnake('fooBarBaz')).to.equal('foo_bar_baz');
      expect(pascalToSnake('fooBar')).to.equal('foo_bar');
      expect(pascalToSnake('BarBaz')).to.equal('_bar_baz');
    });
  });
});
