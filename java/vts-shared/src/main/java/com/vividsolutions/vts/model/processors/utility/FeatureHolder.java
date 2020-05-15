package com.vividsolutions.vts.model.processors.utility;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class FeatureHolder extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(FeatureHolder.class);
    
    private static final long serialVersionUID = 3001216221981133387L;

    public FeatureHolder()
    {
        super();
        this.setType(Processor.Type.FEATURE_HOLDER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) getOutputNodes().get(FEATURES).addAll(getFeatures());
            
            this.setProcessed(true);
        }
        
        logger.debug(" << FeatureHolder.process()");
        return true;
    }

    @SuppressWarnings({ "rawtypes" })
    @Override
    public boolean process(List<Processor> parentProcesses, CouchDAO couchDAO) throws Exception
    {
        boolean initProcess = super.process(parentProcesses, couchDAO);
        return process() && initProcess;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        FeatureHolder copy = new FeatureHolder();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
