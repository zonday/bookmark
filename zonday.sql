-- phpMyAdmin SQL Dump
-- version 3.4.10.1
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2013 年 09 月 07 日 08:43
-- 服务器版本: 5.5.20
-- PHP 版本: 5.2.6

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- 数据库: `zonday`
--

-- --------------------------------------------------------

--
-- 表的结构 `category`
--

CREATE TABLE IF NOT EXISTS `category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `count` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- 转存表中的数据 `category`
--

INSERT INTO `category` (`id`, `name`, `count`) VALUES
(1, '计算机', 2),
(2, 'web前端', 7);

-- --------------------------------------------------------

--
-- 表的结构 `post`
--

CREATE TABLE IF NOT EXISTS `post` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  `url` varchar(255) NOT NULL,
  `category_id` int(11) NOT NULL DEFAULT '0',
  `create_time` int(11) NOT NULL DEFAULT '0',
  `update_time` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `url` (`url`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=14 ;

--
-- 转存表中的数据 `post`
--

INSERT INTO `post` (`id`, `title`, `url`, `category_id`, `create_time`, `update_time`) VALUES
(5, '防御XSS的七条原则', 'http://blog.jobbole.com/47372/', 2, 1378171138, 1378516839),
(6, '提升WordPress站点速度的八个建议', 'http://blog.jobbole.com/47402/', 2, 1378361436, 1378361436),
(7, '有jQuery背景，该如何用AngularJS编程思想？', 'http://blog.jobbole.com/46589/', 2, 1378361732, 1378361732),
(8, 'Backbone.js的技巧和模式', 'http://www.w3cplus.com/js/backbone-js-tips-patterns.html', 2, 1378361822, 1378516869),
(9, 'PHP编程之道', 'http://www.golaravel.com/php-the-right-way/getting-started.html', 2, 1378363228, 1378516884),
(10, 'less中文网', 'http://www.lesscss.net/article/home.html', 1, 1378526629, 1378526629),
(11, 'kohana', 'http://kohanaframework.org/', 1, 1378526725, 1378526725),
(12, '前端工程师面试问题列表', 'http://blog.jobbole.com/29269/', 2, 1378526881, 1378538971),
(13, '为你的响应式设计提速', 'http://blog.jobbole.com/47483/', 2, 1378526932, 1378537364);

-- --------------------------------------------------------

--
-- 表的结构 `post_tag`
--

CREATE TABLE IF NOT EXISTS `post_tag` (
  `post_id` int(10) unsigned NOT NULL DEFAULT '0',
  `tag_id` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`post_id`,`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `post_tag`
--

INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES
(5, 3),
(6, 4),
(7, 5),
(7, 6),
(8, 7),
(9, 8),
(10, 9),
(10, 10),
(11, 11),
(12, 1),
(13, 12);

-- --------------------------------------------------------

--
-- 表的结构 `tag`
--

CREATE TABLE IF NOT EXISTS `tag` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `count` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `count` (`count`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=13 ;

--
-- 转存表中的数据 `tag`
--

INSERT INTO `tag` (`id`, `name`, `count`) VALUES
(1, '面试', 0),
(2, 'linux', 0),
(3, 'xss', 0),
(4, 'wordpress', 0),
(5, 'jquery', 0),
(6, 'angularjs', 0),
(7, 'backbone', 0),
(8, 'php', 0),
(9, 'css', 0),
(10, 'less', 0),
(11, 'php框架', 0),
(12, '响应式设计', 0);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
