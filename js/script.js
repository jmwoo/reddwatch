function PostCtrl($scope, $http, $sce) {
  $scope.subreddit = '';
  var totalPosts = 0;
  var numRequests = 0;
  $scope.seenUrls = [];
  $scope.posts = [];
  var interval;
  $scope.queryOptions = [{
    "name": "hot"
  }, {
    "name": "new"
  }];
  $scope.queryOption = $scope.queryOptions[0];

  var get = function (url, isNew) {
    numRequests += 1;
    console.log('querying ' + url + ' at ' + moment().format('YYYY-MM-DD h:mm:ss a'));
    $http.get(url)
      .success(function (data) {
        data.data.children.forEach(function (child) {
          var post = child.data;
          post = readyPost(post);
          var postIndex = _.findIndex($scope.posts, {
            'url': post.url
          });
          if (postIndex >= 0) {
            $scope.posts[postIndex] = post;
          } else if (isNew && !_.contains($scope.seenUrls, post.url)) {
            $scope.posts.push(post);
            $scope.seenUrls.push(post.url);
          }
        });
      })
      .error(function (data) {
        console.log('error getting json');
      });

    // if (isNew) {
    //   // request /rising 10 seconds from now
    //   setTimeout(function () {
    //     get('http://www.reddit.com/r/' + $scope.subreddit + '/rising.json', false)
    //   }, 10 * 1000);

    //   // request /hot 20 seconds from now
    //   setTimeout(function () {
    //     get('http://www.reddit.com/r/' + $scope.subreddit + '.json', false)
    //   }, 20 * 1000);
    // }
  };

  $scope.checkClick = function (ev, post_url) {
    $scope.posts = _.filter($scope.posts, function (post) {
      return post.url !== post_url;
    });
  };

  var readyPost = function (post) {
    // add a date and time from the epoch
    var amoment = moment.unix(post.created_utc);
    post.date = amoment.format('YYYY-MM-DD');
    post.time = amoment.format('h:mm:ss a');

    if (post.selftext_html) {
      // replace relative links with absolute links
      post.selftext_html = post.selftext_html.replace(/href="\//g, 'href="http://www.reddit.com/');
    }

    // unescape and clean raw html
    post.trustedHtml = $sce.trustAsHtml(_.unescape(post.selftext_html));

    post.title = _.unescape(post.title);

    if (post.author_flair_text) {
      post.author_flair_text = '(' + post.author_flair_text + ')';
    }

    return post;
  };

  $scope.sr_keypress = function (ev) {
    // console.log('keypress');
    if (ev.which === 13) {
      reset();
      startRequesting();
    }
  };

  var reset = function () {
    console.log('reseting');
    $scope.posts = [];
    totalPosts = 0;
    numRequests = 0;
    $scope.seenUrls = [];
  };

  var startRequesting = function () {
    if ($scope.subreddit) {
      var url = 'http://www.reddit.com/r/' + $scope.subreddit + '/' + $scope.queryOption.name + '.json';
      get(url, true);
      clearInterval(interval);

      // begin requesting every 30 seconds
      interval = setInterval(function () {
        get(url, true);
      }, 60 * 1000);
    }
  };

  var suffix = function (n) {
    n = n % 10;
    return n > 3 ? 'th' : ['th', 'st', 'nd', 'rd'][n];
  };
}
