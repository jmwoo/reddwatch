function PostCtrl($scope, $http) {
  var mfmt = 'YYYY-MM-DD h:mm:ss a';
  var subr = 'programming';
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
            console.log(post);
            totalPosts += 1;
            post.timestamp = moment.unix(post.created_utc).format(mfmt);
            post.postNum = totalPosts;
            $scope.posts.push(post);
            seenUrls.push(post.url);
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

  get();
  setInterval(get, 30 * 1000);
}