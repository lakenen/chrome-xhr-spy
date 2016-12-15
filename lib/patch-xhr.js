'use strict';

module.exports = function (namespace) {
  if (!window[namespace]) {
    window[namespace] = [];
    // only need to patch the XHR object once...
    initSpying();
  }

  function isStr(data) {
    return data + '' === data;
  }

  function parse(data) {
    if (data && isStr(data)) {
      try {
        data = JSON.parse(data);
      } catch (e) { /* not json */ }
    }
    return data;
  }
  function stringify(data) {
    if (!isStr(data)) {
      data = JSON.stringify(data);
    }
    return data;
  }

  function getSpies() {
    return window[namespace];
  }

  function fireEvent(data) {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent(namespace, true, true, data);
    document.dispatchEvent(event);
  }

  function runSpy(spy, data, info) {
    data = parse(data);

    if (spy.modify) {
      return new Promise(function (resolve) {
        // add a one-time event listener for the modified data
        document.addEventListener(namespace, function handler(event) {
          if (event.detail.modified && event.detail.spyId === spy.id) {
            var data = event.detail.data;
            resolve(stringify(data));
            document.removeEventListener(namespace, handler);
          }
        });

        fireEvent({
          modify: true,
          spyId: spy.id,
          data: data,
          info: info
        });
      });
    } else {
      fireEvent({
        spy: true,
        spyId: spy.id,
        data: data,
        info: info
      });
      return Promise.resolve(stringify(data));
    }
  }

  function runSpies(spies, data, info) {
    var p = Promise.resolve(data);
    spies.forEach(function (spy) {
      p = p.then(function (data) {
        return runSpy(spy, data, info);
      });
    });
    return p;
  }

  function filterSpies(xhr, info) {
    var url = new URL(info.url);
    return getSpies().filter(function (f) {
      var opt = f.filter;
      if (opt.method) {
        if (opt.method !== info.method) {
          return false;
        }
      }

      // filter requests by url pathname or query params
      if (opt.url) {
        if (opt.url.pathname && opt.url.pathname !== url.pathname) {
          return false;
        }

        if (opt.url.search) {
          var matchesSearch = Object.keys(opt.url.search).every(function (k) {
            return opt.url.search[k] === url.searchParams.get(k);
          });
          if (!matchesSearch) {
            return false;
          }
        }
      }

      if (opt.request && xhr.readyState >= 2) {
        return false;
      }

      if (opt.response && xhr.readyState < 4) {
        return false;
      }

      return true;
    });
  }

  function initSpying() {
    var XHR = window.XMLHttpRequest;

    window.XMLHttpRequest = function XMLHttpRequest() {
      var xhr = new XHR(),
        info = {};

      xhr.addEventListener = function (name, handler, b) {
        var _handler = function (ev) {
          var spies = filterSpies(xhr, info);
          if (name === 'load' && spies.length) {
            runSpies(spies, xhr.responseText, info)
            .then(function (data) {
              data = stringify(data);
              Object.defineProperty(xhr, 'responseText', {
                get: function () { return data; },
                configurable: true
              });

              handler.call(xhr, ev);
            });
          } else {
            handler.call(xhr, ev);
          }
        };
        XHR.prototype.addEventListener.call(xhr, name, _handler, b)
      };

      xhr.open = function (method, url, async) {
        info.method = method;
        info.url = (new URL(url, window.location.href)).href;
        info.async = async;
        return XHR.prototype.open.apply(xhr, arguments);
      };

      xhr.send = function (data) {
        if (!info.async) {
          return XHR.prototype.send.call(xhr, data);
        }
        var spies = filterSpies(xhr, info);
        runSpies(spies, data, info)
        .then(function (data) {
          if (xhr.readyState === 1) {
            XHR.prototype.send.call(xhr, data);
          }
        });
      };
      return xhr;
    };
    window.XMLHttpRequest.prototype = new XHR();
  }
};
