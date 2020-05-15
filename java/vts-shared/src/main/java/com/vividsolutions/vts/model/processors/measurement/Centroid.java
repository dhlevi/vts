package com.vividsolutions.vts.model.processors.measurement;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class Centroid extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(Centroid.class);
    
    private static final long serialVersionUID = -5790724251427622521L;
    
    public Centroid()
    {
        super();
        this.setType(Processor.Type.CENTROID.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) calculateCentroid();
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
    
    private void calculateCentroid() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> calculateCentroid()");
        
        if(getFeatures() != null && getFeatures().size() > 0)
        {
            getFeatures().parallelStream().forEach((featureId) -> 
            {
                try
                {
                    Feature feature = getCouchDAO().getGeometry(featureId);
                    
                    Point centroid = feature.getAsGeometryObject().getInteriorPoint();
                    
                    Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                    
                    copy.setFromGeometryObject(centroid);
                    
                    getCouchDAO().createResource(copy);
                    getOutputNodes().get(FEATURES).add(copy.getGeometryID());
                }
                catch(Exception e)
                {
                    logger.error(e.getMessage());
                    throw new RuntimeException(e);
                }
            });
        }
        
        logger.debug(" << calculateCentroid()");
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        Centroid copy = new Centroid();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
