package com.vividsolutions.vts.model;

import java.io.Serializable;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Attribute implements Serializable
{
    private static final long serialVersionUID = 828142833989904329L;
 
    private String name;
    private String alias;
    private DataType dataType;
    private String value;
    private int decimalPrecision;
    private String dateFormat;
    private int displayOrder;
    private int length;
    
    public enum DataType { string, number, date, bool, geometry };
    
    public Attribute()
    {
        
    }

    public Attribute(Attribute copy)
    {
        name = copy.getName();
        alias = copy.getAlias();
        dataType = copy.getDataType();
        value = copy.getValue();
        decimalPrecision = copy.getDecimalPrecision();
        dateFormat = copy.getDateFormat();
        displayOrder = copy.getDisplayOrder();
    }
    
    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getAlias()
    {
        return alias;
    }

    public void setAlias(String alias)
    {
        this.alias = alias;
    }

    public DataType getDataType()
    {
        return dataType;
    }

    public void setDataType(DataType dataType)
    {
        this.dataType = dataType;
    }

    @JsonIgnore
    public Object getTypedValue()
    {
        if(dataType == DataType.bool) return Boolean.parseBoolean(value);
        else if(dataType == DataType.date) 
        {
            if(value == null) return new Date();
            
            DateFormat format = new SimpleDateFormat(dateFormat);
            try
            {
                return format.parse(value);
            }
            catch (ParseException e)
            {
                e.printStackTrace();
                return value;
            }
        }
        else if(dataType == DataType.number)
        {
            if(value == null) return 0;
            
            if(this.decimalPrecision == 0 && !value.contains(".")) return Integer.parseInt(value);
            else 
            {
                double val = 0;
                try
                {
                    val = Double.parseDouble(value);
                }
                catch(NumberFormatException e)
                {
                    e.printStackTrace();
                }
                
                return val;
            }
        }
        else return value;
    }
    
    public String getValue()
    {
        return value;
    }

    public void setValue(String value)
    {
        this.value = value;
    }

    public int getDecimalPrecision()
    {
        return decimalPrecision;
    }

    public void setDecimalPrecision(int decimalPrecision)
    {
        this.decimalPrecision = decimalPrecision;
    }

    public String getDateFormat()
    {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat)
    {
        this.dateFormat = dateFormat;
    }

    public int getDisplayOrder()
    {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder)
    {
        this.displayOrder = displayOrder;
    }

    public int getLength()
    {
        return length;
    }

    public void setLength(int length)
    {
        this.length = length;
    }
}
