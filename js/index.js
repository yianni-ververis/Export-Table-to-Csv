/*
 * @owner yianni.ververis@qlik.com
 *
 */
 var me = {
    config: {
        host: 'sense-demo.qlik.com',
        prefix: "/",
        port: 443,
        isSecure: true,
    },

    vars: {
        id: '1b4194fd-0ace-4934-80ff-2c679b19624e'
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

            // Get the Qlik Sense Object Table
            me.obj.app = qlik.openApp(me.vars.id, me.config);

            me.events();
            
            me.getData(function () {
                me.displayData();
            });

        } );
    },

    events: function () {
        $( document ).ready(function() {

            $(".container").height($("body").height() - 50);

            $("#export").on('click', function (event) {
                me.exportTableToCSV.apply(this, [$('#tableData'), 'QlikSenseExport.csv']);
            });

            $("#exportSense").on('click', function (event) {
                // CSV
                me.exportTableToCSV.apply(this, [$('.qv-object-table'), 'QlikSenseExport.csv']);
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

        // Get the Qlik Sense Table Object
        me.obj.app.getObject(document.getElementById('DBujmm'), 'DBujmm');
    },

    // Get raw data with HyperQube to create the Table
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

    // Refactor Data to a more readable format rather than qText etc.
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

    // Prepare Data for Display
    displayData: function () {
        $.each(me.data.rf, function(key, value) {
            var html = '<tr>\
                <td>' + value.school + '</td>\
                <td>' + value.pre10 + '</td>\
                <td>' + value.post10 + '</td>\
                <td></td>\
                <td></td>\
                <td>' + value.conference + '</td>\
            </tr>';

            $('#tableData').append(html);
        });

        // After everything is rendered, enable the buttons for export
        $('#export').removeClass('disabled');
        $('#exportSense').removeClass('disabled');
    },

    exportTableToCSV: function ($table, filename) {
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
                    // Select all of the TH and TD tags
                    // If its a Sense Object, remove the search column
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

        // Check if browser is IE
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
        me.log('exportTableToCSV', 'Success!');
    },

    // Custom Logger
    log: function (type, message) {
        console.log('%c ' + type + ': ', 'color: red', message);
    },

};

app = me;

app.boot();