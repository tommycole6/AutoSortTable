sap.ui.define([
	"sap/m/TableRenderer"
	], 
	function(Renderer) {
	"use strict";

	var AutoSortTableRenderer = Renderer.extend("AutoSortTableRenderer", {
		
		renderColumns: function(rm, oTable, type) {
			Renderer.renderColumns.apply(this, arguments);
		}
		
	});
	
	return AutoSortTableRenderer;
});