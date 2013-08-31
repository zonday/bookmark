<?php
function deep_stripcslashes(&$data)
{
	return is_array($data) ? array_map('deep_stripcslashes', $data) : stripcslashes($data);
}

function request_init()
{
	//关闭魔术引号
	if (function_exists('get_magic_quotes_gpc') && get_magic_quotes_gpc())
	{
		if (isset($_GET))
			$_GET = deep_stripcslashes($_GET);

		if (isset($_POST))
			$_GET = deep_stripcslashes($_POST);

		if (isset($_REQUEST))
			$_REQUEST = deep_stripcslashes($_REQUEST);

		if (isset($_COOKIE))
			$_COOKIE = deep_stripcslashes($_COOKIE);
	}

	//关闭运行时魔术引号
	ini_set('magic_quotes_runtime',0);
}

function is_ajax()
{
	return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH']==='XMLHttpRequest';
}

function is_post()
{
	return isset($_SERVER['REQUEST_METHOD']) && strtoupper($_SERVER['REQUEST_METHOD']) === 'POST';
}