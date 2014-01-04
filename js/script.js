function PostCtrl($scope, $http, $sce) {
  var mfmt = 'YYYY-MM-DD h:mm:ss a';
  var subr = 'javascript';
  var totalPosts = 0;
  var seenUrls = [];
  $scope.posts = [];

  var get = function () {
    console.log('querying...');
    $http.get('http://www.reddit.com/r/' + subr + '/new.json')
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

  $scope.remaining = function () {
    return $scope.posts.length;
  };

  $scope.checkClick = function () {
    console.log(this);
  };

  var readyPost = function (post) {
    // add a readable timestamp from the epoch
    post.timestamp = moment.unix(post.created_utc).format(mfmt);

    // unescape and clean raw html
    if (post.selftext_html) {
      post.selftext_html = post.selftext_html.replace(/href="\//g, 'href="http://www.reddit.com/');
    }
    post.trustedHtml = $sce.trustAsHtml(_.unescape(post.selftext_html));

    return post;
  };

  get();
  setInterval(get, 30 * 1000);
}
