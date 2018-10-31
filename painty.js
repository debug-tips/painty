(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.painty = factory());
}(this, (function () { 'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var lib = createCommonjsModule(function (module) {
	/**
	 * timing2 - A PerformanceTimeline polyfill for legacy browsers.
	 * @author jasonslyvia
	 */

	(function (root, factory) {
	  if (module.exports) {
	    module.exports = factory();
	  } else {
	    root.timing2 = factory();
	  }
	}(typeof self !== 'undefined' ? self : commonjsGlobal, function () {
	  if (typeof window !== 'object') {
	    return;
	  }

	  var win = window;
	  var timing2;
	  var NAVIGATION_TYPE = {
	    0: 'navigate',
	    1: 'reload',
	    2: 'back_forward',
	  };

	  var KEYS = [
	    'unloadEventStart',
	    'unloadEventEnd',
	    'redirectStart',
	    'redirectEnd',
	    'fetchStart',
	    'domainLookupStart',
	    'domainLookupEnd',
	    'connectStart',
	    'connectEnd',
	    'secureConnectionStart',
	    'requestStart',
	    'responseStart',
	    'responseEnd',
	    'domLoading',
	    'domInteractive',
	    'domContentLoadedEventStart',
	    'domContentLoadedEventEnd',
	    'domComplete',
	    'loadEventStart'
	  ];

	  if (!win || !win.performance || typeof win.performance !== 'object') {
	    return timing2;
	  }

	  if (typeof win.performance.getEntries === 'function' && win.performance.timeOrigin) {
	    return win.performance;
	  }

	  var getEntry = function() {
	    var entry = win.performance.timing;
	    var timeOrigin = entry.navigationStart || entry.redirectStart || entry.fetchStart;
	    var finalEntry = {
	      entryType: 'navigation',
	      initiatorType: 'navigation',
	      name: win.location.href,
	      startTime: 0,
	      duration: entry.loadEventEnd ? entry.loadEventEnd - timeOrigin : 0,
	      redirectCount: win.performance.navigation.redirectCount,
	      type: NAVIGATION_TYPE[win.performance.navigation.type],
	    };

	    for (var i = 0; i < KEYS.length; i++) {
	      var key = KEYS[i];
	      var value = entry[key];
	      finalEntry[key] = !value ? 0 : value - timeOrigin;
	    }

	    return finalEntry;
	  };

	  timing2 = {
	    _entry: getEntry(),
	    timeOrigin: win.performance.timing.navigationStart,
	    getEntries: function() {
	      return [this._entry];
	    },
	    getEntriesByType: function(type) {
	      if (type !== 'navigation') {
	        return [];
	      }
	      return [this._entry];
	    },
	    getEntriesByName: function(name) {
	      if (name !== win.location.href) {
	        return [];
	      }
	      return [this._entry];
	    },
	    now: function() {
	      return Date.now() - win.performance.timing.navigationStart;
	    },
	  };

	  return timing2;
	}));
	});

	function getWeight(num) {
	  return Math.pow(0.5, num);
	}

	var calculateFMP = function calculateFMP(option) {
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

	/**
	 * painty - A First Meaningful Paint metric collector based on MutationObserver with a setTimeout
	 *          fallback
	 * @author jasonslyvia
	 */



	/* global __PAINTY_STACK_LIMIT__ */

	// record at most 100 DOM changes
	var STACK_LIMIT = typeof __PAINTY_STACK_LIMIT__ === 'number' ? __PAINTY_STACK_LIMIT__ : 100;

	function now() {
	  return performance && performance.now ? performance.now() : Date.now();
	}

	var painty = function painty(timeout, callback) {
	  if (typeof window !== 'object' || typeof lib !== 'object') {
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

	    var navTimings = lib.getEntriesByType('navigation');
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

	return painty;

})));
