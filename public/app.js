'use strict';

var learnjs = {};

learnjs.problemView = function() {
  return $('<div class="problem-view">').text('Coming soon!');
}

learnjs.showView = function(hash) {

  var routes = {
    '#problem': learnjs.problemView
  };

  var parts  = hash.split('-');

  var viewFn = routes[parts[0]];

  if (viewFn) {
    $('.view-container').empty().append(viewFn(parts[1]));
  }

}
