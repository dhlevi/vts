package com.vividsolutions.vts.model.processors.utility;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.operation.valid.IsValidOp;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class FeatureValidator extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(FeatureValidator.class);
    
    private static final long serialVersionUID = -3986928513042760200L;
 
    public static final String FAILED_NODE = "failed";
    
    private String isValidAttribute;
    private String errorMessageAttribute;
    
    public FeatureValidator()
    {
        super();
        this.setType(Processor.Type.FEATURE_VALIDATOR.toString());
        this.getOutputNodes().put(FAILED_NODE, new ArrayList<UUID>(0));
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) validateFeatures();
            
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

    private void validateFeatures() throws ParseException
    {
        logger.debug(" >> validateFeatures()");
                
        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Attribute isValidAttributeResource = null;
                Attribute errorMessageAttributeResource = null;
                
                Feature feature = getCouchDAO().getGeometry(featureId);
                
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                
                for(Attribute attribute : copy.getAttributes())
                {
                    if(attribute.getName().equals(isValidAttribute))
                    {
                        isValidAttributeResource = attribute;
                    }
                    else if(attribute.getName().equals(errorMessageAttribute))
                    {
                        errorMessageAttributeResource = attribute;
                    }
                }
                
                if(isValidAttributeResource == null)
                {
                    isValidAttributeResource = new Attribute();
                    isValidAttributeResource.setDataType(DataType.bool);
                    isValidAttributeResource.setName("IS_VALID");
                    isValidAttributeResource.setAlias("IS_VALID");
                    copy.getAttributes().add(isValidAttributeResource);
                }
                
                if(errorMessageAttributeResource == null)
                {
                    errorMessageAttributeResource = new Attribute();
                    errorMessageAttributeResource.setDataType(DataType.string);
                    errorMessageAttributeResource.setName("VALIDATION_ERROR_MESSAGE");
                    errorMessageAttributeResource.setAlias("VALIDATION_ERROR_MESSAGE");
                    copy.getAttributes().add(errorMessageAttributeResource);
                }
                
                Geometry geom = feature.getAsGeometryObject();
                boolean isValid = geom.isValid();
    
                isValidAttributeResource.setValue(Boolean.toString(isValid));
    
                if(!isValid)
                {
                    IsValidOp validOp = new IsValidOp(geom);
                    errorMessageAttributeResource.setValue(validOp.getValidationError().getMessage() + " -- At Coordinate: " + validOp.getValidationError().getCoordinate().toString());
                    copy.setNode(FAILED_NODE);
                }
                
                getCouchDAO().createResource(copy);
                getOutputNodes().get(copy.getNode()).add(copy.getGeometryID());
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                throw new RuntimeException(e);
            }
        });
        
        logger.debug(" << validateFeatures()");
    }
    
    public String getIsValidAttribute()
    {
        return isValidAttribute;
    }

    public void setIsValidAttribute(String isValidAttribute)
    {
        this.isValidAttribute = isValidAttribute;
    }

    public String getErrorMessageAttribute()
    {
        return errorMessageAttribute;
    }

    public void setErrorMessageAttribute(String errorMessageAttribute)
    {
        this.errorMessageAttribute = errorMessageAttribute;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        FeatureValidator copy = new FeatureValidator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
