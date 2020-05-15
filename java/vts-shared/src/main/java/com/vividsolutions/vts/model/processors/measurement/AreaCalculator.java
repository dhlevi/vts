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

public class AreaCalculator extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(AreaCalculator.class);
    
    private static final long serialVersionUID = -4333168981459082629L;
    
    private String areaAttribute;
    
    public AreaCalculator()
    {
        super();
        this.setType(Processor.Type.AREA_CALCULATOR.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) calculateAreas();
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
    
    private void calculateAreas() throws ParseException
    {
        logger.debug(" >> calculateAreas()");

        if(getFeatures() != null && getFeatures().size() > 0)
        {
            getFeatures().parallelStream().forEach((featureId) -> 
            {
                try
                {
                    Feature feature = getCouchDAO().getGeometry(featureId);
                    
                    Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                    
                    // find the attribute
                    Attribute areaAttributeResource = null;
                    for(Attribute attribute : copy.getAttributes())
                    {
                        if(attribute.getName().equals(areaAttribute))
                        {
                            areaAttributeResource = attribute;
                            break;
                        }
                    }
                    
                    if(areaAttributeResource == null)
                    {
                        areaAttributeResource = new Attribute();
                        areaAttributeResource.setDataType(DataType.number);
                        areaAttributeResource.setDecimalPrecision(20);
                        areaAttributeResource.setName("CALCULATED_AREA");
                        areaAttributeResource.setAlias("CALCULATED_AREA");
                        
                        copy.getAttributes().add(areaAttributeResource);
                    }
                    
                    double area = feature.getAsGeometryObject().getArea();
                    areaAttributeResource.setValue(Double.toString(area));
                    
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
        
        logger.debug(" << calculateAreas()");
    }
    
    public String getAttribute()
    {
        return areaAttribute;
    }

    public void setAttribute(String areaAttribute)
    {
        this.areaAttribute = areaAttribute;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        AreaCalculator copy = new AreaCalculator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
