<?php
$post_cache = array();

/**
 * 获取DB
 * @return medoo
 */
function get_db()
{
	static $db;
	if (!isset($db))
	{
		$db = new medoo(array(
			'username' => DB_USERNAME,
			'password' => DB_PASSWORD,
			'database_name' => DB_DATABASE_NAME,
		));
	}

	return $db;
}

/**
 * 获取书签缺省数据
 * @return array
 */
function post_data_default()
{
	return array(
		'url' => '',
		'title' => '',
		'category_id' => 0,
		'create_time' => 0,
		'update_time' => 0,
	);
}

/**
 * 清理书签数据
 * @param array $source
 * @return array
 */
function post_data_clean($source)
{
	$data = array();
	foreach (post_data_default() as $key => $value)
	{
		if (isset($source[$key]))
			$data[$key] = $source[$key];
		else
			$data[$key] = $value;
	}
	return $data;
}

/**
 * 书签数据验证
 * @param array $data
 * @return array $error 错误集合
 */
function post_data_validate($data)
{
	$error = array();
	if (empty($data['url']))
		$error['url'] = 'Url不能为空';
	elseif (!preg_match('/^https?:\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)/i', $data['url']))
		$error['url'] = 'Url格式不正确';

	$where = array('url'=>$url);
	if (!empty($data['id']))
		$where['id'] = $data['id'];

	if (get_db()->has('post', $where))
		$error[] = array('url'=>'Url已经存在');

	return $error;
}

/**
 * 根据tag获取书签
 * @param string $tag
 * @param array $args 查询参数
 * @return array 返回两个长度的数组 0为统计1为模型列表
 */
function post_all_by_tag($tag, $args=array())
{
	$where = array();
	$db = get_db();
	$total = 0 + ($db->query('SELECT COUNT(*) FROM post_tag INNER JOIN tag ON post_tag.tag_id=tag.id' . $db->where_clause(array('tag.name'=>$tag)))->fetchColumn());

	if ($total === 0)
		return array($total, array());

	post_parse_limit($args, $where);

	$where['tag.name'] = $tag;
	$post_ids = $db->query('SELECT post_id FROM post_tag INNER JOIN tag ON post_tag.tag_id=tag.id' . $db->where_clause($where))->fetchColumn();
	unset($where['tag.name']);
	$where['id'] = $post_ids;
	post_parse_order($args, $where);
	$result = post_merge(get_db()->select('post', '*', $where));
	return array($total, $result);
}

/**
 * 解析参数$args中的limit
 * @param array $args
 * @param array $where 引用
 */
function post_parse_limit($args, &$where=array())
{
	if (isset($args['limit']))
	{
		$where['LIMIT'] = $args['limit'];
		if (isset($args['offset']))
			$where['LIMIT'] = array($args['offset'], $where['LIMIT']);
	}
}

/**
 * 解析参数$args中的order
 * @param array $args
 * @param array $where 引用
 */
function post_parse_order($args, &$where=array())
{
	if (isset($args['orderby']) && in_array($args['orderby'], array('id', 'create_time')))
	{
		$orderby = $args['orderby'];
		if (isset($args['order']) && in_array(strtoupper($args['order']), array('ASC', 'DESC')))
			$order = strtoupper($args['order']);
		else
			$order = 'DESC';
		$where['ORDER'] = $orderby . ' ' . $order;
	} else
	{
		$where['ORDER'] = 'id DESC';
	}
}

function post_merge($posts)
{
	if (empty($posts))
		return array();

	foreach ($posts as $key => &$post)
	{
		$category = category_get($post['category_id']);
		if ($category)
			$post['category'] = $category;
		unset($post['category_id']);
		$post['tags'] = post_get_tags($post['id']);
	}
	return $posts;
}

/**
 * 获取所有书签
 * @param array $args
 * @return array 返回两个长度的数组 0为统计1为模型列表
 */
function post_all($args=array())
{
	$where = array();

	if (isset($args['category_id']))
		$where['category_id'] = $args['category_id'];

	$total = get_db()->count('post', $where);

	if ($total === 0)
		return array($total, array());

	post_parse_order($args, $where);
	post_parse_limit($args, $where);

	$result = post_merge(get_db()->select('post', '*', $where));

	return array($total, $result);
}

/**
 * 获取书签标签
 * @param integer $id 书签id
 * @return array
 */
function post_get_tags($id)
{
	$query = get_db()->query('SELECT tag.name FROM tag INNER JOIN post_tag ON tag.id = post_tag.tag_id ' . get_db()->where_clause(array('post_tag.post_id'=>$id)));

	if ($query)
		$result = $query->fetchAll(PDO::FETCH_COLUMN);
	return !empty($result) ? $result : array();
}

/**
 * 获取书签
 * @param integer $id 书签id
 * @return array|boolean 成功返回数组 失败返回false
 */
function post_get($id)
{
	return get_db()->get('post', '*', array('id'=>$id));
}

/**
 * 书签数据缓存设置
 * @param array $data
 */
function post_cache_set($data)
{
	global $post_cache;

	if (empty($data['id']))
		return;

	$post_cache['id'] = $data;
}

/**
 * 书签数据缓存获取
 * @param integer $id 书签id
 * @return array|boolean 成功返回数组 失败返回false
 */
function post_cache_get($id)
{
	global $post_cache;
	return isset($post_cache[$id]) ? $post_cache[$id] : false;
}

/**
 * 添加书签
 * @param array $source
 * @return array|boolean 成功返回数组 失败返回false
 */
function post_add($source=array())
{
	$data = post_data_clean($source);
	$data['create_time'] = time();
	$data['update_time'] = time();

	$id = get_db()->insert('post', $data);

	if (empty($id))
		return false;

	if (isset($source['tags']))
		$tags = post_save_tags($id, $source['tags'], true);

	if (isset($data['category_id']))
		category_update_count($data['category_id']);

	$data['id'] = $id;
	$data['tags'] = !empty($tags) ? $tags : array();
	$category = category_get($data['category_id']);
	if (empty($category))
		$category = array('id'=>0, 'name'=>'');
	$data['category'] = $category;
	return $data;
}

/**
 * 更新书签
 * @param array $source
 * @return array|boolean 成功返回数组 失败返回false
 */
function post_update($source=array())
{
	if (empty($source['id']))
		return false;
	else
		$id = $source['id'];

	if (($post = post_get($id)) === false)
		return false;

	$old_category_id = $post['category_id'];

	$data = post_data_clean($source);
	$data['update_time'] = time();
	$result =  get_db()->update('post', $data, array('id' => $id));

	if ($result === false)
		return false;

	if (isset($source['tags']))
		$tags = post_save_tags($id, $source['tags']);

	if (isset($data['category_id']) && ($data['category_id'] != $old_category_id))
	{
		category_update_count($data['category_id']);
		category_update_count($old_category_id);
	}

	$data['tags'] = !empty($tags) ? $tags : array();
	$category = category_get($data['category_id']);
	if (empty($category))
		$category = array('id'=>0, 'name'=>'');
	$data['category'] = $category;
	return $data;
}

/**
 * 删除书签
 * @param integer $id 书签id
 * @return boolean 成功返回影响的行数，失败返回false
 */
function post_delete($id)
{
	if (($post = post_get($id)) === false)
		return false;

	$result = get_db()->delete('post', array('id'=>$id));
	if ($result !== false)
	{
		post_delete_tags($id);

		if ($post)
			category_update_count($post['category_id']);
	}
	return $result;
}

/**
 * 删除书签标签
 * @param integer $id 书签id
 */
function post_delete_tags($id)
{
	get_db()->delete('post_tag', array('post_id'=>$id));
}

/**
 * 保存书签标签
 * @param integer $id 书签id
 * @param mixed $tags 数组或者字符串
 * @param boolean $new_record 书签是否为新纪录
 * @return null
 */
function post_save_tags($id, $tags, $new_record=false)
{
	if (is_string($tags))
		$tags = preg_split('/\s+/', $tags, -1, PREG_SPLIT_NO_EMPTY);

	$tags = array_unique((array) $tags);

	$tag_ids = tag_save_tags($tags);
	$post_id = (int) $id;

	if (empty($tag_ids) || empty($post_id))
		return;

	$add_tag_ids = $del_tag_ids = array();
	if ($new_record)
	{
		$add_tag_ids = $tag_ids;
	} else {
		if (($old_tag_ids = get_db()->select('post_tag', 'tag_id', array('post_id' => $post_id))) === false)
			$old_tag_ids = array();

		$old_tag_ids = array_map('intval', $old_tag_ids);
		$add_tag_ids = array_diff($tag_ids, $old_tag_ids);
		$del_tag_ids = array_diff($old_tag_ids, $tag_ids);
	}

	if ($add_tag_ids)
	{
		foreach ($add_tag_ids as $tag_id)
		{
			$values[] = "($post_id, $tag_id)";
		}
		$values = implode(', ', $values);
		$query = 'INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES ' . $values;
		get_db()->exec($query);
	}

	if ($del_tag_ids)
	{
		get_db()->delete('post_tag', array('tag_id' => $del_tag_ids));
	}

	tag_update_count(array_merge($add_tag_ids, $del_tag_ids));

	return $tags;
}

function tag_update_count($tag_ids)
{
	$list = array();
	foreach ($tag_ids as $tag_id)
	{
		$list[$tag_id] = get_db()->count('post_tag', array('tag_id' => $tag_id));
	}

	foreach ($list as $tag_id => $count)
	{
		get_db()->update('tag', array('count' => $count), array('id' => $tag_id));
	}
}

/**
 * 保存标签
 * @param array $tags
 * @return array 返回保存的标签ids
 */
function tag_save_tags($tags)
{
	if (empty($tags) || !is_array($tags))
		return array();

	if (($saved_tags = get_db()->select('tag', '*', array('name' => $tags))) === false)
		return array();

	$ids = array();
	foreach ($saved_tags as $tag)
	{
		if (($index = array_search($tag['name'], $tags)) !== false)
		{
			$ids[] = (int) $tag['id'];
			unset($tags[$index]);
		}
	}

	foreach ($tags as $tag)
	{
		$tag = trim($tag);
		if (empty($tag))
			continue;

		if (($id = get_db()->insert('tag', array('name' => $tag))) !== false)
			$ids[] = $id;
	}

	return $ids;
}

/**
 * 获取分类
 * @param integer $id 分类id
 * @return array|boolean 成功返回数组，失败返回false
 */
function category_get($id)
{
	static $cache=array();
	if (!isset($cache[$id]))
		$cache[$id] = get_db()->get('category', '*', array('id' => $id));
	return $cache[$id];
}

/**
 * 添加分类
 * @param array $data
 * @return boolean|integer 成功返回插入后的id，失败返回false
 */
function category_add($data)
{
	if (empty($data['name']))
		return false;

	return get_db()->insert('category', array('name' => $data['name'], 'count' => 0));
}

/**
 * 更新分类
 * @param integer $id 分类id
 * @param array $data
 * @return boolean|number 成功返回影响的行数, 失败返回false
 */
function category_update($id, $data)
{
	if (($category = category_get($id)) === false)
		return false;

	return get_db()->update('category', $data, array('id' => $id));
}

/**
 * 更新分类下的数目
 * @param integer $id 分类id
 * @return number 成功返回影响的行数，失败返回false
 */
function category_update_count($id)
{
	$count = get_db()->count('post', array('category_id'=>$id));
	return get_db()->update('category', array('count' => $count), array('id' => $id));
}

/**
 * 是否登录
 * @return boolean
 */
function is_login()
{
	return !empty($_SESSION['is_admin']);
}