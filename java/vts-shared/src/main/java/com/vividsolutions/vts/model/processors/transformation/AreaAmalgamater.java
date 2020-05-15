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
import com.vividsolutions.jts.geom.IntersectionMatrix;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class AreaAmalgamater extends FeatureProcessor
{
    private static final long serialVersionUID = 1458289736180823550L;

    private static Log logger = LogFactory.getLog(AreaAmalgamater.class);
    
    public AreaAmalgamater()
    {
        super();
        this.setType(Processor.Type.AREA_AMALGAMATER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) mergeFeatures();
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

    private void mergeFeatures() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> mergeFeatures()");

        for(int i = 0; i < getFeatures().size(); i++)
        {
            Feature feature = getCouchDAO().getGeometry(getFeatures().get(i));
            
            Feature copy = new Feature(getProcessorID(), FEATURES, feature);
            Geometry featureGeom = copy.getAsGeometryObject();
            
            boolean mergeOccured = false;
            for(int j = 0; j < getFeatures().size(); j++)
            {
                Feature featureToMerge = getCouchDAO().getGeometry(getFeatures().get(j));
                if(!featureToMerge.equals(feature))
                {
                    Geometry featureToMergeGeom = featureToMerge.getAsGeometryObject();
                    IntersectionMatrix relatedMatrix = featureToMergeGeom.relate(featureGeom);
                    
                    if(relatedMatrix.isContains() ||
                       relatedMatrix.isIntersects() || 
                       relatedMatrix.isWithin() ||
                       relatedMatrix.isEquals(featureToMergeGeom.getDimension(), featureGeom.getDimension()) ||
                       relatedMatrix.isDisjoint() || 
                       relatedMatrix.isTouches(featureToMergeGeom.getDimension(), featureGeom.getDimension()) ||
                       relatedMatrix.isCrosses(featureToMergeGeom.getDimension(), featureGeom.getDimension()) || 
                       relatedMatrix.isOverlaps(featureToMergeGeom.getDimension(), featureGeom.getDimension()) || 
                       relatedMatrix.isCovers() || 
                       relatedMatrix.isCoveredBy())
                    {
                        // union
                        featureGeom.union(featureToMergeGeom);
                        featureGeom.geometryChanged();
                        
                        copy.setFromGeometryObject(featureGeom);
                        // remove from features.
                        getFeatures().remove(featureToMerge);
                        j--;
                        
                        mergeOccured = true;
                    }
                }
                
                // if we successfully merged one or more feature together, retry again in case anything was missed.
                if(mergeOccured) i--;
            }
            
            getCouchDAO().createResource(copy);
            getOutputNodes().get(FEATURES).add(copy.getGeometryID());
        }
        
        logger.debug(" << mergeFeatures()");
    }
    
    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        AreaAmalgamater copy = new AreaAmalgamater();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
