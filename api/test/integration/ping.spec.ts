// import { expect } from 'chai';
import { describe, it } from 'mocha';
import { get } from './request';

describe('ping', () => {

  // let assert: Chai.AssertStatic;
  let expect: Chai.ExpectStatic;
  before(async () => {
    // assert = (await import('chai')).assert;
    expect = (await import('chai')).expect;
  });

  describe('/api/ping', () => {
    it('Should send a ping to the api', async () => {
      // Ping the API
      const response = await get('/api/ping');

      // Verify the response
      expect(response.status).to.equal(200);
      expect(response.data.message).to.equal('pong');
    });
  });
});
