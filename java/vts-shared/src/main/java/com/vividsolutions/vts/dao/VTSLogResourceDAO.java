package com.vividsolutions.vts.dao;

import org.ektorp.CouchDbConnector;
import org.ektorp.support.CouchDbRepositorySupport;

import com.vividsolutions.vts.model.LogMessage;

public class VTSLogResourceDAO extends CouchDbRepositorySupport<LogMessage>
{
    protected VTSLogResourceDAO(Class<LogMessage> type, CouchDbConnector db) 
    {
        super(type, db);
    }
}
