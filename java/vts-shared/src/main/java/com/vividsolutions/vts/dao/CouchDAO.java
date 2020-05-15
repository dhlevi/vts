package com.vividsolutions.vts.dao;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.ektorp.CouchDbConnector;
import org.ektorp.CouchDbInstance;
import org.ektorp.ViewQuery;
import org.ektorp.ViewResult;
import org.ektorp.ViewResult.Row;
import org.ektorp.http.HttpClient;
import org.ektorp.http.StdHttpClient;
import org.ektorp.impl.StdCouchDbConnector;
import org.ektorp.impl.StdCouchDbInstance;
import org.ektorp.support.DesignDocument;
import org.springframework.stereotype.Repository;

import com.vividsolutions.vts.engine.RequestParameters;
import com.vividsolutions.vts.engine.TaskParameters;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.FeatureCache;
import com.vividsolutions.vts.model.VTSUser;
import com.vividsolutions.vts.model.Engine;
import com.vividsolutions.vts.model.LogMessage;
import com.vividsolutions.vts.model.processors.ProcessorRequest;

@Repository
public class CouchDAO
{
    private static Log logger = LogFactory.getLog(CouchDAO.class);
    
    private String couchUrl;
    
    // couch db instances
    private CouchDbInstance userDb;
    private CouchDbConnector userDbc;
    private VTSUserResourceDAO userResourceDAO;
    
    private CouchDbInstance requestsDb;
    private CouchDbConnector requestsDbc;
    private VTSRequestResourceDAO requestResourceDAO;
    
    private CouchDbInstance tasksDb;
    private CouchDbConnector tasksDbc;
    private VTSTasksResourceDAO tasksResourceDAO;
    
    private CouchDbInstance projectsDb;
    private CouchDbConnector projectsDbc;
    private VTSProjectsResourceDAO projectsResourceDAO;
    
    private CouchDbInstance geometryDb;
    private CouchDbConnector geometryDbc;
    private VTSGeometryCacheDAO geometryDAO;
    
    private CouchDbInstance engineDb;
    private CouchDbConnector engineDbc;
    private VTSEngineDAO engineDAO;
    
    private CouchDbInstance logsDb;
    private CouchDbConnector logsDbc;
    private VTSLogResourceDAO logsDAO;
    
    //Feature Cache
    private ExecutorService executorService;
    private ConcurrentHashMap<UUID, FeatureCache> featureCache;
    private int cacheLimit;
    
    /*
     * This DAO should be split out into seperate DAO's for Engines, Task, Request, Project, Logs, Users, and Features
     */
    
    public CouchDAO(String couchUrl, String userDatabaseName, String requestsDatabaseName, String taskDatabaseName, String projectDatabaseName, String geometryDatabaseName, String engineDatabaseName, String logDatabaseName, String user, String password, int cacheLimit) throws MalformedURLException
    {
        this.couchUrl = couchUrl;
        
        logger.info("Initializing CouchDB DAO with the following settings:");
        logger.info(" - Couch URL: " + couchUrl);
        logger.info(" - User: " + user);

        HttpClient httpClient = new StdHttpClient.Builder().url(couchUrl).username(user).password(password).build();

        userDb = new StdCouchDbInstance(httpClient);
        userDbc = new StdCouchDbConnector(userDatabaseName, userDb);
        
        if(!userDb.checkIfDbExists(userDatabaseName))
        {
            logger.info(" ### User database does not exist. Creating...");
            userDbc.createDatabaseIfNotExists();
            logger.info("     Complete");
        }

        userResourceDAO = new VTSUserResourceDAO(VTSUser.class, userDbc);
        
        requestsDb = new StdCouchDbInstance(httpClient);
        requestsDbc = new StdCouchDbConnector(requestsDatabaseName, userDb);
        
        if(!requestsDb.checkIfDbExists(requestsDatabaseName))
        {
            logger.info(" ### Requests database does not exist. Creating...");
            requestsDbc.createDatabaseIfNotExists();
            // build views
            DesignDocument doc = new DesignDocument("_design/request-queries");
            
            String fetchAllString = "function (doc) { emit(doc.requestID, {  \"message\": doc.message, \"started\": doc.started, \"completed\": doc.completed, \"creationTime\": doc.creationTime, \"startTime\": doc.startTime, \"completionTime\": doc.completionTime, \"priority\": doc.priority }); }";
            DesignDocument.View fetchAll = new DesignDocument.View(fetchAllString);
            
            String fetchAllByEngineString = "function (doc) { emit(doc.engineID, doc.requestID); }";
            DesignDocument.View fetchAllFetchAllByEngine = new DesignDocument.View(fetchAllByEngineString);
            
            doc.addView("fetch-all-requests", fetchAll);
            doc.addView("fetch-requests-by-engine", fetchAllFetchAllByEngine);
            
            requestsDbc.create(doc);
            
            logger.info("     Complete");
        }
        
        requestResourceDAO = new VTSRequestResourceDAO(RequestParameters.class, requestsDbc);
        
        tasksDb = new StdCouchDbInstance(httpClient);
        tasksDbc = new StdCouchDbConnector(taskDatabaseName, userDb);
        
        if(!tasksDb.checkIfDbExists(taskDatabaseName))
        {
            logger.info(" ### Tasks database does not exist. Creating...");
            tasksDbc.createDatabaseIfNotExists();
            // build views
            DesignDocument doc = new DesignDocument("_design/task-queries");
            
            String fetchAllString = "function (doc) {emit(doc.name, {\"requestID\": doc.requestID,\"message\": doc.message,\"started\": doc.started,\"completed\": doc.completed,\"successful\": doc.successful, \"halted\": doc.halted, \"running\": doc.running,\"creationTime\": doc.creationTime,\"startTime\": doc.startTime,\"completionTime\": doc.completionTime,\"priority\": doc.priority});}";
            DesignDocument.View fetchAll = new DesignDocument.View(fetchAllString);
            
            String fetchAllByEngineString = "function (doc) { emit(doc.engineID, doc.requestID); }";
            DesignDocument.View fetchAllFetchAllByEngine = new DesignDocument.View(fetchAllByEngineString);
            
            doc.addView("fetch-tasks-requests", fetchAll);
            doc.addView("fetch-tasks-by-engine", fetchAllFetchAllByEngine);
            
            tasksDbc.create(doc);
            
            logger.info("     Complete");
        }
        
        tasksResourceDAO = new VTSTasksResourceDAO(TaskParameters.class, tasksDbc);
        
        projectsDb = new StdCouchDbInstance(httpClient);
        projectsDbc = new StdCouchDbConnector(projectDatabaseName, userDb);
        
        if(!projectsDb.checkIfDbExists(projectDatabaseName))
        {
            logger.info(" ### User database does not exist. Creating...");
            projectsDbc.createDatabaseIfNotExists();
            logger.info("     Complete");
        }
        
        projectsResourceDAO = new VTSProjectsResourceDAO(ProcessorRequest.class, projectsDbc);

        geometryDb = new StdCouchDbInstance(httpClient);
        geometryDbc = new StdCouchDbConnector(geometryDatabaseName, userDb);
        
        if(!geometryDb.checkIfDbExists(geometryDatabaseName))
        {
            logger.info(" ### Geometry Cache database does not exist. Creating...");
            geometryDbc.createDatabaseIfNotExists();
            // build views
            DesignDocument doc = new DesignDocument("_design/feature-queries");
            
            String fetchAllString = "function (doc) {emit(doc.geometryID, {\"geometry\": doc.geometry,\"processorID\": doc.processorID,\"node\": doc.node, \"attributes\": doc.attributes, \"crs\": doc.crs});}";
            DesignDocument.View fetchAll = new DesignDocument.View(fetchAllString);
            
            String fetchKeys = "function (doc) {emit(doc.geometryID, doc._rev);}";
            DesignDocument.View fetchKeysView = new DesignDocument.View(fetchKeys);
            
            String fetchDeletedKeys = "function (doc) {if(doc._deleted){emit(doc._id, dov._rev);}}";
            DesignDocument.View fetchDeletedKeysView = new DesignDocument.View(fetchDeletedKeys);
            
            doc.addView("fetch-feature", fetchAll);
            doc.addView("fetch-feature-keys", fetchKeysView);
            doc.addView("fetch-deleted-keys", fetchDeletedKeysView);
            
            geometryDbc.create(doc);

            logger.info("     Complete");
        }
        
        geometryDAO = new VTSGeometryCacheDAO(Feature.class, geometryDbc);
        
        engineDb = new StdCouchDbInstance(httpClient);
        engineDbc = new StdCouchDbConnector(engineDatabaseName, userDb);
        
        if(!engineDb.checkIfDbExists(engineDatabaseName))
        {
            logger.info(" ### Engine database does not exist. Creating...");
            engineDbc.createDatabaseIfNotExists();
            logger.info("     Complete");
        }
        
        engineDAO = new VTSEngineDAO(Engine.class, engineDbc);
        
        logsDb = new StdCouchDbInstance(httpClient);
        logsDbc = new StdCouchDbConnector(logDatabaseName, userDb);
        
        if(!logsDb.checkIfDbExists(engineDatabaseName))
        {
            logger.info(" ### Engine database does not exist. Creating...");
            logsDbc.createDatabaseIfNotExists();
            logger.info("     Complete");
        }
        
        logsDAO = new VTSLogResourceDAO(LogMessage.class, logsDbc);
        
        // init feature cache
        this.cacheLimit = cacheLimit;
        featureCache = new ConcurrentHashMap<UUID, FeatureCache>();
        executorService = Executors.newCachedThreadPool();
        executorService.submit(new CacheMonitor());
        logger.info("Initialization of CouchDB DAO complete.");
    }
 
    public VTSUser getUserByDocId(String docId)
    {
        return userResourceDAO.get(docId);
    }

    public void createResource(VTSUser resource)
    {
        userResourceDAO.add(resource);
    }

    public void updateResource(VTSUser resource)
    {
        userResourceDAO.update(resource);
    }

    public void removeResource(VTSUser resource)
    {
        userResourceDAO.remove(resource);
    }

    public List<VTSUser> getAllUsersResources()
    {
        return userResourceDAO.getAll();
    }

    public RequestParameters getRequestByDocId(String docId)
    {
        return requestResourceDAO.get(docId);
    }

    public void createResource(RequestParameters resource)
    {
        requestResourceDAO.add(resource);
    }

    public void updateResource(RequestParameters resource)
    {
        requestResourceDAO.update(resource);
    }

    public void removeResource(RequestParameters resource)
    {
        requestResourceDAO.remove(resource);
    }

    public List<RequestParameters> getAllRequestResources()
    {
        return requestResourceDAO.getAll();
    }
    
    public List<RequestParameters> getAllRequestResources(UUID engineID)
    {
        List<RequestParameters> results = new ArrayList<RequestParameters>();
        
        try
        {
            ViewQuery query = new ViewQuery()
                    .designDocId("_design/request-queries")
                    .viewName("fetch-requests-by-engine")
                    .key(engineID.toString())
                    .includeDocs(true); // should include only a matching doc, not all docs.
            results = requestsDbc.queryView(query, RequestParameters.class);
        }
        catch(Exception e)
        {
            logger.debug(e.getMessage());
        }
        
        // sort by priority
        
        return results;
    }
    
    public RequestParameters getRequestResource(UUID requestID)
    {
        List<RequestParameters> results = new ArrayList<RequestParameters>();
        
        try
        {
            ViewQuery query = new ViewQuery()
                    .designDocId("_design/request-queries")
                    .viewName("fetch-all-requests")
                    .key(requestID.toString())
                    .includeDocs(true); // should include only a matching doc, not all docs.
            
            results = requestsDbc.queryView(query, RequestParameters.class);
        }
        catch(Exception e)
        {
            logger.error(e.getMessage());
        }
        
        if(results != null && results.size() > 0) return results.get(0);
        else return null;
    }
    
    public TaskParameters getTaskByDocId(String docId)
    {
        return tasksResourceDAO.get(docId);
    }

    public TaskParameters getTaskResource(String name)
    {
        List<TaskParameters> results = new ArrayList<TaskParameters>();
        
        try
        {
            ViewQuery query = new ViewQuery()
                    .designDocId("_design/task-queries")
                    .viewName("fetch-all-tasks")
                    .key(name)
                    .includeDocs(true); // should include only a matching doc, not all docs.
            //ViewResult queryRslt = requestsDbc.queryView(query);
            results = tasksDbc.queryView(query, TaskParameters.class);
        }
        catch(Exception e)
        {
            logger.debug(e.getMessage());
        }
        
        if(results != null && results.size() == 1) return results.get(0);
        else return null;
    }
    
    public TaskParameters getTaskResource(UUID id)
    {
        List<TaskParameters> results = new ArrayList<TaskParameters>();
        
        try
        {
            ViewQuery query = new ViewQuery()
                    .designDocId("_design/task-queries")
                    .viewName("fetch-all-tasks")
                    .includeDocs(true);
            results = tasksDbc.queryView(query, TaskParameters.class);
            
            for(TaskParameters task : results)
            {
                if(task.getRequestID().equals(id)) return task;
            }
        }
        catch(Exception e)
        {
            logger.debug(e.getMessage());
        }
        
        return null;
    }
    
    public void createResource(TaskParameters resource)
    {
        tasksResourceDAO.add(resource);
    }

    public void updateResource(TaskParameters resource)
    {
        // purge any feature id's?
        tasksResourceDAO.update(resource);
    }

    public void removeResource(TaskParameters resource)
    {
        tasksResourceDAO.remove(resource);
    }

    public List<TaskParameters> getAllTasksResources()
    {
        return tasksResourceDAO.getAll();
    }

    public List<TaskParameters> getAllTasksResources(UUID engineID)
    {
        List<TaskParameters> results = new ArrayList<TaskParameters>();
        try
        {
            ViewQuery query = new ViewQuery()
                    .designDocId("_design/task-queries")
                    .viewName("fetch-tasks-by-engine")
                    .key(engineID.toString())
                    .includeDocs(true); // should include only a matching doc, not all docs.
            results = tasksDbc.queryView(query, TaskParameters.class);
        }
        catch(Exception e)
        {
            logger.debug(e.getMessage());
        }
        
        // sort by priority
        
        return results;
    }
    
    public ProcessorRequest getProjectByDocId(String docId)
    {
        return projectsResourceDAO.get(docId);
    }

    public void createResource(ProcessorRequest resource)
    {
        projectsResourceDAO.add(resource);
    }

    public void updateResource(ProcessorRequest resource)
    {
        projectsResourceDAO.update(resource);
    }

    public void removeResource(ProcessorRequest resource)
    {
        projectsResourceDAO.remove(resource);
    }

    public List<ProcessorRequest> getAllProjectsResources()
    {
        return projectsResourceDAO.getAll();
    }

    public Engine getEngineByDocId(String docId)
    {
        return engineDAO.get(docId);
    }

    public void createResource(Engine resource)
    {
        engineDAO.add(resource);
    }

    public void updateResource(Engine resource)
    {
        engineDAO.update(resource);
    }

    public void removeResource(Engine resource)
    {
        engineDAO.remove(resource);
    }

    public Engine getEngine(UUID id)
    {
        for(Engine engine : engineDAO.getAll())
        {
            if(engine.getEngineID().equals(id)) return engine;
        }
        
        return null;
    }
    
    public Engine getEngine(String name)
    {
        for(Engine engine : engineDAO.getAll())
        {
            if(engine.getEngineName().equals(name)) return engine;
        }
        
        return null;
    }
    
    public List<Engine> getAllEngines()
    {
        return engineDAO.getAll();
    }

    public LogMessage getLogByDocId(String docId)
    {
        return logsDAO.get(docId);
    }

    public void createResource(LogMessage resource)
    {
        logsDAO.add(resource);
    }

    public void updateResource(LogMessage resource)
    {
        logsDAO.update(resource);
    }

    public void removeResource(LogMessage resource)
    {
        logsDAO.remove(resource);
    }

    public List<LogMessage> getAllLogMessages()
    {
        return logsDAO.getAll();
    }

    public Feature getGeometryByDocId(String docId)
    {
        return geometryDAO.get(docId);
    }

    public void deleteGeometryByKey(UUID id)
    {
        try
        {
            ViewQuery query = new ViewQuery()
                    .designDocId("_design/feature-queries")
                    .viewName("fetch-feature")
                    .key(id.toString())
                    .includeDocs(false);
    
            ViewResult viewResults = geometryDbc.queryView(query);
    
            for(Row result : viewResults)
            {
                URL url = new URL(couchUrl + "/vts_feature_cache/" + result.getId() + "?rev=" + result.getValue());
                HttpURLConnection con = (HttpURLConnection) url.openConnection();
                con.setRequestMethod("DELETE");
            }
        }
        catch(Exception e)
        {
            logger.debug(e.getMessage());
        }
    }
    
    public Feature getGeometry(UUID id)
    {
        // look on cache first
        if(featureCache.containsKey(id))
        {
            try
            {
                FeatureCache cache = featureCache.get(id);
                cache.setExpired(false);
                cache.setExpiryTime(Instant.now().plus(1, ChronoUnit.MINUTES));
                return cache.getFeature();
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                return null;
            }
        }
        else
        {
            List<Feature> results = new ArrayList<Feature>();
            
            try
            {
                ViewQuery query = new ViewQuery()
                        .designDocId("_design/feature-queries")
                        .viewName("fetch-feature")
                        .key(id.toString())
                        .includeDocs(true); // should include only a matching doc, not all docs.
                results = geometryDbc.queryView(query, Feature.class);
            }
            catch(Exception e)
            {
                logger.debug(e.getMessage());
            }
            
            if(results.size() > 0) 
            {
                Feature feature = results.get(0); 
                FeatureCache cache = new FeatureCache(feature);
                cache.setPersisted(true);
                // add to cache
                this.featureCache.put(feature.getGeometryID(), cache);
                
                return feature;
            }
            else return null;
        }
    }
    
    // get keys can be used to cleanup orphan features in the feature cache.
    // get all Requests and Tasks processors outputnode keys
    // any key in getGeometryKeys that is not in the request/task nodes, can be removed
    public List<String> getGeometryKeys()
    {
        List<String> results = new ArrayList<String>();
        
        try
        {
            ViewQuery query = new ViewQuery()
                    .designDocId("_design/feature-queries")
                    .viewName("fetch-feature-keys");
            
            ViewResult viewResults = geometryDbc.queryView(query);
            
            results = new ArrayList<String>();
            
            for(Row result : viewResults)
            {
                results.add(result.getKey());
            }
        }
        catch(Exception e)
        {
            logger.debug(e.getMessage());
        }
        
        return results;
    }
    
    public void createResource(Feature resource)
    {
        // cache the resource
        if(featureCache.size() <= cacheLimit)
        {
            featureCache.put(resource.getGeometryID(), new FeatureCache(resource));
        }

        //executorService.submit(new CouchWriteResourceHelper(this, resource));
    }

    public void updateResource(Feature resource)
    {
        // update cache
        if(featureCache.containsKey(resource.getGeometryID()))
        {
            FeatureCache cache = featureCache.get(resource.getGeometryID());
            cache.setExpired(false);
            cache.setExpiryTime(Instant.now().plus(1, ChronoUnit.MINUTES));
            cache.setFeature(resource);
        }
        
        geometryDAO.update(resource);
    }

    public void removeResource(Feature resource)
    {
        // update cache
        if(featureCache.containsKey(resource.getGeometryID()))
        {
            featureCache.remove(resource.getGeometryID());
        }
        
        Map<String, List<String>> purgeContents = new HashMap<String, List<String>>();
        List<String> revs = new ArrayList<String>();
        purgeContents.put(resource.getId(), revs);
        
        geometryDAO.remove(resource);
        // fully destroy the feature.
        // if we move to a noded couchdb and replicate between them, we can't do this!
        geometryDbc.purge(purgeContents);
    }
    
    public void removeFromCache(UUID featureId)
    {
        FeatureCache cache = featureCache.remove(featureId);
        try
        {
            createResource(cache.getFeature());
        }
        catch(Exception e)
        {
            logger.error(e);
        }
    }
    
    public void flushCache()
    {
        featureCache.clear();
    }
    
    public void cleanup() throws IOException
    {
        try
        {
            ViewQuery query = new ViewQuery()
                      .designDocId("_design/feature-queries")
                      .viewName("fetch-deleted-keys");
            
            ViewResult viewResults = geometryDbc.queryView(query);
            
            Map<String, List<String>> purgeContents = new HashMap<String, List<String>>();
            
            for(Row result : viewResults)
            {
                List<String> revs = new ArrayList<String>();
                revs.add(result.getValue());
                purgeContents.put(result.getId(), revs);
            }
            
            geometryDbc.purge(purgeContents);
            geometryDbc.compact();
            geometryDbc.compactViews("feature-queries");
        }
        catch(Exception e)
        {
            logger.debug(e.getMessage());
        }
    }
    
    private class CacheMonitor implements Runnable
    {
        public void run()
        {
            while(true)
            {
                // loop through cache, turf any objects flagged as expired
                // if any others are past expiry, flag them as expired and let
                // them sit for another minute.
                try
                {
                    featureCache.keySet().parallelStream().forEach((key) -> 
                    {
                       try
                       {
                           FeatureCache cache = featureCache.get(key);
                           
                           if(!cache.isPersisted())
                           {
                               // push onto db
                               cache.setPersisted(true);
                               geometryDAO.add(cache.getFeature());
                           }
                           
                           Instant now = Instant.now();
                           Instant expiry = cache.getExpiryTime();
                           
                           if(expiry.equals(now) || expiry.isBefore(now))
                           {
                               if(cache.isExpired())
                               {
                                   featureCache.remove(key);
                               }
                               else
                               {
                                   cache.setExpired(true);
                                   cache.setExpiryTime(now.plus(5, ChronoUnit.MINUTES));   
                               }
                           }
                       }
                       catch(Exception e)
                       {
                           logger.error(e);
                           //throw new RuntimeException(e);
                       }
                    });
                    
                    // sleep for a bit and check cache again
                    TimeUnit.SECONDS.sleep(10);
                }
                catch(Exception e)
                {
                    logger.error(e);
                }
            }
        }
    }
}
