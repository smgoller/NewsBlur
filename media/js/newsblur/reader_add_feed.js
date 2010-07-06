NEWSBLUR.ReaderAddFeed = function(feed_id, score, options) {
    var defaults = {};
    
    this.options = $.extend({}, defaults, options);
    this.model = NEWSBLUR.AssetModel.reader();
    this.google_favicon_url = 'http://www.google.com/s2/favicons?domain_url=';
    this.runner();
};

NEWSBLUR.ReaderAddFeed.prototype = {
    
    runner: function() {
        this.make_modal();
        this.handle_cancel();
        this.open_modal();
        this.handle_keystrokes();
        
        this.$add.bind('click', $.rescope(this.handle_click, this));
    },
    
    make_modal: function() {
        var self = this;
        
        this.$add = $.make('div', { className: 'NB-add NB-modal' }, [
            $.make('h2', { className: 'NB-modal-title' }, 'Add feeds and folders'),
            $.make('div', { className: 'NB-add-form' }, [
                $.make('div', { className: 'NB-fieldset NB-add-add-url' }, [
                    $.make('h5', [
                        $.make('div', { className: 'NB-add-folders' }, this.make_folders()),
                        'Add a new feed'
                    ]),
                    $.make('div', { className: 'NB-fieldset-fields' }, [
                        $.make('div', [
                            $.make('div', { className: 'NB-loading' }),
                            $.make('label', { 'for': 'NB-add-url' }, 'RSS or URL: '),
                            $.make('input', { type: 'text', id: 'NB-add-url', className: 'NB-add-url', name: 'url' }),
                            $.make('input', { type: 'submit', value: 'Add it', className: 'NB-add-url-submit' }),
                            $.make('div', { className: 'NB-error' })
                        ])
                    ])
                ]),
                $.make('div', { className: 'NB-fieldset NB-add-add-folder' }, [
                    $.make('h5', [
                        $.make('div', { className: 'NB-add-folders' }, this.make_folders()),
                        'Add a new folder'
                    ]),
                    $.make('div', { className: 'NB-fieldset-fields' }, [
                        $.make('div', [
                            $.make('div', { className: 'NB-loading' }),
                            $.make('label', { 'for': 'NB-add-folder' }, [
                                $.make('div', { className: 'NB-folder-icon' })
                            ]),
                            $.make('input', { type: 'text', id: 'NB-add-folder', className: 'NB-add-folder', name: 'url' }),
                            $.make('input', { type: 'submit', value: 'Add folder', className: 'NB-add-folder-submit' }),
                            $.make('div', { className: 'NB-error' })
                        ])
                    ])
                ]),
                $.make('div', { className: 'NB-fieldset' }, [
                    $.make('h5', [
                        'Import from Google Reader'
                    ]),
                    $.make('div', { className: 'NB-fieldset-fields' }, [
                        $.make('a', { href: NEWSBLUR.URLs['opml-reader-authorize'], className: 'NB-opml-reader-oauth NB-splash-link' }, [
                            'Import everything from Google Reader (OAuth)',
                            $.make('img', { className: 'NB-add-google-reader-arrow', src: NEWSBLUR.Globals['MEDIA_URL']+'img/icons/silk/arrow_right.png' })
                        ]),
                        $.make('div', { className: 'NB-add-danger' }, [
                            $.make('img', { src: NEWSBLUR.Globals['MEDIA_URL']+'img/icons/silk/server_go.png' }),
                            'This will erase all existing feeds and folders.'
                        ])
                    ])
                ]),
                $.make('div', { className: 'NB-fieldset NB-add-opml' }, [
                    $.make('h5', 'Upload OPML'),
                    $.make('div', { className: 'NB-fieldset-fields' }, [
                        $.make('form', { method: 'post', enctype: 'multipart/form-data', className: 'NB-add-form' }, [
                            $.make('div', { className: 'NB-loading' }),
                            $.make('input', { type: 'file', name: 'file', id: 'opml_file_input' }),
                            $.make('input', { type: 'submit', className: 'NB-add-opml-button', value: 'Upload OPML File' }).click(function(e) {
                                e.preventDefault();
                                self.handle_opml_upload();
                                return false;
                            })
                        ]),
                        $.make('div', { className: 'NB-add-danger' }, [
                            $.make('img', { src: NEWSBLUR.Globals['MEDIA_URL']+'img/icons/silk/server_go.png' }),
                            'This will erase all existing feeds and folders.'
                        ])
                    ])
                ])
            ])
        ]);
    
    },
    
    make_folders: function() {
        var folders = this.model.get_folders();
        var $options = $.make('select', { className: 'NB-folders'});
        
        var $option = $.make('option', { value: '' }, "Top Level");
        $options.append($option);

        $options = this.make_folder_options($options, folders, '-');
        
        return $options;
    },

    make_folder_options: function($options, items, depth) {
        for (var i in items) {
            var item = items[i];
            if (typeof item == "object") {
                for (var o in item) {
                    var folder = item[o];
                    var $option = $.make('option', { value: o }, depth + ' ' + o);
                    $options.append($option);
                    $options = this.make_folder_options($options, folder, depth+'-');
                }
            }
        }
    
        return $options;
    },

    open_modal: function() {
        var self = this;

        var $holder = $.make('div', { className: 'NB-modal-holder' }).append(this.$add).appendTo('body').css({'visibility': 'hidden', 'display': 'block', 'width': 600});
        var height = $('.NB-add', $holder).outerHeight(true);
        $holder.css({'visibility': 'visible', 'display': 'none'});
        var w = $.modal.impl.getDimensions();
        if (height > w[0] - 70) {
            height = w[0] - 70;
        }
        this.$add.modal({
            'minWidth': 600,
            'maxHeight': height,
            'overlayClose': true,
            'onOpen': function (dialog) {
	            dialog.overlay.fadeIn(200, function () {
		            dialog.container.fadeIn(200);
		            dialog.data.fadeIn(200);
	            });
            },
            'onShow': function(dialog) {
                $('#simplemodal-container').corner('6px').css({'width': 600, 'height': height});
                // $('.NB-classifier-tag', self.$add).corner('4px');
            },
            'onClose': function(dialog) {
                dialog.data.hide().empty().remove();
                dialog.container.hide().empty().remove();
                dialog.overlay.fadeOut(200, function() {
                    dialog.overlay.empty().remove();
                    $.modal.close();
                });
                $('.NB-modal-holder').empty().remove();
            }
        });
    },
    
    handle_cancel: function() {
        var $cancel = $('.NB-modal-cancel', this.$add);
        
        $cancel.click(function(e) {
            e.preventDefault();
            $.modal.close();
        });
    },
    
    handle_keystrokes: function() {
        var self = this;
        
        $('.NB-add-url', this.$add).bind('keyup', 'return', function(e) {
            e.preventDefault();
            self.save_add_url();
        });  
        
        $('.NB-add-folder', this.$add).bind('keyup', 'return', function(e) {
            e.preventDefault();
            self.save_add_folder();
        });  
    },
        
    // ========
    // = OPML =
    // ========
        
    handle_opml_upload: function() {
        var self = this;
        var $loading = $('.NB-fieldset.NB-add-opml .NB-loading');
        $loading.addClass('NB-active');

        // NEWSBLUR.log(['Uploading']);
        $.ajaxFileUpload({
			url: '/import/opml_upload', 
			secureuri: false,
			fileElementId: 'opml_file_input',
			dataType: 'text',
			success: function (data, status)
			{
                $loading.removeClass('NB-active');
				NEWSBLUR.reader.load_feeds();
				$.modal.close();
			},
			error: function (data, status, e)
			{
                $loading.removeClass('NB-active');
				NEWSBLUR.log(['Error', data, status, e]);
			}
		});
		
		return false;
    },
    
    // ===========
    // = Actions =
    // ===========

    handle_click: function(elem, e) {
        var self = this;
        
        $.targetIs(e, { tagSelector: '.NB-add-url-submit' }, function($t, $p) {
            e.preventDefault();
            
            self.save_add_url();
        });
        
        $.targetIs(e, { tagSelector: '.NB-add-folder-submit' }, function($t, $p) {
            e.preventDefault();
            
            self.save_add_folder();
        });        
        
    },
    
    save_add_url: function() {
        var $error = $('.NB-error', '.NB-fieldset.NB-add-add-url');
        var $loading = $('.NB-loading', '.NB-fieldset.NB-add-add-url');
        
        var url = $('.NB-add-url').val();
        var folder = $('.NB-add-url').parents('.NB-fieldset').find('.NB-folders').val();
            
        $error.slideUp(300);
        $loading.addClass('NB-active');

        this.model.save_add_url(url, folder, $.rescope(this.post_save_add_url, this));
    },
    
    post_save_add_url: function(e, data) {
        NEWSBLUR.log(['Data', data]);
        var $loading = $('.NB-loading', '.NB-fieldset.NB-add-add-url');
        $loading.removeClass('NB-active');
        
        if (data.code > 0) {
            NEWSBLUR.reader.load_feeds();
            $.modal.close();
        } else {
            var $error = $('.NB-error', '.NB-fieldset.NB-add-add-url');
            $error.text(data.message);
            $error.slideDown(300);
        }
    },
    
    save_add_folder: function() {
        var $error = $('.NB-error', '.NB-fieldset.NB-add-add-folder');
        var $loading = $('.NB-loading', '.NB-fieldset.NB-add-add-folder');
        
        var folder = $('.NB-add-folder').val();
        var parent_folder = $('.NB-add-folder').parents('.NB-fieldset').find('.NB-folders').val();
            
        $error.slideUp(300);
        $loading.addClass('NB-active');

        this.model.save_add_folder(folder, parent_folder, $.rescope(this.post_save_add_folder, this));
    },
    
    post_save_add_folder: function(e, data) {
        NEWSBLUR.log(['Data', data]);
        var $loading = $('.NB-loading', '.NB-fieldset.NB-add-add-folder');
        $loading.removeClass('NB-active');
        
        if (data.code > 0) {
            NEWSBLUR.reader.load_feeds();
            $.modal.close();
        } else {
            var $error = $('.NB-error', '.NB-fieldset.NB-add-add-folder');
            $error.text(data.message);
            $error.slideDown(300);
        }
    }
    
};