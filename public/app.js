'use strict';

var learnjs = {};

learnjs.problems = [
  {
    description: "What is truth?",
    code: "function problem() { return __; }"
  },
  {
    description: "Simple Math",
    code: "function problem() { return 42 === 6 * __; }"
  },
  {
    description: "Start of an Array",
    code: "function problem() { list = [42, 23, 10]; return __ === 42; }"
  },
  {
    description: "Accessing Attributues",
    code: 'function problem() { p = {name: "Ken"}; return __ == "Ken"; }'
  },
  {
    description: "Increment Variable",
    code: 'function problem() { a = 41; return (++a == __);}'
  }
];

learnjs.applyObject = function(obj, elem) {
  for (var key in obj) {
    elem.find('[data-name="' + key + '"]').text(obj[key]);
  }
};

learnjs.problemView = function(data) {
  var number = parseInt(data, 10);
  var view = $('.templates .problem-view').clone();
  view.find('.title').text('Problem #' + number);
  learnjs.applyObject(learnjs.problems[number -1], view);
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
