/* eslint-disable @typescript-eslint/no-unused-expressions */
// import { expect } from 'chai';
import { describe, it } from 'mocha';

// chai.use(require('chai-as-promised'));

describe('Placeholder test', () => {

  // let assert: Chai.AssertStatic;
  let expect: Chai.ExpectStatic;
  before(async () => {
    // assert = (await import('chai')).assert;
    expect = (await import('chai')).expect;
  });
  it('Given a condition, when we take an action, we should get a result', () => {
    expect(true).to.be.true;
  });
});
