package com.vividsolutions.vts.model;

import java.util.Date;

import org.ektorp.support.CouchDbDocument;

public class LogMessage extends CouchDbDocument
{
    private static final long serialVersionUID = -2746862305930768043L;

    private String processID;
    private String processorID;
    private String message;
    private Date timestamp;
    
    public LogMessage()
    {
        timestamp = new Date();
    }

    public LogMessage(String processID, String processorID, String message)
    {
        this.processID = processID;
        this.processorID = processorID;
        this.message = message;
        
        timestamp = new Date();
    }
    
    public String getProcessID()
    {
        return processID;
    }

    public void setProcessID(String processID)
    {
        this.processID = processID;
    }

    public String getProcessorID()
    {
        return processorID;
    }

    public void setProcessorID(String processorID)
    {
        this.processorID = processorID;
    }

    public String getMessage()
    {
        return message;
    }

    public void setMessage(String message)
    {
        this.message = message;
    }

    public Date getTimestamp()
    {
        return timestamp;
    }

    public void setTimestamp(Date timestamp)
    {
        this.timestamp = timestamp;
    }
}
