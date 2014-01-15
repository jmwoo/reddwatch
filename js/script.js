function PostCtrl($scope, $http, $sce) {
  $scope.subreddit = '';
  var totalPosts = 0;
  var numRequests = 0;
  var validImgExts = ['jpg', 'jpeg', 'jpg?1', 'png', 'gif'];
  $scope.seenUrls = [];
  $scope.posts = [];
  $scope.isLoading = false;
  var queryIntervalSecs = 60;
  var interval;
  $scope.queryOptions = [
     {'name': 'hot'}
    ,{'name': 'new'}
    ,{'name': 'top'}
  ];
  $scope.queryOption = $scope.queryOptions[0];
  $scope.sortOptions = [
     {'name': 'time', 'value': 'created_utc'}
    ,{'name': 'score', 'value': 'score'}
    ,{'name': 'comments', 'value': 'num_comments'}
  ];
  $scope.sortOption = $scope.sortOptions[0];

  var get = function (url, isNew) {
    $scope.isLoading = true;
    numRequests += 1;
    console.log('querying ' + url + ' at ' + moment().format('YYYY-MM-DD h:mm:ss a'));
    $http.get(url)
      .success(function (data) {
        $scope.isLoading = false;
        data.data.children.forEach(function (child) {
          var post = child.data;
          var postIndex = _.findIndex($scope.posts, {
            'url': post.url
          });
          post = readyPost(post, postIndex);
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
        $scope.isLoading = false;
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

  $scope.closeClick = function (ev, post_url) {
    $scope.posts = _.filter($scope.posts, function (post) {
      return post.url !== post_url;
    });
  };

  $scope.toggleTxt = function(ev, post) {
    post.isTxtToggled = !post.isTxtToggled;
  };

  $scope.toggleImg = function (ev, post) {
    post.isImgToggled = !post.isImgToggled;
  };

  var readyPost = function (post, postIndex) {
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

    post.isImg = isImg(post);

    if (postIndex >= 0) {
      post.isImgToggled = $scope.posts[postIndex].isImgToggled;
      post.isTxtToggled = $scope.posts[postIndex].isTxtToggled;
    } else {
      post.isTxtToggled = false;
      post.isImgToggled = false;
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

  var isImg = function (post) {
    var urlsplit = post.url.split('.');
    var urlext = urlsplit[urlsplit.length - 1].toLowerCase();
    return _.any(validImgExts, function (ext) {
      return ext === urlext;
    });
  }

  var reset = function () {
    console.log('resetting');
    $scope.posts = [];
    totalPosts = 0;
    numRequests = 0;
    $scope.seenUrls = [];
  };

  var startRequesting = function () {
    if ($scope.subreddit) {
      var url = 'http://www.reddit.com/r/' + $scope.subreddit + '/' + $scope.queryOption.name + '.json';
      if ($scope.queryOption.name === 'top') {
        url += '?sort=top&t=day'; // if top, do only top for 'today'
      }
      get(url, true);
      clearInterval(interval);

      interval = setInterval(function () {
        get(url, true);
      }, queryIntervalSecs * 1000);
    }
  };
}
