'use strict';

var learnjs = {};

learnjs.problemView = function(number) {
  var title = 'Problem #' + number + ' Coming soon!';
  return $('<div class="problem-view">').text(title);
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

learnjs.appOnReady = function() {
  learnjs.showView(window.location.hash);
}
