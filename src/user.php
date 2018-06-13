<?php

if (empty($_GET['screenName'])) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('error' => 'Missing user name')));
}

// defaults ?qf to 'on', which is the
// current (2018-05-20) behaviour of the twitter website
$params = array(
  'screenName' => filter_var($_GET['screenName'], FILTER_SANITIZE_STRING)
);

$url = 'https://twitter.com/' . urlencode($params['screenName']);
$opts = array(
  "http" => array(
    "method" => "GET",
    "header" => "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"
  )
);

$context = stream_context_create($opts);

error_log('Requesting content from ' . $url);
$content = file_get_contents($url, false, $context);
echo $content;

?>
