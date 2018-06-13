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
if ($_GET['q']) {
  $url = 'https://twitter.com/search?f=tweets&src=typd&vertical=default&q=' .
    urlencode(filter_var($_GET['q'], FILTER_SANITIZE_STRING));
} else {
  $url = 'https://twitter.com/' .
    filter_var($_GET['screenName'], FILTER_SANITIZE_STRING);
}

$opts = array(
  "http" => array(
    "method" => "GET",
    "header" => "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36\r\n" .
      "Accept: */*\r\n"
  )
);
$context = stream_context_create($opts);

error_log('Requesting content from ' . $url);
$content = file_get_contents($url, false, $context);
echo $content;

?>
