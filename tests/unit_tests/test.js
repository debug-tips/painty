var assert = require('assert');
var calculateFMP = require('../../calculateFMP');
var shortPayload = require('./short.json');
var longPayload = require('./long.json');
var payload3 = require('./payload3.json');

describe('painty', () => {
  it('should return the value of timeout if no records taken', () => {
    const fmp = calculateFMP({
      records: [],
      start: 0,
      timeout: 100,
    });
    assert.equal(fmp, 100);
  });

  it('should return 0 if no timeout nor records taken', () => {
    const fmp = calculateFMP({
      records: [],
      start: 0,
    });
    assert.equal(fmp, 0);
  });

  it('should calculate fmp correctly for short period of data', () => {
    const fmp = calculateFMP({
      records: shortPayload,
      start: 0,
      timeout: 20000,
    });
    assert.equal(fmp, 6873.500000001513);
  });

  it('should calculate fmp correctly for long period of data based on load time', () => {
    const fmp = calculateFMP({
      records: longPayload,
      start: 0,
      timeout: 40000,
      load: 6871.49,
    });
    assert.equal(fmp, 6949.100000005274);
  });

  it('should work on another payload set', () => {
    const fmp = calculateFMP({
      records: payload3,
      start: 0,
      timeout: 40000,
      load: 6871.49,
    });
    assert.equal(fmp, 6762.599999987287);
  });
});
