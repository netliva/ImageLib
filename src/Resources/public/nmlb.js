if (window.jQuery)
{
	(function ($) {

		$.nmlb = {
			// ===============
			modal				: null,
			settings			: {
				callback: function () {}
			},
			selected_medias		: {},
			dropped_files		: [],
			file_input_name		: "nmlb_form[nmlb-file][]",
			is_uploading		: false,
			upload_url			: "/netliva/file/upload",
			file_list_url		: "/netliva/file/list",
			is_advanced_upload	: function() {
				var div = document.createElement('div');
				return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
			}(),

			// === LANGUAGE ===
			lang: "en",
			langs: {},
			l:{
				main_title		: "Ortam Ekle",
				upload_title	: "Dosya Yükle",
				explore_title	: "Ortam Kütüphanesi",
				search_input_ph	: "Ortam dosyalarında ara...",
				selected		: "seçildi",
				clear			: "Temizle",
				upload_area_msg	: "Yüklemek için dosyaları sürükleyip bırakın",
				not_found		: "Hiç bir öğe bulunamadı",
				upload_msg_l1	: "Yüklemek istediğiniz dosyaları herhangi bir yere sürükleyip bırakın",
				upload_msg_l2	: "ya da",
				upload_msg_btn	: "Dosya Seçin",
				upload_msg_l3	: "Yüklenebilecek en büyük dosya boyutu: 2 MB.",
				add				: "Ekle",
			},

			// === FUNCTIONS ===
			netlivaMediaLib: function (settings)
			{
				this.settings = $.extend(this.settings, settings);
				this.buildMediaModal();
			},
			buildMediaModal: function  ()
			{
				this.readLang();

				if (!$("#netlivaMediaModal").length)
				{
					this.modal = $('<div class="nmlb-modal"></div>');
					var container = $('<div id="netlivaMediaModal"><div class="nmlb-modal-back"></div></div>');
					var close_btn = $('<button class="nmlb-modal-close"><i class="nmlb-icon"></i></button>')
					var title = $('<div class="nmlb-frame-title"><h1>'+this.l.main_title+'</h1></div>');
					var router = $('<div class="nmlb-frame-router"><ul><li data-href="upload">'+this.l.upload_title+'</li><li data-href="browser">'+this.l.explore_title+'</li></ul></div>');
					var content = $('<div class="nmlb-frame-content"></div>');
					var toolbar = $('<div class="nmlb-frame-toolbar"><div class="nmlb-toolbar"></div></div>');
					var toolbarLeft = $('<div class="nmlb-toolbar-left"></div>');
					var toolbarRight = $('<div class="nmlb-toolbar-right"></div>');
					var uploader = $('<div class="nmlb-frame-uploader"><div class="nmlb-uploader-window"><div class="nmlb-uploader-window-content"><h1>'+this.l.upload_area_msg+'</h1></div></div></div>');
					var file = $('<div class="nmlb-frame-file"><input type="file" name="'+this.file_input_name+'" id="nmlb-file" multiple /></div>');

					toolbarLeft.appendTo(toolbar.find(".nmlb-toolbar"));
					toolbarRight.appendTo(toolbar.find(".nmlb-toolbar"));
					this.modal.prependTo(container);
					close_btn.prependTo(this.modal);
					title.appendTo(this.modal);
					router.appendTo(this.modal);
					content.appendTo(this.modal);
					toolbar.appendTo(this.modal);
					uploader.appendTo(this.modal);
					file.appendTo(this.modal);


					that = this;
					file.find("input").change(function () {
						that.upload("iframe");
					});
					router.find("li").click($.proxy(this.route,this));
					close_btn.click($.proxy(this.close,this));

					$("body").append(container);
				}
				else
				{
					$("#netlivaMediaModal").show();
					this.modal = $("#netlivaMediaModal .nmlb-modal")
				}

				$(document).on("dragenter",$.proxy(this.dragenter,this));
				$(document).on("dragleave",$.proxy(this.dragleave,this));
				$(document).on("dragover",$.proxy(this.dragover,this));
				$(document).on("drop",$.proxy(this.drop,this));

				this.modal.find('.nmlb-frame-router li[data-href="browser"]').click();

			},
			close: function (e)
			{
				$("#netlivaMediaModal").hide();
				$(document).off("dragenter",$.proxy(this.dragenter,this));
				$(document).off("dragleave",$.proxy(this.dragleave,this));
				$(document).off("dragover",$.proxy(this.dragover,this));
				$(document).off("drop",$.proxy(this.drop,this));
			},
			dragenter: function (e)
			{
				e.preventDefault();
				if(e.relatedTarget == null )
				{
					var uploader = this.modal.find(".nmlb-frame-uploader .nmlb-uploader-window");
					uploader.show();
					setTimeout(function(){ uploader.css({opacity:1}); }, 10);
				}
			},
			dragleave: function (e)
			{
				e.preventDefault();
				if(e.relatedTarget == null)
				{
					var uploader = this.modal.find(".nmlb-frame-uploader .nmlb-uploader-window");
					uploader.css({opacity:0});
					setTimeout(function(){ if (uploader.css("opacity") == 0) uploader.hide(); }, 300);
				}
			},
			dragover: function (e)
			{
				e.preventDefault();
			},
			drop: function (e)
			{
				e.preventDefault();
				/*
				var dt = e.originalEvent.dataTransfer;
				var length = dt.items.length;
				for (var i = 0; i < length; i++) {
					var entry = dt.items[i].webkitGetAsEntry();
					if (entry.isFile) {
					} else if (entry.isDirectory) {
					}
				}
				*/
				this.dropped_files = e.originalEvent.dataTransfer.files;
				$(document).trigger("dragleave");
				this.upload("dropzone");
			},
			route : function (e)
			{
				var $el = $(e.currentTarget);

				path = $el.data("href");
				$el.parent().find(">*").removeClass("active");
				$el.addClass("active");

				this.modal.find(".nmlb-frame-toolbar .nmlb-toolbar .nmlb-toolbar-left").html("");
				this.modal.find(".nmlb-frame-toolbar .nmlb-toolbar .nmlb-toolbar-right").html("");
				this["content_"+path]();
			},
			content_upload: function ()
			{
				this.modal.find(".nmlb-frame-content").html(this.create_upload_content());
			},
			content_browser: function ()
			{
				this.build_browser();

				var search = $('<input placeholder="'+this.l.search_input_ph+'" class="nmlb-browser-search" type="search" id="nmlb-media-search-input"></input>');
				var typing = $('<div class="nmlb-typing"><div style="width:100%;height:100%" class="nmlb-ellipsis"><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div></div>');
				var addBtn = $('<button class="nmlb-add-btn">'+this.l.add+'</button>');
				var selection = $(
					'<div class="nmlb-selection">' +
						'<div class="nmlb-selection-info">' +
							'<span class="nmlb-count">1 seçildi</span>' +
							'<button type="button" class="nmlb-button-link nmlb-clear-selection">'+this.l.clear+'</button>' +
						'</div>' +
						'<div class="nmlb-selection-view">' +
							'<ul class="nmlb-attachments">' +
							'</ul>' +
						'</div>' +
					'</div>');


				selection.find(".nmlb-clear-selection").click($.proxy(this.clear_selections, this));
				addBtn.click($.proxy(this.add_selected_media, this));

				typing.appendTo(this.modal.find(".nmlb-browser-toolbar .nmlb-toolbar-right"));
				search.appendTo(this.modal.find(".nmlb-browser-toolbar .nmlb-toolbar-right"));
				selection.appendTo(this.modal.find(".nmlb-frame-toolbar .nmlb-toolbar .nmlb-toolbar-left"));
				addBtn.appendTo(this.modal.find(".nmlb-frame-toolbar .nmlb-toolbar .nmlb-toolbar-right"));

				search.keyup($.proxy(this.search_change, this));

				this.update_selection();

				this.file_list();

			},
			add_selected_media: function ()
			{
				this.settings.callback(this.selected_medias);
				this.close();
			},
			create_upload_content: function ()
			{
				var upload = $('<div class="nmlb-upload-content">' +
					'<label for="nmlb-file">' +
					( this.is_advanced_upload ?
							'<div>'+this.l.upload_msg_l1+'</div>' +
							'<div><small>'+this.l.upload_msg_l2+'</small></div>' : ""
					) +
					'<div><button class="nmlb-upload-btn" type="button">'+this.l.upload_msg_btn+'</button></div>' +
					'<div><small>'+this.l.upload_msg_l3+'</small></div>' +
					'</label>' +
					'</div>');
				that = this;
				upload.find(".nmlb-upload-btn").click(function () {
					that.modal.find("#nmlb-file").click();
				});

				return upload;
			},
			build_browser: function ()
			{
				var browser = $('<div class="nmlb-browser"></div>');
				var toolbar = $('<div class="nmlb-browser-toolbar"></div>');
				var attachments = $('<ul class="nmlb-attachments"></ul>');
				var sidebar = $('<div class="nmlb-sidebar"></div>');
				var toolbarLeft = $('<div class="nmlb-toolbar-left"></div>');
				var toolbarRight = $('<div class="nmlb-toolbar-right"></div>');
				var loading = $('<div class="nmlb-loading"><div style="width:100%;height:100%" class="lds-double-ring"><div></div><div></div></div>');
				var not_found = this.create_upload_content();
				not_found.find(".nmlb-upload-content").prepend('<div>'+this.l.not_found+'</div>');

				toolbarLeft.appendTo(toolbar);
				toolbarRight.appendTo(toolbar);

				toolbar.appendTo(browser);
				loading.appendTo(browser);
				attachments.appendTo(browser);
				not_found.appendTo(browser);
				sidebar.appendTo(browser);

				this.modal.find(".nmlb-frame-content").html(browser);

			},
			file_list: function ()
			{
				var attcs = this.modal.find('.nmlb-browser .nmlb-attachments');
				var notfd = this.modal.find('.nmlb-browser .nmlb-upload-content');
				this.modal.find(".nmlb-browser .nmlb-loading").css("opacity", 1);

				notfd.css("opacity", 0);
				attcs.css("opacity", 0);
				setTimeout(function () {
					notfd.hide();
					attcs.hide();
				},300);

				var that = this;
				$.ajax({
					url:this.file_list_url, dataType: "json", type: "post",
					data:{
						search_text: this.modal.find('.nmlb-browser .nmlb-browser-search').val()
					},
					success: function (response) {
						attcs.html("");

						setTimeout(function () {

							that.modal.find(".nmlb-browser .nmlb-loading").css("opacity", 0);
							that.modal.find(".nmlb-browser .nmlb-typing").css("opacity", 0);

							attcs.show();
							setTimeout(function () { attcs.css("opacity", 1); }, 10);

						},300);

						if (response.length)
						{

							$.each(response, function (key, data) {
								that.new_attachment(data);
							})
						}
						else
						{
							notfd.show();
							setTimeout(function () { notfd.css("opacity", 1); }, 10);
						}
					}
				});
			},

			search_interval: null,
			search_change: function ()
			{
				var time = 2;
				var that = this;

				this.modal.find(".nmlb-typing").css("opacity", 1);

				if (this.search_interval) clearInterval(this.search_interval);

				this.search_interval = setInterval(function () {
					time--;
					if (time<0)
					{
						clearInterval(that.search_interval);
						that.file_list();
					}
				},100);
			},

			new_attachment: function (data)
			{
				var attachments = this.modal.find('.nmlb-browser .nmlb-attachments');

				var attachment = this.prepare_attachment({
					id: data.id,
					url: data.url,
					filename: data.filename,
					class: data.id in this.selected_medias ? "selected" : ""
				});

				attachment.appendTo(attachments);
			},
			select_attachment : function (e)
			{
				var $el = $(e.currentTarget).parent();

				if (!this.selected_medias.hasOwnProperty($el.data("id"))) this.selected_medias[$el.data("id")] = { "url": $el.find("img").attr("src"), "filename":$el.data("filename") }
				this.update_selection();

				this.modal.find('.nmlb-attachment:not(*[data-id="'+$el.data("id")+'"])').removeClass("active");
				this.modal.find('.nmlb-attachment[data-id="'+$el.data("id")+'"]').addClass("active");
				this.modal.find('.nmlb-attachment[data-id="'+$el.data("id")+'"]').addClass("selected");
			},
			deselect_attachment : function (e)
			{
				var $el = $(e.currentTarget).parent();

				if (this.selected_medias.hasOwnProperty($el.data("id"))) delete(this.selected_medias[$el.data("id")]);
				this.update_selection();

				this.modal.find('.nmlb-attachment[data-id="'+$el.data("id")+'"]').removeClass("active");
				this.modal.find('.nmlb-attachment[data-id="'+$el.data("id")+'"]').removeClass("selected");
			},
			clear_selections : function () {
				this.selected_medias = {}
				this.update_selection();
				this.modal.find('.nmlb-attachment').removeClass("active");
				this.modal.find('.nmlb-attachment').removeClass("selected");
			},
			update_selection : function () {
				selection = this.modal.find(".nmlb-frame-toolbar .nmlb-selection");
				console.log(this.selected_medias);
				if (this.size(this.selected_medias))
				{
					selection.removeClass("empty");
					this.modal.find(".nmlb-add-btn").show();
					selection.find(".nmlb-count").text(this.size(this.selected_medias)+" "+this.l.selected);
					attachments = selection.find(".nmlb-attachments");
					attachments.html("");
					var that = this;
					$.each(this.selected_medias, function (key, val) {
						var attachment = that.prepare_attachment({
							class: "selection",
							id: key,
							url: val.url,
							filename: val.filename,
						});

						attachment.find(".nmlb-attachment-preview").click(function () {
							var browser_attachments = that.modal.find('.nmlb-browser .nmlb-attachments');
							if (browser_attachments.find(".nmlb-attachment[data-id="+key+"]").length)
							{
								var scTop = browser_attachments.scrollTop()+browser_attachments.find(".nmlb-attachment[data-id="+key+"]").position().top;
								browser_attachments.animate({
									scrollTop: Math.floor(scTop) - 5
								},600);
							}
						});

						attachment.appendTo(attachments);
					})
				}
				else
				{
					selection.addClass("empty");
					this.modal.find(".nmlb-add-btn").hide();
				}
			},
			prepare_attachment : function (data) {
				data = $.extend({"url":"", "id":"", "filename":"", "class":""}, data);
				var attachment = $('<li role="checkbox" aria-checked="true" class="nmlb-attachment '+data.class+'" data-id="'+data.id+'" data-filename="'+data.filename+'"></li>');
				var preview = $('<div class="nmlb-attachment-preview">' +
					'<div class="thumbnail">' +
					'<div class="centered">' +
					'<img src="'+data.url+'">' +
					'</div>' +
					'</div>' +
					'</div>');
				preview.click($.proxy(this.select_attachment, this));
				preview.appendTo(attachment);

				if (data.class != "selection")
				{
					var deselect = $('<button type="button" class="check"><span class="nmlb-icon"></span></button>');
					deselect.click($.proxy(this.deselect_attachment,this));
					deselect.appendTo(attachment);
				}

				return attachment;
			},
			upload : function (type)
			{
				if (this.is_uploading) return false;

				if(type == "dropzone")
				{
					this.upload_ajax();
				}
				else
				{
					this.upload_iframe();
				}
			},
			upload_ajax: function ()
			{
				var that = this;
				var ajaxData = new FormData();

				if (this.dropped_files) {
					$.each( this.dropped_files, function(i, file) {
						ajaxData.append( that.file_input_name, file );
					});
				}

				$.ajax({
					url: this.upload_url,
					type: "post",
					data: ajaxData,
					dataType: 'json',
					cache: false,
					contentType: false,
					processData: false,
					complete: $.proxy(that.upload_complate,that),
					success: $.proxy(that.upload_success,that),
					error: function() {
						// Log the error, show an alert, whatever works for you
					}
				});
			},
			upload_iframe: function ()
			{
				var iframeName  = 'uploadiframe' + new Date().getTime();
				$iframe   = $('<iframe name="' + iframeName + '" style=""></iframe>');

				$form = $("<form />");
				$form.attr('target', iframeName);
				$form.attr('method', "post");
				$form.attr('enctype', "multipart/form-data");
				$form.attr('action', this.upload_url);
				this.modal.find('input[name="'+this.file_input_name+'"]').clone().appendTo($form);

				$('body').append($form);
				$('body').append($iframe);

				$form.submit();


				that = this;
				$iframe.one('load', function() {
					var data = JSON.parse($iframe.contents().find('body').text());
					$iframe.remove();
					$form.remove();
					that.upload_complate();
					that.upload_success(data);
				});
			},

			upload_complate: function () {
				this.is_uploading = false;
				if (this.modal.find(".nmlb-frame-router .active").data("href") == "browser")
					this.file_list();
				else
					this.modal.find(".nmlb-frame-router li[data-href=browser]").click();
			},
			upload_success: function (data) {
				that = this;
				first = Object.keys(data.files)[0];
				say = 0;
				inter = setInterval(function () {
					find = that.modal.find('.nmlb-frame-content .nmlb-attachments .nmlb-attachment[data-id="'+first+'"]').length;
					if (find)
					{
						that.clear_selections();
						$.each(data.files, function (key, file) {
							that.modal.find('.nmlb-frame-content .nmlb-attachments .nmlb-attachment[data-id="'+key+'"] .nmlb-attachment-preview').click();
						});
						clearInterval(inter);
					}
					say++;
					if(say>200)
						clearInterval(inter);

				},100);
			},

			readLang : function () {
				if (this.langs[this.lang] != undefined)
					$.extend( true, this.l, this.langs[this.lang]);
			},
			size : function(obj) {
				var size = 0, key;
				for (key in obj) {
					if (obj.hasOwnProperty(key)) size++;
				}
				return size;
			}
		};

		$.fn.openNetlivaMediaLib = function(settings)
		{
			this.click(function(){
				$.nmlb.netlivaMediaLib(settings);
				return false;
			});
		};

	})(jQuery);


}