package com.vividsolutions.vts.dao;

import org.ektorp.CouchDbConnector;
import org.ektorp.support.CouchDbRepositorySupport;

import com.vividsolutions.vts.engine.RequestParameters;

public class VTSRequestResourceDAO extends CouchDbRepositorySupport<RequestParameters>
{
    protected VTSRequestResourceDAO(Class<RequestParameters> type, CouchDbConnector db) 
    {
        super(type, db);
    }
}
