// import { assert, expect } from 'chai';
import { describe, it } from 'mocha';
import { env } from '../../src/helpers/util';

describe('util.ts', () => {

  let assert: Chai.AssertStatic;
  let expect: Chai.ExpectStatic;
  before(async () => {
    assert = (await import('chai')).assert;
    expect = (await import('chai')).expect;
  });

  describe('env', () => {
    it('Should retrieve an environment variable', () => {
      process.env.IS_SET = 'value';
      expect(env('IS_SET')).to.equal('value');
    });

    it('Should theow an exception if the env var isn\'t set', () => {
      assert.throws(() => env('missing'));
    });
  });
});
