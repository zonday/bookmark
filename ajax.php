<?php
define('ROOT', dirname(__FILE__));

define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_DATABASE_NAME', 'zonday');

require ROOT . '/includes/medoo.php';
require ROOT . '/includes/functions.php';
require ROOT . '/includes/models.php';
require ROOT . '/includes/actions.php';

if (!is_ajax())
	die();

request_init();

header('Content-Type: text/json');

$r = isset($_REQUEST['r']) ? $_REQUEST['r'] : '';
if (preg_match('/([a-z]+)\/?(\d+)?/', trim($r, '/'), $match)) {
	if (isset($match[1]))
		$action = trim($match[1]);

	if (isset($match[2]))
		$_GET['id'] = $match[2];
}


if (!empty($action))
{
	$function = 'action_' . $action;
	function_exists($function) && $function();
}

