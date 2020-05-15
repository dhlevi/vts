package com.vividsolutions.vts.model;

import java.util.UUID;

import org.ektorp.support.CouchDbDocument;

public class Engine extends CouchDbDocument
{
    private static final long serialVersionUID = 7998486786111928458L;
 
    private UUID engineID;
    private String engineName;
    private String engineURL;
    private boolean acceptRequests;
    private boolean acceptTasks;
    private boolean halted;
    private boolean recycle;
    
    public Engine()
    {
        
    }

    public boolean isAcceptRequests()
    {
        return acceptRequests;
    }

    public void setAcceptRequests(boolean acceptRequests)
    {
        this.acceptRequests = acceptRequests;
    }

    public boolean isAcceptTasks()
    {
        return acceptTasks;
    }

    public void setAcceptTasks(boolean acceptTasks)
    {
        this.acceptTasks = acceptTasks;
    }

    public UUID getEngineID()
    {
        return engineID;
    }

    public void setEngineID(UUID engineID)
    {
        this.engineID = engineID;
    }

    public String getEngineName()
    {
        return engineName;
    }

    public void setEngineName(String engineName)
    {
        this.engineName = engineName;
    }

    public String getEngineURL()
    {
        return engineURL;
    }

    public void setEngineURL(String engineURL)
    {
        this.engineURL = engineURL;
    }

    public boolean isHalted()
    {
        return halted;
    }

    public void setHalted(boolean halted)
    {
        this.halted = halted;
    }

    public boolean isRecycle()
    {
        return recycle;
    }

    public void setRecycle(boolean recycle)
    {
        this.recycle = recycle;
    }
}
