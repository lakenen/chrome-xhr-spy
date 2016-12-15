'use strict';

module.exports = function (namespace, spy) {
  var ind = window[namespace].findIndex(function (s) {
    return s.id === spy.id;
  });
  if (ind > -1) {
    window[namespace].splice(ind, 1);
  }
};
