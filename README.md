# AutoSortTable
The AutoSortTable is a custom SAPUI5 control that extends [sap.m.Table](https://sapui5.hana.ondemand.com/#/api/sap.m.Table) and makes it fast and easy to provide user initiated sorting and filtering by attaching a [sap.m.ResponsivePopover](https://sapui5.hana.ondemand.com/#/api/sap.m.ResponsivePopover) to the associated SortableColumns defined in the columns aggregation. The features of this popover can be defined globally across all SortableColumns or defined individually in each.
   
The most basic example to export all properties and rows on a single click is

```XML
<comp:AutoSortTable items="{/users}"/>
```
## To Use In Your SAPUI5/Fiori Application
1. Copy the [AutoSortTable.js](https://github.com/tommycole6/AutoSortTable/blob/main/AutoSortTable.js), [AutoSortTableRenderer.js](https://github.com/tommycole6/AutoSortTable/blob/main/AutoSortTableRenderer.js) and [SortableColumn.js](https://github.com/tommycole6/AutoSortTable/blob/main/SortableColumn.js) files to your project. It is recommended that you place them in a subfolder (i.e. components)
2. For XML views, add a new namespace that points to the folder
   ```XML
   <core:View
         ...
         xmmlns:comp="my.namespace.components">
   ```
3. Add the AutoSortTable to your XML view
   ```XML
   <comp:AutoSortTable>
     ...
   </comp:AutoSortTable>
   ```

You can find more examples and documentation in the [AutoSortTable.pdf](https://github.com/tommycole6/AutoSortTable/blob/main/AutoSortTable.pdf) file included in the distribution.
