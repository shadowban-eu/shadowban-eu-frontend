<?php

/*
** Simple Twitter Shadowban Checker - php proxy
** 2016 @xho
*/

if (empty($_GET['q'])) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('error' => 'Missing query')));
}

// defaults ?qf to 'on', which is the
// current (2018-05-20) behaviour of the twitter website
$params = array(
  'q' => filter_var($_GET['q'], FILTER_SANITIZE_STRING),
  'qf' => empty($_GET['noqf']) ? '' : '&qf=off'
);

$url = 'https://twitter.com/search?f=tweets&src=typd&vertical=default&q=' . urlencode($params['q']) . $params['qf'];
$opts = array(
  "http" => array(
    "method" => "GET",
    "header" => "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"
  )
);

$context = stream_context_create($opts);

$content = file_get_contents($url, false, $context);
echo $content;

?>
