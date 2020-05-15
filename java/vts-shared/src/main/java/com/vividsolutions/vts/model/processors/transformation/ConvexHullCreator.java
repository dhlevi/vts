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
import com.vividsolutions.jts.algorithm. ConvexHull;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class ConvexHullCreator extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(ConvexHullCreator.class);
    
    private static final long serialVersionUID = -214732174198977148L;

    public ConvexHullCreator()
    {
        super();
        this.setType(Processor.Type.CONVEX_HULL_CREATOR.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0)
            {
                getOutputNodes().get(FEATURES).add(createHullFromFeatures().getGeometryID());
            }
            
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

    private Feature createHullFromFeatures() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> createHullFromFeatures()");
        Feature results = null;
        
        int srid = 0;
        if(getFeatures() != null && getFeatures().size() > 0)
        {
            List<Coordinate> coords = new ArrayList<Coordinate>();
            for(UUID featureId : getFeatures())
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                coords.addAll(Arrays.asList(feature.getAsGeometryObject().getCoordinates()));
                if(srid == 0) srid = feature.getAsGeometryObject().getSRID();
            }
            
            ConvexHull convexHull = new ConvexHull(coords.toArray(new Coordinate[coords.size() - 1]), new GeometryFactory());
            Geometry convexHullGeometry = convexHull.getConvexHull();
            convexHullGeometry.setSRID(srid);
            
            results = new Feature();
            results.setGeometryID(UUID.randomUUID());
            results.setNode(FEATURES);
            results.setProcessorID(getProcessorID());
            results.setFromGeometryObject(convexHullGeometry);
            results.setCrs(Integer.toString(srid));
            
            getCouchDAO().createResource(results);
        }
        logger.debug(" << createHullFromFeatures()");
        return results;
    }
    
    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        ConvexHullCreator copy = new ConvexHullCreator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
