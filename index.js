/**
 * painty - A First Meaningful Paint metric collector based on MutationObserver with a setTimeout
 *          fallback
 * @author jasonslyvia
 */
var timing = require('timing2');
var calculateFMP = require('./calculateFMP');

/* global __PAINTY_STACK_LIMIT__ */

// record at most 100 DOM changes
var STACK_LIMIT = typeof __PAINTY_STACK_LIMIT__ === 'number' ? __PAINTY_STACK_LIMIT__ : 100;

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

  var records = [];

  function logDOMChange() {
    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function() {
        records.push({
          t: now(),
          domCnt: document.getElementsByTagName('*').length,
        });

        if (records.length === STACK_LIMIT) {
          done();
        }
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

      if (records.length === STACK_LIMIT) {
        done();
      } else {
        logDOMChange();
      }
    }, 200);

    return function() {
      clearTimeout(timer);
    };
  }

  var stopLogging = logDOMChange();
  function done() {
    stopLogging();

    var navTimings = timing.getEntriesByType('navigation');
    if (!navTimings || !navTimings.length) {
      return;
    }

    var navTiming = navTimings[0];
    var start = navTiming.startTime;

    callback(calculateFMP({
      records: records,
      start: start,
      timeout: timeout,
      load: navTiming.duration,
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
