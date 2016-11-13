'use strict';

var learnjs = {
  poolId: 'us-east-1:1b21c3b3-3c9d-49f0-97f5-5a74d4ad14f0'
};

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
    code: "function problem() { var list = [42, 23, 10]; return __ === 42; }"
  },
  {
    description: "Accessing Attributues",
    code: 'function problem() { var p = {name: "Ken"}; return __ == "Ken"; }'
  },
  {
    description: "Increment Variable",
    code: 'function problem() { var a = 41; return (++a == __);}'
  }
];

learnjs.flashElement = function(elem, content) {
  elem.fadeOut('fast', function() {
    elem.html(content);
    elem.fadeIn();
  });
}

learnjs.applyObject = function(obj, elem) {
  for (var key in obj) {
    elem.find('[data-name="' + key + '"]').text(obj[key]);
  }
};

learnjs.template = function(name) {
  return $('.templates .' + name).clone();
}

learnjs.triggerEvent = function(name, args) {
  $('.view-container>*').trigger(name, args);
}

learnjs.buildCorrectFlash = function(number) {
  var correctFlash = learnjs.template('correct-flash');
  var link = correctFlash.find('a');
  if (number < learnjs.problems.length) {
    link.attr('href', '#problem-' + (number + 1));
  } else {
    link.attr('href', '');
    link.text("You're Finished!");
  }
  return correctFlash;
}

learnjs.landingView = function() {
  return learnjs.template('landing-view');
}

learnjs.problemView = function(data) {
  var number = parseInt(data, 10);
  var view = learnjs.template('problem-view');
  var problem = learnjs.problems[number - 1];
  var result = view.find('.result');
  var answer = view.find('.answer');

  function checkAnswer() {
    var test = problem.code.replace('__', answer.val()) + '; problem();';
    return eval(test);
  }

  function handleSubmit() {
    if (checkAnswer()) {
      var correctFlash = learnjs.buildCorrectFlash(number);
      learnjs.flashElement(result, correctFlash);
      learnjs.saveAnswer(number, answer.val());
    } else {
      learnjs.flashElement(result, 'Incorrect!');
    }
  }

  if (number < learnjs.problems.length) {
    var buttonItem = learnjs.template('skip-btn');
    buttonItem.find('a').attr('href', '#problem-' + (number + 1));
    $('.nav-list').append(buttonItem);
    view.bind('removingView', function() {
      buttonItem.remove();
    });
  }

  learnjs.fetchAnswer(number).then(function(data) {
    if (data.Item) {
      answer.val(data.Item.answer);
    }
  });

  view.find('.check-btn').click(handleSubmit);
  view.find('.title').text('Problem #' + number);
  learnjs.applyObject(problem, view);

  return view;
}

learnjs.profileView = function() {
  var view = learnjs.template('profile-view');
  learnjs.identity.done(function(identity) {
    view.find('.email').text(identity.email);
  });
  return view;
}

learnjs.showView = function(hash) {

  var routes = {
    '#problem': learnjs.problemView,
    '#profile': learnjs.profileView,
    '#': learnjs.landingView,
    '': learnjs.landingView
  };

  var parts  = hash.split('-');

  var viewFn = routes[parts[0]];

  if (viewFn) {
    learnjs.triggerEvent('removingView', []);
    $('.view-container').empty().append(viewFn(parts[1]));
  }

}

learnjs.appOnReady = function() {
  window.onhashchange = function() {
    learnjs.showView(window.location.hash);
  };
  learnjs.showView(window.location.hash);
  learnjs.identity.done(learnjs.addProfileLink);
}

learnjs.addProfileLink = function(profile) {
  var link = learnjs.template('profile-link');
  link.find('a').text(profile.email);
  $('.signin-bar').prepend(link);
}

learnjs.identity = new $.Deferred();

learnjs.awsRefresh = function() {
  var deferred = new $.Deferred();
  AWS.config.credentials.refresh(function(err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(AWS.config.credentials.identityId);
    }
  });
  return deferred.promise();
}

function googleSignIn(googleUser) {

  var id_token = googleUser.getAuthResponse().id_token;

  AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: learnjs.poolId,
      Logins: {
        'accounts.google.com': id_token }
      })
  });

  function refresh() {
    return gapi.auth2.getAuthInstance().signIn({
      prompt: 'login'
    }).then(function(userUpdate) {
      var creds = AWS.config.credentials;
      var newToken = userUpdate.getAuthResponse().id_token;
      creds.params.Logins['accounts.google.com'] = newToken;
      return learnjs.awsRefresh();
    });
  }

  learnjs.awsRefresh().then(function(id) {
    learnjs.identity.resolve({
      id: id,
      email: googleUser.getBasicProfile().getEmail(),
      refresh: refresh
    });
  });

}

learnjs.sendDbRequest = function(req, retry) {
  var promise = new $.Deferred();
  req.on('error', function(error) {
    if (error.code === "CredentialsError") {
      learnjs.identity.then(function(identity) {
        return identity.refresh().then(
          function() {
            return retry();
          },
          function() {
            promise.reject(resp);
          });
      });
    } else {
      promise.reject(error);
    }
  });
  req.on('success', function(resp) {
    promise.resolve(resp.data);
  });
  req.send();
  return promise;
}

learnjs.saveAnswer = function(problemId, answer) {
  return learnjs.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'learnjs',
      Item: {
        userId: identity.id,
        problemId: problemId,
        answer: answer
      }
    };
    return learnjs.sendDbRequest(db.put(item), function() {
      return learnjs.saveAnswer(problemId, answer);
    })
  });
};

learnjs.fetchAnswer = function(problemId) {
  return learnjs.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'learnjs',
      Key: {
        userId: identity.id,
        problemId: problemId
      }
    };
    return learnjs.sendDbRequest(db.get(item), function() {
      return learnjs.fetchAnswer(problemId);
    })
  });
}
