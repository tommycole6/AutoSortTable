sap.ui.define([
	"sap/m/Table",
	"./AutoSortTableRenderer"
	], 
	function(Table, Renderer) {
	"use strict";
	/**
	 * Constructor for a new AutoSortTable.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The <code>AutoSortTable</code> control provides a easy way to provide more advanced <code>sap.m.Table</code> that automatically provides filtering and
	 * sorting capabilities through a <code>sap.m.ResponsivePopover</code> attached to the header and is displayed when the column header is clicked. The developer
	 * can provide default values for displaying filtering, sorting or both for all columns, or can specify which is available in individual columns. 
	 * The columns provide icons to indicate of that column is currently sorted or filtered.
	 *
	 * @extends sap.m.Table
	 *
	 * @author Tom Cole, Linx-AS, L.L.C.
	 * @version 1.0.0
	 *
	 * @constructor
	 * @public
	 */
	var AutoSortTable = Table.extend("AutoSortTable", {
		metadata: {
			properties: {
				/** 
				 * Indicates where the <code>sap.m.ResponsivePopover</code> will be displayed in relation to the column header.
				 */
				placement: {type: "sap.m.PlacementType", defaultValue: "Auto"},
				/** 
				 * The text to display on the ascending sort button.
				 */
				sortAscButtonText: {type: "string", defaultValue: "Sort Ascending"},
				/** 
				 * The text to display on the descending sort button.
				 */
				sortDescButtonText: {type: "string", defaultValue: "Sort Descending"},
				/** 
				 * Denotes the number of fixed rows to leave unaffected by sorting or filtering.
				 */
				fixedBottomRowCount: {type: "int", defaultValue: 0},
				/** 
				 * Indicates if the table should be zebra stripped.
				 */
				zebraStripe: {type: "boolean", defaultValue: false},
				/** 
				 * Color for even rows.
				 * 
				 * NOTE: If zebraStripe is set to false, this property is ignored.
				 */
				evenRowColor: {type: "string", defaultValue: "white"},
				/** 
				 * Color for odd rows.
				 * 
				 * NOTE: If zebraStripe is set to false, this property is ignored.
				 */
				oddRowColor: {type: "string", defaultValue: "lightgray"},
				/** 
				 * Color for total row(s) as indicated by the value defined in the property fixedBottomRowCount.
				 * 
				 * NOTE: If zebraStripe is set to false, this property is ignored.
				 */
				totalRowColor: {type: "string", defaultValue: "darkgray"},
				/** 
				 * The text to display as the placeholder in the filter field.
				 */
				filterPlaceholder: {type: "string", defaultValue: "Enter filter..."},
				/**
				 * The default title to display on the <code>sap.m.ResponsivePopover. 
				 * 
				 * NOTE: You can override this value in the properties for each <code>SortableColumn</code>
				 */
				title: {type: "string", defaultValue: "Options"},
				/**
				 * The default property to indicate if sort buttons should be displayed in the <code>sap.m.ResponsivePopover</code>. 
				 * 
				 * NOTE: You can override this value in the properties for each <code>SortableColumn</code>
				 */
				showSort: {type: "boolean", defaultValue: true},
				/**
				 * The default property to indicate if the filter field should be displayed in the <code>sap.m.ResponsivePopover</code>. 
				 * 
				 * NOTE: You can override this value in the properties for each <code>SortableColumn</code>
				 */
				showFilter: {type: "boolean", defaultValue: true}
			},
			/**
			 * Defines the <code>SortableColumns</code> that should be displayed in the table. These columns will automatically provide a
			 * <code>sap.m.ResponsivePopover</code> when the user clicks on the header.
			 */
			aggregations: {
				columns: { type : "SortableColumn", multiple : true, singularName : "column" }
			}
		},
		_filters: {},
		renderer: Renderer,
		constructor: function(sID, mSettings) {
			sap.m.Table.apply(this, arguments);
			var that = this;
			this.attachModelContextChange(function(oEvent) {
				that._clearFilters();
				that._clearSorts();
			});
		},
		_getSortableColumns: function() {
			var aColumns = this.getAggregation("columns");
			return aColumns;
		},
		onBeforeRendering: function() {
			var style = document.createElement("style");
			style.type = "text/css";
			style.innerHTML = ".sapMColumnHeader .filteredColumn::before{font-family:'SAP-Icons';font-size:.875rem;font-weight:normal;align-self:center;padding-left:0.5rem;padding-right:0.5rem}.sapMColumnHeader .filteredColumn::before{content:'\\e076'}";
			document.head.appendChild(style);
			if (this.getZebraStripe()) {
				this.addStyleClass("tableStyle");
				var style2 = document.createElement('style');
				style2.type = 'text/css';
				style2.innerHTML = '.tableStyle tr[data-class="oddRow"], .tableStyle tr[data-class="oddRow"]  + tr[class="sapMListTblSubRow"]{ background-color:' + this.getOddRowColor() + ' !important;	} .tableStyle tr[data-class="evenRow"], .tableStyle tr[data-class="evenRow"]  + tr[class="sapMListTblSubRow"] { background-color:' + this.getEvenRowColor() + ' !important; } .tableStyle tr[data-class="totalRow"] { background-color:' + this.getTotalRowColor() + ' !important; }';
				document.head.appendChild(style2);
			}
		},
		onAfterRendering: function() {
			var aColumns = this.getAggregation("columns");
			for (var i = 0; i < aColumns.length; i++) {
				var oColumnEle = aColumns[i];
				oColumnEle._setParentTable(this);
				var oHeaders = oColumnEle.getAggregation("header");
				var oColumn = oHeaders.$()[0];
				let that = oColumnEle;
				while (oColumn.tagName !== "TH") {
					oColumn = oColumn.parentElement;
				}
				oColumn.addEventListener("click", function(oEvent) {
					that._handleClick(oEvent);
				}, false);
				oColumn.addEventListener("touchend", function(oEvent) {
					that._handleClick(oEvent);
				}, false);
			}
		},
		_stripeTable: function() {
			if (this.getZebraStripe()) {
				var oItems = this.getAggregation("items");
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var isTotal = i >= oItems.length - this.getFixedBottomRowCount();
					var theIndex = (isTotal) ? 2 : ((i % 2) === 0) ? 0 : 1;
					var oCustomData = new sap.ui.core.CustomData({key: "class", writeToDom: true, value: ((theIndex === 0) ? "evenRow" : (theIndex === 1) ? "oddRow" : "totalRow")});
					oItem.destroyCustomData();
					oItem.addCustomData(oCustomData);
				}
			}
		},
		_doFilter: function(sBindingPath, sValue) {
			var aFilters = [];
			if (this._filters.hasOwnProperty(sBindingPath)) {
				delete this._filters[sBindingPath];
			}
			if (sValue && sValue.length > 0) {
				var oFilter = new sap.ui.model.Filter(sBindingPath, "Contains", sValue);
				this._filters[sBindingPath] = oFilter;
			}
			for (let key in this._filters) {
				if (this._filters.hasOwnProperty(key)) {
					aFilters.push(this._filters[key]);
				}
			}
			var oItems = this.getBinding("items");
			try {
				oItems.filter(aFilters);
			}
			catch(e) {
				
			}
			if (this.getZebraStripe()) {
				this._stripeTable();
			}
			
			this._getSortableColumns().forEach(function(oColumn, order) {
				if (oColumn.getAggregation("header").$().length > 0) {
					if (oColumn._isFiltered()) {
						oColumn.getAggregation("header").$()[0].classList.add("filteredColumn");
						console.log(oColumn.sId + " FILTERED");
					}
					else {
						oColumn.getAggregation("header").$()[0].classList.remove("filteredColumn");
						console.log(oColumn.sId + " NOT FILTERED");
					}
				}
			});
			
		},
		_canSortOrFilter: function() {
			var sItemPath = this.getBindingContext().getPath() + "/" + this.getBinding("items").getPath();
			var aData = this.getBindingContext().getModel().getProperty(sItemPath);
			return aData.length > 1;
		},
		_doSort: function(sBindingPath, bDescending) {
			for (let i = 0; i < this.getAggregation("columns").length; i++) {
				this.getAggregation("columns")[i].setSortIndicator("None");
			}
			if (this.getAggregation("items").length > 0) {
				var aSorters = [];
				var oSorter = new sap.ui.model.Sorter(sBindingPath, bDescending);
				aSorters.push(oSorter);
				//remove rows from data model if rows excluded..
				var rowsToHide = [];
				if (this.getFixedBottomRowCount() > 0) {
					var count = this.getFixedBottomRowCount();
					//var theModel = component.getModel(this.getContext());
					var theModel = this.getBindingContext().getModel();
					var theBindingPath = this.getAggregation("items")[0].getBindingContext(this.getContext()).getPath();
					var theItemsPath = theBindingPath.substring(0, theBindingPath.lastIndexOf("/"));
					var theData = theModel.getProperty(theItemsPath);
					for (var i = theData.length - count; i < theData.length; i++) {
						rowsToHide.push(theData[i]);
					}
					theData.length = theData.length - count;
					theModel.setProperty(theItemsPath, theData);
					theModel.refresh();
				}
				var oItems = this.getBinding("items");
				oItems.sort(aSorters);
				//put rows back if rows excluded...
				if (rowsToHide.length > 0) {
					var theModel = this.getBindingContext().getModel();
					var theBindingPath = this.getAggregation("items")[0].getBindingContext(this.getContext()).getPath();
					var theItemsPath = theBindingPath.substring(0, theBindingPath.lastIndexOf("/"));
					var theData = [];
					var theSrc = this.getAggregation("items");
					for (var i = 0; i < theSrc.length; i++) {
						theData.push(theSrc[i].getBindingContext("reportData").getObject());
					}
					theData = theData.concat(rowsToHide);
					oItems.sort([]);
					theModel.setProperty(theItemsPath, theData);
					theModel.refresh();
				}
				if (this.getZebraStripe()) {
					this._stripeTable();
				}
			}
		},
		_clearFilters: function() {
			this._filters = {};
			for (let i = 0; i < this.getAggregation("columns").length; i++) {
				this.getAggregation("columns")[i]._clearFilter();
				this.getAggregation("columns")[i].setSortIndicator("None");
			}
			this._doFilter();
		},
		_clearSorts: function() {
			this.getBinding("items").aSorters = null;
			this.getModel().refresh();
		}
	});

	return AutoSortTable;
}
);
