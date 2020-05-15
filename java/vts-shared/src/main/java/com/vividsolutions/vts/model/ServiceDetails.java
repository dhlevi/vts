package com.vividsolutions.vts.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class ServiceDetails implements Serializable, SimpleHateoas
{
    private static final long serialVersionUID = 8774858588103895223L;
 
    private String eTag;
    private List<RelLink> links;
    
    private String name;
    private String details;
    
    public ServiceDetails()
    {
        
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getDetails()
    {
        return details;
    }

    public void setDetails(String details)
    {
        this.details = details;
    }

    @Override
    public String getETag()
    {
        return eTag;
    }

    @Override
    public void setETag(String eTag)
    {
        this.eTag = eTag;
    }

    @Override
    public List<RelLink> getLinks()
    {
        if(links == null) links = new ArrayList<RelLink>();
        return links;
    }

    @Override
    public void setLinks(List<RelLink> links)
    {
        this.links = links;
    }
}
