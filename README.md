# AutoSortTable
The AutoSortTable is a custom SAPUI5 control that extends [sap.m.Table](https://sapui5.hana.ondemand.com/#/api/sap.m.Table) and makes it fast and easy to provide user initiated sorting and filtering by attaching a [sap.m.ResponsivePopover](https://sapui5.hana.ondemand.com/#/api/sap.m.ResponsivePopover) to the associated SortableColumns defined in the columns aggregation. The features of this popover can be defined globally across all SortableColumns or defined individually in each.
   
The most basic example to export all properties and rows on a single click is

```XML
<comp:AutoSortTable />
```
