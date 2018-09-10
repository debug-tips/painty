/**
 * painty - A First Meaningful Paint metric collector based on MutationObserver with a setTimeout
 *          fallback
 * @author jasonslyvia
 */
const timing = require('timing2');

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

  const start = timing.getEntriesByType('navigation')[0].startTime;
  const records = [];
  const stopLogging = logDOMChange();

  function done() {
    stopLogging();
    callback(calculateFMP());
  }

  if (typeof timeout === 'number') {
    setTimeout(done, timeout);
  } else {
    const ua = navigator.userAgent;
    const isMobileSafari = !!ua.match(/iPhone|iPad|iPod/i);
    const eventName = isMobileSafari ? 'pagehide' : 'beforeunload';

    window.addEventListener(eventName, done);
  }

  function logDOMChange() {
    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(function() {
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

    const timer = setTimeout(function() {
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

    const slopes = records.map(function(item, idx) {
      if (idx === 0) {
        return 0;
      }
      const prev = records[idx - 1];
      if (item.domCnt === prev.domCnt) {
        return 0;
      }

      return (item.t - prev.t) / (item.domCnt - prev.domCnt);
    });

    const maxSlope = Math.max(...slopes);
    const maxSlopeIndex = slopes.indexOf(maxSlope);
    return records[maxSlopeIndex].t - start;
  }
}
