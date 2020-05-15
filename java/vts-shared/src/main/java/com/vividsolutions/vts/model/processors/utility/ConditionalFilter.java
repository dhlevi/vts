package com.vividsolutions.vts.model.processors.utility;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Condition;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class ConditionalFilter extends FeatureProcessor
{
    private static final long serialVersionUID = 6295244071223314838L;
 
    private static Log logger = LogFactory.getLog(ConditionalFilter.class);
    
    public static final String FAILED_NODE = "failed";

    private List<Condition> conditions;
    private boolean conditionalAnd;
    
    public ConditionalFilter()
    {
        super();
        
        this.setType(Processor.Type.CONDITIONAL_FILTER.toString());
        conditionalAnd = true;
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
                
                boolean passedConditions = false;
                
                List<Boolean> evaluatedConditions = new ArrayList<Boolean>();
                
                for(Condition condition : conditions)
                {
                    boolean passed = condition.processCondition(feature.getAttributes());
                    
                    evaluatedConditions.add(passed);
                    
                }
                
                // loop through condition results and detetmine if this is an overall pass or fail
                for(Boolean evaluatedCondition : evaluatedConditions)
                {
                    if(evaluatedCondition == false && conditionalAnd)
                    {
                        passedConditions = false;
                        break;
                    }
                    else if(evaluatedCondition == true && !conditionalAnd)
                    {
                        passedConditions = true;
                    }
                }
                
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                
                if(!passedConditions)
                {
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
        
        logger.debug(" << filterFeatures()");
    }

    public List<Condition> getConditions()
    {
        if(conditions == null) conditions = new ArrayList<Condition>();
        return conditions;
    }

    public void setConditions(List<Condition> conditions)
    {
        this.conditions = conditions;
    }

    public boolean isConditionalAnd()
    {
        return conditionalAnd;
    }

    public void setConditionalAnd(boolean conditionalAnd)
    {
        this.conditionalAnd = conditionalAnd;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        ConditionalFilter copy = new ConditionalFilter();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
