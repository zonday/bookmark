$(function() {
	'use strict';
	var tagsSplitter = /\s*,\s*/;
	var user = null;
	
	var SignView = Backbone.View.extend({
		el: '#sign',
		
		render: function() {
			var html;
			if (!user)
				html ='<a href="#/login">登录</a>';
			else
				html = '欢迎你' + _.escape(user.name) +'<a href="#/logout">退出</a>';
			
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
		}
	});
	
	var Bookmarks = Backbone.Collection.extend({
		total: 0,
		
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
			return this;
		},
		
		edit: function() {
			var formView = appView.formView;
			formView.model = this.model;
			formView.listenTo(this.model, 'destroy', formView.reset);
			formView.listenTo(this.model, 'change', formView.reset);
			formView.$submit.html('修改');
			formView.$title.val(this.model.get('title'));
			formView.$url.val(this.model.get('url'));
			formView.$category.val(this.model.get('category').id);
			formView.$tags.val(this.model.get('tags').join(','));
		},
		
		clear: function () {
			this.model.destroy();
		}
	});
	
	var FormView = Backbone.View.extend({
		tagName: 'form',
		
		isNewRecord: true,
		
		template: _.template($('#form-template').html()),
		
		events: {
			'click #submit': 'submit',
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
		},
		
		submit: function(e) {
			if (!this.model)
				bookmarks.create(this.newAttributes(), {wait: true});
			else
				this.model.save(this.newAttributes(), {wait: true});
			
			return false;
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
	
	var AppView = Backbone.View.extend({
		el: '#bookmarkapp',
		
		formTemplate: _.template($('#form-template').html()),

		initialize: function() {
			this.listenTo(bookmarks, 'add', this.addOne);
			this.listenTo(bookmarks, 'reset', this.addAll);
			this.listenTo(categories, 'reset', this.addCategories);
			this.formView = new FormView();
			this.signView = new SignView();
			this.categoiresView = new CategoriesView();
		},
		
		render: function() {
			this.formView.render();
			this.signView.render();
			categories.fetch({reset:true});
		},
		
		addOne: function(bookmark) {
			if (!bookmark.isNew()) {
				var view = new BookmarkView({model: bookmark});
				$('#items').prepend(view.render().el);
			}
		},
		
		addAll: function(bookmarks) {
			this.$('#items').html('');
			bookmarks.each(this.addOne, this);
		}
	});
	
	var BookmarkRouter = Backbone.Router.extend({
		routes: {
			'page/:page': 'show',
			'category/:id': 'showByCategory',
			'category/:id/page/:page': 'showByCategory',
			'tag/:tag': 'showByTag',
			'tag/:tag/page/:page': 'showByTag'
		},
		
		show: function(page) {
			var data = {};
			if (page)
				data['page'] = page;
			bookmarks.fetch({reset: true, data: data});
			
		},
		
		showByCategory: function (category_id, page) {
			var data = {};
			if (category_id)
				data['category_id'] = category_id;
			
			if (page)
				data['page'] = page;
			
			bookmarks.fetch({reset: true, data: data});
		},
		
		showByTag: function ($tag, page) {
			
		}
	});
	
	Backbone.emulateHTTP = true;
	Backbone.emulateJSON = true;
	
	var bookmarkRouter = new BookmarkRouter();
	Backbone.history.start();
	
	var appView = new AppView();
	appView.render();
});