package com.vividsolutions.vts.engine;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;

import org.geotools.data.ows.Request;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

import com.vividsolutions.vts.controller.VTSController;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.EngineStatus;
import com.vividsolutions.vts.model.LogMessage;
import com.vividsolutions.vts.model.processors.Processor;

public class AdminRequestEngine
{
    static private final Logger logger = LoggerFactory.getLogger(AdminRequestEngine.class);
    
    @Autowired
    private Environment env;

    @Autowired
    private VTSController vtsController;
    
    @Autowired
    private CouchDAO couchDAO;
    
    private ExecutorService executorService;
    @SuppressWarnings("rawtypes")
    private Future requestCleanerFuture;
    @SuppressWarnings("rawtypes")
    private Future requeuerFuture;
    private boolean shuttingDown;
    
    public AdminRequestEngine()
    {
    }

    @PostConstruct
    public void init()
    {
        log(new LogMessage("Service", "", "Initializing Request Execution Engine..."));
        shuttingDown = false;
        
        log(new LogMessage("Service", "", "Creating new Executor Service..."));
        executorService = Executors.newCachedThreadPool();
        
        log(new LogMessage("Service", "", "Initializing Request Cleaner thread..."));
        requestCleanerFuture = executorService.submit(new RequestCleaner(couchDAO));
        requeuerFuture = executorService.submit(new Requeuer(couchDAO));
        // if the engine died, but we have stored requests, re-queue them
        // this should check the engine ID's first...
        try
        {
            for(RequestParameters params : couchDAO.getAllRequestResources())
            {
                if(!params.isCompleted())
                {
                    vtsController.performRequest(params);
                }
            }
            
            for(TaskParameters params : couchDAO.getAllTasksResources())
            {
                if(!params.isCompleted())
                {
                    vtsController.performTaskRequest(params);
                }
            }
        }
        catch(Exception e)
        {
            log(new LogMessage("Service", "CouchDB", "You may need to restart the Execution Engine. Checking request cache failed. Could not read from CouchDB: " + e.getClass().getName() + " : " + e.getMessage() + " : " + e.getStackTrace()));
        }
    }
    
    private void log(LogMessage log)
    {
        if(vtsController != null) vtsController.fetchLogs().add(log);
    }
    
    public void shutdownEngine() throws InterruptedException
    {
        log(new LogMessage("Service", "", "Shutting down engine (Waiting for tasks to complete)..."));
        shuttingDown = true;
        
        log(new LogMessage("Service", "", "Killing Reqest, Cleaner, and Scheduled Task threads..."));
        requestCleanerFuture.cancel(true);
        requeuerFuture.cancel(true);
        
        log(new LogMessage("Service", "", "Shutting down executor service..."));
        
        executorService.shutdown();
    }
    
    public boolean restartEngine()
    {
        try
        {
            log(new LogMessage("Service", "", "Starting full engine restart..."));
            shutdownEngine();
            init();
            log(new LogMessage("Service", "", "Completed full engine restart..."));
            
            return true;
        }
        catch(Exception e)
        {
            logger.error(e.getMessage());
            return false;
        }
    }
    
    public ExecutorService getExecutorService()
    {
        return executorService;
    }

    public void setExecutorService(ExecutorService executorService)
    {
        this.executorService = executorService;
    }

    @SuppressWarnings("rawtypes")
    public Future getRequestCleanerFuture()
    {
        return requestCleanerFuture;
    }

    @SuppressWarnings("rawtypes")
    public void setRequestCleanerFuture(Future requestCleanerFuture)
    {
        this.requestCleanerFuture = requestCleanerFuture;
    }

    public List<RequestParameters> getRequestResults()
    {
        return couchDAO.getAllRequestResources();
    }

    public List<TaskParameters> getTaskResults()
    {
        return couchDAO.getAllTasksResources();
    }

    public boolean isShuttingDown()
    {
        return shuttingDown;
    }

    public void setShuttingDown(boolean shuttingDown)
    {
        this.shuttingDown = shuttingDown;
    }

    private class Requeuer implements Runnable
    {
        private CouchDAO couchDAO;
        
        public Requeuer(CouchDAO couchDAO)
        {
            this.couchDAO = couchDAO;
        }
        
        public void run()
        {
            while(!shuttingDown)
            {
                try
                {
                    // loop through requests and tasks
                    // For each request/task, check the engine they're assigned to is still alive and running
                    // if it is not, then reassign to a new available engine
                    // - This could be done on the engine as well? in the event the master service dies?
            
                    List<RequestParameters> requests = couchDAO.getAllRequestResources();
                    
                    // strip out any completed requests. they don't need requeing
                    for(int i = 0; i < requests.size(); i++)
                    {
                        RequestParameters request = requests.get(i);
                        if(request.isCompleted()) 
                        {
                            requests.remove(i);
                            i--;
                        }
                    }
                    
                    List<TaskParameters> tasks = couchDAO.getAllTasksResources();
                    
                    requests.addAll(tasks);
                    
                    for(RequestParameters request : requests)
                    {
                        boolean requeue = false;
                        try
                        {
                            EngineStatus status = vtsController.fetchEngineStatus(request.getEngineID());
                            
                            if(status == null || (status != null && (status.isHalted() || !status.isRegistered())))
                            {
                                requeue = true;
                            }
                        }
                        catch(Exception e)
                        {
                            // the engine could not be hit. Send to a new engine
                            requeue = true;
                        }
                        
                        if(requeue)
                        {
                            try
                            {
                                request.setEngineID(null);
                                if(request instanceof TaskParameters)
                                {
                                    couchDAO.updateResource((TaskParameters)request);
                                    vtsController.performTaskRequest((TaskParameters)request);
                                }
                                else
                                {
                                    couchDAO.updateResource(request);
                                    vtsController.performRequest(request);
                                }
                            }
                            catch(Exception e)
                            {
                                logger.error(e.getMessage());
                                log(new LogMessage("Service", request.getRequestID().toString(), "Error running requeue: " + e.getMessage()));
                            }
                        }
                    }
                    
                    TimeUnit.MINUTES.sleep(1);
                }
                catch(Exception e)
                {
                    logger.error(e.getMessage());
                    log(new LogMessage("Service", "Re-Queuer", "Error running requeue: " + e.getMessage()));
                }
            }
        }
    }
    
    private class RequestCleaner implements Runnable
    {
        private CouchDAO couchDAO;
        
        public RequestCleaner(CouchDAO couchDAO)
        {
            this.couchDAO = couchDAO;
        }
        
        @SuppressWarnings({ "rawtypes", "unchecked" })
        public void run()
        {
            try
            {
                int retentionThresholdMins = new Integer(env.getProperty("max.retention.threshold.minutes"));
                int queueCleanupWaitTime = new Integer(env.getProperty("queue.cleanup.wait.time"));

                log(new LogMessage("Service", "", "Starting Request Cleaner Thread..."));
                
                while (!shuttingDown)
                {
                    try
                    {
                        logger.info(" >>> Checking Queue/Complete and cleaning up stale requests");
    
                        Instant processThreshold = Instant.now().minus(Duration.ofMinutes(retentionThresholdMins));
                        
                        List<RequestParameters> requestResults = couchDAO.getAllRequestResources();
                        
                        if(requestResults.size() > 0)
                        {
                            for(int i = 0; i < requestResults.size(); i++)
                            {
                                RequestParameters param = requestResults.get(i);
                                
                                Instant instant = Instant.ofEpochMilli(param.getCompletionTime().getTime());
                                
                                if(param.isCompleted() && instant.isBefore(processThreshold))
                                {
                                    // clear any existing cache
                                    for(Processor processor : param.getProcessors())
                                    {
                                        for(Object key : processor.getOutputNodes().keySet())
                                        {
                                            List<UUID> uuids = (List<UUID>) processor.getOutputNodes().get(key);
                                            for(UUID id : uuids)
                                            {
                                                try
                                                {
                                                    couchDAO.removeResource(couchDAO.getGeometry(id));
                                                }
                                                catch(Exception e)
                                                {
                                                    logger.error("Failed to fetch/delete feature cache object " + id.toString() + " : " + e.getMessage());
                                                }
                                            }
                                            
                                            processor.getOutputNodes().put(key, new ArrayList<UUID>());
                                        }
                                    }
                                    
                                    couchDAO.removeResource(param);
                                    requestResults.remove(i);
                                    i--;
                                }
                            }
                        }
                        
                        // CouchDB purge and compaction
                        couchDAO.cleanup();
                        
                        // chill out for a while, and check again
                        TimeUnit.MINUTES.sleep(queueCleanupWaitTime);
                        logger.info(" <<< Completed RequestCleaner");
                    }
                    catch(Exception e)
                    {
                        logger.error(e.getMessage() + " Trying to run cleanup again in " + queueCleanupWaitTime + " minutes");
                        TimeUnit.MINUTES.sleep(queueCleanupWaitTime);
                    }
                }
                
                log(new LogMessage("Service", "", "Stopping Reqeust Cleaner Thread..."));
            }
            catch(Exception e)
            {
                log(new LogMessage("Service", "", "Error running request cleanup: " + e.getMessage()));
            }
        }
    }
}