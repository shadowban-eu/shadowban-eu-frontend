<?php
/*
** Simple Twitter Shadowban Checker - php proxy
** 2016 @xho
** 2018 @raphaelbeerlin (V2 modifications)
*/

// search results, if query is supplied
// user's page, otherwise
if (isset($_GET['q'])) {
    $url = 'https://twitter.com/search?f=tweets&src=typd&vertical=default&q=' .
        urlencode(filter_var($_GET['q'], FILTER_SANITIZE_STRING)) .
        (isset($_GET['noqf']) ? '&qf=off' : '');
} elseif (isset($_GET['screenName'])) {
    $url = 'https://twitter.com/' .
        urlencode(filter_var($_GET['screenName'], FILTER_SANITIZE_STRING));
} else {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(array('error' => 'Missing query or username'));
    return;
}

// initialize curl handler
$handler = curl_init();

// define the user agent
$userAgent = "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36\r\n";

// set some options to the curl handler
curl_setopt_array($handler, array(
    CURLOPT_URL => $url,
    CURLOPT_FAILONERROR => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERAGENT => $userAgent
));

//do the request and fetch htmlas well as the http status code
$response = curl_exec($handler);
$statusCode = curl_getinfo($handler, CURLINFO_HTTP_CODE);

// return the status code if an error occured
if ($response === false) {
    http_response_code($statusCode);
    curl_close($handler);
    return;
}

// close the curl handler
curl_close($handler);

// check for an error
if ($statusCode != 200) {
    // relay response code
    http_response_code($statusCode);
    return;
}

// print the html
echo $response;
