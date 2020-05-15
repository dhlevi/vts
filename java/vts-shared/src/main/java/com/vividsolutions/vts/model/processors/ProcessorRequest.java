package com.vividsolutions.vts.model.processors;

import java.util.ArrayList;
import java.util.List;

import org.ektorp.support.CouchDbDocument;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.vividsolutions.vts.model.RelLink;
import com.vividsolutions.vts.model.SimpleHateoas;

//@JsonIgnoreProperties({"id", "revision"})
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProcessorRequest extends CouchDbDocument implements SimpleHateoas
{
    private static final long serialVersionUID = -1385933833468040655L;
 
    private int priority;
    @SuppressWarnings("rawtypes")
    private List<Processor> processors;
    
    private String name;
    private String user;
    private boolean isPublic;
    
    private String eTag;
    private List<RelLink> links;
        
    public ProcessorRequest()
    {
    }

    public int getPriority()
    {
        return priority;
    }

    public void setPriority(int priority)
    {
        this.priority = priority;
    }

    @SuppressWarnings("rawtypes")
    public List<Processor> getProcessors()
    {
        return processors;
    }

    @SuppressWarnings("rawtypes")
    public void setProcessors(List<Processor> processors)
    {
        this.processors = processors;
    }
    
    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getUser()
    {
        return user;
    }

    public void setUser(String user)
    {
        this.user = user;
    }

    public boolean isPublic()
    {
        return isPublic;
    }

    public void setPublic(boolean isPublic)
    {
        this.isPublic = isPublic;
    }

    // Hateoas
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
