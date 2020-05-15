package com.vividsolutions.vts.model.processors.measurement;

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
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class LengthCalculator extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(LengthCalculator.class);
    
    private static final long serialVersionUID = -5022356555259936400L;

    private String lengthAttribute;
    
    public LengthCalculator()
    {
        super();
        this.setType(Processor.Type.LENGTH_CALCULATOR.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            try
            {
                if(getFeatures().size() > 0) calculateLengths();
                this.setProcessed(true);
            }
            catch(Exception e)
            {
                // logger, message?
                throw e;
            }
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

    private void calculateLengths() throws ParseException
    {
        logger.debug(" >> calculateLengths()");
        
        if(getFeatures() != null && getFeatures().size() > 0)
        {
            getFeatures().parallelStream().forEach((featureId) -> 
            {
                try
                {
                    Feature feature = getCouchDAO().getGeometry(featureId);
                    
                    Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                    
                    // find the attribute
                    Attribute lengthAttributeResource = null;
                    for(Attribute attribute : copy.getAttributes())
                    {
                        if(attribute.getName().equals(lengthAttribute))
                        {
                            lengthAttributeResource = attribute;
                            break;
                        }
                    }
                    
                    if(lengthAttributeResource == null)
                    {
                        lengthAttributeResource = new Attribute();
                        lengthAttributeResource.setDataType(DataType.number);
                        lengthAttributeResource.setDecimalPrecision(20);
                        lengthAttributeResource.setName("CALCULATED_LENGTH");
                        lengthAttributeResource.setAlias("CALCULATED_LENGTH");
                        
                        copy.getAttributes().add(lengthAttributeResource);
                    }
                    
                    double length = feature.getAsGeometryObject().getLength();
                    lengthAttributeResource.setValue(Double.toString(length));
                    
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
        
        logger.debug(" << calculateLengths()");
    }
    
    public String getAttribute()
    {
        return lengthAttribute;
    }

    public void setAttribute(String lengthAttribute)
    {
        this.lengthAttribute = lengthAttribute;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        LengthCalculator copy = new LengthCalculator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
