package com.vividsolutions.vts.model;

import java.io.Serializable;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Condition implements Serializable
{
    private static final long serialVersionUID = 2112220245568394978L;

    public enum Conditional { Equal, Greater, Less, Contains };
    
    private boolean negate;
    private Conditional conditional;
    
    private String attributeToTest;
    private String valueToTest;
    
    private Condition and;
    private Condition or;
    
    public Condition()
    {
        
    }
    
    @JsonIgnore
    public boolean processCondition(List<Attribute> attributes)
    {
        Object value = null;
        
        for(Attribute attribute : attributes)
        {
            if(attribute.getName().equals(attributeToTest))
            {
                value = attribute.getTypedValue();
                break;
            }
        }
        
        // If the attribute doesn't even exist, then assume the condition failed.
        boolean passed = false;
        
        if(value != null)
        {
            boolean isEqual = value.equals(valueToTest);
            boolean doesContain = value.toString().contains(valueToTest);
            boolean isGreater = false;
            boolean IsLesser = false;
            
            // try and parse as a numeric value. If it parses numerically, retest isEqual
            try
            {
                double valAsNumeric = Double.parseDouble(valueToTest);
                double attValAsNumeric = Double.parseDouble(value.toString());
                
                isEqual = valAsNumeric == attValAsNumeric;
                isGreater = attValAsNumeric > valAsNumeric;
                IsLesser = attValAsNumeric < valAsNumeric;
            }
            catch(Exception e)
            {
                // ignore. Is non numeric
            }
            
            // conditions are tested. Determine if this is a pass or fail for the requested operation
            if(getConditional() == Conditional.Equal && (isEqual || (!isEqual && negate))) passed = true;
            else if(getConditional() == Conditional.Greater && (isGreater || (!isGreater && negate))) passed = true;
            else if(getConditional() == Conditional.Less && (IsLesser || (!IsLesser && negate))) passed = true;
            else if(getConditional() == Conditional.Contains && (doesContain || (!doesContain && negate))) passed = true;
        }
        
        if(and != null && passed) passed = and.processCondition(attributes);
        if(or != null && !passed) passed = or.processCondition(attributes);
        
        return passed;
    }
    
    public boolean isNegate()
    {
        return negate;
    }
    
    public void setNegate(boolean negate)
    {
        this.negate = negate;
    }
    
    public Conditional getConditional()
    {
        return conditional;
    }
    
    public void setConditional(Conditional conditional)
    {
        this.conditional = conditional;
    }
    
    public String getAttributeToTest()
    {
        return attributeToTest;
    }
    
    public void setAttributeToTest(String attributeToTest)
    {
        this.attributeToTest = attributeToTest;
    }
    
    public String getValueToTest()
    {
        return valueToTest;
    }
    
    public void setValueToTest(String valueToTest)
    {
        this.valueToTest = valueToTest;
    }

    public Condition getAnd()
    {
        return and;
    }

    public void setAnd(Condition and)
    {
        this.and = and;
    }

    public Condition getOr()
    {
        return or;
    }

    public void setOr(Condition or)
    {
        this.or = or;
    }
}
