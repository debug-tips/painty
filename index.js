/**
 * painty - A First Meaningful Paint metric collector based on MutationObserver with a setTimeout
 *          fallback
 * @author jasonslyvia
 */
var timing = require('timing2');

function now() {
  return performance && performance.now ? performance.now() : Date.now();
}

module.exports = function painty(timeout, callback) {
  if (typeof window !== 'object' || typeof timing !== 'object') {
    return null;
  }

  if (typeof timeout === 'function') {
    callback = timeout;
  }

  var start = timing.getEntriesByType('navigation')[0].startTime;
  var records = [];
  var stopLogging = logDOMChange();

  function done() {
    stopLogging();
    callback(calculateFMP());
  }

  if (typeof timeout === 'number') {
    setTimeout(done, timeout);
  } else {
    var ua = navigator.userAgent;
    var isMobileSafari = !!ua.match(/iPhone|iPad|iPod/i);
    var eventName = isMobileSafari ? 'pagehide' : 'beforeunload';

    window.addEventListener(eventName, done);
  }

  function logDOMChange() {
    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function() {
        records.push({
          t: now(),
          domCnt: document.getElementsByTagName('*').length,
        });
      });
      observer.observe(document, {
        childList: true,
        subtree: true,
      });

      return observer.disconnect.bind(observer);
    }

    var timer = setTimeout(function() {
      records.push({
        t: now(),
        domCnt: document.getElementsByTagName('*').length,
      });
      logDOMChange();
    }, 200);

    return function(){
      clearTimeout(timer);
    };
  }

  function calculateFMP() {
    if (records.length === 0) {
      return typeof timeout === 'number' ? timeout : 0;
    }

    var slopes = records.map(function(item, idx) {
      if (idx === 0) {
        return 0;
      }
      var prev = records[idx - 1];
      if (item.domCnt === prev.domCnt) {
        return 0;
      }

      return (item.t - prev.t) / (item.domCnt - prev.domCnt);
    });

    var maxSlope = Math.max.apply(null, slopes);
    var maxSlopeIndex = slopes.indexOf(maxSlope);
    return records[maxSlopeIndex].t - start;
  }
}
