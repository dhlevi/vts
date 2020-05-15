package com.vividsolutions.vts.model.processors.transformation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.vividsolutions.jts.geom.TopologyException;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class BufferFeature extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(BufferFeature.class);
    
    private static final long serialVersionUID = 8111628679440048928L;

    private double distance;
    
    public BufferFeature()
    {
        super();
        this.setType(Processor.Type.BUFFER_FEATURE.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) bufferFeatures();
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

    private void bufferFeatures() throws TopologyException, ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> bufferFeatures()");
        
        if(getFeatures() != null && getFeatures().size() > 0)
        {
            getFeatures().parallelStream().forEach((featureId) -> 
            {
                try
                {
                    Feature feature = getCouchDAO().getGeometry(featureId);
                    
                    Feature bufferedFeature = new Feature(getProcessorID(), FEATURES, feature);
                    bufferedFeature.setFromGeometryObject(bufferedFeature.getAsGeometryObject().buffer(distance));
                    
                    getCouchDAO().createResource(bufferedFeature);
                    getOutputNodes().get(FEATURES).add(bufferedFeature.getGeometryID());
                }
                catch(Exception e)
                {
                    logger.error("Failed to buffer feature " + featureId + " : " + e.getMessage());
                    throw new RuntimeException(e);
                }
            });
        }
        
        logger.debug(" << bufferFeatures()");
    }

    public double getDistance()
    {
        return distance;
    }

    public void setDistance(double distance)
    {
        this.distance = distance;
    }
    
    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        BufferFeature copy = new BufferFeature();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
