package com.vividsolutions.vts.model.processors.transformation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.operation.overlay.OverlayOp;
import com.vividsolutions.jts.operation.overlay.snap.SnapIfNeededOverlayOp;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.NodeMap;
import com.vividsolutions.vts.model.processors.Processor;

public class OverlayOperator extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(OverlayOperator.class);
    
    private static final long serialVersionUID = 1369099147920646590L;
    
    // output nodes
    public static final String OUTSIDE_FEATURES = "outside";
    // input nodes
    public static final String INPUT_NODE_OPERATORS = "operators";
    
    public enum OverlayOperation { intersection, difference, union };
    
    private List<UUID> operatorFeatures;
    
    private OverlayOperation overlayOperation;
    
    public OverlayOperator()
    {
        super();
        this.setType(Processor.Type.OVERLAY_OPERATOR.toString());
        this.getInputNodes().put(INPUT_NODE_OPERATORS, new ArrayList<NodeMap>());
        this.getOutputNodes().put(OUTSIDE_FEATURES, new ArrayList<UUID>(0));
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) overlayFeatures();
            this.setProcessed(true);
        }
        
        return true;
    }

    @SuppressWarnings({ "rawtypes", "unchecked" })
    @Override
    public boolean process(List<Processor> parentProcesses, CouchDAO couchDAO) throws Exception
    {
        if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
        if(operatorFeatures == null) operatorFeatures = new ArrayList<UUID>();
        setCouchDAO(couchDAO);
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
                            
                            if(inputKey.equals(INPUT_NODE_OPERATORS))
                            {
                                operatorFeatures.addAll((Collection<? extends UUID>) processor.getOutputNodes().get(input.getNode()));
                            }
                            else
                            {
                                getFeatures().addAll((Collection<? extends UUID>) processor.getOutputNodes().get(input.getNode()));
                            }
                            
                            break;
                        }
                    }
                }
            }
        }
        
        return process();
    }

    private void overlayFeatures() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> overlayFeatures()");
        
        // overlay all features in "features" with features in "operatorFeatures"
        
        for(UUID clippeeId : getFeatures())
        {
            Feature clippee = getCouchDAO().getGeometry(clippeeId);
            
            Feature copy = new Feature(getProcessorID(), FEATURES, clippee);
            Geometry clippeeGeometry = copy.getAsGeometryObject();
            
            boolean unmodified = true;
            
            if(operatorFeatures != null)
            {
                for(UUID clipperId : operatorFeatures)
                {
                    Feature clipper = getCouchDAO().getGeometry(clipperId);
                    
                    Geometry clipperGeometry = clipper.getAsGeometryObject();       

                    clippeeGeometry = performOverlay(clipperGeometry, clippeeGeometry);
                }
                
                unmodified = clippeeGeometry.equals(copy.getAsGeometryObject());
                copy.setFromGeometryObject(clippeeGeometry);
            }
            else
            {
                for(UUID clipperId : operatorFeatures)
                {
                    Feature clipper = getCouchDAO().getGeometry(clipperId);
                    
                    if(!clipper.equals(clippee))
                    {
                        Geometry clipperGeometry = clipper.getAsGeometryObject();       
                        
                        clippeeGeometry = performOverlay(clipperGeometry, clippeeGeometry);
                    }
                }
                
                unmodified = clippeeGeometry.equals(copy.getAsGeometryObject());
                copy.setFromGeometryObject(clippeeGeometry);
            }

            Attribute modifiedAffectedAttribute = new Attribute();
            modifiedAffectedAttribute.setName("MODIFIED_BY_OVERLAY_OPERATOR_" + this.getProcessorID());
            modifiedAffectedAttribute.setAlias("Modified by Overlay Operation");
            modifiedAffectedAttribute.setDataType(DataType.bool);
            modifiedAffectedAttribute.setValue(Boolean.toString(unmodified));
            
            copy.getAttributes().add(modifiedAffectedAttribute);
            
            if(unmodified) 
            {
                copy.setNode(OUTSIDE_FEATURES);
                getCouchDAO().createResource(copy);
                getOutputNodes().get(OUTSIDE_FEATURES).add(copy.getGeometryID());
            }
            else 
            {
                copy.setNode(FEATURES);
                getCouchDAO().createResource(copy);
                getOutputNodes().get(FEATURES).add(copy.getGeometryID());
            }
        }
        
        logger.debug(" << overlayFeatures()");
    }
    
    private Geometry performOverlay(Geometry clipper, Geometry clippee)
    {
        int op = 0;
        
        if(overlayOperation == OverlayOperation.difference) op = OverlayOp.DIFFERENCE;
        else if(overlayOperation == OverlayOperation.union) op = OverlayOp.UNION;
        else if(overlayOperation == OverlayOperation.intersection) op = OverlayOp.INTERSECTION;
        
        return SnapIfNeededOverlayOp.overlayOp(clippee, clipper, op);
    }
    
    public List<UUID> getOperatorFeatures()
    {
        return operatorFeatures;
    }

    public void setOperatorFeatures(List<UUID> clipperFeatures)
    {
        this.operatorFeatures = clipperFeatures;
    }

    public OverlayOperation getOverlayOperation()
    {
        return overlayOperation;
    }

    public void setOverlayOperation(OverlayOperation overlayOperation)
    {
        this.overlayOperation = overlayOperation;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        OverlayOperator copy = new OverlayOperator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOperatorFeatures(new ArrayList<UUID>());
        copy.setOverlayOperation(this.getOverlayOperation());
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
