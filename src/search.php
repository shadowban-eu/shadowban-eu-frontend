<?php

/*
** Simple Twitter Shadowban Checker - php proxy
** 2016 @xho
** 2018 @raphaelbeerlin (V2 modifications)
*/

// bail if neither query nor screenName are supplied
if (empty($_GET['q']) && empty($_GET['screenName'])) {
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
} else {
  $url = 'https://twitter.com/' .
    urlencode(filter_var($_GET['screenName'], FILTER_SANITIZE_STRING));
}

$uas = array(
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.37",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.38",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.39",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.40"
);
$uai = 0;
if(isset($_GET['ua'])) {
  $uai = (int)$_GET['ua'];
}
$uai = $uai % count($uas);
$ua = $uas[$uai];

$opts = array(
  "http" => array(
    "method" => "GET",
    "header" => "User-Agent: " . $ua . "\r\n" .
      "Accept: */*\r\n"
  )
);
$context = stream_context_create($opts);

error_log('Requesting content from ' . $url);
$content = file_get_contents($url, false, $context);
if($content === false && isset($_GET['q'])) {
  header('HTTP/1.1 500 Internal Server Booboo');
  die();
}
if(isset($_GET['q'])) {
  // relay response code
  header($http_response_header[0]);
}
echo $content;
