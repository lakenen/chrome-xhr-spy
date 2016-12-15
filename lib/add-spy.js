'use strict';

module.exports = function (namespace, spy) {
  window[namespace].push(spy);
};
