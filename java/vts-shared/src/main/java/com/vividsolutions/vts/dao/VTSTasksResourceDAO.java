package com.vividsolutions.vts.dao;

import org.ektorp.CouchDbConnector;
import org.ektorp.support.CouchDbRepositorySupport;

import com.vividsolutions.vts.engine.TaskParameters;

public class VTSTasksResourceDAO extends CouchDbRepositorySupport<TaskParameters>
{
    protected VTSTasksResourceDAO(Class<TaskParameters> type, CouchDbConnector db) 
    {
        super(type, db);
    }
}
