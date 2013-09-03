<?php
session_start();

function action_error($code, $message=null)
{
	header("HTTP/1.0 {$code}");
}

function action_logout()
{
	session_destroy();
	echo 1;
}

function action_is_login()
{
	if (is_login())
		$result = array('error'=>0, 'user'=>array('name'=>'超级管理员'));
	else
		$result = array('error'=>1);
	echo json_encode($result);
}

function action_login()
{
	if (is_post())
	{
		if (!empty($_POST['username']))
			$username = $_POST['username'];
		if (!empty($_POST['password']))
			$password = $_POST['password'];

		if (isset($username) && isset($password) && $username === 'admin' && $password === 'admin')
		{
			$result = array('error'=>0, 'user'=>array('name'=>'超级管理员'));
			$_SESSION['is_admin'] = true;
		} else
			$result = array('error'=>1, 'message'=>'用户名密码错误');
	} else {
		$result = array('error'=>1, 'message'=>'登录失败');
	}

	echo json_encode($result);
}

function action_categories()
{
	$rows = get_db()->select('category', '*');
	if (empty($rows))
		$rows = array();

	echo json_encode(array('error' => 0, 'models'=>$rows));
}

function action_posts()
{
	if (isset($_GET['page']) && is_numeric($_GET['page']))
	{
		$page = max(intval($_GET['page']), 1);
	} else {
		$page = 1;
	}

	$args['limit'] = 20;
	$args['offset'] = ($page - 1) * $args['limit'];

	$result = array(0, array());
	if (isset($_GET['tag'])) {
		$tag = trim($_GET['tag']);
		if ($tag)
			$result = post_all_by_tag($tag);
	} else {
		if (isset($_GET['category_id']) && is_numeric($_GET['category_id']) && !empty($_GET['category_id']))
			$args['category_id'] = $_GET['category_id'];

		$result = post_all($args);
	}

	list($total, $models) = $result;
	echo json_encode(array('total' => $total, 'models'=>$models));
}

function action_post()
{
	if (is_post())
	{
		$method = isset($_POST['_method']) ? $_POST['_method'] : 'CREATE';

		if (in_array($method, array('PUT', 'CREATE', 'DELETE')) && !is_login()) {
			action_error(404);
			return;
		}

		if ($method === 'DELETE')
		{
			if (!empty($_GET['id']))
			{
				if (post_delete($_GET['id']) !== false)
				{
					echo json_encode(array('error' => 0, 'message' => '删除成功'));
				} else
				{
					echo json_encode(array('error' => 1, 'message' => '删除失败'));
				}
			}
			return;
		}

		if (!empty($_POST['model']))
			$model = json_decode($_POST['model'], true);

		if (empty($model))
			return;

		if ($method === 'PUT')
			$function = 'post_update';
		elseif ($method === 'CREATE')
			$function = 'post_add';
		else
			return;

		$model['category_id'] = $model['category']['id'];

		if (($model = $function($model)) !== false)
			echo json_encode(array('error' => 0, 'model' => $model));
		else
			echo json_encode(array('error' => 1, 'message' => $method === 'PUT' ? '更新失败': '添加失败'));
	}
}
