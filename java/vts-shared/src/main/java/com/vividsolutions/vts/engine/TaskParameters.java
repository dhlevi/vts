package com.vividsolutions.vts.engine;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.vts.model.processors.Processor;
import com.vividsolutions.vts.model.processors.TaskRequest.IntervalUnit;

public class TaskParameters extends RequestParameters
{
    private static final long serialVersionUID = -7774881644223065369L;

    
    private int interval;
    private IntervalUnit intervalUnit;
    private boolean isRunning;
    private Instant nextExecutionTime;
    private Long nextExecutionTimeEpoch;
    private int nextExecutionTimeNano;
    private Date lastFailureDate;
    private boolean halted;
    
    @SuppressWarnings("rawtypes")
    public TaskParameters()
    {
        this.setProcessors(new ArrayList<Processor>());
    }

    public int getInterval()
    {
        return interval;
    }

    public void setInterval(int interval)
    {
        this.interval = interval;
    }

    public IntervalUnit getIntervalUnit()
    {
        return intervalUnit;
    }

    public void setIntervalUnit(IntervalUnit intervalUnit)
    {
        this.intervalUnit = intervalUnit;
    }

    @JsonIgnore
    public Instant getNextExecutionTime()
    {
        return nextExecutionTime;
    }

    public void setNextExecutionTime(Instant nextExecutionTime)
    {
        if(nextExecutionTime != null)
        {
            setNextExecutionTimeEpoch(nextExecutionTime.getEpochSecond());
            setNextExecutionTimeNano(nextExecutionTime.getNano());
        }
        else
        {
            setNextExecutionTimeEpoch(null);
            setNextExecutionTimeNano(0);
        }
        
        this.nextExecutionTime = nextExecutionTime;
    }

    public Long getNextExecutionTimeEpoch()
    {
        return nextExecutionTimeEpoch;
    }

    public void setNextExecutionTimeEpoch(Long nextExecutionTimeEpoch)
    {
        this.nextExecutionTimeEpoch = nextExecutionTimeEpoch;
    }

    public int getNextExecutionTimeNano()
    {
        return nextExecutionTimeNano;
    }

    public void setNextExecutionTimeNano(int nextExecutionTimeNano)
    {
        this.nextExecutionTimeNano = nextExecutionTimeNano;
    }

    public boolean isRunning()
    {
        return isRunning;
    }

    public void setRunning(boolean isRunning)
    {
        this.isRunning = isRunning;
    }

    public boolean isHalted()
    {
        return halted;
    }

    public void setHalted(boolean halted)
    {
        this.halted = halted;
    }

    public Date getLastFailureDate()
    {
        return lastFailureDate;
    }

    public void setLastFailureDate(Date lastFailureDate)
    {
        this.lastFailureDate = lastFailureDate;
    }
}
