"use strict";

importScripts('./util.js');
var total = 0;

onmessage = function onmessage(e) {
  var lines = e.data.text.split('\n');
  var result = lines.reduce(function (acc, line) {
    if (line) {
      var pts = decodePolyline(line);
      return acc.concat(pts);
    }

    return acc;
  }, []);
  total += result.length;
  postMessage({
    action: 'add',
    data: result,
    meta: {
      count: total
    }
  });
};