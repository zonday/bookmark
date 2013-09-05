'use strict';

$(function() {
	var tagsSplitter = /\s*,\s*/;
	var user = null;
	
	var SignView = Backbone.View.extend({
		el: '#sign',
		
		render: function() {
			var html;
			if (!user)
				html ='<a href="#/login">登录</a>';
			else
				html = '欢迎你' + _.escape(user.name) +'！ <a href="#/logout">退出</a>';
			
			this.$el.html(html);
		}
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
			var html = this.$el.html();
			categories.each(function(category) {
				html += '<li><a href="#/category/' + category.escape('id') + '">' + category.escape('name') + '</a>' + '<span>' + category.escape('count') + '</span></li>';
			});
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
		total: 0,
		
		page: 1,
		
		model: Bookmark,
		
		url: 'ajax.php?r=posts',
		
		//localStorage: new Backbone.LocalStorage('bookmarks-backbone'),
		
		parse: function(resp, options) {
			this.total = resp.total;
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
		},
		
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.$edit = this.$('.edit').hide();
			this.$destory = this.$('.destory').hide();
			return this;
		},
		
		edit: function() {
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
			window.location.href = '#post';
		},
		
		clear: function () {
			this.model.destroy({wait: true});
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
		
		events: {
			'click button': 'login',
		},
		
		render: function() {
			this.$el.html($('#login-template').html());
			$('#sign').after(this.$el);
			this.$username = this.$('#username');
			this.$password = this.$('#password');
		},
		
		login: function(e) {
			var self = this;
			$.ajax({
				url: 'ajax.php?r=login',
				type: 'post',
				data: {username: this.$username.val(), password: this.$password.val()},
				success: function(resp) {
					if (resp.error == 0) {
						user = resp.user;
						appView.signView.render();
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
			this.listenTo(bookmarks, 'add', this.addOne);
			this.listenTo(bookmarks, 'reset', this.pagination);
			this.listenTo(bookmarks, 'reset', this.addAll);
			this.listenTo(categories, 'reset', this.addCategories);
			this.formView = new FormView();
			this.signView = new SignView();
			this.loginView = new LoginView();
			this.categoiresView = new CategoriesView();
			
			//if (!this.isFetch)
				//bookmarks.fetch({reset: true, data:{'page':1}});
			
			$(window).scroll(function(){
				var scrollHeight = $(window).scrollTop() + $(window).height();
			});
			
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
			categories.fetch({reset:true});
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
		
		pagination: function(bookmarks) {
			var page = bookmarks.page;
			var total = bookmarks.total;
			var maxPage = Math.ceil(total/20);
			var pagination = [];
			if (maxPage > 1) {
				if (page == 1) {
					pagination.push({'下一页': page+1});
				} else if (page > 1 && page < maxPage-1) {
					pagination.push({'上一页': page-1});
					pagination.push({'下一页': page+1});
				} else {
					pagination.push({'上一页': page-1});
				}
			}
		}
	});
	
	var BookmarkRouter = Backbone.Router.extend({
		routes: {
			'': 'show',
			'logout': 'logout',
			'login': 'login',
			'page/:page': 'show',
			'category/:id': 'showByCategory',
			'category/:id/page/:page': 'showByCategory',
			'tag/:tag': 'showByTag',
			'tag/:tag/page/:page': 'showByTag'
		},
		
		logout: function() {
			$.ajax({
				url: 'ajax.php?r=logout',
				success: function(resp) {
					if (resp == 1) {
						user = null;
						appView.signView.render();
						appView.formView.$el.hide();
						appView.trigger('afterLogout');
					}
				}
			});
		},
		
		login: function() {
			appView.loginView.render();
			appView.loginView.$el.show();
		},
		
		show: function(page) {
			var data = {};
			page = parseInt(page);
			if (!page)
				page = 1;
			bookmarks.page = page;
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
			bookmarks.fetch({reset: true, data: data});
		}
	});
	
	Backbone.emulateHTTP = true;
	Backbone.emulateJSON = true;

	var appView = new AppView();
	var bookmarkRouter = new BookmarkRouter();
	Backbone.history.on('route', function(){
		console.log(arguments);
	});
	Backbone.history.start();
	
	appView.render();
});