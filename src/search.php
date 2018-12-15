<?php

/*
** Simple Twitter Shadowban Checker - php proxy
** 2016 @xho
** 2018 @raphaelbeerlin (V2 modifications)
*/

define('SESSION_HEADER_FILE', '.htsession');

// bail if neither query nor screenName are supplied
if (empty($_GET['q']) && empty($_GET['screenName']) && empty($_GET['timeline']) && empty($_GET['status']) && empty($_GET['suggest'])) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('error' => 'Missing query or username')));
}

// search results, if query is supplied
// user's page, otherwise
if (isset($_GET['q'])) {
  $url = 'https://twitter.com/search?f=tweets&src=typd&vertical=default&lang=en&q=' .
    urlencode(filter_var($_GET['q'], FILTER_SANITIZE_STRING)) .
    (isset($_GET['noqf']) ? '&qf=off' : '');
} else if(isset($_GET['screenName'])) {
  $url = 'https://twitter.com/' .
    urlencode(filter_var($_GET['screenName'], FILTER_SANITIZE_STRING)) . '?lang=en';
} else if(isset($_GET['status'])) {
  $url = 'https://twitter.com/anyone/status/' .
    urlencode(filter_var($_GET['status'], FILTER_SANITIZE_NUMBER_INT)) . '?lang=en';
} else if(isset($_GET['suggest'])) {
  $url = 'https://twitter.com/i/search/typeahead.json?count=10&filters=false&q=%40' .
    urlencode(filter_var($_GET['suggest'], FILTER_SANITIZE_STRING)) . '&result_type=users&src=SEARCH_BOX';
} else {
  $tweetEp = isset($_GET['replies']) ? 'with_replies' : 'tweets';
  $url = 'https://twitter.com/i/profiles/show/'.
    urlencode(filter_var($_GET['timeline'], FILTER_SANITIZE_STRING)) .
	'/timeline/' . $tweetEp . '?include_available_features=1&include_entities=1&lang=en'
    . (isset($_GET['pos']) ? '&max_position=' .
    urlencode(filter_var($_GET['pos'], FILTER_SANITIZE_NUMBER_INT)) : '');
}

// Twitter likely uses a client fingerprint with its user agent for load balancing
// Thus, we need a variety of user agent strings that hopefully hash to unique values
$uas = array(
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
  "Some Agent",
  "Another Additional Agent"
);
$uai = 0;
if(isset($_GET['ua'])) {
  $uai = (int)$_GET['ua'];
}
$uai = $uai % count($uas);
$ua = $uas[$uai];

$session_headers = isset($_GET['login']) || isset($_GET['replies']) ?
  @file_get_contents(SESSION_HEADER_FILE) : '';

if($session_headers !== false && $session_headers != '') {
  $session_headers = "Cookie: " . $session_headers . "\r\nReferer: https://twitter.com/search\r\n";
}

$opts = array(
  "http" => array(
    "method" => "GET",
    "header" => "User-Agent: " . $ua . "\r\n" .
      "Accept: */*\r\n" .
      ($session_headers ? $session_headers : '')
  )
);

if(isset($_GET['screenName'])) {
  $opts['http']['ignore_errors'] = true;
}

error_log('Requesting content from ' . $url);
for($i = 0; $i < 5; $i++) {
  $context = stream_context_create($opts);
  $content = @file_get_contents($url, false, $context);
  // If there is an error, try again.
  // Also try again if we receive the Twitter Lite page for some reason.
  // This happens nondeterministically.
  if($content !== false && strpos($content,
    '<meta name="apple-mobile-web-app-title" content="Twitter Lite" />') === false) {
    break;
  }
}
if($content === false && isset($_GET['q'])) {
  header('HTTP/1.1 500 Internal Server Booboo');
  die();
}
if(isset($_GET['q'])) {
  // relay response code
  header($http_response_header[0]);
}
echo $content;
