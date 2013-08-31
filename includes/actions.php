<?php
function action_error($code, $message=null)
{

}

function action_login()
{

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

	if (isset($_GET['category_id']) && is_numeric($_GET['category_id']) && !empty($_GET['category_id']))
		$args['category_id'] = $_GET['category_id'];

	list($total, $models) = post_all($args);
	echo json_encode(array('total' => $total, 'models'=>$models));
}

function action_post()
{
	if (is_post())
	{
		$method = isset($_POST['_method']) ? $_POST['_method'] : 'CREATE';

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
