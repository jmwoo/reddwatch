function PostCtrl($scope, $http, $sce) {
  var mfmt = 'YYYY-MM-DD h:mm:ss a';
  $scope.subreddit = '';
  var totalPosts = 0;
  var seenUrls = [];
  $scope.posts = [];
  var interval;
  var timeout;

  var get = function () {
    console.log('querying...' + $scope.subreddit);
    $http.get('http://www.reddit.com/r/' + $scope.subreddit + '/new.json')
      .success(function (data) {
        data.data.children.forEach(function (child) {
          var post = child.data;
          if (!_.contains(seenUrls, post.url)) {
            console.log('found new post at ' + moment().format(mfmt));
            totalPosts += 1;
            post = readyPost(post);
            $scope.posts.push(post);
            seenUrls.push(post.url);
          } else {
            var postIndex = _.findIndex($scope.posts, {'url': post.url});
            if (postIndex >= 0) {
              post = readyPost(post);
              $scope.posts[postIndex] = post;
            }
          }
        });
      })
      .error(function (data) {
        console.log('error getting json');
      });
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

    return post;
  };

  $scope.srtext_change = function () {
    console.log('new subreddit is ' + $scope.subreddit);
    $scope.posts = [];
    startRequesting();
  };

  var startRequesting = function () {
    if ($scope.subreddit) {
      clearTimeout(timeout);
      timeout = setTimeout(get, 3 * 1000);
      clearInterval(interval);
      interval = setInterval(get, 30 * 1000);
    }
  };

  startRequesting();
}
