'use strict';

module.exports = function (fn, args) {
  var argStr = JSON.stringify(args || []);

  function init(fn, a) {
    var args = JSON.parse(a);
    fn.apply(null, args);
  }

  var src = '('
    + init
    + ')('
    + fn + ','
    + '\'' + argStr + '\');';

  var script = document.createElement('script');
  script.textContent = src;
  (document.head||document.documentElement).appendChild(script);
  script.remove();
};
