'use strict';

jQuery(function($) {
	var tagsSplitter = /\s*,\s*/;
	var user = null;
	var $modal;

	var modal = {
		$modal: null,

		init: function() {
			if (!this.$modal) {
				$('body').append($('#modal-template').html());
				$modal = $('#modal');
			}
		},

		setContent: function(el) {
			$('.modal-body', this.$modal).append($(el));
		},

		setTitle: function(title) {
			$('model-header h3', this.$modal).html(title);
		}
	};

	var SignView = Backbone.View.extend({
		el: '#sign',

		events: {
			'click #login': 'login',
			'click #logout': 'logout',
		},

		render: function() {
			var html;
			if (!user)
				html ='<p class="navbar-text"><a href="#" id="login">登录</a></p>';
			else
				html ='<p class="navbar-text">欢迎你' + _.escape(user.name) +'！ <a href="#" id="logout">退出</a></p>';

			this.$el.html(html);
			return this;
		},

		login: function(e) {
			this.$el.hide();
			appView.loginView.render().$el.show();
			e.preventDefault();
		},

		logout: function(e) {
			var self = this;
			$.ajax({
				url: 'ajax.php?r=logout',
				success: function(resp) {
					if (resp == 1) {
						user = null;
						self.render();
						appView.formView.$el.hide();
						appView.trigger('afterLogout');
					}
				}
			});
			e.preventDefault();
		},
	});

	var Category = Backbone.Model.extend({
		defaults: {
			name: '',
			count: 0
		}
	});

	var Categories = Backbone.Collection.extend({
		model: Category,

		url: 'ajax.php?r=categories',

		parse: function(resp, options) {
			return resp.models;
		}
	});

	var CategoriesView = Backbone.View.extend({
		el: '#categories',

		initialize: function() {
			this.listenTo(categories, 'reset', this.render);
		},

		render: function(categories) {
			var total = 0;
			var html = '';
			categories.each(function(category) {
				html += '<li><a class="category-' + category.escape('id') + '"  href="#/category/' + category.escape('id') + '">' + category.escape('name') + '<span>' + category.escape('count') + '</span></a></li>';
				total += window.parseInt(category.get('count'));
			});
			html = '<li><a href="#/">所有<span>' + total + '</span></a>' + html;
			this.$el.html(html);
		}
	});

	var categories = new Categories();

	var Bookmark = Backbone.Model.extend({
		defaults: {
			title: '',
			url: '',
			category: {id: 0, name: ''},
			tags: []
		},

		urlRoot: 'ajax.php?r=post',

		parse: function(resp, options) {
			if (resp.error == '0') {
				return resp.model;
			} else {
				return resp;
			}
		},

		validate: function(attrs, options) {
			if (!attrs.url.trim())
				return 'Url不能为空';

			if (!/^https?:\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)/i.test(attrs.url))
				return 'Url格式不正确';
		},

		initialize: function() {
			this.on('invalid', function(model, error){
				alert(error);
			});

			this.on('error', function(model, xhr) {
				if (xhr.status == 404)
					alert('没有权限访问，请登录');
			});
		}
	});

	var Bookmarks = Backbone.Collection.extend({
		query: {},

		total: 0,

		page: 1,

		maxPage: 1,

		sectionNum: 5,

		model: Bookmark,

		url: 'ajax.php?r=posts',

		//localStorage: new Backbone.LocalStorage('bookmarks-backbone'),

		parse: function(resp, options) {
			this.total = resp.total;
			this.maxPage = Math.max(Math.ceil(this.total/20), 1);
			return resp.models;
		}
	});

	var bookmarks = new Bookmarks();

	var BookmarkView = Backbone.View.extend({
		tagName: 'div',

		attributes: {
			'class': 'item',
		},

		template: _.template($('#item-template').html()),

		events: {
			'click .edit': 'edit',
			'click .destory': 'clear',
		},

		initialize: function() {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
			this.listenTo(this.model, 'change:category', this.changeCategory);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.$edit = this.$('.edit');
			this.$destory = this.$('.destory');
			if (!user) {
				this.$edit.hide();
				this.$destory.hide();
			}
			return this;
		},

		changeCategory: function(model) {
			categories.fetch({'reset': true});
		},

		edit: function(e) {
			var formView = appView.formView;
			formView.model = this.model;
			formView.listenTo(this.model, 'destroy', formView.reset);
			formView.listenTo(this.model, 'change', formView.reset);
			formView.$submit.html('修改');
			formView.$cannel.show();
			formView.$title.val(this.model.get('title'));
			formView.$url.val(this.model.get('url'));
			formView.$category.val(this.model.get('category').id);
			formView.$tags.val(this.model.get('tags').join(','));
			//console.log($modal);
			//$('.modal-body', $modal).append(formView.$el);
			//$modal.modal();
			window.location.href = '#post';
			e.preventDefault();
		},

		clear: function(e) {
			if (window.confirm('确定要删除这个书签吗？'))
				this.model.destroy({wait: true});
			e.preventDefault();
		},

		afterLogin: function() {
			this.$edit.show();
			this.$destory.show();
		},

		afterLogout: function() {
			this.$edit.hide();
			this.$destory.hide();
		}
	});

	var FormView = Backbone.View.extend({
		tagName: 'form',

		isNewRecord: true,

		template: _.template($('#form-template').html()),

		events: {
			'click #submit': 'submit',
			'click #cannel': 'reset',
		},

		initialize: function() {
			this.listenTo(categories, 'reset', this.renderCategories);
			this.listenTo(bookmarks, 'add', this.reset);
			this.listenTo(bookmarks, 'reset', this.reset);
		},

		render: function() {
			this.$el.html(this.template());
			this.$title = this.$('#title');
			this.$url = this.$('#url');
			this.$submit = this.$('#submit');
			this.$category = this.$('#category');
			this.$tags = this.$('#tags');
			this.$cannel = this.$('#cannel');
			$('#post').append(this.$el);
			return this;
		},

		renderCategories: function(categories) {
			var html='';
			categories.each(function(category){
				html += '<option value="' + category.escape('id') + '">' + category.escape('name') + '</option>';
			});
			this.$category.html(html);
		},

		reset: function() {
			delete this.model;
			this.$title.val('');
			this.$url.val('');
			this.$category.val('');
			this.$tags.val('');
			this.$submit.html('提交');
			this.$cannel.hide();
		},

		submit: function(e) {
			if (!this.model) {
				bookmarks.create(this.newAttributes(), {wait: true});
			} else {
				var model = this.model;
				this.model.save(this.newAttributes(), {wait: true, success: function(){
					window.location.href = '#item-' + model.id;
				}});
			}
			e.preventDefault();
		},

		newAttributes: function() {
			var url = this.$url.val().trim();
			var title = this.$title.val().trim();
			var category = {id: this.$category.val(), name: $('option:selected', this.$category).html()};

			return {
				title: title ? title : url,
				url: url,
				category: category,
				tags: this.$tags.val().trim().split(tagsSplitter)
			};
		}
	});

	var LoginView = Backbone.View.extend({
		tagName: 'form',

		className: 'navbar-form pull-right',

		events: {
			'click button': 'submit',
		},

		render: function() {
			this.$el.html($('#login-template').html());
			this.$username = this.$('#username');
			this.$password = this.$('#password');
			$('#sign').after(this.$el);
			return this;
		},

		submit: function(e) {
			var self = this;
			$.ajax({
				url: 'ajax.php?r=login',
				type: 'post',
				data: {username: this.$username.val(), password: this.$password.val()},
				success: function(resp) {
					if (resp.error == 0) {
						user = resp.user;
						appView.signView.render().$el.show();
						self.$el.hide();
						appView.formView.$el.show();
						appView.trigger('afterLogin');
					} else {
						alert(resp.message);
					}
				}
			});
			e.preventDefault();
		}
	});

	var AppView = Backbone.View.extend({

		isFetch: false,

		el: '#bookmarkapp',

		formTemplate: _.template($('#form-template').html()),

		initialize: function() {
			var self = this;
			var pagination = $('#pagination');

			var loading = $('.loading', this.$el);
			this.listenTo(bookmarks, 'add', this.addOne);
			this.listenTo(bookmarks, 'reset', this.addAll);
			this.listenTo(bookmarks, 'reset', function() {
				if (bookmarks.query['category_id']) {
					category = categories.findWhere({'id': bookmarks.query['category_id']});
					if (category) {
						$('h2', self.$el).html('分类：' + category.escape('name'));
					}
				} else if (bookmarks.query['tag']) {
					$('h2', self.$el).html('标签：' + _.escape(bookmarks.query['tag']));
				} else
					$('h2', self.$el).html('');
			});
			this.listenTo(bookmarks, 'request', function() {
				loading.show();
				pagination.html('');
			});
			this.listenTo(bookmarks, 'sync', function() {
				loading.hide();
				self.pagination();
			});
			this.listenTo(categories, 'reset', this.addCategories);
			this.listenTo(bookmarkRouter, 'route', function(route, params){
				var tag, category;
				if (_.indexOf(['show', 'showByCategory', 'showByTag'], route) !== -1) {
					self.isFetch = true;
				}
			});

			this.formView = new FormView();
			this.signView = new SignView();
			this.loginView = new LoginView();
			this.categoiresView = new CategoriesView();

			var throttled = _.throttle(function(){
				if (bookmarks.maxPage <= bookmarks.page || (bookmarks.page % bookmarks.sectionNum === 0))
					return;

				var scrollHeight = $(window).scrollTop() + $(window).height();

				if (scrollHeight >= pagination.offset()['top']) {
					var data = {};
					data['page'] = ++bookmarks.page;

					if (bookmarks.query['category_id'])
						data['category_id'] = bookmarks.query['category_id'];
					else if (bookmarks.query['tag'])
						data['tag'] = bookmarks.query['tag'];

					bookmarks.fetch({data: data});
				}
			}, 100);

			$(window).scroll(throttled);

			this.checkLogin();
		},

		checkLogin: function()
		{
			var self = this;
			$.ajax({
				url: 'ajax.php?r=is_login',
				success: function(resp) {
					if (resp.error == 0) {
						user = resp.user;
						self.signView.render();
						self.loginView.$el.hide();
						self.formView.$el.show();
						self.trigger('afterLogin');
					}
				}
			});
		},

		render: function() {
			this.signView.render();
			this.formView.render().$el.hide();
			categories.fetch({'reset': true});
			if (!this.isFetch)
				bookmarks.fetch({reset: true, data:{'page':1}});
		},

		addOne: function(bookmark) {
			if (!bookmark.isNew()) {
				var view = new BookmarkView({model: bookmark});
				this.on('afterLogin', view.afterLogin, view);
				this.on('afterLogout', view.afterLogout, view);
				view.$el.attr('id', 'item-' + bookmark.id);
				$('#items').append(view.render().el);
			}
		},

		addAll: function(bookmarks) {
			this.$('#items').html('');
			bookmarks.each(this.addOne, this);
			this.isFetch = true;
		},

		pagination: function() {
			var sectionNum = bookmarks.sectionNum;
			var page = Math.ceil(bookmarks.page / sectionNum);
			var maxPage = Math.ceil(bookmarks.maxPage / sectionNum);

			if (bookmarks.page %2 !== 0) {
				if (maxPage !== page || page == 1)
					return;
			}


			var pagination = {};
			var url;
			var html = '';

			if (maxPage > 1) {
				if (page == 1) {
					pagination = {'下一页': page*sectionNum + 1};
				} else if (page > 1 && page < maxPage) {
					pagination={
						'上一页': bookmarks.page - page*sectionNum + 1,
						'下一页': bookmarks.page + 1
					};
				} else {
					pagination = {'上一页': (page-2) * sectionNum + 1};
				}

				if (bookmarks.query['category_id'])
					url = '#/category/' + _.escape(bookmarks.query['category_id']) + '/page/:page';
				else if (bookmarks.query['tag'])
					url = '#/tag/' + _.escape(bookmars.query['tag']) + '/page/:page';
				else
					url = '#/page/:page';

				_.each(pagination, function(value, key){
					html += '<a href="' + url.replace(':page', value) + '">' + key + '</a>';
				});

				$('#pagination').html(html);
			}
		}
	});

	var BookmarkRouter = Backbone.Router.extend({
		routes: {
			'': 'show',
			'page/:page': 'show',
			'category/:id': 'showByCategory',
			'category/:id/page/:page': 'showByCategory',
			'tag/:tag': 'showByTag',
			'tag/:tag/page/:page': 'showByTag'
		},

		show: function(page) {
			var data = {};
			page = parseInt(page);
			if (!page)
				page = 1;
			bookmarks.page = page;
			delete bookmarks.query['tag'];
			delete bookmarks.query['category_id'];
			bookmarks.fetch({reset: true, data: {page: page}});
		},

		showByCategory: function (category_id, page) {
			var data = {};
			if (category_id)
				data['category_id'] = category_id;

			page = parseInt(page);
			if (!page)
				page = 1;
			data['page'] = page;
			bookmarks.page = page;
			bookmarks.query['category_id'] = category_id;
			delete bookmarks.query['tag'];
			bookmarks.fetch({reset: true, data: data});
		},

		showByTag: function (tag, page) {
			var data = {};
			if (tag)
				data['tag'] = tag;

			page = parseInt(page);
			if (!page)
				page = 1;
			data['page'] = page;
			bookmarks.page = page;
			bookmarks.query['tag'] = tag;
			delete bookmarks.query['category_id'];
			bookmarks.fetch({reset: true, data: data});
		}
	});

	Backbone.emulateHTTP = true;
	Backbone.emulateJSON = true;

	var bookmarkRouter = new BookmarkRouter();
	var appView = new AppView();

	Backbone.history.start();

	appView.render();
});