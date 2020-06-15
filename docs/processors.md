# VTS Processors

There are a number of processors that can be used by VTS workflows. Below is a description of each, and their editable parameters.

## Readers

Readers bring data into the workflow and are essential for starting a process. They include only one output node (features)

### Cache Reader

The Cache reader will return all features that have been saved to the VTS Feature Cache by any other request. You can supply the name of the request and the name of the processor that was cached.

### DB Reader

### File Reader

### HTTP Reader

### Random Reader

## Processors

Processors transform data. They always have at least one input node (Features) and one output node (Features).

### Along

### Area

### Attribute Calculator

### Attribute Creator

### Attribute Keeper

### Attribute Remover

### Atribute Renamer

### Bezier Curve

### Bounding Box

### Bounding Box Creator

### Bounding Box Replace

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