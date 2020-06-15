# VTS Processors

There are a number of processors that can be used by VTS workflows. Below is a description of each, and their editable parameters.

## Readers

Readers bring data into the workflow and are essential for starting a process. They include only one output node (features)

### Cache Reader

The Cache reader will return all features that have been saved to the VTS Feature Cache by any other request. You can supply the name of the request and the name of the processor that was cached.

### DB Reader

The DB Reader reads features from a database. Current support for Oracle Databases is experimental, with support for Postgres upcoming.

The DB Reader requires a connection string for your database, including a user name and password for access. You must supply a query. Note that returning geometry is optional (but recommended!).

```sql
SELECT t.attribute, t.another, t.geometry 
  FROM t mytable
 WHERE t.attribute = 'Cool!'
```

To ensure the correct attribute is used for the geometry, you must also supply the geometry column. If your data is not in WGS84 projection, supply the source projection PSG Code (or proj4 string) so data can be reprojected as needed.

### File Reader

The File reader loads features from a number of file sources. You must supply a path to the file (including the file name). Options for data type are `JSON`, `KML`, `KMZ`, `GML`, `Shapefile` and `FGDB`. Note that Shapefiles and FGDBs MUST be in a zip file.

If your data is not in WGS84 projection, supply the source projection PSG Code (or proj4 string) so data can be reprojected as needed.

### HTTP Reader

The HTTP Reader will read features from an HTTP source, such as a WFS layer, or an endpoint that returns KML. Supported file types are the same as the File Reader.

If your data is not in WGS84 projection, supply the source projection PSG Code (or proj4 string) so data can be reprojected as needed.

### Random Reader

The Random reader generates a random feature. Mainly used as a "Readerless" trigger. You can supply a type of Polygon, Point, or Linestring, and set a number of random features to generate.

## Processors

Processors transform data. They always have at least one input node (Features) and one output node (Features).

### Along

Along returns a point at a specified distance along a line or the perimiter of a polygon.

The length value can be derived from a feature attribute by supplying an attribute tag `${AttributeName}`.

You can supply a number for the length, and a unit of measure.

### Area

Area calculates the area of a feature. Line and Point feature will have an area of 0. Area is always returned as Squar KM's.

You an supply the name of the area attribute to store with the feature.

### Attribute Calculator

Attribute Calculator lets you run calculations on a features attributes. You write a calculation using JavaScript syntax.

```javascript
attribute1 + attribute2 / attribute3
```

String concatination can also be used

```javascript
attribute + ' - ' + attribute2
```

You can supply the name of an attribute where the calculation will be stored on the feature.

### Attribute Creator

The Attribute creator allows you to create a new attribute on every feature. You can supply a name, a default value, and a type (`string`, `number`, `boolean`).

The default value can be derived from a feature attribute by supplying an attribute tag `${AttributeName}`.

You can create multiple features by supplying a comma-seperated list of names, types, and default values. If all types are the same, you don't have to specify it for each new attribute.

### Attribute Keeper

The Attribute Keeper allows you to specify a comma-seperated list of attributes to keep, removing all other attributes that don't match the provided list of names.

### Attribute Remover

The Attribute Remover allows you to specify a comma-seperated list of attributes to remove, keeping all other attributes that don't match the provided list of names.

### Atribute Renamer

The Attribute Renamer allows you to specify the name of an existing attribute, and the name to change it to. You can supply a comma-seperated list of values.

### Bezier Curve

The Bezier Curve processor takes a linestring or polygon permimeter and returns a curve line by applying a Bezier spline algorithm.

You can supply the curve resolution and sharpness.

Bezier Curve has two output nodes: `Features`, which passes through all features passed into the processor, and `curves` which returns all generated curves.

### Bounding Box

Bounding box generates a single bounding box encompassing all passed in features.

### Bounding Box Creator

Bounding Box creator allows you to supply a min and max XY coordinate values, and generates a bounding box.

Bounding Box Creator has two output nodes: `Features`, which passes through all features passed into the processor, and `bbox` which return the generator bounding box.

### Bounding Box Replace

Bounding box replace replaces all passed in features with their respective bounding box.

### Buffer

### Center

### Center All

### Center of Mass

### Center of Mass All

### Centroid

### Clean Coords

### Counter

### Destination

### Difference

### Dissolve

### Donut Extractor

### Donut Remover

### Exploder

### Feature Holder

### Filter

### Flatten

### Flip

### Hull Replace

### Hull Creator

### Intersect

### Length

### Line Chunk

### Line Creator

### Line to Polygon

### Merge

### Null Polygon Filter

### Polygon to Line

### Projector

### Reduce Precision

### Rotate

### Scale

### Simplify

### Spatial Filter

### Spatial Relation Filter

### SQL Caller

### Tesselate

### Timestampper

### TIN

### Translate

### Union

### Un-Kink

### Vertex Counter

### Voronoi

## Writers

Writers typically end a workflow, storing the features that have been processed to a file or database.

### Cache Writer

### DB Writer

### File Writer