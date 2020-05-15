package com.vividsolutions.vts.model;

import java.io.Serializable;

import com.vividsolutions.vts.model.Attribute.DataType;

public class AttributeUpdateValueMapper implements Serializable
{
    private static final long serialVersionUID = 2309638095928942016L;
 
    private String attributeToTest;
    
    private String newAttributeName;
    private String newAttributeAlias;
    private DataType newDataType;
    private int newDecimalPrecision;
    private String newDateFormat;
    private int newDisplayOrder;
    private int newLength;
    
    public AttributeUpdateValueMapper()
    {
        
    }

    public DataType getNewDataType()
    {
        return newDataType;
    }

    public void setNewDataType(DataType newDataType)
    {
        this.newDataType = newDataType;
    }

    public int getNewDecimalPrecision()
    {
        return newDecimalPrecision;
    }

    public void setNewDecimalPrecision(int newDecimalPrecision)
    {
        this.newDecimalPrecision = newDecimalPrecision;
    }

    public String getNewDateFormat()
    {
        return newDateFormat;
    }

    public void setNewDateFormat(String newDateFormat)
    {
        this.newDateFormat = newDateFormat;
    }

    public int getNewDisplayOrder()
    {
        return newDisplayOrder;
    }

    public void setNewDisplayOrder(int newDisplayOrder)
    {
        this.newDisplayOrder = newDisplayOrder;
    }

    public int getNewLength()
    {
        return newLength;
    }

    public void setNewLength(int newLength)
    {
        this.newLength = newLength;
    }

    public String getAttributeToTest()
    {
        return attributeToTest;
    }

    public void setAttributeToTest(String attributeToTest)
    {
        this.attributeToTest = attributeToTest;
    }

    public String getNewAttributeName()
    {
        return newAttributeName;
    }

    public void setNewAttributeName(String newAttributeName)
    {
        this.newAttributeName = newAttributeName;
    }

    public String getNewAttributeAlias()
    {
        return newAttributeAlias;
    }

    public void setNewAttributeAlias(String newAttributeAlias)
    {
        this.newAttributeAlias = newAttributeAlias;
    }
}
