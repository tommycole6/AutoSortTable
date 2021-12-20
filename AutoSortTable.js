sap.ui.define([
	"sap/m/Table",
	"./AutoSortTableRenderer"
	], 
	function(Table, Renderer) {
	"use strict";

	var AutoSortTable = Table.extend("AutoSortTable", {
		metadata: {
			properties: {
				/** 
				 * The following properties are global and apply to all columns in the table.
				 */
				placement: {type: "sap.m.PlacementType", defaultValue: "Auto"},
				sortAscButtonText: {type: "string", defaultValue: "Sort Ascending"},
				sortDescButtonText: {type: "string", defaultValue: "Sort Descending"},
				fixedBottomRowCount: {type: "int", defaultValue: 0},
				zebraStripe: {type: "boolean", defaultValue: false},
				evenRowColor: {type: "string", defaultValue: "white"},
				oddRowColor: {type: "string", defaultValue: "lightgray"},
				totalRowColor: {type: "string", defaultValue: "darkgray"},
				filterPlaceholder: {type: "string", defaultValue: "Enter filter..."},
				/**
				 * The following properties are used as defaults. Individual SortableColumns
				 * can overwrite these values to customize their popup options.
				 */
				title: {type: "string", defaultValue: "Options"},
				showSort: {type: "boolean", defaultValue: true},
				showFilter: {type: "boolean", defaultValue: true}
			},
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
		getSortableColumns: function() {
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
			
			this.getSortableColumns().forEach(function(oColumn, order) {
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
