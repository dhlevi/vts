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
import com.vividsolutions.vts.model.AttributeUpdateValueMapper;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class AttributeRenamer extends FeatureProcessor
{
    private static final long serialVersionUID = 3246116334163733542L;

    private static Log logger = LogFactory.getLog(AttributeRenamer.class);

    private List<AttributeUpdateValueMapper> attributesToTest;

    public AttributeRenamer()
    {
        super();
        this.setType(Processor.Type.ATTRIBUTE_RENAMER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) updateAttribute();
            
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

    private void updateAttribute() throws ParseException
    {
        logger.debug(" >> updateAttribute()");

        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                
                for(AttributeUpdateValueMapper avm : attributesToTest)
                {
                    Attribute attributeToChange = null;
                    for(Attribute attribute : copy.getAttributes())
                    {
                        if(attribute.getName().equals(avm.getAttributeToTest()))
                        {
                            attributeToChange = attribute;
                            break;
                        }
                    }
                    
                    if(attributeToChange != null)
                    {
                        attributeToChange.setName(avm.getNewAttributeName());
                        attributeToChange.setAlias(avm.getNewAttributeAlias());
                        attributeToChange.setDataType(avm.getNewDataType());
                        attributeToChange.setDecimalPrecision(avm.getNewDecimalPrecision());
                        attributeToChange.setDateFormat(avm.getNewDateFormat());
                        attributeToChange.setDisplayOrder(avm.getNewDisplayOrder());
                        attributeToChange.setLength(avm.getNewLength());
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
        
        logger.debug(" << updateAttribute()");
    }

    public List<AttributeUpdateValueMapper> getAttributesToTest()
    {
        if(attributesToTest == null) attributesToTest = new ArrayList<AttributeUpdateValueMapper>();
        return attributesToTest;
    }

    public void setAttributesToTest(List<AttributeUpdateValueMapper> attributesToTest)
    {
        this.attributesToTest = attributesToTest;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        AttributeRenamer copy = new AttributeRenamer();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
