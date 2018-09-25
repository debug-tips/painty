/**
 * painty - A First Meaningful Paint metric collector based on MutationObserver with a setTimeout
 *          fallback
 * @author jasonslyvia
 */
var timing = require('timing2');
var calculateFMP = require('./calculateFMP');

function now() {
  return performance && performance.now ? performance.now() : Date.now();
}

module.exports = function painty(timeout, callback) {
  if (typeof window !== 'object' || typeof timing !== 'object') {
    return;
  }

  if (typeof timeout === 'function') {
    callback = timeout;
  }

  var start = timing.getEntriesByType('navigation')[0].startTime;
  var records = [];

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

    return function() {
      clearTimeout(timer);
    };
  }

  var stopLogging = logDOMChange();
  function done() {
    stopLogging();
    callback(calculateFMP({
      records: records,
      start: start,
      timeout: timeout,
    }));
  }

  if (typeof timeout === 'number') {
    setTimeout(done, timeout);
  } else {
    var ua = navigator.userAgent;
    var isMobileSafari = !!ua.match(/iPhone|iPad|iPod/i);
    var eventName = isMobileSafari ? 'pagehide' : 'beforeunload';

    window.addEventListener(eventName, done);
  }
};
