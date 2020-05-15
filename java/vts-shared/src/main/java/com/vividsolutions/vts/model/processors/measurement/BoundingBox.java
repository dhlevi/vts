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
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class BoundingBox extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(BoundingBox.class);
    
    private static final long serialVersionUID = -6616385849714469069L;

    public BoundingBox()
    {
        super();
        this.setType(Processor.Type.BOUNDING_BOX.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) calculateBoundingBox();
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
    
    private void calculateBoundingBox() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> calculateBoundingBox()");
        
        if(getFeatures() != null && getFeatures().size() > 0)
        {
            List<Geometry> geoms = new ArrayList<Geometry>();
            getFeatures().parallelStream().forEach((featureId) -> 
            {
                try
                {
                    Feature feature = getCouchDAO().getGeometry(featureId);
                    geoms.add(feature.getAsGeometryObject());
                }
                catch(Exception e)
                {
                    logger.error(e.getMessage());
                    throw new RuntimeException(e);
                }
            });
    
            GeometryCollection gc = new GeometryCollection(geoms.toArray(new Geometry[geoms.size() - 1]), new GeometryFactory());
            Geometry envelope = gc.getEnvelope();
            
            Feature envelopeFeature = new Feature();
            envelopeFeature.setGeometryID(UUID.randomUUID());
            envelopeFeature.setNode(FEATURES);
            envelopeFeature.setProcessorID(getProcessorID());
            envelopeFeature.setFromGeometryObject(envelope);
            
            getCouchDAO().createResource(envelopeFeature);
            getOutputNodes().get(FEATURES).add(envelopeFeature.getGeometryID());
        }
        
        logger.debug(" << calculateBoundingBox()");
    }
    
    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        BoundingBox copy = new BoundingBox();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
