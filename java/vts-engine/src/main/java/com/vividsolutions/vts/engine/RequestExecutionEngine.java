package com.vividsolutions.vts.engine;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

import com.vividsolutions.vts.controller.VTSEngineController;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Engine;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.LogMessage;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;
import com.vividsolutions.vts.model.processors.TaskRequest.IntervalUnit;

public class RequestExecutionEngine
{
    static private final Logger logger = LoggerFactory.getLogger(RequestExecutionEngine.class);
    
    @Autowired
    private Environment env;

    @Autowired
    private VTSEngineController vtsEngineController;
    
    @Autowired
    private CouchDAO couchDAO;
    
    private ExecutorService executorService;
    @SuppressWarnings("rawtypes")
    private Future requestCleanerFuture;
    @SuppressWarnings("rawtypes")
    private Future requestInitiatorFuture;
    @SuppressWarnings("rawtypes")
    private Future taskInitiatorFuture;
    @SuppressWarnings("rawtypes")
    private Future reqeustQueuerFuture;
    
    public RequestExecutionEngine()
    {
    }

    @PostConstruct
    public void init()
    {
        log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Initializing Request Execution Engine..."));
        
        log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Creating new Executor Service..."));
        executorService = Executors.newCachedThreadPool();
        
        log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Initializing Request Initiator thread..."));
        requestInitiatorFuture = executorService.submit(new RequestInitiator(couchDAO, engineRegistration()));
        log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Initializing Request Cleaner thread..."));
        requestCleanerFuture = executorService.submit(new RequestCleaner(couchDAO, engineRegistration()));
        log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Initializing Scheduled Task Initiator thread..."));
        taskInitiatorFuture = executorService.submit(new TaskInitiator(couchDAO, engineRegistration()));
        
        engineRegistration().setHalted(false);
        couchDAO.updateResource(engineRegistration());
    }
    
    private Engine engineRegistration()
    {
        return vtsEngineController.getEngineRegistration();
    }

    private void log(String message)
    {
        vtsEngineController.log(message);
    }
        
    private void log(LogMessage log)
    {
        vtsEngineController.log(log);
    }
    
    public void shutdownEngine() throws InterruptedException
    {
        log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Shutting down engine (Waiting for tasks to complete)..."));
        engineRegistration().setHalted(false);
        
        // give the threads a couple seconds to wind down and shut down naturally
        TimeUnit.SECONDS.sleep(2);
        
        log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Killing Reqest, Cleaner, and Scheduled Task threads..."));
        requestInitiatorFuture.cancel(true);
        requestCleanerFuture.cancel(true);
        reqeustQueuerFuture.cancel(true);
        taskInitiatorFuture.cancel(false);
        
        // wait until taskInitiator is done before shutting down completely
        // we don't want to leave any scheduled tasks in a bad state in case they're writing to a 
        // database or to the disk
        
        while(!taskInitiatorFuture.isDone())
        {
            TimeUnit.SECONDS.sleep(1);
        }
        
        log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Shutting down executor service..."));
        executorService.shutdown();
    }
    
    public boolean restartEngine()
    {
        try
        {
            log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Starting full engine restart..."));
            shutdownEngine();
            init();
            log(new LogMessage("ENGINE", engineRegistration().getEngineName(), "Completed full engine restart..."));
            
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

    @SuppressWarnings("rawtypes")
    public Future getRequestInitiatorFuture()
    {
        return requestInitiatorFuture;
    }

    @SuppressWarnings("rawtypes")
    public Future getTaskInitiatorFuture()
    {
        return taskInitiatorFuture;
    }

    @SuppressWarnings("rawtypes")
    public void setTaskInitiatorFuture(Future taskInitiatorFuture)
    {
        this.taskInitiatorFuture = taskInitiatorFuture;
    }

    @SuppressWarnings("rawtypes")
    public void setRequestInitiatorFuture(Future requestInitiatorFuture)
    {
        this.requestInitiatorFuture = requestInitiatorFuture;
    }
    
    public List<RequestParameters> getRequestResults()
    {
        return couchDAO.getAllRequestResources();
    }

    public List<TaskParameters> getTaskResults()
    {
        List<TaskParameters> tasks = new ArrayList<TaskParameters>();
        
        for(TaskParameters task : couchDAO.getAllTasksResources(engineRegistration().getEngineID()))
        {
            tasks.add(task);
        }
        
        return tasks;
    }

    private class TaskInitiator implements Runnable
    {
        private CouchDAO couchDAO;
        private Engine engine;
        
        public TaskInitiator(CouchDAO couchDAO, Engine engine)
        {
            this.couchDAO = couchDAO;
            this.engine = engine;
        }
        
        @SuppressWarnings({ "rawtypes", "unchecked" })
        public void run()
        {
            int taskCheckWaitSeconds = new Integer(env.getProperty("task.check.wait.seconds"));
            //String physicalTaskPath = env.getProperty("task.file.path");
            
            while(couchDAO == null) 
            {
                try
                {
                    TimeUnit.SECONDS.sleep(taskCheckWaitSeconds);
                } 
                catch (InterruptedException e)
                {
                    logger.error(e.getMessage());
                }
            }
            
            log(new LogMessage("Engine", engine.getEngineName(), "Starting Scheduled Task Thread..."));
            
            while (!engineRegistration().isHalted())
            {
                try
                {
                    List<TaskParameters> tasks = couchDAO.getAllTasksResources(engine.getEngineID());
                    for(TaskParameters task : tasks)
                    {
                        if(task != null && !task.isRunning() && !task.isHalted() && !engineRegistration().isHalted())
                        {
                            Instant now = Instant.now();
                            if(task.getNextExecutionTime() == null) task.setNextExecutionTime(now);
                            
                            if(task.getNextExecutionTime().equals(now) || task.getNextExecutionTime().isBefore(now))
                            {
                                // if it isn't running, start the task
                             
                                if(!task.isRunning())
                                {
                                    task.setRunning(true);
                                    task.setCompletionTime(null);
                                    
                                    for(Processor process : task.getProcessors())
                                    {
                                        process.setProcessed(false);

                                        for(Object node : process.getOutputNodes().keySet())
                                        {
                                            // delete cache
                                            List<UUID> uuids = (List<UUID>) process.getOutputNodes().get(node);
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
                                        
                                            ((List<Feature>)process.getOutputNodes().get(node)).clear();
                                        }
                                        
                                        process.setMessages(null);
                                    }
                                    
                                    task.setStartTime(new Date());
                                    
                                    // set execution to now plus interval
                                    TemporalUnit unit = null;
                                    
                                    if(task.getIntervalUnit() == IntervalUnit.Seconds) unit = ChronoUnit.SECONDS;
                                    else if(task.getIntervalUnit() == IntervalUnit.Minutes) unit = ChronoUnit.MINUTES;
                                    else if(task.getIntervalUnit() == IntervalUnit.Hours) unit = ChronoUnit.HOURS;
                                    else if(task.getIntervalUnit() == IntervalUnit.Days) unit = ChronoUnit.DAYS;
                                    else unit = ChronoUnit.MINUTES;
                                    
                                    task.setNextExecutionTime(Instant.now().plus(task.getInterval(), unit));
                                    // persist
                                    couchDAO.updateResource(task);
                                    
                                    log(new LogMessage(task.getName(), "", "Starting scheduled task run..."));
                                    
                                    RequestProcessor process = new RequestProcessor(task, couchDAO);
                                    executorService.execute(process);
                                    
                                    log(new LogMessage(task.getName(), "", "Setting next run for: " + new Date(task.getNextExecutionTime().toEpochMilli()).toString()));
                                }
                            }
                        }
                    }
                    
                    // done checking each scheduled task. Wait for a bit and check again
                    TimeUnit.SECONDS.sleep(taskCheckWaitSeconds);
                }
                catch(Exception e)
                {
                    logger.error("Error in TaskInitiator: " + e.getMessage());
                    log(new LogMessage("ENGINE", engine.getEngineName(), "Error in TaskInitiator: " + e.getMessage()));
                }
            }
            
            log(new LogMessage("ENGINE", engine.getEngineName(), "Stopping Scheduled Task Thread..."));
        }
    }
    
    private class RequestCleaner implements Runnable
    {
        private CouchDAO couchDAO;
        private Engine engine;
        
        public RequestCleaner(CouchDAO couchDAO, Engine engine)
        {
            this.couchDAO = couchDAO;
            this.engine = engine;
        }
        
        @SuppressWarnings({ "rawtypes", "unchecked" })
        public void run()
        {
            try
            {
                int retentionThresholdMins = new Integer(env.getProperty("max.retention.threshold.minutes"));
                int queueCleanupWaitTime = new Integer(env.getProperty("queue.cleanup.wait.time"));
                
                while(couchDAO == null) 
                {
                    try
                    {
                        TimeUnit.MINUTES.sleep(queueCleanupWaitTime);
                    } 
                    catch (InterruptedException e)
                    {
                        logger.error(e.getMessage());
                    }
                }
                
                log(new LogMessage("Service", "", "Starting Request Cleaner Thread..."));
                
                while (!engineRegistration().isHalted())
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
                
                log(new LogMessage("ENGINE", engine.getEngineName(), "Stopping Reqeust Cleaner Thread..."));
            }
            catch(Exception e)
            {
                log(new LogMessage("ENGINE", engine.getEngineName(), "Error running request cleanup: " + e.getMessage()));
            }
        }
    }
    
    private class RequestInitiator implements Runnable
    {
        private CouchDAO couchDAO;
        private Engine engine;
        
        public RequestInitiator(CouchDAO couchDAO, Engine engine)
        {
            this.couchDAO = couchDAO;
            this.engine = engine;
        }
        
        @SuppressWarnings("unchecked")
        public void run()
        {
            while(couchDAO == null) 
            {
                try
                {
                    TimeUnit.SECONDS.sleep(10);
                } 
                catch (InterruptedException e)
                {
                    logger.error(e.getMessage());
                }
            }
            
            log(new LogMessage("ENGINE", engine.getEngineName(), "Starting Queue Thread..."));
            
            while (!engineRegistration().isHalted())
            {
                logger.info(" >>> Checking Queue and Process status.");

                if(!engineRegistration().isHalted())
                {
                    RequestParameters runningParams = null;
                    
                    try
                    {
                        List<RequestParameters> requests = couchDAO.getAllRequestResources(engine.getEngineID());
                        for(RequestParameters parameters : requests)
                        {
                            if(!parameters.isCompleted() && !parameters.isStarted())
                            {
                                // pop off the queue...
                                log(new LogMessage("ENGINE", engine.getEngineName(), "Pulling request " + parameters.getRequestID().toString() + " off of the queue..."));
                                runningParams = parameters;
    
                                try
                                {
                                    logger.info(">>> RequestInitiator starting request id " + parameters.getRequestID());
                                    
                                    int nRetries = 10;
                                    boolean jobIsStarted = false;
                                    while (!jobIsStarted && !engineRegistration().isHalted())
                                    {
                                        try
                                        {
                                            parameters.setMessage("Processing started...");
                                            parameters.setStartTime(new Date());
                                            parameters.setStarted(true);

                                            jobIsStarted = true;
                                            
                                            // clear out previous results
                                            for(@SuppressWarnings("rawtypes") Processor processor : parameters.getProcessors())
                                            {
                                                for(Object key : processor.getOutputNodes().keySet())
                                                {
                                                    List<Feature> features = (List<Feature>) processor.getOutputNodes().get(key);
                                                    features.clear();
                                                }
                                            }
                                            // update persistence
                                            couchDAO.updateResource(parameters);
                                            
                                            RequestProcessor process = new RequestProcessor(parameters, couchDAO);
                                            
                                            log(new LogMessage("ENGINE", engine.getEngineName(), "Executing Request " + parameters.getRequestID().toString()));
                                            
                                            executorService.execute(process);
                                        }
                                        catch (Exception e)
                                        {
                                            parameters.setMessage("Processing Failed: " + e.getMessage());
                                            log(new LogMessage(parameters.getRequestID().toString(), "", "Processing Failed: " + e.getMessage()));
                                            if (nRetries-- == 0)
                                            {
                                                logger.error("RequestInitiator exhausted attempts to run job " + parameters.getRequestID());
                                                throw e;
                                            }
                                            else
                                            {
                                                logger.warn("RequestInitiator saw " + e.getClass().getName() + " when attempting to run job "
                                                        + parameters.getRequestID() + ". Retrying (at most " + nRetries + " more times)."
                                                        + (e.getMessage() != null ? " Reason: " + e.getMessage() : ""));
            
                                                Thread.sleep(1000 /* ms */);
                                            }
                                        }
                                    }
                                }
                                catch (Exception e)
                                {
                                    // This is a new request; none of these exceptions are possible.
                                    logger.warn("RequestInitiator saw " + e.getClass().getName() + " when starting job "
                                            + parameters.getRequestID() + ". "
                                            + (e.getMessage() != null ? " Reason: " + e.getMessage() : ""));
                                    throw new IllegalStateException();
                                }
                            }
                        }
                        
                        // wait a few seconds before checking again
                        TimeUnit.SECONDS.sleep(10);
                    }
                    catch (Throwable t)
                    {
                        if (runningParams != null)
                        {
                            UUID requestId = runningParams.getRequestID();
                            
                            logger.warn("RequestInitiator saw " + t.getClass().getName() + " while waiting for or starting job " + requestId + "." + (t.getMessage() != null ? " Reason: " + t.getMessage() : ""));
                            log(new LogMessage(runningParams.getRequestID().toString(), "", "RequestInitiator saw " + t.getClass().getName() + " while waiting for or starting job " + requestId + "." + (t.getMessage() != null ? " Reason: " + t.getMessage() : "")));
                            
                            try
                            {
                                // set a request status message to return to the caller
                            }
                            catch (Exception e)
                            {
                                logger.warn(requestId + " failed and we could not set the status of request to Failed. Exception: " 
                                        + e.getClass().getName() + ". " + (e.getMessage() != null ? " Reason: " + e.getMessage() : ""));
                            }
                        }
                        else
                        {
                            logger.warn("RequestInitiator saw " + t.getClass().getName() + " while waiting for or starting unknown job." + (t.getMessage() != null ? " Reason: " + t.getMessage() : ""));
                            log(new LogMessage("Service", "", "RequestInitiator saw " + t.getClass().getName() + " while waiting for or starting unknown job." + (t.getMessage() != null ? " Reason: " + t.getMessage() : "")));
                        }
                    }
                }
            }
            
            log(new LogMessage("ENGINE", engine.getEngineName(), "Stopping Queue Thread..."));
        }
    }
    
    private class RequestProcessor implements Runnable
    {
        private CouchDAO couchDAO;
        
        private RequestParameters parameters;
        
        public RequestProcessor(RequestParameters parameters, CouchDAO couchDAO)
        {
            this.parameters = parameters;
            this.couchDAO = couchDAO;
        }
        
        public RequestProcessor(TaskParameters parameters, CouchDAO couchDAO)
        {
            this.parameters = parameters;
            this.couchDAO = couchDAO;
        }
        
        @SuppressWarnings("unchecked")
        public void run()
        {
            try
            {
                parameters.setSuccessful(false);
                
                boolean errorOccured = false;
                
                // run the processors
                for(@SuppressWarnings("rawtypes") Processor processor : parameters.getProcessors())
                {
                    try
                    { 
                        processor.process(parameters.getProcessors(), couchDAO);
                    }
                    catch(Exception e)
                    {
                        errorOccured = true;
                        processor.getMessages().add("Error: " + e.getMessage());
                        log(new LogMessage(parameters.getRequestID().toString(), String.valueOf(processor.getProcessorID()), e.getMessage()));
                        e.printStackTrace();
                    }
                }
                
                // clear features (results are stored in output nodes.
                for(@SuppressWarnings("rawtypes") Processor processor : parameters.getProcessors())
                {
                    if(processor instanceof FeatureProcessor)
                    {
                        if(((FeatureProcessor)processor).getFeatures() != null)
                            ((FeatureProcessor)processor).getFeatures().clear();
                    }
                }
                
                parameters.setCompletionTime(new Date());
                
                String logMessage = "";
                if(errorOccured)
                {
                    logMessage = "Processing Complete with Errors";
                    
                    if(parameters.getClass() == TaskParameters.class) 
                    {
                        ((TaskParameters)parameters).setLastFailureDate(new Date());
                    }
                }
                else
                {
                    parameters.setSuccessful(true);
                    logMessage = "Processing Complete!";
                }
                
                parameters.setMessage(logMessage);

                try
                {
                    if(parameters.getClass() == TaskParameters.class)
                    {
                        log(new LogMessage(((TaskParameters)parameters).getName(), "", logMessage));
                        ((TaskParameters)parameters).setRunning(false);
                        couchDAO.updateResource(((TaskParameters)parameters));
                    }
                    else
                    {
                        log(new LogMessage(parameters.getRequestID().toString(), "", logMessage));
                        couchDAO.updateResource(parameters);
                    }
                }
                catch(Exception e)
                {
                    logger.error("Failure to update process on CouchDB: " + e.getMessage());
                    // this will occur generally for Scheduled tasks, where they lose the race between updates from the task execution thread.
                    // This may mean a task is not updated to the persisted store until the next iteration. Scheduled tasks are not affected
                    // by this directly, but their "last run results" in couchDB won't be accurate.
                    // To prevent this, either we don't persist here, and wait for the task scheduler (or vice versa)
                    // or before persisting, pull the resource from couch and make sure we have the latest revision ID.
                }
                
                // flush the couchDB cache for this process, we don't need it anymore
                for(@SuppressWarnings("rawtypes") Processor processor : parameters.getProcessors())
                {
                    for(Object key : processor.getOutputNodes().keySet())
                    {
                        List<UUID> uuids = (List<UUID>) processor.getOutputNodes().get(key);
                        for(UUID id : uuids)
                        {
                            try
                            {
                                couchDAO.removeFromCache(id);
                            }
                            catch(Exception e)
                            {
                                logger.error("Failed to fetch/delete feature cache object " + id.toString() + " : " + e.getMessage());
                            }
                        }
                    }
                }
            }
            catch(Exception e)
            {
                logger.error("RequestProcessor saw " + e.getClass().getName() + " when running job "
                        + parameters.getRequestID() + ". "
                        + (e.getMessage() != null ? " Reason: " + e.getMessage() : ""));
                
                parameters.setMessage("Process Failed: " + e.getMessage());
                log(new LogMessage(parameters.getRequestID().toString(), "", e.getMessage()));
                
                if(parameters.getClass() == TaskParameters.class)
                {
                    ((TaskParameters)parameters).setLastFailureDate(new Date());
                    ((TaskParameters)parameters).setRunning(false);
                    couchDAO.updateResource(((TaskParameters)parameters));
                }
            }
        }
    }
}