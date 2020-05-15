package com.vividsolutions.vts.dao;

import org.ektorp.CouchDbConnector;
import org.ektorp.support.CouchDbRepositorySupport;

import com.vividsolutions.vts.model.Engine;

public class VTSEngineDAO extends CouchDbRepositorySupport<Engine>
{
    protected VTSEngineDAO(Class<Engine> type, CouchDbConnector db) 
    {
        super(type, db);
    }
}
