package com.vividsolutions.vts.model.processors.transformation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
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
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.triangulate.DelaunayTriangulationBuilder;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class Triangulator extends FeatureProcessor
{
    private static final long serialVersionUID = -3260613798864391466L;

    private static Log logger = LogFactory.getLog(Triangulator.class);

    public static final String EDGES = "edges";
    
    private Double tolerance;
    
    public Triangulator()
    {
        super();
        this.setType(Processor.Type.TRIANGULATOR.toString());
        this.getOutputNodes().put(EDGES, new ArrayList<UUID>(0));
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) triangulate();
            
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

    private void triangulate() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> triangulate()");

        com.vividsolutions.jts.triangulate.
        
        DelaunayTriangulationBuilder triangulator = new DelaunayTriangulationBuilder();

        List<Coordinate> coords = new ArrayList<Coordinate>();
        
        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                coords.addAll(Arrays.asList(feature.getAsGeometryObject().getCoordinates()));
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                throw new RuntimeException(e);
            }
        });
        
        triangulator.setTolerance(tolerance);
        triangulator.setSites(coords);
        
        Geometry edges = triangulator.getEdges(new GeometryFactory());
        Geometry faces = triangulator.getTriangles(new GeometryFactory());
        
        Feature edgesFeature = new Feature();
        edgesFeature.setGeometryID(UUID.randomUUID());
        edgesFeature.setNode(EDGES);
        edgesFeature.setProcessorID(getProcessorID());
        edgesFeature.setFromGeometryObject(edges);
        
        Feature facesFeature = new Feature();
        facesFeature.setGeometryID(UUID.randomUUID());
        facesFeature.setNode(FEATURES);
        facesFeature.setProcessorID(getProcessorID());
        facesFeature.setFromGeometryObject(faces);
        
        // should be split into different output nodes.
        getCouchDAO().createResource(edgesFeature);
        getCouchDAO().createResource(facesFeature);
        
        getOutputNodes().get(EDGES).add(edgesFeature.getGeometryID());
        getOutputNodes().get(FEATURES).add(facesFeature.getGeometryID());
        
        logger.debug(" << triangulate()");
    }
    
    public Double getTolerance()
    {
        return tolerance;
    }

    public void setTolerance(Double tolerance)
    {
        this.tolerance = tolerance;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        Triangulator copy = new Triangulator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
