
/** Ext JsonReader for World Bank Data**/
Ext.namespace('Ext.ux.data', 'Ext.ux.util', 'Ext.ux.tree');

Ext.ux.util.OnDemandLoadByAjax = function() {
    loadComponent = function(component) {
        var sURL = null;
        var sCALLBACK = null;

        if (typeof component === "string") {
            sURL = component;
        } else if (typeof component === "object") {
            sURL = component[0];
            sCALLBACK = component[1];
        }

        handleSuccess = function(response, options) {
            var head = document.getElementsByTagName("head")[0];
            var js = document.createElement('script');
            js.setAttribute("type", "text/javascript");
            js.text = response.responseText;
            if (!document.all) {
                js.innerHTML = response.responseText;
            }

            head.appendChild(js);
            if (typeof sCALLBACK == "function") {
                if (document.all) {
                    sCALLBACK();
                } else {
                    sCALLBACK.defer(50);
                }
            }
        }

        handleFailure = function(response, options) {
            alert('Dynamic load script: [' + sURL + '] failed!');
        }

        Ext.Ajax.request({
            url: sURL ,method: 'GET' ,success: handleSuccess ,failure: handleFailure ,disableCaching : false
        });

    }
    
    return {
        load: function(components) {
            Ext.each(components, function(component) {
                loadComponent(component);
            });
        }
    }
}();

/** end of code **/

/** example of use, one callback only **/
/*
var oScripts = [
    'dependence1.js', 'dependence2.js', [ 'script.php', function(options) {
            alert('this is a callback after script.php');
        }
    ]
];
Ext.ux.OnDemandLoadByAjax.load(oScripts);
*/

/** example of use, multiples callbacks **/
/*
var oScripts = [
    [ 'script1.php', function(options) {
            alert('this is a callback after script1.php');
        }
    ] ,[ 'script2.php', function(options) {
        alert('this is a callback after script2.php');
        }
    ]
];


Ext.ux.cmp.wbGeomapTabPanel = function( mapType ) {
	return {
        title: 'google map',
        id: 'wb-center-' + mapType + '-panel',
        layout: 'anchor',
        items:[ { 
        	// title: "Geomap",
        	anchor: '100%, 80%',
        	id: 'wb-center-' + mapType + '-content-panel',
            plugins: [new Ext.ux.Plugin.RemoteComponent({
	            url : './js/components/Ggeomap.js',
	            loadOn: 'show',
                listeners: {
	                'beforeadd' : {fn: function(JSON) {
            			console.log("loaded;;;;;;;;;; ");
			        	// JSON['markers'] = markers;
	                } }
        		}
            })]
		}, {
            xtype : 'form',
            id : 'wb-center-' + mapType + '-indicator-form-panel',
            anchor: '100%, 20%',
            labelWidth: 90,
            title: 'Indicator selection',
            items : [ {
            		xtype	 : 'combo',
            		id	 : 'wb-center-' + mapType + '-combo',
                    fieldLabel   : 'Query string',
                    displayField : 'indicator',
                    typeAhead    : true,
                    loadingText  : 'Searching...',
                    pageSize     : 5,
                    width        : 400,
                    store : new Ext.ux.component.wbDataStore ( {
                        proxy: new Ext.data.HttpProxy({
                            method: 'GET',
                            url: wb_json_data_url_prefix+'indicators.json'
                        }),
                        reader: new Ext.ux.data.wbReader({
                            root: 'results',
                            fields: [{name: 'value', mapping: 'id'},
                                     {name: 'label', mapping: 'value'}
                             ]
                       })
                    })
                 }, {
        	        xtype: 'sliderfield',
        	        id : 'wb-center-' + mapType + 'dt',
        	        fieldLabel: 'Geomap Date : ',
        	        increment: 1,
        	        minValue: 1960,
        	        maxValue: 2010,
                    anchor: '100%',
                    value: 2000,
                    tipText: function(thumb) {
                        return String(thumb.value) + ' year';
                    }
        	    }  ]
        } ]
	};
}
*/

Ext.ux.util.getDateValFromWB = function( dateStr ) {
	var newDateStr = '';
	switch(true) {
		case (dateStr.indexOf('Q') > 0):
			var dateArray = dateStr.split('Q');
			dateArray[dateArray.length-1] = dateArray[dateArray.length-1] * 3;
			dateArray[dateArray.length-1] = String.leftPad(dateArray[dateArray.length-1], 2, '0');
			newDateStr = dateArray.join('-') + '-01';
			break;
		case (dateStr.indexOf('M') > 0):
			newDateStr = dateStr.split('M').join('-') + '-01';
			break;
		default:
			newDateStr = dateStr + '-01-01';
			break;
	}
	return newDateStr;
}

Ext.ux.util.getWBChartURL = function( indicator ) {

    var per_page = "&per_page=4000";

    var countryList = new Array();
    var wbEastCountryProperty = Ext.getCmp('wb-east-country-property-grid');
    Ext.iterate(wbEastCountryProperty.getSource(), function(key, val) {
    	countryList.push(val);
    });
    
    var parameter = "";
    if (!Ext.getCmp('wb-center-chart-mrv-fieldset').collapsed && Ext.getCmp('wb-center-chart-mrv-number').getValue()) {
    	parameter = "&mrv=" + Ext.getCmp('wb-center-chart-mrv-number').getValue();
    	parameter += "&Gapfill=" + Ext.getCmp('wb-center-chart-mrv-gapfill').getValue();
    	parameter += "&frequency=" + Ext.getCmp('wb-center-chart-mrv-frequency').getValue();
    } else {
        var startDt = Ext.getCmp('wb-center-chart-startdt').getValue();
        var endDt = Ext.getCmp('wb-center-chart-enddt').getValue();
        if (Ext.getCmp('wb-center-chart-month-checkbox').getValue()) {
        	parameter = "&date=" + startDt.format('Y\\Mm') + ":" + endDt.format('Y\\Mm');
        } else if ( Ext.getCmp('wb-center-quarterly-month-checkbox').getValue() ) {
        	var start_quarter = Ext.getCmp('wb-center-chart-quarterly-startdt-combo').getValue();
        	var end_quarter = Ext.getCmp('wb-center-chart-quarterly-enddt-combo').getValue();
        	parameter = "&date=" + startDt.format('Y') + start_quarter + ":" + endDt.format('Y') + end_quarter;
        } else {
        	parameter = "&date=" + startDt.format('Y') + ":" + endDt.format('Y');
        }
    }

	return "../lib/ajax-proxy.php?route=/countries/" + countryList.join(";") + "/indicators/" + indicator + "?format=json"+parameter+per_page;
}

Ext.ux.util.getWBGeomapURL = function( wbGeoMapIndicator ) {

    var geoMapDate = Ext.getCmp('wb-center-geomap-date').getValue();
    var parameter = "";
    if ( Ext.getCmp('wb-center-geomap-month-checkbox').getValue() ) {
    	parameter = "&date=" + geoMapDate.format('Y\\Mm');
    } else if ( Ext.getCmp('wb-center-geomap-quarterly-checkbox').getValue() ) {
    	parameter = "&date=" + geoMapDate.format('Y') + Ext.getCmp('wb-center-geomap-quarterly-combo').getValue();
    } else {
    	parameter = "&date=" + geoMapDate.format('Y');
    }

    var per_page = "&per_page=4000";
	return "../lib/ajax-proxy.php?route=/countries/all/indicators/" + wbGeoMapIndicator + "?format=json"+parameter+per_page;
}

Ext.ux.data.wbGetColumnModelForDG = function(store, idName) {
	/*
	 * [
	                // expander,
	                {id:'company',header: "Company", width: 40, dataIndex: 'company'},
	                {header: "Price", renderer: Ext.util.Format.usMoney, dataIndex: 'price'},
	                {header: "Change", dataIndex: 'change'},
	                {header: "% Change", dataIndex: 'pctChange'},
	                {header: "Last Updated", renderer: Ext.util.Format.dateRenderer('m/d/Y'), dataIndex: 'lastChange'}
	            ]
	 */
	consloe.log('executed;;;;;;;;;;;; ');
}
Ext.ux.data.wbGoogleMapMarkers = function(googleMapCmp, countrySortKey, countrySortVal) {
	var dataStore = new Ext.data.Store ( {
		url: Ext.wb.variables.json_data_url_prefix + "countries.json",
        autoLoad: true,
	    reader: new Ext.ux.data.wbReader( {
	        root: 'results',
	        fields: [ {name: 'ISO2Code',     mapping: 'iso2Code'},
	                  {name: 'Name',         mapping: 'name'},
	                  {name: 'Region',       mapping: 'region'},
	                  {name: 'AdminRegion',  mapping: 'adminregion'},
	                  {name: 'IncomeLevel',  mapping: 'incomeLevel'},
	                  {name: 'LendingType',  mapping: 'lendingType'},
	                  {name: 'CapitalCity',  mapping: 'capitalCity'},
	                  {name: 'longitude',    mapping: 'longitude'},
	                  {name: 'latitude',     mapping: 'latitude'} ]
	    } ),
        listeners: {
            load : function( store ) {
				var markers = new Array();
				var country_names = new Array();
            	store.each(function(record, rowIdx) {
                    marker_info = {
                        lat: record.get('latitude'),
                        lng: record.get('longitude'),
                        marker: {
                            icon: "http://thydzik.com/thydzikGoogleMap/markerlink.php?text=" + record.get('ISO2Code') + "&color=5680FC",
                            title: Ext.wb.variables.GmapInfoWindowTpl.apply(Ext.apply({msg:'Click to view more details', br:''}, record.data)),
                            infoWindow: {
                                content: Ext.wb.variables.GmapInfoWindowTpl.apply(Ext.apply({msg:'',br:'<br/>'}, record.data))
                            }
                        }
                    };
                    switch(true) {
                    	case (record.get(countrySortKey).id == countrySortVal):
                    		markers.push(marker_info);
                    		country_names.push(record.get('Name'));
                    		break;
                    	default:
                    		// markers.push(marker_info);
                    		break;
                    }
                });
            	googleMapCmp.addMarkers(markers);
                Ext.Msg.show({
                    title: 'Found ' + country_names.length + ' Countries',
                    msg: country_names.length > 0 ? country_names.join(', ') : 'None',
                    icon: Ext.Msg.INFO,
                    minWidth: 500,
                    buttons: Ext.Msg.OK
                });
            }
        }
    } );
}

Ext.ux.data.wbChartData = function( columns, indicator ) {

	return new Ext.data.Store ( {
		url: Ext.ux.util.getWBChartURL( indicator ),
		// url: "./json/countries/AE;EG;HU;QA/indicators/BM.GSR.TOTL",
        autoLoad: true,
	    reader: new Ext.ux.data.wbReader( {
	        root: 'results',
	        fields: [ {name: 'country', mapping: 'country'},
	                  {name: 'date', mapping: 'date'},
	                  {name: 'value', mapping: 'value'} ]
	    } ),
        listeners: {
            load : function( record ) {

				Ext.ux.data.wbChartDataFormat(columns, record);

	            var tabPanel = Ext.getCmp('wb-center-chart-content-panel');
	            var tabPanelCount = tabPanel.items.getCount();
	        	if (tabPanelCount > 2) {	// in case of updating base on the new data.
	            	while(--tabPanelCount) {
	            		tabPanel.get(tabPanelCount).destroy();
	            	}
	        	}
	            if (tabPanelCount < 2) {
	                Ext.iterate(Ext.wb.variables.gCharts, function(key, val) {
	                    tabPanel.add( {
	                        title: val,
	                        plugins: [ new Ext.ux.Plugin.RemoteComponent( {
				                        	url : "./js/components/G" + key + ".js",
				                        	loadOn: 'show',
				                            listeners: {
					                            'success' : { fn: function() {

					                            } },
					                            'beforeadd' : { fn: function(JSON) {
					                            	JSON['height'] = tabPanel.getHeight() - tabPanel.getFrameHeight();
					                            	JSON['width'] = tabPanel.getWidth();
					                            } }
					                    	}
	                        		} ) ]
	                    } );
	                } );
	            } else {

	            }
            }
        },
        exception : function( misc )  {
        	
        }
    } );
};

Ext.ux.data.wbChartDataFormat = function( columns, record ) {
	var chartData = {'commonData' : new Array(), 'motionData' : new Array()};
    var colIdx = 0;

    record.singleSort('date');
    var store_fields = new Array();
    Ext.iterate(columns, function(key, val) {

        // record.filterBy( function(record) { return record.get('country').id == val } ); // by country code eg AU, KR
        record.filterBy( function(record) { return record.get('country').value == key } ); // by country name

        // create fields information
		if (colIdx < 1) {
			store_fields.push( {name: 'date', type: 'date'} );
			store_fields.push( {name: key, type: 'float'} );
		} else {
			store_fields.push( {name: key, type: 'float'} );
		}

    	record.each(function(rowRecord, rowIdx) {
    		var recVal = rowRecord.get('value');
    		var numValue = (isNaN( recVal ) || !recVal ) ? 0 : recVal;
    		var newDateFormat = Ext.ux.util.getDateValFromWB(rowRecord.get('date'));
    		if (colIdx < 1) {
    			chartData.commonData.push(new Array( Date.parseDate( newDateFormat, 'Y-m-d' ),
    												 parseFloat( numValue ) ));
    		} else {
    			chartData.commonData[rowIdx].push( parseFloat( numValue ) );
    		}

    		chartData.motionData.push(new Array(rowRecord.get('country').value,
    									Date.parseDate( newDateFormat, 'Y-m-d' ),
										parseFloat( numValue ) ));
        });

        if ( record.isFiltered() ) {
            record.clearFilter();
        }
    	colIdx++;
    });

    new Ext.data.Store({
    	storeId: 'wbExtjsGridDataStore',
        proxy: new Ext.ux.data.PagingMemoryProxy(chartData.commonData),
        remoteSort:true,
        sortInfo: {field:'date', direction:'ASC'},
        reader: new Ext.data.ArrayReader({
        	fields: store_fields
        })
    });
    
    new Ext.data.ArrayStore({
        autoDestroy: true,
        storeId: 'wbGCommonDataStore',
        idIndex: 0,  
        fields: store_fields,
        data: chartData.commonData
    });

	new Ext.data.ArrayStore({
        autoDestroy: true,
        storeId: 'wbGMotionDataStore',
        sortInfo: {
            field: 'date',
            direction: 'DESC' // or 'DESC' (case sensitive for local sorting)
        },
        // idIndex: 1,  
        fields: [ {name: 'country', type: 'string'}, {name: 'date', type: 'date'}, {name: 'value', type: 'float'} ],
        data: chartData.motionData
    });
	// console.log(chartData);
};

Ext.ux.data.wbReader = function(meta, recordType){
    meta = meta || {};
    Ext.ux.data.wbReader.superclass.constructor.call(this, meta, recordType || meta.fields);
};

Ext.extend(Ext.ux.data.wbReader, Ext.data.JsonReader, {
    readRecords : function(o){
    this.jsonData = o;
    if(o.metaData){
        this.onMetaChange(o.metaData);
    }
    var s = this.meta, Record = this.recordType,
        f = Record.prototype.fields, fi = f.items, fl = f.length, v;

    try {
    	var root = o[1], c = o[0].total, totalRecords = c, success = true;
    	if (root === null)
    		root = [];
    } catch(e){
    	var root = [], c = 0, totalrecords = 0, success = true;
    }

    if(s.totalProperty){
        v = parseInt(this.getTotal(o), 10);
        if(!isNaN(v)){
            totalRecords = v;
        }
    }
    if(s.successProperty){
        v = this.getSuccess(o);
        if(v === false || v === 'false'){
            success = false;
        }
    }

    // TODO return Ext.data.Response instance instead.  @see #readResponse
    return {
        success : success,
        records : this.extractData(root, true), // <-- true to return [Ext.data.Record]
        totalRecords : totalRecords
    };
    }
});

Ext.ux.tree.wbTreeLoader = Ext.extend(Ext.tree.TreeLoader, {
	// private override
    processResponse : function(response, node, callback, scope){ 
        var json = response.responseText;
        try {
            var o = response.responseData || Ext.decode(json);
            
            node = this.parseWbCountryData(node, o[1]);
            // node.expandChildNodes();

            this.runCallback(callback, scope || node, [node]);
        } catch(e) {
            this.handleFailure(response);
        }
    },
	parseWbCountryData : function(node, o) {
        var regionCode = new Array("EAP", "EAS", "ECA", "ECS", "LAC", "LCN", "MNA", "MEA", "NAC", "SAS", "SSA",  "SSF");
        var incomeLevel = new Array("NOC", "OEC", "HIC", "HPC", "LIC", "LMC", "LMY", "MIC", "UMC");

		var countryChildren = new Array();
		var regionChildren = new Array();
		var inclvlChildren = new Array();
        for(var i = 0, len = o.length; i < len; i++) {
            switch (true) {
	            case ( regionCode.indexOf( o[i]['id'] )  > -1 ):
	            	regionChildren.push({id : o[i]['id'], text : o[i]['name'], leaf : true, checked : false});
	                break;
	            case ( incomeLevel.indexOf( o[i]['id'] ) > -1 ):
	            	inclvlChildren.push({id : o[i]['id'], text : o[i]['name'], leaf : true, checked : false});
	                break;
	            default:
	            	countryChildren.push({id : o[i]['iso2Code'], text : o[i]['name'], leaf : true, checked : false});
	                break;
            }

        }

        node.beginUpdate();
        node.appendChild(this.createNode({ id : "country", text: "country", cls: "folder", leaf : false, children: countryChildren} ) );
        node.appendChild(this.createNode({ id : "region", text: "region", cls: "folder", leaf : false, children: regionChildren} ) );
        node.appendChild(this.createNode({ id : "inclvl", text: "income level", cls: "folder", leaf : false, children: inclvlChildren} ) );
        node.endUpdate();
        return node;
    }
});
