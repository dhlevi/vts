package com.vividsolutions.vts.model;

import java.util.UUID;

public class EngineStatus
{
    private UUID engineID;
    private String engineName;
    private int runningRequests;
    private int runningTasks;
    private boolean halted;
    private boolean registered;
    
    public EngineStatus()
    {
        
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

    public int getRunningRequests()
    {
        return runningRequests;
    }

    public void setRunningRequests(int runningRequests)
    {
        this.runningRequests = runningRequests;
    }

    public int getRunningTasks()
    {
        return runningTasks;
    }

    public void setRunningTasks(int runningTasks)
    {
        this.runningTasks = runningTasks;
    }

    public boolean isHalted()
    {
        return halted;
    }

    public void setHalted(boolean halted)
    {
        this.halted = halted;
    }

    public boolean isRegistered()
    {
        return registered;
    }

    public void setRegistered(boolean registered)
    {
        this.registered = registered;
    }
}
