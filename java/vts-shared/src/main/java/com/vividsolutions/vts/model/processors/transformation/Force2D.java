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
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class Force2D extends FeatureProcessor
{
    private static final long serialVersionUID = 4720194862646815472L;

    private static Log logger = LogFactory.getLog(Force2D.class);

    public Force2D()
    {
        super();
        this.setType(Processor.Type.FORCE2D.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) set2D();
            
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

    private void set2D() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> set2D()");
        
        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                
                Geometry geom = copy.getAsGeometryObject();
    
                for(Coordinate coord : geom.getCoordinates())
                {
                    coord.setCoordinate(new Coordinate(coord.x, coord.y));
                }
                
                geom.geometryChanged();
                
                copy.setFromGeometryObject(geom);
                
                getCouchDAO().createResource(copy);
                getOutputNodes().get(FEATURES).add(copy.getGeometryID());
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                throw new RuntimeException(e);
            }
        });
        
        logger.debug(" << set2D()");
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        Force2D copy = new Force2D();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
