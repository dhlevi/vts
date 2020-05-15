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
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class Aggregator extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(Aggregator.class);
    
    private static final long serialVersionUID = -5790724251427622521L;

    public Aggregator()
    {
        super();
        this.setType(Processor.Type.AGGREGATOR.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0)
            {
                getOutputNodes().get(FEATURES).add(aggregate().getGeometryID());
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
    
    private Feature aggregate() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> aggregate()");
        
        Feature aggregatedFeature = null;
        
        if(getFeatures() != null && getFeatures().size() > 0)
        {
            List<Geometry> geomsToAggregate = new ArrayList<Geometry>();
            
            List<Attribute> baseAttributes = null;
            for(UUID featureId : getFeatures())
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                
                geomsToAggregate.add(feature.getAsGeometryObject());
                
                if(baseAttributes == null)
                {
                    baseAttributes = feature.cloneAttributes();
                    
                    for(Attribute attribute : baseAttributes)
                    {
                        attribute.setValue(null);
                    }
                }
            }
            
            GeometryCollection geomCollection = new GeometryCollection(geomsToAggregate.toArray(new Geometry[geomsToAggregate.size() - 1]), new GeometryFactory());
            
            aggregatedFeature = new Feature();
            aggregatedFeature.setGeometryID(UUID.randomUUID());
            aggregatedFeature.setNode(FEATURES);
            aggregatedFeature.setProcessorID(getProcessorID());
            aggregatedFeature.setFromGeometryObject(geomCollection);
            aggregatedFeature.setAttributes(baseAttributes);
            
            getCouchDAO().createResource(aggregatedFeature);
        }
        
        logger.debug(" << aggregate()");
        return aggregatedFeature;
    }
    
    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        Aggregator copy = new Aggregator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
