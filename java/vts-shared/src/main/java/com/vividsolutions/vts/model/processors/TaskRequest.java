package com.vividsolutions.vts.model.processors;

public class TaskRequest extends ProcessorRequest
{
    private static final long serialVersionUID = -3872248203757300100L;

    public enum IntervalUnit { Seconds, Minutes, Hours, Days };

    private int interval;
    private IntervalUnit intervalUnit;
    
    public TaskRequest()
    {
        intervalUnit = IntervalUnit.Minutes;
        interval = 60;
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
}
