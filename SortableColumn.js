sap.ui.define([
	"sap/m/Column",
	"sap/ui/core/Renderer"
	], 
	function(Column, Renderer) {
	"use strict";
	/**
	 * Constructor for a new SortableColumn.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The <code>SortableColumn</code> extends the <code>sap.m.Column</code> control that automatically provides filtering and
	 * sorting capabilities through a <code>sap.m.ResponsivePopover</code> attached to the header and is displayed when the column header is clicked. The developer
	 * can use the default values defined in the parent <code>AutoSortTable> for displaying filtering, sorting or both for all columns, or can 
	 * specify which is available in individual columns. The column provides icons to indicate of it is currently sorted or filtered.
	 *
	 * @extends sap.m.Column
	 *
	 * @author Tom Cole, Linx-AS, L.L.C.
	 * @version 1.0.0
	 *
	 * @constructor
	 * @public
	 */
	var SortableColumn = Column.extend("SortableColumn", {
		metadata : {
			properties: {
				/**
				 * The title for the <code>sap.m.ResponsivePopover</code> attached to this <code>SortableColumn</code>.
				 * If no value is provided, the title property from the parent <code>AutoSortTable<code> is used.
				 */
				title: {type: "string", defaultValue: ""},
				/**
				 * Indicates if sorting buttons should be provided in the <code>sap.m.ResponsivePopover</code> attached to this <code>SortableColumn</code>.
				 * If no value is provided, or if the useDefaults value is set to true, the shortSort property from the parent <code>AutoSortTable<code> is used.
				 */
				showSort: {type: "boolean", defaultValue: true},
				/**
				 * Indicates if the filter field should be provided in the <code>sap.m.ResponsivePopover</code> attached to this <code>SortableColumn</code>.
				 * If no value is provided, or if the useDefaults value is set to true, the shortSort property from the parent <code>AutoSortTable<code> is used.
				 */
				showFilter: {type: "boolean", defaultValue: true},
				/**
				 * Indicates if the values provided by the parent <code>AutoSortTable</code> should be used to define the properties for this <code>SortableColumn</code>.
				 * If set to true, the other properties will be ignored.
				 */
				useDefaults: {type: "boolean", defaultValue: true}
			}
		},
		_oTable: null,
		_oPopover: null,
		_oFilterField: null,
		_oAscending: null,
		_oDescending: null,
		_sRelatedProperty: null,
		constructor: function(sId, mSettings) {
			sap.m.Column.apply(this, arguments);
		},
		_setParentTable: function(oTable) {
			this._oTable = oTable;
		},
		_isFiltered: function() {
			var sValue = (this._oFilterField) ? this._oFilterField.getValue() : "";
			return sValue.length > 0;
		},
		_handleClick: function (oEvent) {
			if (! this._oPopover) {
				var that = this;
				this._oFilterField = new sap.m.SearchField({
					placeholder: this._oTable.getFilterPlaceholder(),
					change: [that._onChange, that],
					liveChange: [that._onLiveChange, that],
					search: [that._onLiveChange, that]
				});
				this._oAscending = new sap.m.ObjectListItem({
					type: "Active",
					press: [that._onAscending, that],
					title: this._oTable.getSortAscButtonText()
				}); 
				this._oDescending = new sap.m.ObjectListItem({
					type: "Active",
					press: [that._onDescending, that],
					title: this._oTable.getSortDescButtonText()
				});
				var oItems = [];
				if (((! this.getUseDefaults()) && this.getShowFilter()) || (this.getUseDefaults() && this._oTable.getShowFilter())) {
					oItems.push(new sap.m.CustomListItem({
						content: [
							this._oFilterField
							]
					}));
				}
				if (((! this.getUseDefaults()) && this.getShowSort()) || (this.getUseDefaults() && this._oTable.getShowSort())) {
					oItems.push(this._oAscending);
					oItems.push(this._oDescending);
				}
				this._oPopover = new sap.m.ResponsivePopover({
					title: (this.getUseDefaults()) ? this._oTable.getTitle() : this.getTitle(),
					placement: this._oTable.getPlacement(),
					content: [
						new sap.m.List({
							items: oItems
						})
						]
				});
			}
			if (this._oTable._canSortOrFilter() && (this.getShowFilter() || this.getShowSort())) {
				this._oPopover.openBy(this.getAggregation("header"));
			}
		},
		_onChange: function(oEvent) {
			this._onLiveChange(oEvent);
			this._complete(oEvent);
		},
		_onLiveChange: function(oEvent) {
			oEvent.cancelBubble();
			oEvent.preventDefault();
			var sPath = this._resolvePath();
			var sValue = oEvent.getSource().getValue();
			if (sPath) {
				this._oTable._doFilter(sPath, sValue);
			}
		},
		_onAscending: function(oEvent) {
			var sPath = this._resolvePath();
			if (sPath) {
				this._oTable._doSort(sPath, false);
				this.setSortIndicator("Ascending");
			}
			this._complete(oEvent);
		},
		_onDescending: function(oEvent) {
			var sPath = this._resolvePath();
			if (sPath) {
				this._oTable._doSort(sPath, true);
				this.setSortIndicator("Descending");
			}
			this._complete(oEvent);
		},
		_complete: function(oEvent) {
			this._oPopover.close();
			this._oTable._stripeTable();
		},
		_resolvePath: function() {
			if (! this._sRelatedProperty) {
				var oColumns = this._oTable.getAggregation("columns");
				for (var i = 0; i < oColumns.length; i++) {
					if (oColumns[i].getId() === this.getId()) {
						var oRelatedItem = this._oTable.getAggregation("items")[0].getCells()[i];
						if (oRelatedItem.mBindingInfos) {
						   if (oRelatedItem.mBindingInfos.value) {
							   if (oRelatedItem.mBindingInfos.value.parts) {
								   this._sRelatedProperty = oRelatedItem.mBindingInfos.value.parts[0].path;
							   }
						   }
						   else if (oRelatedItem.mBindingInfos.text) {
							   if (oRelatedItem.mBindingInfos.text.parts) {
								   this._sRelatedProperty = oRelatedItem.mBindingInfos.text.parts[0].path;
							   }
						   }
						   else if (oRelatedItem.mBindingInfos.selected) {
							   if (oRelatedItem.mBindingInfos.selected.parts) {
								   this._sRelatedProperty = oRelatedItem.mBindingInfos.selected.parts[0].path;
							   }
						   }
						   else if (oRelatedItem.mBindingInfos.src) {
							   if (oRelatedItem.mBindingInfos.src.parts) {
								   this._sRelatedProperty = oRelatedItem.mBindingInfos.src.parts[0].path;
							   }
						   }
					   }
					}
				}
			}
			return this._sRelatedProperty;
		},
		_clearFilter: function() {
			if (this._oFilterField) {
				this._oFilterField.setValue("");
				this.setSortIndicator("None");
			}
		}
	});

	return SortableColumn;

});