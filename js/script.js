function PostCtrl($scope, $http, $sce) {
    var mfmt = 'YYYY-MM-DD h:mm:ss a';
    $scope.subreddit = '';
    var totalPosts = 0;
    var numRequests = 0;
    var seenUrls = [];
    $scope.posts = [];
    var interval;

    var get = function() {
        numRequests += 1;
        var url = 'http://www.reddit.com/r/' + $scope.subreddit + '/new.json';
        console.log('querying ' + url + ' for the ' + numRequests.toString() + suffix(numRequests).toString() + ' time');
        $http.get(url)
            .success(function(data) {
                data.data.children.forEach(function(child) {
                    var post = child.data;
                    if (!_.contains(seenUrls, post.url)) {
                        console.log('found new post at ' + moment().format(mfmt));
                        totalPosts += 1;
                        post = readyPost(post);
                        $scope.posts.push(post);
                        seenUrls.push(post.url);
                    } else {
                        var postIndex = _.findIndex($scope.posts, {
                            'url': post.url
                        });
                        if (postIndex >= 0) {
                            post = readyPost(post);
                            $scope.posts[postIndex] = post;
                        }
                    }
                });
            })
            .error(function(data) {
                console.log('error getting json');
            });
    };

    $scope.checkClick = function() {
        console.log('check clicked!');
    };

    var readyPost = function(post) {
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

    $scope.sr_keypress = function(ev) {
        console.log('keypress');
        if (ev.which === 13) {
            $scope.posts = [];
            startRequesting();
        }
    }

    var startRequesting = function() {
        if ($scope.subreddit) {
            get();
            clearInterval(interval);
            interval = setInterval(get, 30 * 1000);
        }
    };

    var suffix = function(n) {
        n = n % 10;
        return n > 3 ? 'th' : ['th', 'st', 'nd', 'rd'][n];
    };

    startRequesting();
}
