package com.vividsolutions.vts.dao;

import org.ektorp.CouchDbConnector;
import org.ektorp.support.CouchDbRepositorySupport;

import com.vividsolutions.vts.model.VTSUser;

public class VTSUserResourceDAO extends CouchDbRepositorySupport<VTSUser>
{
    protected VTSUserResourceDAO(Class<VTSUser> type, CouchDbConnector db) 
    {
        super(type, db);
    }
}
