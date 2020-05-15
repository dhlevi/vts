package com.vividsolutions.vts.model;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public class FeatureCache
{
    private Feature feature;
    private boolean isExpired;
    private boolean isPersisted;
    private Instant creationTime;
    private Instant expiryTime;
    
    public FeatureCache(Feature feature)
    {
        this.feature = feature;
        
        isExpired = false;
        isPersisted = false;
        
        creationTime = Instant.now();
        expiryTime = Instant.now().plus(5, ChronoUnit.MINUTES);
    }

    public Feature getFeature()
    {
        return feature;
    }

    public void setFeature(Feature feature)
    {
        this.feature = feature;
    }

    public boolean isExpired()
    {
        return isExpired;
    }

    public void setExpired(boolean isExpired)
    {
        this.isExpired = isExpired;
    }

    public Instant getCreationTime()
    {
        return creationTime;
    }

    public void setCreationTime(Instant creationTime)
    {
        this.creationTime = creationTime;
    }

    public Instant getExpiryTime()
    {
        return expiryTime;
    }

    public void setExpiryTime(Instant expiryTime)
    {
        this.expiryTime = expiryTime;
    }

    public boolean isPersisted()
    {
        return isPersisted;
    }

    public void setPersisted(boolean isPersisted)
    {
        this.isPersisted = isPersisted;
    }
}
