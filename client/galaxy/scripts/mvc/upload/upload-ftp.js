/** This renders the content of the ftp popup **/
define( [ 'utils/utils' ], function( Utils ) {
    return Backbone.View.extend({
        initialize: function( options ) {
            var self = this;
            this.options = Utils.merge( options, {
                css             : 'upload-ftp',
                class_add       : 'upload-icon-button fa fa-square-o',
                class_remove    : 'upload-icon-button fa fa-check-square-o',
                class_partial   : 'upload-icon-button fa fa-minus-square-o',
                show_help       : true,
                collection      : null,
                onchange        : function() {},
                onadd           : function() {},
                onremove        : function() {}
            } );
            this.collection = this.options.collection;
            this.setElement( this._template() );
            this.$content = this.$( '.upload-ftp-content' );
            this.$wait    = this.$( '.upload-ftp-wait' );
            this.$help    = this.$( '.upload-ftp-help' );
            this.$number  = this.$( '.upload-ftp-number' );
            this.$disk    = this.$( '.upload-ftp-disk' );
            this.$body    = this.$( '.upload-ftp-body' );
            this.$warning = this.$( '.upload-ftp-warning' );
            this.$select  = this.$( '.upload-ftp-select-all' );
            this.render();
        },

        render: function() {
            var self = this;
            this.$wait.show();
            this.$content.hide();
            this.$warning.hide();
            this.$help.hide();
            $.ajax({
                url     : Galaxy.root + 'api/remote_files',
                method  : 'GET',
                success : function( ftp_files ) { self._renderTable( ftp_files ) },
                error   : function() { self._renderTable() }
            });
        },

        /** Template help */
        helpText: function() {
            return 'This Galaxy server allows you to upload files via FTP. To upload some files, log in to the FTP server at <strong>' + this.options.ftp_upload_site + '</strong> using your Galaxy credentials.'
        },

        /** Fill table with ftp entries */
        _renderTable: function( ftp_files ) {
            var self = this;
            this.rows = [];
            if ( ftp_files && ftp_files.length > 0 ) {
                this.$body.empty();
                var size = 0;
                for (var index in ftp_files ) {
                    this.rows.push( this._add( ftp_files[ index ] ) );
                    size += ftp_files[ index ].size;
                }
                this.$number.html( ftp_files.length + ' files' );
                this.$disk.html( Utils.bytesToString ( size, true ) );
                if ( this.collection ) {
                    this.$( '._has_collection' ).show();
                    this.$select.addClass( this.options.class_add )
                                .off().on( 'click', function() {
                                    var add = self.$select.hasClass( self.options.class_add );
                                    for (var index in ftp_files ) {
                                        var ftp_file = ftp_files[ index ];
                                        var model_index = self._find( ftp_file );
                                        if( !model_index && add || model_index && !add ) {
                                            self.rows[ index ].trigger( 'click' );
                                        }
                                    }
                                });
                    this._refresh();
                }
                this.$content.show();
            } else {
                this.$warning.show();
            }
            this.options.show_help && this.$help.show();
            this.$wait.hide();
        },

        /** Add file to table */
        _add: function( ftp_file ) {
            var self = this;
            var $it = $( this._templateRow( ftp_file ) );
            var $icon = $it.find( '.icon' );
            this.$body.append( $it );
            if ( this.collection ) {
                $icon.addClass( this._find( ftp_file ) ? this.options.class_remove : this.options.class_add );
                $it.on('click', function() {
                    var model_index = self._find( ftp_file );
                    $icon.removeClass();
                    if ( !model_index ) {
                        self.options.onadd( ftp_file );
                        $icon.addClass( self.options.class_remove );
                    } else {
                        self.options.onremove( model_index );
                        $icon.addClass( self.options.class_add );
                    }
                    self._refresh();
                });
            } else {
                $it.on('click', function() { self.options.onchange( ftp_file ) } );
            }
            return $it;
        },

        /** Refresh select all button state */
        _refresh: function() {
            var filtered = this.collection.where( { file_mode: 'ftp', enabled: true } );
            this.$select.removeClass();
            if ( filtered.length == 0 ) {
                this.$select.addClass( this.options.class_add );
            } else {
                this.$select.addClass( filtered.length == this.rows.length ? this.options.class_remove : this.options.class_partial );
            }
        },

        /** Get model index */
        _find: function( ftp_file ) {
            var item = this.collection.findWhere({
                file_path   : ftp_file.path,
                file_mode   : 'ftp',
                enabled     : true
            });
            return item && item.get('id');
        },

        /** Template of row */
        _templateRow: function( options ) {
            return  '<tr class="upload-ftp-row">' +
                        '<td class="_has_collection" style="display: none;"><div class="icon"/></td>' +
                        '<td class="ftp-name">' + _.escape(options.path) + '</td>' +
                        '<td class="ftp-size">' + Utils.bytesToString( options.size ) + '</td>' +
                        '<td class="ftp-time">' + options.ctime + '</td>' +
                    '</tr>';
        },

        /** Template of main view */
        _template: function() {
            return  '<div class="' + this.options.css + '">' +
                        '<div class="upload-ftp-wait fa fa-spinner fa-spin"/>' +
                        '<div class="upload-ftp-help">' + this.helpText() + '</div>' +
                        '<div class="upload-ftp-content">' +
                            '<span style="whitespace: nowrap; float: left;">Available files: </span>' +
                            '<span style="whitespace: nowrap; float: right;">' +
                                '<span class="upload-icon fa fa-file-text-o"/>' +
                                '<span class="upload-ftp-number"/>&nbsp;&nbsp;' +
                                '<span class="upload-icon fa fa-hdd-o"/>' +
                                '<span class="upload-ftp-disk"/>' +
                            '</span>' +
                            '<table class="grid" style="float: left;">' +
                                '<thead>' +
                                    '<tr>' +
                                        '<th class="_has_collection" style="display: none;"><div class="upload-ftp-select-all"></th>' +
                                        '<th>Name</th>' +
                                        '<th>Size</th>' +
                                        '<th>Created</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody class="upload-ftp-body"/>' +
                            '</table>' +
                        '</div>' +
                        '<div class="upload-ftp-warning warningmessage">' +
                            'Your FTP directory does not contain any files.' +
                        '</div>'
                    '<div>';
        }
    });
});
