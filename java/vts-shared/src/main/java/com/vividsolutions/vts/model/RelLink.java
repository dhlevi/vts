package com.vividsolutions.vts.model;

public class RelLink
{
    public String type;
    public String method;
    public String uri;
    
    public RelLink()
    {
        
    }
    
    public RelLink(String type, String method, String uri)
    {
        this.type = type;
        this.uri = uri;
        this.method = method;
    }

    public String getType()
    {
        return type;
    }

    public void setType(String type)
    {
        this.type = type;
    }

    public String getUri()
    {
        return uri;
    }

    public void setUri(String uri)
    {
        this.uri = uri;
    }

    public String getMethod()
    {
        return method;
    }

    public void setMethod(String method)
    {
        this.method = method;
    }
    
}
