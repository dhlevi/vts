package com.vividsolutions.vts.dao;

import org.ektorp.CouchDbConnector;
import org.ektorp.support.CouchDbRepositorySupport;

import com.vividsolutions.vts.model.Feature;

public class VTSGeometryCacheDAO extends CouchDbRepositorySupport<Feature>
{
    protected VTSGeometryCacheDAO(Class<Feature> type, CouchDbConnector db) 
    {
        super(type, db);
    }
}