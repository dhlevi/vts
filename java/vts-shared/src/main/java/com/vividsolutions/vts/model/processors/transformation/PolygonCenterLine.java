package com.vividsolutions.vts.model.processors.transformation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.IntersectionMatrix;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiLineString;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.operation.linemerge.LineMerger;
import com.vividsolutions.jts.operation.overlay.OverlayOp;
import com.vividsolutions.jts.operation.overlay.snap.SnapIfNeededOverlayOp;
import com.vividsolutions.jts.triangulate.VoronoiDiagramBuilder;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class PolygonCenterLine extends FeatureProcessor
{
    private static final long serialVersionUID = -5826913164200320210L;

    private static Log logger = LogFactory.getLog(PolygonCenterLine.class);

    public PolygonCenterLine()
    {
        super();
        this.setType(Processor.Type.POLYGON_CENTER_LINE.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) centerlineFeatures();
            this.setProcessed(true);
        }
        
        return true;
    }

    @SuppressWarnings({ "rawtypes" })
    @Override
    public boolean process(List<Processor> parentProcesses, CouchDAO couchDAO) throws Exception
    {
        boolean initProcess = super.process(parentProcesses, couchDAO);
        return process() && initProcess;
    }

    @SuppressWarnings("rawtypes")
    private void centerlineFeatures() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> centerlineFeatures()");

        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                // work in progress... voronoi cells, clip, then extract linework and trim out the lines that overlap?
                
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                Geometry featureGeom = copy.getAsGeometryObject();
                
                GeometryFactory factory = new GeometryFactory();
                
                VoronoiDiagramBuilder voronoi = new VoronoiDiagramBuilder();
                voronoi.setTolerance(0);
                voronoi.setSites(Arrays.asList(featureGeom.getCoordinates()));
                voronoi.setClipEnvelope(featureGeom.getEnvelopeInternal());
                
                Geometry voronoiCells = voronoi.getDiagram(factory);
                
                List<Polygon> snippedCells = new ArrayList<Polygon>();
    
                for(int i = 0; i < voronoiCells.getNumGeometries(); i++)
                {
                    Geometry cell = voronoiCells.getGeometryN(i);
                    cell = SnapIfNeededOverlayOp.overlayOp(featureGeom, cell, OverlayOp.DIFFERENCE);
                    
                    if(cell instanceof Polygon)
                    {
                        snippedCells.add((Polygon)cell);
                    }
                    else if(cell instanceof MultiPolygon)
                    {
                        // break apart multipoly and inject individual parts
                        for(int j = 0; j < cell.getNumGeometries(); j++)
                        {
                            Polygon innerCell = (Polygon)cell.getGeometryN(j);
                            snippedCells.add(innerCell);
                        }
                    }
                }
                
                List<LineString> lines = new ArrayList<LineString>();
                for(Polygon poly : snippedCells)
                {
                    LineString ring = poly.getExteriorRing();
                    Coordinate[] coords = ring.getCoordinates();
                    
                    List<Coordinate> pointsToKeep = new ArrayList<Coordinate>();
                    for(int i = 0; i < coords.length; i++)
                    {
                        // if this point is on the edge of the featureGeom, ignore it
                        Point pnt = factory.createPoint(coords[i]);
                        
                        IntersectionMatrix relatedMatrix = pnt.relate(featureGeom);
                        
                        if(!relatedMatrix.isTouches(pnt.getDimension(), featureGeom.getDimension()) && pnt.buffer(0.000005).within(featureGeom))
                        {
                            pointsToKeep.add(pnt.getCoordinate());
                        }
                    }
                    
                    if(pointsToKeep.size() >=  2)
                    { 
                        LineString line = factory.createLineString(pointsToKeep.toArray(new Coordinate[pointsToKeep.size()]));
                        if(line.isValid() && !line.isEmpty()) lines.add(line);
                    }
                }
                
                LineMerger merger = new LineMerger();
                merger.add(lines);
                Collection mergedLines = merger.getMergedLineStrings();
                lines = new ArrayList<LineString>();
                for(Object o : mergedLines)
                {
                    lines.add((LineString)o);
                }
                
                MultiLineString trimmedCellGeoms = factory.createMultiLineString(lines.toArray(new LineString[lines.size()]));
                
                copy.setFromGeometryObject(trimmedCellGeoms);
                
                getCouchDAO().createResource(copy);
                getOutputNodes().get(FEATURES).add(copy.getGeometryID());
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                throw new RuntimeException(e);
            }
        });
        
        logger.debug(" << centerlineFeatures()");
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        PolygonCenterLine copy = new PolygonCenterLine();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
