package com.vividsolutions.vts.model.processors.utility;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mvel2.MVEL;
import org.mvel2.integration.VariableResolverFactory;
import org.mvel2.integration.impl.MapVariableResolverFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class AttributeCalculator extends FeatureProcessor
{
    private static Log logger = LogFactory.getLog(AttributeCalculator.class);
    
    private static final long serialVersionUID = 8844198109274331774L;

    private String expression;
    private String attributeName; // the attribute to store the result. If it isn't found, create it
    
    public AttributeCalculator()
    {
        super();
        this.setType(Processor.Type.ATTRIBUTE_CALCULATOR.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) calculateAttributes();
            
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

    @SuppressWarnings("unchecked")
    private void calculateAttributes() throws ParseException
    {
        logger.debug(" >> calculateAttributes()");
        
        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
                
                @SuppressWarnings("rawtypes")
                Map context = new HashMap();
                
                List<String> attributesToEvaluate = new ArrayList<String>();
                
                boolean readingAttributeName = false;
                String varAttributeName = "";
                for(int i = 0; i < expression.length(); i++)
                {
                    if(readingAttributeName)
                    {
                        varAttributeName += expression.charAt(i);
                    }
                    
                    // do we have an attribute tag here? '${' evals to attribute tag
                    if(expression.charAt(i) == '$' && expression.charAt(i + 1) == '{')
                    {
                        i++;
                        readingAttributeName = true;
                    }
                    else if(readingAttributeName && expression.charAt(i + 1) == '}')
                    {
                        readingAttributeName = false;
                        attributesToEvaluate.add(varAttributeName);
                        varAttributeName = "";
                    }
                }
    
                //do we have a featuer var?
                for(String attName : attributesToEvaluate)
                {
                    if(attName.equals("feature"))
                    {
                        expression = expression.replace("${feature}", "feature");
                        context.put("feature", feature);
                    }
                    else if(attName.equals("geometry"))
                    {
                        expression = expression.replace("${geometry}", "geometry");
                        context.put("geometry", feature.getAsGeometryObject());
                        // access a geometry object beans
                    }
                }
                
                // first, parse the expression string. Find any ${...} chunks and replace with the attribute
                Attribute attributeToUpdate = null;
                for(Attribute attribute : copy.getAttributes())
                {
                    for(String attName : attributesToEvaluate)
                    {
                        if(attName.equals(attribute.getName()))
                        {
                            expression = expression.replace("${" + attName + "}", attName);
                            context.put(attName, attribute.getTypedValue());
                            break;
                        }
                    }
                    
                    // pull the attribute to update here as well, while we're iterating through here
                    if(attributeName.equals(attribute.getName()))
                    {
                        attributeToUpdate = attribute;
                    }
                }
                
                if(attributeToUpdate == null)
                {
                    attributeToUpdate = new Attribute();
                    attributeToUpdate.setName(attributeName);
                    attributeToUpdate.setAlias(attributeName);
                    attributeToUpdate.setDisplayOrder(copy.getAttributes().size() + 1);
                    
                    copy.getAttributes().add(attributeToUpdate);
                }
                
                VariableResolverFactory functionFactory = new MapVariableResolverFactory(context);
                
                try
                {
                    Object result = MVEL.eval(expression, functionFactory);
                    // set data type?
                    attributeToUpdate.setValue(result.toString());
                    logger.debug("Expression evaluated:" + result);
        
                    //Serializable compileExpression = MVEL.compileExpression(expression);
                    //result = MVEL.executeExpression(compileExpression, context, functionFactory);
                }
                catch(Exception e)
                {
                    this.getMessages().add("Error processing expression for feature. " + e.getMessage());
                }
                
                getCouchDAO().createResource(copy);
                getOutputNodes().get(FEATURES).add(copy.getGeometryID());
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                throw new RuntimeException(e);
            }
        });
        
        logger.debug(" << calculateAttributes()");
    }
    
    public String getExpression()
    {
        return expression;
    }

    public void setExpression(String expression)
    {
        this.expression = expression;
    }

    public String getAttributeName()
    {
        return attributeName;
    }

    public void setAttributeName(String attributeName)
    {
        this.attributeName = attributeName;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        AttributeCalculator copy = new AttributeCalculator();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
