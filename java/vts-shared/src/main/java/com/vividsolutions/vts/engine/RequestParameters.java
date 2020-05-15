package com.vividsolutions.vts.engine;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.ektorp.support.CouchDbDocument;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.vividsolutions.vts.model.RelLink;
import com.vividsolutions.vts.model.SimpleHateoas;
import com.vividsolutions.vts.model.processors.Processor;

//@JsonIgnoreProperties({"id", "revision"})
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RequestParameters extends CouchDbDocument implements Serializable, Comparable<RequestParameters>, SimpleHateoas
{   
    private static final long serialVersionUID = 8551213129783481641L;

    private UUID requestID;
    private String name;
    private String user;
    private Date creationTime;
    private Date startTime;
    private Date completionTime;
    private int priority;
    @SuppressWarnings("rawtypes")
    private List<Processor> processors;
    private String message;
    private boolean successful;
    private UUID engineID;
    private String eTag;
    private List<RelLink> links;

    @SuppressWarnings("rawtypes")
    public RequestParameters()
    {
        processors = new ArrayList<Processor>();
    }

    public RequestParameters(RequestParameters copy)
    {
        requestID = copy.getRequestID();
        creationTime = copy.getCreationTime();
        startTime = copy.getStartTime();
        completionTime = copy.getCompletionTime();
        priority = copy.getPriority();
        message = copy.getMessage();
    }
    
    public boolean isStarted()
    {
        return startTime != null;
    }
    
    public void setStarted(boolean started)
    {
        
    }
    
    public boolean isCompleted()
    {
        return completionTime != null;
    }
    
    public void setCompleted(boolean started)
    {
        
    }
    
    public UUID getRequestID()
    {
        return requestID;
    }

    public void setRequestID(UUID requestID)
    {
        this.requestID = requestID;
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }
    
    public Date getCreationTime()
    {
        return creationTime;
    }

    public void setCreationTime(Date creationTime)
    {
        this.creationTime = creationTime;
    }

    public Date getStartTime()
    {
        return startTime;
    }

    public void setStartTime(Date startTime)
    {
        this.startTime = startTime;
    }

    public Date getCompletionTime()
    {
        return completionTime;
    }

    public void setCompletionTime(Date completionTime)
    {
        this.completionTime = completionTime;
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

    public String getMessage()
    {
        return message;
    }

    public void setMessage(String message)
    {
        this.message = message;
    }

    public int compareTo(RequestParameters other)
    {
        return Integer.compare(other.priority, this.priority);
    }

    public boolean isSuccessful()
    {
        return successful;
    }

    public void setSuccessful(boolean successful)
    {
        this.successful = successful;
    }

    public String getUser()
    {
        return user;
    }

    public void setUser(String user)
    {
        this.user = user;
    }

    public UUID getEngineID()
    {
        return engineID;
    }

    public void setEngineID(UUID engineID)
    {
        this.engineID = engineID;
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
