/*
 * @owner yianni.ververis@qlik.com
 *
 */
 var me = {
    config: {
        host: 'sense-demo.qlik.com',
        // host: 'demos.qlik.com',
        // host: 'usrad-jvs.qliktech.com',
        // host: window.location.hostname,
        prefix: "/",
        port: 443,
        isSecure: true,
        // noInteractions: 'true'
    },

    vars: {
        id: '1b4194fd-0ace-4934-80ff-2c679b19624e', // demos
        // id: '9fa7ec06-69b1-4bdc-904d-fe902673c96c', // Local
        invitees: 1,
        total: 0,
        limit: 100,
    },

    data: {},

    obj: {
        qlik: null,
        app: null
    },

    init: function () {
        require.config( {
            baseUrl: ( me.config.isSecure ? "https://" : "http://" ) + me.config.host + (me.config.port ? ":" + me.config.port: "") + me.config.prefix + "resources"
        });
    },

    boot: function () {
        me.init();

        me.log('Boot', 'Success!');

        require(['js/qlik'], function (qlik) {
            me.obj.qlik = qlik;
            qlik.setOnError( function ( error ) {
                alert( error.message );
            } );

            me.obj.app = qlik.openApp(me.vars.id, me.config);

            me.events();
            
            me.getData(function () {
             me.displayData();
            });
            // me.getObjects();

        } );
    },

    events: function () {
        $( document ).ready(function() {
            $(".container").height($("body").height() - 50);

            $(".export").on('click', function (event) {
                // CSV
                me.exportTableToCSVsense.apply(this, [$('#dvData>table'), 'export.csv']);
            });

            $(".exportSense").on('click', function (event) {
                // CSV
                // me.exportTableToCSV.apply(this, [$('.qv-object-table>table'), 'export.csv']);
                me.exportTableToCSVsense.apply(this, [$('.qv-object-table'), 'export.csv']);
            });

        });

        $(window).resize(function() {
            $(".container").height($("body").height());
        });

        //resize on scroll end
        $(window).scroll(function() {
            me.obj.qlik.resize()
        });

        $(window).resize(function() {
            me.obj.qlik.resize()
        });

        me.obj.app.getObject(document.getElementById('DBujmm'), 'DBujmm');
    },

    getData: function (callback) {
        me.obj.app.createCube({
            qDimensions : [{
                qDef : {
                    qFieldDefs : ["School"]
                }
            },{
                qDef : {
                    qFieldDefs : ["Conference"]
                }
            }
            ],
            qMeasures : [
            {
                "qLabel": "# Preseason Top 10",
                "qLibraryId": "HdsZnjL",
                "qSortBy": {
                    "qSortByState": 0,
                    "qSortByFrequency": 0,
                    "qSortByNumeric": 0,
                    "qSortByAscii": 1,
                    "qSortByLoadOrder": 0,
                    "qSortByExpression": 0,
                    "qExpression": {
                        "qv": " "
                    }
                }
            },
            {
                "qLabel": "# Postseason Top 10",
                "qLibraryId": "tEknwb",
                "qSortBy": {
                    "qSortByState": 0,
                    "qSortByFrequency": 0,
                    "qSortByNumeric": 0,
                    "qSortByAscii": 1,
                    "qSortByLoadOrder": 0,
                    "qSortByExpression": 0,
                    "qExpression": {
                        "qv": " "
                    }
                }
            }
            ],
            qInitialDataFetch : [{
                qTop : 0,
                qLeft : 0,
                qHeight : 20,
                qWidth : 5
            }]
        }, function(reply) {
            me.log('getData', 'Success!');
            me.data.hq = reply.qHyperCube.qDataPages[0].qMatrix;
            me.refactorData();
            callback(true);
        });
    },

    refactorData: function () {
        var data = [];
        $.each(me.data.hq, function(key, value) {
            data[key] = {};
            data[key].school = value[0].qText;
            data[key].conference = value[1].qText;
            data[key].pre10 = value[2].qText;
            data[key].post10 = value[3].qText;
        });
        me.data.rf = data;
    },

    displayData: function () {
        $.each(me.data.rf, function(key, value) {
            var html = '\
                <div class="row">\
                    <div class="col-md-2"><a onclick="app.selectField(\'' + value.school + '\')">' + value.school + '</a></div>\
                    <div class="col-md-2">' + value.pre10 + '</div>\
                    <div class="col-md-2">' + value.post10 + '</div>\
                    <div class="col-md-2"></div>\
                    <div class="col-md-2"></div>\
                    <div class="col-md-2">' + value.conference + '</div>\
                </div>\
            ';

            var htmlTable = '<tr>\
                <td>' + value.school + '</td>\
                <td>' + value.pre10 + '</td>\
                <td>' + value.post10 + '</td>\
                <td></td>\
                <td></td>\
                <td>' + value.conference + '</td>\
            </tr>';

            $('#content').append(html);
            // $('#tableData tr:last').after(htmlTable);
            $('#tableData').append(htmlTable);
        });
    },

    exportTableToCSV: function ($table, filename) {
        // var $rows = $table.find('tr:has(td)'),
        var $rows = $table.filter('th, td'),

            // Temporary delimiter characters unlikely to be typed by keyboard
            // This is to avoid accidentally splitting the actual contents
            tmpColDelim = String.fromCharCode(11), // vertical tab character
            tmpRowDelim = String.fromCharCode(0), // null character

            // actual delimiter characters for CSV format
            colDelim = '","',
            rowDelim = '"\r\n"',

            // Grab text from table into CSV formatted string
            csv = '"' + $rows.map(function (i, row) {
                var $row = $(row),
                    // $cols = $row.find('td');
                    $cols = $row.filter('th, td');

                return $cols.map(function (j, col) {
                    var $col = $(col),
                        text = $col.text();

                    return text.replace(/"/g, '""'); // escape double quotes

                }).get().join(tmpColDelim);

            }).get().join(tmpRowDelim)
                .split(tmpRowDelim).join(rowDelim)
                .split(tmpColDelim).join(colDelim) + '"',

            // Data URI
            csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

        if ( window.navigator.msSaveOrOpenBlob && window.Blob ) {
            var blob = new Blob( [ csv ], { type: "text/csv" } );
            navigator.msSaveOrOpenBlob( blob, filename );
        } else {
            $(this)
                .attr({
                'download': filename,
                    'href': csvData,
                    'target': '_blank'
            });
            }
    },

    exportTableToCSVsense: function ($table, filename) {
        var $rows = $table.find('tr:has(th), tr:has(td)'),

            // Temporary delimiter characters unlikely to be typed by keyboard
            // This is to avoid accidentally splitting the actual contents
            tmpColDelim = String.fromCharCode(11), // vertical tab character
            tmpRowDelim = String.fromCharCode(0), // null character

            // actual delimiter characters for CSV format
            colDelim = '","',
            rowDelim = '"\r\n"';

            // Grab text from table into CSV formatted string
            var csv = '"' + $rows.map(function (i, row) {
                var $row = $(row),
                    $cols = $row.find('th:not(.qv-st-header-cell-search), td');

                return $cols.map(function (j, col) {
                    var $col = $(col),
                        text = $col[0].outerText;

                    text.replace(/"/g, '""'); // escape double quotes

                    return text; 

                }).get().join(tmpColDelim);

            }).get().join(tmpRowDelim)
                .replace(/\r?\n|\r/g, '')
                .split(tmpRowDelim).join(rowDelim)
                .split(tmpColDelim).join(colDelim) + '"',

            // Data URI
            csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

console.log(csv);

        if ( window.navigator.msSaveOrOpenBlob && window.Blob ) {
            var blob = new Blob( [ csv ], { type: "text/csv" } );
            navigator.msSaveOrOpenBlob( blob, filename );
        } else {
            $(this)
                .attr({
                'download': filename,
                    'href': csvData,
                    'target': '_blank'
            });
        }
    },

    clearAll: function () {
        me.obj.app.clearAll();
    },

    selectField: function (text) {
        me.log('Field Selected', text);
        me.obj.app.field('School').selectValues([text], true, true);
    },

    getObjects: function () {
        me.obj.app.getAppObjectList( 'sheet', function(reply){
            console.log(reply);
        });
        me.obj.app.getList( 'MeasureList', function(reply){
            // FieldList
            // MeasureList
            // DimensionList
            // BookmarkList
            // CurrentSelections
            console.log(reply);
        });
    },

    // Custom Logger
    log: function (type, message) {
        console.log('%c ' + type + ': ', 'color: red', message);
    },

};

app = me;

app.boot();