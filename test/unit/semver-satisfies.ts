import { expect } from 'chai';
import { describe, it } from 'mocha';
import semverSatisfies from '../../src/utils/semver-satisfies';

describe('semverSatisfies', () => {
  it('returns a proper value', () => {
    expect(semverSatisfies('1.0.0', '1.0.0', '1.0.1')).to.equal(true);
    expect(semverSatisfies('1.0.0', '1.0.1', '1.0.2')).to.equal(false);
    expect(semverSatisfies('2.4.0', '1.4.0', '3.0.0')).to.equal(true);
    expect(semverSatisfies('2.4.0', '2.5.0', '3.0.0')).to.equal(false);
    expect(semverSatisfies('1.9.0', '2.0.0', '3.0.0')).to.equal(false);
    expect(semverSatisfies('1.9.0', '2.0.0', '3.0.0')).to.equal(false);
    expect(semverSatisfies('5.0.0', '3.0.0', '5.0.0')).to.equal(false);
    expect(semverSatisfies('6.0.0-rc4', '6.0.0', '7.0.0')).to.equal(true);
    expect(semverSatisfies('6.3.0+2.0f7ce80e', '6.0.0', '7.0.0')).to.equal(true);
    expect(semverSatisfies('7.0.0', '6.13.0')).to.equal(true);
  });
});
