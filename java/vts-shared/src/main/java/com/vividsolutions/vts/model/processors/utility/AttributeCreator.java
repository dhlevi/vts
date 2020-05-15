package com.vividsolutions.vts.model.processors.utility;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class AttributeCreator extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(AttributeCreator.class);
 
    private static final long serialVersionUID = 8844198109274331774L;
    
    private List<Attribute> newAttributes;
    
    public AttributeCreator()
    {
        super();
        this.setType(Processor.Type.ATTRIBUTE_CREATOR.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) createAttributes();
            
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

    private void createAttributes() throws ParseException
    {
        logger.debug(" >> createAttributes()");

        if(newAttributes == null) newAttributes = new ArrayList<Attribute>();
        
        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                
                for(Attribute newAttribute : newAttributes)
                {
                    copy.getAttributes().add(new Attribute(newAttribute));
                }
    
                getCouchDAO().createResource(copy);
                getOutputNodes().get(FEATURES).add(copy.getGeometryID());
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                throw new RuntimeException(e);
            }
        });
        
        logger.debug(" << createAttributes()");
    }

    public List<Attribute> getNewAttributes()
    {
        return newAttributes;
    }

    public void setNewAttributes(List<Attribute> newAttributes)
    {
        this.newAttributes = newAttributes;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        AttributeCreator copy = new AttributeCreator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}