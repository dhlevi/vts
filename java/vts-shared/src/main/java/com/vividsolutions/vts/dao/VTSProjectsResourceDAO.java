package com.vividsolutions.vts.dao;

import org.ektorp.CouchDbConnector;
import org.ektorp.support.CouchDbRepositorySupport;

import com.vividsolutions.vts.model.processors.ProcessorRequest;

public class VTSProjectsResourceDAO extends CouchDbRepositorySupport<ProcessorRequest>
{
    protected VTSProjectsResourceDAO(Class<ProcessorRequest> type, CouchDbConnector db) 
    {
        super(type, db);
    }
}