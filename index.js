'use strict';

var injectScript = require('./lib/inject-script.js'),
  patchXHR = require('./lib/patch-xhr.js'),
  addSpy = require('./lib/add-spy.js'),
  removeSpy = require('./lib/remove-spy.js');

var NAMESPACE = chrome.runtime.id + '-xhr-spy';


function initListener() {
  var spies = window[NAMESPACE];
  document.addEventListener(NAMESPACE, function (event) {
    if (event.detail.spyId) {
      var spy = spies.find(function (s) {
        return s.id == event.detail.spyId;
      });

      if (spy.modify && event.detail.modify) {
        // modifying data...
        spy.callback(event.detail.data, event.detail.info, function (data) {
          // send the data back
          var event = document.createEvent('CustomEvent');
          event.initCustomEvent(NAMESPACE, true, true, {
            modified: true,
            spyId: spy.id,
            data: data
          });
          document.dispatchEvent(event);
        });
      } else if (event.detail.spy) {
        // just reading data...
        spy.callback(event.detail.data, event.detail.info);
      }
    }
  });
}

// inject a new spy into the page
module.exports = function injectXHRSpy(spy) {
  if (typeof window[NAMESPACE] === 'undefined') {
    window[NAMESPACE] = [];
    initListener();
    injectScript(patchXHR, [NAMESPACE]);
  }
  var spies = window[NAMESPACE];

  spy.id = 'spy-' + spies.length;
  spies.push(spy);
  injectScript(addSpy, [NAMESPACE, spy]);

  return {
    remove: function () {
      injectScript(removeSpy, [NAMESPACE, spy]);
    }
  };
};
