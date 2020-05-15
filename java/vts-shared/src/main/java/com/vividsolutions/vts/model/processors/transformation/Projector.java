package com.vividsolutions.vts.model.processors.transformation;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.osgeo.proj4j.CRSFactory;
import org.osgeo.proj4j.CoordinateReferenceSystem;
import org.osgeo.proj4j.CoordinateTransform;
import org.osgeo.proj4j.CoordinateTransformFactory;
import org.osgeo.proj4j.ProjCoordinate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiLineString;
import com.vividsolutions.jts.geom.MultiPoint;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class Projector extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(Projector.class);

    private static final long serialVersionUID = -4933203561268844129L;
    
    private String srid; // as a string, but must be an INT only
    
    public Projector()
    {
        super();
        this.setType(Processor.Type.PROJECTOR.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) project();
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
    
    private void project()
    {
        logger.debug(" >> project()");
        
        if(getFeatures() != null && getFeatures().size() > 0)
        {
            getFeatures().parallelStream().forEach((featureId) -> 
            {
                try
                {
                    Feature feature = getCouchDAO().getGeometry(featureId);
                
                    // create projectedFeature from source, using supplied SRID for projection
                
                    Feature projectedFeature = new Feature(getProcessorID(), FEATURES, feature);
                
                    projectedFeature.setFromGeometryObject(project(projectedFeature.getAsGeometryObject()));
                    
                    getCouchDAO().createResource(projectedFeature);
                    getOutputNodes().get(FEATURES).add(projectedFeature.getGeometryID());
                } 
                catch (Exception e)
                {
                    logger.error("Failed to project feature " + featureId + " : " + e.getMessage());
                    throw new RuntimeException(e);
                }
            });
        }
        
        logger.debug(" << project()");
    }

    private Geometry project(Geometry geometry)
    {
        
        CoordinateTransformFactory ctFactory = new CoordinateTransformFactory();
        CRSFactory crsFactory = new CRSFactory();
        CoordinateReferenceSystem crs1 = crsFactory.createFromName("EPSG:" + geometry.getSRID());
        CoordinateReferenceSystem crs2 = crsFactory.createFromName("EPSG:" + srid);
        CoordinateTransform ct = ctFactory.createTransform(crs1, crs2);
        
        if(geometry instanceof Point)
        {
            geometry = geometry.getFactory().createPoint(transform(geometry.getCoordinates(), ct)[0]);
        }
        else if(geometry instanceof MultiPoint)
        {
            Point[] projPoints = new Point[geometry.getNumGeometries()];
            for(int i = 0; i < geometry.getNumGeometries(); i++)
            {
                projPoints[i] = geometry.getFactory().createPoint(transform(geometry.getGeometryN(i).getCoordinates(), ct)[0]);
            }
            
            geometry = geometry.getFactory().createMultiPoint(projPoints);
        }
        else if(geometry instanceof LineString)
        {
            geometry = geometry.getFactory().createLineString(transform(geometry.getCoordinates(), ct));
        }
        else if(geometry instanceof MultiLineString)
        {
            LineString[] projLiness = new LineString[geometry.getNumGeometries()];
            for(int i = 0; i < geometry.getNumGeometries(); i++)
            {
                projLiness[i] = geometry.getFactory().createLineString(transform(geometry.getGeometryN(i).getCoordinates(), ct));
            }
            
            geometry = geometry.getFactory().createMultiLineString(projLiness);
        }
        else if(geometry instanceof Polygon)
        {
            geometry = geometry.getFactory().createPolygon(transform(geometry.getCoordinates(), ct));
        }
        else if(geometry instanceof MultiPolygon)
        {
            Polygon[] projPolys = new Polygon[geometry.getNumGeometries()];
            for(int i = 0; i < geometry.getNumGeometries(); i++)
            {
                projPolys[i] = geometry.getFactory().createPolygon(transform(geometry.getGeometryN(i).getCoordinates(), ct));
            }
            
            geometry = geometry.getFactory().createMultiPolygon(projPolys);
        }
        else if(geometry instanceof GeometryCollection)
        {
            Geometry[] projGeoms = new Geometry[geometry.getNumGeometries()];
            
            for(int i = 0; i < geometry.getNumGeometries(); i++)
            {
                projGeoms[i] = project(geometry.getGeometryN(i));
            }
            
            geometry = geometry.getFactory().createGeometryCollection(projGeoms);
        }
        
        geometry.setSRID(Integer.parseInt(srid));
        
        return geometry;
    }
    
    private Coordinate[] transform(Coordinate[] coords, CoordinateTransform ct)
    {
        Coordinate[] out = new Coordinate[coords.length];
        
        for (int i = 0; i < coords.length; ++i) 
        {
            Coordinate coord = coords[i];
            ProjCoordinate projCoord = ct.transform(new ProjCoordinate(coord.x, coord.y, coord.z), new ProjCoordinate());
            out[i] = new Coordinate(projCoord.x, projCoord.y, projCoord.z);
        }
        
        return out;
    }
    
    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        Projector copy = new Projector();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }

    public String getSRID()
    {
        return srid;
    }

    public void setSRID(String srid)
    {
        // If EPSG: is supplied, remove it
        srid = srid.toUpperCase().replaceAll("EPSG:", "");
        
        // if it's not a number, set to default 4326
        try
        {
            Integer.parseInt(srid);
        }
        catch(NumberFormatException e)
        {
            srid = "4326";
        }
        
        this.srid = srid;
    }
}
