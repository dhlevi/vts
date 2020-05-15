package com.vividsolutions.vts.model.processors;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;

@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class FeatureProcessor extends Processor<Feature>
{
    private static final long serialVersionUID = 7776169683078335401L;

    private CouchDAO couchDAO;
    
    private List<UUID> features;
    
    public FeatureProcessor()
    {
        super();
    }
    
    @SuppressWarnings({ "rawtypes", "unchecked" })
    public boolean process(List<Processor> parentProcesses, CouchDAO couchDAO) throws Exception
    {
        if(features == null) features = new ArrayList<UUID>();
        if(this.couchDAO == null) this.couchDAO = couchDAO;
        if(getInputNodes().size() > 0 && !this.isProcessed())
        {
            for(String inputKey : getInputNodes().keySet())
            {
                List<NodeMap> inputs = getInputNodes().get(inputKey);
                
                for(NodeMap input : inputs)
                {
                    // find the processor, call the results for the specified node name
                    for(Processor processor : parentProcesses)
                    {
                        if(processor.getProcessorID().equals(input.getProcessorID()))
                        {
                            // process the node, in case it hasn't been hit yet
                            // if the node is already processed, this will be ignored.
                            processor.process(parentProcesses, couchDAO);
                            
                            features.addAll((Collection<? extends UUID>) processor.getOutputNodes().get(input.getNode()));
                            
                            break;
                        }
                    }
                }
            }
        }
        
        return true; // process();
    }
    
    public abstract boolean process() throws Exception;
    
    @JsonIgnore
    public abstract FeatureProcessor getSimpleResults();
    
    public List<UUID> getFeatures()
    {
        return features;
    }

    public void setFeatures(List<UUID> features)
    {
        this.features = features;
    }

    @JsonIgnore
    public CouchDAO getCouchDAO()
    {
        return couchDAO;
    }

    @JsonIgnore
    public void setCouchDAO(CouchDAO couchDAO)
    {
        this.couchDAO = couchDAO;
    }
}
