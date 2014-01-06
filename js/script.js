function PostCtrl($scope, $http, $sce) {
  var mfmt = 'YYYY-MM-DD h:mm:ss a';
  $scope.subreddit = '';
  var totalPosts = 0;
  var numRequests = 0;
  var seenUrls = [];
  $scope.posts = [];
  var interval;

  var get = function (url, isNew) {
    numRequests += 1;
    console.log('querying ' + url + ' at ' + moment().format(mfmt));
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
          } else {
            if (isNew) {
              $scope.posts.push(post);
            }
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

  $scope.checkClick = function () {
    console.log('check clicked!');
  };

  var readyPost = function (post) {
    // add a readable timestamp from the epoch
    post.timestamp = moment.unix(post.created_utc).format(mfmt);

    if (post.selftext_html) {
      // replace relative links with absolute links
      post.selftext_html = post.selftext_html.replace(/href="\//g, 'href="http://www.reddit.com/');
    }

    // unescape and clean raw html
    post.trustedHtml = $sce.trustAsHtml(_.unescape(post.selftext_html));

    post.title = _.unescape(post.title);

    return post;
  };

  $scope.sr_keypress = function (ev) {
    // console.log('keypress');
    if (ev.which === 13) {
      reset();
      startRequesting();
    }
  }

  var reset = function () {
    console.log('reseting');
    $scope.posts = [];
    totalPosts = 0;
    numRequests = 0;
    seenUrls = [];
  };

  var startRequesting = function () {
    if ($scope.subreddit) {
      get('http://www.reddit.com/r/' + $scope.subreddit + '/new.json', true);

      clearInterval(interval);

      // begin requesting /new every 30 seconds
      interval = setInterval(function () {
        get('http://www.reddit.com/r/' + $scope.subreddit + '/new.json', true);
      }, 30 * 1000);
    }
  };

  var suffix = function (n) {
    n = n % 10;
    return n > 3 ? 'th' : ['th', 'st', 'nd', 'rd'][n];
  };
}
