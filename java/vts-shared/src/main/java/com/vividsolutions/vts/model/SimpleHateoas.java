package com.vividsolutions.vts.model;

import java.util.List;

public interface SimpleHateoas
{
    public String getETag();
    public void setETag(String eTag);
    public List<RelLink> getLinks();
    public void setLinks(List<RelLink> links);
}
