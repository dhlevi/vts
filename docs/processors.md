# VTS Processors

There are a number of processors that can be used by VTS workflows. Below is a description of each, and their editable parameters.

- [Readers](#readers)
  * [Cache Reader](#cache-reader)
  * [DB Reader](#db-reader)
  * [File Reader](#file-reader)
  * [HTTP Reader](#http-reader)
  * [Random Reader](#random-reader)
- [Processors](#processors)
  * [Along](#along)
  * [Area](#area)
  * [Attribute Calculator](#attribute-calculator)
  * [Attribute Creator](#attribute-creator)
  * [Attribute Keeper](#attribute-keeper)
  * [Attribute Remover](#attribute-remover)
  * [Atribute Renamer](#atribute-renamer)
  * [Bezier Curve](#bezier-curve)
  * [Bounding Box](#bounding-box)
  * [Bounding Box Creator](#bounding-box-creator)
  * [Bounding Box Replace](#bounding-box-replace)
  * [Buffer](#buffer)
  * [Center](#center)
  * [Center All](#center-all)
  * [Center of Mass](#center-of-mass)
  * [Center of Mass All](#center-of-mass-all)
  * [Centroid](#centroid)
  * [Clean Coords](#clean-coords)
  * [Counter](#counter)
  * [Destination](#destination)
  * [Difference](#difference)
  * [Dissolve](#dissolve)
  * [Donut Extractor](#donut-extractor)
  * [Donut Remover](#donut-remover)
  * [Exploder](#exploder)
  * [Feature Holder](#feature-holder)
  * [Filter](#filter)
  * [Flatten](#flatten)
  * [Flip](#flip)
  * [Hull Replace](#hull-replace)
  * [Hull Creator](#hull-creator)
  * [Intersect](#intersect)
  * [Length](#length)
  * [Line Chunk](#line-chunk)
  * [Line Creator](#line-creator)
  * [Line to Polygon](#line-to-polygon)
  * [Merge](#merge)
  * [Null Polygon Filter](#null-polygon-filter)
  * [Polygon to Line](#polygon-to-line)
  * [Projector](#projector)
  * [Reduce Precision](#reduce-precision)
  * [Rotate](#rotate)
  * [Scale](#scale)
  * [Simplify](#simplify)
  * [Spatial Filter](#spatial-filter)
  * [Spatial Relation Filter](#spatial-relation-filter)
  * [SQL Caller](#sql-caller)
  * [Tesselate](#tesselate)
  * [Timestampper](#timestampper)
  * [TIN](#tin)
  * [Translate](#translate)
  * [Union](#union)
  * [Un-Kink](#un-kink)
  * [Vertex Counter](#vertex-counter)
  * [Voronoi](#voronoi)
- [Writers](#writers)
  * [Cache Writer](#cache-writer)
  * [DB Writer](#db-writer)
  * [File Writer](#file-writer)

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

Buffer buffers supplied features. Point and linestring features will be converted to polygons.

You can supply a distance and a unit of measure. The Distance value can be negative, which will shrink your features.

### Center

Center identifies the median center point of each feature.

### Center All

Center all identified the median center point for all features passed in

### Center of Mass

Center of Mass identifies the greatest center of mass of features.

### Center of Mass All

Center of Mass All identifies the center of mass for all features combined.

### Centroid

Centroid identifies the calculated centroid of each feature.

### Clean Coords

Clean Coords removes duplicate and unecessary vertices from linestring and polygon features.

### Counter

Counter counts the number of features and stores the count in an attribute. You can supply a name for the attribute

### Destination

Destination calculates a destination point along a linestring or polygon permimeter. You supply a distance , bearing, and a unit of measure.

### Difference

Difference "clips" features by a passed in clipper feature or features.

Difference has two input nodes. `Features` which are the featurs that will be clipped, and `Clipper` which is the features that will be used to do the clipping.

### Dissolve

Dissolve will dissolve all features together, resulting in a merged polygon.

### Donut Extractor

Donut extractor will extract interior rings from all polygon features.

Donut extractor has two output nodes. `Features`, which contains all passed in features, and `Donuts` which will contain the extracted interior rings.

### Donut Remover

Donut remover will remove all interior rings from passed in polygon features.

### Exploder

Exploder converts all linestring and polygon features into collections of vertices. Point features will be unaffected.

### Feature Holder

Feature Holder is a utility processor that performs no attribute or geometry transformations, but collects all features together. Useful for merging multiple workflow paths together.

### Filter

Filter performs an attribute filter on all features. The filter is an expression, written in javascript. You can supply an expression using any attributes from your features.

```javascript
myAttribute === 'Test' && otherAttibute >= (a / b)
```

Filter contains two output nodes. `Feature` which will contain all features that "Passed" the expression. Features that did not pass the expression are returned on a node called `False`

### Flatten

Flatten "squishes" multi-geometry features together where possible. Like dissolve for multigeometry features.

### Flip

Flip flips the features coordinates from XY to YX.

### Hull Replace

Hull Replace will replace all features with their calculated hull. You can select convex or concave hulls.

### Hull Creator

Hull creator will create a convex or concave hull for all passed in features.

### Intersect

Intersect performs an intersection on all passed in features with an "Intersector" feature or features.

Intersect has two input nodes. `Features` which contain the features to be intersected, and `Intersector` which contains the feature to do the intersecting.

### Length

Length calculates the length of a line or polygon permimeter.

You can supply the name of the attribute where the calculated length will be stored, and a Unit of measure.

### Line Chunk

Line Chunk Divides a LineString into chunks of a specified length. If the line is shorter than the segment length then the original line is returned. You can supply the length where the chunking will occur, and a unit of measure.

### Line Creator

Line Creator will create a line from points. This does not create a line from all passed in features, so to create a line from points ensure you merge them together into a multigeometry feature. Polygon features will have a line generated from their vertices.

### Line to Polygon

Line to polygon closes a linestring and returns the resulting polygon features.

### Merge

Merge aggregates all features together into a multigeometry.

### Null Polygon Filter

Null Polygon filter checks if a feature has a null geometry. Null Geometry Filter has two output points. `Features` for all features that do not contain null geometry, and `empty` for all features that do contain a null geometry.

### Polygon to Line

Polygon to Line disconnects a polygons exterior ring and returns a linestring. Interior rings are destroyed.

### Projector

Projector takes projection and reprojects the geometry. The projection can be an EPSG code or a proj4 string.

### Reduce Precision

Reduce precision reduces the precision of all vertices in each feature. You can supply a precision number indicating how many decimals to keep.

### Rotate

Rotate spins a geometry around its centroid by a given radius.

### Scale

Scale re-scales a geometry from it's centroid by a scale factor.

### Simplify

Simplify simplifies the features using the Douglas-Peucker algorithm. You can provide a tolerance value to simplify with.

### Spatial Filter

Spatial filter allows you to filter geometry by a specific geometry type. Options are Point, Line, Polygon, and multi feature geometry.

Spatial Filter contains two output nodes. `Features` which contain all values that match the filter, and `false` which contains all features that do not.

### Spatial Relation Filter

Spatial Relation filter filters all features by their spatial relationship to a relator feature.

Spatial Relation Filter contains two input nodes. `Features` which contains all features to relate, and `Relator` which contains the features to compare with.

Relation options include `Crosses`, `Contains`, `Disjoint`, `Equal`, `Overlap`, `Parallel`, `Point in Polygon`, `Point on Line`, and `Within`.

Spatial Relation Filter contains two output nodes. `Features` which contain all values that match the filter, and `false` which contains all features that do not.

### SQL Caller

SQL Caller executes a SQL expression for each feature, and appends the resulting attributes. SQL Caller currently supports Oracle (experimentally).

You must supply a valid connection, including user name and password, and a query to execute. You can bind feature attributes to the query where clause. Query format is standard SQL.

```sql
SELECT t.att, t.otherAtt
  FROM myTable t
 WHERE t.att = :myFeatureAttribute
   AND t.therAtt < :myOtherAttribute
```

SQL Caller will only keep the first row returned, so queries that return multiple row results will ignore every row after the first.

### Tesselate

Tesselate transforms feature geometry into triangles.

### Timestampper

Timestampper creates an attribute on each feature containing the current date and time. You can provide the name for the timestamp attribute.

### TIN

TIN generates TIN polygons from passed in features. Line and polygon features will be exploded into points before processing.

### Translate

Translate moves features a specified distance along a rhumb Line on the provided direction angle. You can provide a distance, a direction and a unit of measure.

### Union

Union creates a union feature from all passed in features, dissolving where necessary.

### Un-Kink

Un-Kink removes self-intersections from polygons by splitting the geometry into a multipolygon at the point of self-intersection.

### Vertex Counter

Vertex counter adds an attribute to each feature with the count of its vertices. You can provide a name for the count attribute.

### Voronoi

Voronoi generates a voronoi diagram from all passed in features. Linestring and polygon features will be exploded into their point values.

## Writers

Writers typically end a workflow, storing the features that have been processed to a file or database.

### Cache Writer

Cache Writer writes all passed in features to the VTS Feature Cache. The Cache key is the name of the request, and the name of the processor passed in. The VTS cache will be destroyed with the request is destroyed so this is most useful for persiting test data temporarily or for scheduled task persistence.

### DB Writer

DB Writer writes all features to a database. Currently only Oracle is experimentally supported, with Postgres in the works.

You must supply a valid connection string to the database, as well as a username and password. You have options to drop and recreate the table, or truncate the table before writing. Additionally, a projection EPSG code or proj4 string can be supplied to project the geometry before it is inserted.

Currently only insert operations are functional, with support for update operations in progress

### File Writer

File Writer writes all provided features to a file on a provided path. The VTS engine requires access to the path provided. Any existing file of the same name will be overwritten. You can currently write to GeoJSON, KML, KMZ, GML and Shapefile.

Support for URL paths is experimental and may not function as expected. An HTTP writer is in progress to support post/put operations to HTTP sources.
