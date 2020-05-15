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
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class Deaggregator extends FeatureProcessor
{
    private static final long serialVersionUID = 3935142000076888787L;

    private static Log logger = LogFactory.getLog(Deaggregator.class);

    public Deaggregator()
    {
        super();
        this.setType(Processor.Type.DEAGGREGATOR.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) deaggregate();
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

    private void deaggregate() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> deaggregate()");
        
        // clip all features in "features" with features in "clipperFeatures"
        
        for(UUID featureId : getFeatures())
        {
            Feature feature = getCouchDAO().getGeometry(featureId);
            
            Geometry featureGeom = feature.getAsGeometryObject();
            Feature copy = new Feature(getProcessorID(), FEATURES, feature);
            
            if(featureGeom instanceof GeometryCollection)
            {
                GeometryCollection geomCollection = (GeometryCollection)featureGeom;
                
                for(int i = 0; i < geomCollection.getNumGeometries(); i++)
                {
                    copy.setFromGeometryObject(geomCollection.getGeometryN(i));
                    
                    Attribute newIndex = new Attribute();
                    newIndex.setName("VTS_DEAGGREGATE_INDEX");
                    newIndex.setAlias("VTS_DEAGGREGATE_INDEX");
                    newIndex.setDataType(DataType.number);
                    newIndex.setDecimalPrecision(0);
                    newIndex.setValue(Integer.toString(i));
                    
                    copy.getAttributes().add(newIndex);
                }
            }
            
            getCouchDAO().createResource(copy);
            getOutputNodes().get(FEATURES).add(copy.getGeometryID());
        }
        
        logger.debug(" << deaggregate()");
    }
    
    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        Deaggregator copy = new Deaggregator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
