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
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.simplify.DouglasPeuckerSimplifier;
import com.vividsolutions.jts.simplify.TopologyPreservingSimplifier;
import com.vividsolutions.jts.simplify.VWSimplifier;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class FeatureSimplifier extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(FeatureSimplifier.class);

    private static final long serialVersionUID = -9136589600366983667L;
    
    public enum SimplificationMethod { visvalingamwhyatt, douglaspeucker, topologypreserver };

    private SimplificationMethod method;
    private Double distanceTolerance;
    
    public FeatureSimplifier()
    {
        super();
        this.setType(Processor.Type.FEATURE_SIMPLIFIER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) simplify();
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

    private void simplify() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> simplify()");

        if(method == null) method = SimplificationMethod.topologypreserver;
        if(distanceTolerance == null) distanceTolerance = new Double(0);
        
        if(getFeatures() != null && getFeatures().size() > 0)
        {
            // Seems to stall? Could be a problem with the parallel stream?
            getFeatures().parallelStream().forEach((featureId) ->
            //for(UUID featureId : getFeatures())
            {
                try
                {
                    Feature feature = getCouchDAO().getGeometry(featureId);
                    Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                   
                    Geometry geom = copy.getAsGeometryObject();
                    
                    if(method == SimplificationMethod.douglaspeucker)
                    {
                        DouglasPeuckerSimplifier dpSimp = new DouglasPeuckerSimplifier(geom);
                        dpSimp.setDistanceTolerance(distanceTolerance);
    
                        geom = dpSimp.getResultGeometry();
                    }
                    else if(method == SimplificationMethod.visvalingamwhyatt)
                    {
                        VWSimplifier vwSimp = new VWSimplifier(geom);
                        vwSimp.setDistanceTolerance(distanceTolerance);
                        
                        geom = vwSimp.getResultGeometry();
                    }
                    else // topology preserver
                    {
                        TopologyPreservingSimplifier tpSimp = new TopologyPreservingSimplifier(geom);
                        tpSimp.setDistanceTolerance(distanceTolerance);
                        
                        geom = tpSimp.getResultGeometry();
                    }
    
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
        }
        
        logger.debug(" << simplify()");
    }

    public SimplificationMethod getMethod()
    {
        return method;
    }

    public void setMethod(SimplificationMethod method)
    {
        this.method = method;
    }

    public Double getDistanceTolerance()
    {
        return distanceTolerance;
    }

    public void setDistanceTolerance(Double distanceTolerance)
    {
        this.distanceTolerance = distanceTolerance;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        FeatureSimplifier copy = new FeatureSimplifier();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setMethod(this.method);
        copy.setDistanceTolerance(this.distanceTolerance);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
