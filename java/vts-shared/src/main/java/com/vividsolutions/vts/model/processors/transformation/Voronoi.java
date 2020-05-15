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
import com.vividsolutions.jts.triangulate.VoronoiDiagramBuilder;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class Voronoi extends FeatureProcessor
{
    private static final long serialVersionUID = -4815603017673412003L;

    private static Log logger = LogFactory.getLog(Voronoi.class);
   
    private Double tolerance;
    
    public Voronoi()
    {
        super();
        this.setType(Processor.Type.VORONOI.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) voronoiGrid();
            
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

    private void voronoiGrid() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> voronoiGrid()");

        VoronoiDiagramBuilder voronoi = new VoronoiDiagramBuilder();

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
        
        //voronoi.setClipEnvelope(clipEnv);
        voronoi.setTolerance(tolerance);
        voronoi.setSites(coords);
        
        Geometry computedDiagram = voronoi.getDiagram(new GeometryFactory());
        
        Feature newFeature = new Feature();
        newFeature.setGeometryID(UUID.randomUUID());
        newFeature.setNode(FEATURES);
        newFeature.setProcessorID(getProcessorID());
        newFeature.setFromGeometryObject(computedDiagram);
        
        getCouchDAO().createResource(newFeature);
        getOutputNodes().get(FEATURES).add(newFeature.getGeometryID());
        
        logger.debug(" << voronoiGrid()");
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
        Voronoi copy = new Voronoi();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
