package com.vividsolutions.vts.model.processors.utility;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class SpatialFilter extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(SpatialFilter.class);
 
    private static final long serialVersionUID = -3312615604665856149L;
    
    public enum SpatialType { point, line, polygon, multipoint, multiline, multipolygon, nil, none, all };
    
    public static final String FAILED_NODE = "failed";
    
    private List<SpatialType> filterTypes;
    
    public SpatialFilter()
    {
        super();
        this.setType(Processor.Type.SPATIAL_FILTER.toString());
        this.getOutputNodes().put(FAILED_NODE, new ArrayList<UUID>(0));
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) filterFeatures();
            
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

    private void filterFeatures() throws ParseException
    {
        logger.debug(" >> filterFeatures()");
        
        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                
                Geometry geom = copy.getAsGeometryObject();
                String geometryType = geom.getGeometryType();
                
                boolean add = false;
                
                for(SpatialType type : filterTypes)
                {
                    if(type == SpatialType.point && geometryType.toUpperCase().equals("POINT")) add = true;
                    if(type == SpatialType.line && geometryType.toUpperCase().equals("LINESTRING")) add = true;
                    if(type == SpatialType.polygon && geometryType.toUpperCase().equals("POLYGON")) add = true;
                    if(type == SpatialType.multipoint && geometryType.toUpperCase().equals("MULTIPOINT")) add = true;
                    if(type == SpatialType.multiline && geometryType.toUpperCase().equals("MULTILINESTRING")) add = true;
                    if(type == SpatialType.multipolygon && geometryType.toUpperCase().equals("MULTIPOLYGON ")) add = true;
                    if(type == SpatialType.nil && ((geom != null && geom.isEmpty()) || geom == null)) add = true;
                    if(type == SpatialType.all) add = true;
                    if(type == SpatialType.none) add = false;
                    
                    if(add) break;
                }
                
                if(add) 
                {
                    getCouchDAO().createResource(copy);
                    getOutputNodes().get(FEATURES).add(copy.getGeometryID());
                }
                else 
                {
                    copy.setNode(FAILED_NODE);
                    getCouchDAO().createResource(copy);
                    getOutputNodes().get(FAILED_NODE).add(copy.getGeometryID());
                }
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                throw new RuntimeException(e);
            }
        });
        
        logger.debug(" << filterFeatures()");
    }
    
    public List<SpatialType> getFilterTypes()
    {
        return filterTypes;
    }

    public void setFilterTypes(List<SpatialType> filterTypes)
    {
        this.filterTypes = filterTypes;
    }
    
    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        SpatialFilter copy = new SpatialFilter();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
