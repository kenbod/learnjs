'use strict';

var learnjs = {};

learnjs.problemView = function(number) {
  var view = $('.templates .problem-view').clone();
  view.find('.title').text('Problem #' + number);
  return view;
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
  window.onhashchange = function() {
    learnjs.showView(window.location.hash);
  };
  learnjs.showView(window.location.hash);
}
