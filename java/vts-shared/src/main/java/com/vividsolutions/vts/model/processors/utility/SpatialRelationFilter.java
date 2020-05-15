package com.vividsolutions.vts.model.processors.utility;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.IntersectionMatrix;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.NodeMap;
import com.vividsolutions.vts.model.processors.Processor;

public class SpatialRelationFilter extends FeatureProcessor
{
    private static final long serialVersionUID = 6384573761986666138L;

    private static Log logger = LogFactory.getLog(SpatialRelationFilter.class);
    
    public enum SpatialRelationType { any, intersects, contains, within, equals, disjoint, touches, crosses, overlaps, covers, coveredby };
    
    // output nodes
    public static final String OUTPUT_NODE_FAILED = "failed";
    // input nodes
    public static final String INPUT_NODE_OPERATORS = "operators";
    
    private List<UUID> operatorFeatures;
    
    private List<SpatialRelationType> relationTypes;
    
    public SpatialRelationFilter()
    {
        super();
        this.setType(Processor.Type.SPATIAL_RELATION_FILTER.toString());

        this.getInputNodes().put(INPUT_NODE_OPERATORS, new ArrayList<NodeMap>());
        this.getOutputNodes().put(OUTPUT_NODE_FAILED, new ArrayList<UUID>(0));
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

    @SuppressWarnings({ "rawtypes", "unchecked" })
    @Override
    public boolean process(List<Processor> parentProcesses, CouchDAO couchDAO) throws Exception
    {
        if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
        if(operatorFeatures == null) operatorFeatures = new ArrayList<UUID>();
        setCouchDAO(couchDAO);
        logger.debug(" >> SpatialRelationFilter.process()");
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
                                operatorFeatures.addAll((Collection<? extends UUID>) processor.getOutputNodes().get(input.getNode()));
                            else 
                                getFeatures().addAll((Collection<? extends UUID>) processor.getOutputNodes().get(input.getNode()));
                            
                            break;
                        }
                    }
                }
            }
        }
        
        return process();
    }

    private void filterFeatures() throws ParseException
    {
        logger.debug(" >> filterFeatures()");

        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                
                Geometry geom = feature.getAsGeometryObject();
                boolean add = false;
                
                if(operatorFeatures != null)
                {
                    for(UUID operatorFeatureId : operatorFeatures)
                    {
                        Feature operatorFeature = getCouchDAO().getGeometry(operatorFeatureId);
                        
                        Geometry operatorGeom = operatorFeature.getAsGeometryObject();
                        
                        IntersectionMatrix relatedMatrix = geom.relate(operatorGeom);
                        for(SpatialRelationType type : relationTypes)
                        {
                            if((type == SpatialRelationType.contains || type == SpatialRelationType.any) && relatedMatrix.isContains()) add = true;
                            else if((type == SpatialRelationType.intersects || type == SpatialRelationType.any) && relatedMatrix.isIntersects()) add = true;
                            else if((type == SpatialRelationType.within || type == SpatialRelationType.any) && relatedMatrix.isWithin()) add = true;
                            else if((type == SpatialRelationType.equals || type == SpatialRelationType.any) && relatedMatrix.isEquals(geom.getDimension(), operatorGeom.getDimension())) add = true;
                            else if((type == SpatialRelationType.disjoint || type == SpatialRelationType.any) && relatedMatrix.isDisjoint()) add = true;
                            else if((type == SpatialRelationType.touches || type == SpatialRelationType.any) && relatedMatrix.isTouches(geom.getDimension(), operatorGeom.getDimension())) add = true;
                            else if((type == SpatialRelationType.crosses || type == SpatialRelationType.any) && relatedMatrix.isCrosses(geom.getDimension(), operatorGeom.getDimension())) add = true;
                            else if((type == SpatialRelationType.overlaps || type == SpatialRelationType.any) && relatedMatrix.isOverlaps(geom.getDimension(), operatorGeom.getDimension())) add = true;
                            else if((type == SpatialRelationType.covers || type == SpatialRelationType.any) && relatedMatrix.isCovers()) add = true;
                            else if((type == SpatialRelationType.coveredby || type == SpatialRelationType.any) && relatedMatrix.isCoveredBy()) add = true;
                            
                            if(add) break;
                        }
                        
                        if(add) break;
                    }
                    
                    Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                    if(add) 
                    {
                        getCouchDAO().createResource(copy);
                        getOutputNodes().get(FEATURES).add(copy.getGeometryID());
                    }
                    else 
                    {
                        copy.setNode(OUTPUT_NODE_FAILED);
                        getCouchDAO().createResource(copy);
                        getOutputNodes().get(OUTPUT_NODE_FAILED).add(copy.getGeometryID());
                    }
                }
                else
                {
                    for(UUID featureToCompareId : getFeatures())
                    {
                        Feature featureToCompare = getCouchDAO().getGeometry(featureToCompareId);
                        
                        Geometry operatorGeom = featureToCompare.getAsGeometryObject();
                        
                        IntersectionMatrix relatedMatrix = geom.relate(operatorGeom);
        
                        for(SpatialRelationType type : relationTypes)
                        {
                            if((type == SpatialRelationType.contains || type == SpatialRelationType.any) && relatedMatrix.isContains()) add = true;
                            else if((type == SpatialRelationType.intersects || type == SpatialRelationType.any) && relatedMatrix.isIntersects()) add = true;
                            else if((type == SpatialRelationType.within || type == SpatialRelationType.any) && relatedMatrix.isWithin()) add = true;
                            else if((type == SpatialRelationType.equals || type == SpatialRelationType.any) && relatedMatrix.isEquals(geom.getDimension(), operatorGeom.getDimension())) add = true;
                            else if((type == SpatialRelationType.disjoint || type == SpatialRelationType.any) && relatedMatrix.isDisjoint()) add = true;
                            else if((type == SpatialRelationType.touches || type == SpatialRelationType.any) && relatedMatrix.isTouches(geom.getDimension(), operatorGeom.getDimension())) add = true;
                            else if((type == SpatialRelationType.crosses || type == SpatialRelationType.any) && relatedMatrix.isCrosses(geom.getDimension(), operatorGeom.getDimension())) add = true;
                            else if((type == SpatialRelationType.overlaps || type == SpatialRelationType.any) && relatedMatrix.isOverlaps(geom.getDimension(), operatorGeom.getDimension())) add = true;
                            else if((type == SpatialRelationType.covers || type == SpatialRelationType.any) && relatedMatrix.isCovers()) add = true;
                            else if((type == SpatialRelationType.coveredby || type == SpatialRelationType.any) && relatedMatrix.isCoveredBy()) add = true;
                            
                            if(add) break;
                        }
                        
                        if(add) break;
                    }
                    
                    Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                    if(add) 
                    {
                        getCouchDAO().createResource(copy);
                        getOutputNodes().get(FEATURES).add(copy.getGeometryID());
                    }
                    else 
                    {
                        copy.setNode(OUTPUT_NODE_FAILED);
                        getCouchDAO().createResource(copy);
                        getOutputNodes().get(OUTPUT_NODE_FAILED).add(copy.getGeometryID());
                    }
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
    
    public List<SpatialRelationType> getRelationTypes()
    {
        return relationTypes;
    }

    public void setRelationTypes(List<SpatialRelationType> relationTypes)
    {
        this.relationTypes = relationTypes;
    }
    public List<UUID> getOperatorFeatures()
    {
        return operatorFeatures;
    }

    public void setOperatorFeatures(List<UUID> clipperFeatures)
    {
        this.operatorFeatures = clipperFeatures;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        SpatialRelationFilter copy = new SpatialRelationFilter();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOperatorFeatures(new ArrayList<UUID>());
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
