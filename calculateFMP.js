function getWeight(num) {
  return 1 - Math.pow(Math.E, num) / (Math.pow(Math.E, num) + 100);
}

module.exports = function calculateFMP(option) {
  var records = option.records;
  var start = option.start;
  var timeout = option.timeout;
  var load = option.load;

  if (records.length === 0) {
    return typeof timeout === 'number' ? timeout : 0;
  }

  // add weight to each data point
  if (typeof load === 'number') {
    records.forEach(function(item) {
      var t = item.t;
      var abst = Math.abs(parseFloat(t) - load);
      item.weight = getWeight(abst / 1000);
    });
  }

  var slopes = records.map(function(item, idx) {
    if (idx === 0) {
      return 0;
    }
    var prev = records[idx - 1];
    if (item.domCnt === prev.domCnt) {
      return 0;
    }

    return (item.domCnt - prev.domCnt) / (item.t - prev.t) * (typeof item.weight === 'number' ? item.weight : 1);
  });

  var maxSlope = Math.max.apply(null, slopes);
  var maxSlopeIndex = slopes.indexOf(maxSlope);
  return records[maxSlopeIndex].t - start;
};
