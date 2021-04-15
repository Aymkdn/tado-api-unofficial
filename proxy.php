<?php
/**
.htaccess:

  Header always set Access-Control-Allow-Origin "*"
  Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS, DELETE, PUT"
  Header always set Access-Control-Allow-Headers "*"

  RewriteEngine On
  RewriteCond %{REQUEST_METHOD} OPTIONS
  RewriteRule ^(.*)$ $1 [R=200,L]
*/

// url is required as a parameter
if (!isset($_GET["url"])) exit;

// utility function
function startsWith ($string, $startString) {
  $len = strlen($startString);
  return (substr($string, 0, $len) === $startString);
}

// get the URL to contact
$url = rawurldecode($_GET["url"]);
$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : "get";

// check URL to make sure we authorize it
$authorizeUrls = [
  "https://auth.tado.com/",
  "https://my.tado.com/"
];
$canContinue = false;
foreach ($authorizeUrls as $urlOK) {
  if (startsWith($url, $urlOK)) {
    $canContinue=true;
    break;
  }
}

if (!$canContinue) exit("Unauthorize URL.");

$data = file_get_contents('php://input');
$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $url);
// transfer the headers
$headers = apache_request_headers();
$curlHeaders = [
  "Origin: https://my.tado.com",
  "Referer: https://my.tado.com"
];
foreach ($headers as $header => $value) {
  if (!in_array($header, [ "Host", "Origin", "Referer" ])) array_push($curlHeaders, $header.': '.$value);
}
curl_setopt($curl, CURLOPT_HTTPHEADER, $curlHeaders);

// send the method and data
if ($method === "POST") {
  curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
} else {
  curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
}
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_HEADER, true);
// debug
/*$fp = fopen(dirname(__FILE__).'/errorlog.txt', 'w+');
curl_setopt($curl, CURLOPT_VERBOSE, true);
curl_setopt($curl, CURLOPT_STDERR, $fp);*/

// read the answer
$response = curl_exec($curl);
$header_size = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $header_size);
$body = substr($response, $header_size);
curl_close($curl);

// transfer the headers to the requestor
$headers = explode("\r\n", $headers);
foreach ($headers as $head) {
  // remove some headers
  switch($head) {
    case "X-Content-Type-Options: nosniff":
    case "X-XSS-Protection: 1; mode=block":
    case "X-Frame-Options: DENY":
    case "Transfer-Encoding: chunked":
    case "Access-Control-Allow-Origin: *":
    case "": break;
    default: {
      header($head);
    }
  }
}

// write the body
echo $body;
?>
