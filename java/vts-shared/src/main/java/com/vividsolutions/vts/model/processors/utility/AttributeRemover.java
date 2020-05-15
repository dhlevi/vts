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

public class AttributeRemover extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(AttributeRemover.class);
 
    private static final long serialVersionUID = -995480067944313601L;
    
    private List<Attribute> attributesToRemove;
    
    public AttributeRemover()
    {
        super();
        this.setType(Processor.Type.ATTRIBUTE_REMOVER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) deleteAttributes();
            
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

    private void deleteAttributes() throws ParseException
    {
        logger.debug(" >> deleteAttributes()");
        
        if(attributesToRemove == null) attributesToRemove = new ArrayList<Attribute>();
        
        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                
                for(Attribute attributeToRemove : attributesToRemove)
                {
                    for(int i = 0; i < copy.getAttributes().size(); i++)
                    {
                        Attribute sourceAttribute = copy.getAttributes().get(i);
                        
                        if(attributeToRemove.getName().equals(sourceAttribute.getName()))
                        {
                            copy.getAttributes().remove(i);
                            i--;
                        }
                    }
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
        
        logger.debug(" << deleteAttributes()");
    }

    public List<Attribute> getAttributesToRemove()
    {
        return attributesToRemove;
    }

    public void setAttributesToRemove(List<Attribute> attributesToRemove)
    {
        this.attributesToRemove = attributesToRemove;
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
