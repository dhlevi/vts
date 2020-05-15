package com.vividsolutions.vts.controller;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.annotation.PostConstruct;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.engine.AdminRequestEngine;
import com.vividsolutions.vts.engine.RequestParameters;
import com.vividsolutions.vts.engine.TaskParameters;
import com.vividsolutions.vts.model.Engine;
import com.vividsolutions.vts.model.EngineStatus;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.LogMessage;
import com.vividsolutions.vts.model.RelLink;
import com.vividsolutions.vts.model.VTSUser;
import com.vividsolutions.vts.model.processors.NodeMap;
import com.vividsolutions.vts.model.processors.Processor;
import com.vividsolutions.vts.model.processors.ProcessorRequest;
import com.vividsolutions.vts.model.processors.TaskRequest;

@PropertySource("classpath:application.properties")
public class VTSController
{
    private static Log logger = LogFactory.getLog(VTSController.class);
    
    @Autowired
    private AdminRequestEngine requestExecutionEngine;
    
    @Autowired
    private ObjectMapper jsonObjectMapper;

    @Autowired
    private CouchDAO couchDAO;
    
    private int runningTasks;
    
    private List<LogMessage> logs;
    
    public VTSController() throws InterruptedException
    {
    }
    
    @PostConstruct
    public void init()
    {
    }
    
    public List<RequestParameters> getRunningServiceRequests()
    {
        List<RequestParameters> allRequests = new ArrayList<RequestParameters>();
        
        try
        {
            List<RequestParameters> requests = requestExecutionEngine.getRequestResults();
            List<TaskParameters> tasks = requestExecutionEngine.getTaskResults();
            
            allRequests.addAll(requests);
            allRequests.addAll(tasks);
        }
        catch(Exception e)
        {
            logger.error(e);
        }
        
        return allRequests;
    }
    
    @SuppressWarnings({ "rawtypes", "unchecked" })
    public boolean deleteRequest(UUID requestId)
    {
        try
        {
            RequestParameters request = couchDAO.getRequestResource(requestId);
            request.setEngineID(null);
            couchDAO.updateResource(request);
            couchDAO.removeResource(request);
            
            // clear any existing cache
            for(Processor processor : request.getProcessors())
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
            
            return true;
        }
        catch(Exception e)
        {
            logger.error(e);
        }
        
        return false;
    }
    
    @SuppressWarnings({ "rawtypes", "unchecked" })
    public boolean deleteTaskRequest(String taskId)
    {
        TaskParameters request = fetchTaskResults(taskId);
        
        try
        {
            couchDAO.removeResource(request);
            
            // clear any existing cache
            for(Processor processor : request.getProcessors())
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
            
            return true;
        }
        catch(Exception e)
        {
            logger.error(e);
        }
        
        return false;
    }
    
    public TaskParameters fetchPersistedTask(String id)
    {
       return couchDAO.getTaskResource(id);
    }
    
    public TaskParameters fetchTaskResults(String id)
    {
        for(TaskParameters task : requestExecutionEngine.getTaskResults())
        {
            if(task.getName().equals(id))
            {
                return task;
            }
            
            try
            {
                if(task.getRequestID().equals(UUID.fromString(id)))
                {
                    return task;
                }
            }
            catch(IllegalArgumentException e)
            {
                // ignore. Names passed in will not match a valid UUID
            }
        }
        
        return null;
    }
    
    public RequestParameters fetchResults(UUID id)
    {
        return couchDAO.getRequestResource(id);
    }
    
    public Engine findAvailableEngine(boolean acceptTask) throws IOException
    {
        Engine engineToUse = null;
        EngineStatus status = null;
        
        for(Engine engine : couchDAO.getAllEngines())
        {
            if(((acceptTask && engine.isAcceptTasks()) || (!acceptTask && engine.isAcceptRequests())) && !engine.isHalted())
            {
                if(engineToUse == null) 
                {
                    engineToUse = engine;
                    status = fetchEngineStatus(engine.getEngineID());
                }
                else
                {
                    EngineStatus thisStatus = fetchEngineStatus(engine.getEngineID());
                    if(thisStatus.getRunningTasks() < status.getRunningTasks() && !thisStatus.isHalted() && !status.isHalted())
                    {
                        engineToUse = engine;
                        status = thisStatus;
                    }
                }
            }
        }
        
        return engineToUse;
    }
    
    @SuppressWarnings("unchecked")
    public TaskParameters performTaskRequest(TaskParameters request) throws IOException
    {
        // clear out results, if they were inadvertently submitted
        for(@SuppressWarnings("rawtypes") Processor processor : request.getProcessors())
        {
            for(Object key : processor.getOutputNodes().keySet())
            {
                List<UUID> features = (List<UUID>) processor.getOutputNodes().get(key);
                features.clear();
            }
        }
        
        try
        {
            boolean valid = processValidator(request.getProcessors());
            if(!valid)
            {
                request.setMessage("ERROR: Task could not be created! Task is invalid (infinite loop).");
                request.setRequestID(null);
                return request;
            }
        }
        catch(Exception e)
        {
            logger.error(e);
        }
        
        TaskParameters existingTask = fetchTaskResults(request.getName());
        if(existingTask != null)
        {
            request.setMessage("ERROR: Task could not be created! Please ensure the name is unique");
            request.setRequestID(null);
        }
        else
        {
            // find the best engine to use

            Engine engineToUse = findAvailableEngine(true);
            
            if(engineToUse != null)
            {
                request.setEngineID(engineToUse.getEngineID());
                couchDAO.createResource(request);
            }
        }
        
        return request;
    }
    
    public RequestParameters performTaskRequest(TaskRequest task) throws IOException
    {
        TaskParameters request = new TaskParameters();
        request.setRequestID(UUID.randomUUID());
        request.setCreationTime(new Date());
        request.setProcessors(task.getProcessors());
        request.setPriority(task.getPriority());
        request.setName(task.getName());
        request.setInterval(task.getInterval());
        request.setIntervalUnit(task.getIntervalUnit());
        
        return performTaskRequest(request);
    }
    
    @SuppressWarnings("unchecked")
    public ProcessorRequest createProject(ProcessorRequest processors)
    {
        try
        {
            // clear out results, if they were inadvertently submitted
            for(@SuppressWarnings("rawtypes") Processor processor : processors.getProcessors())
            {
                for(Object key : processor.getOutputNodes().keySet())
                {
                    List<Feature> features = (List<Feature>) processor.getOutputNodes().get(key);
                    features.clear();
                }
            }
            
            // reset links
            processors.getLinks().clear();
            processors.getLinks().add(new RelLink("self", "GET", "/Projects/" + processors.getName().toString()));
            processors.getLinks().add(new RelLink("update", "PUT", "/Projects/" + processors.getName().toString()));
            processors.getLinks().add(new RelLink("delete", "DELETE", "/Projects/" + processors.getName().toString()));
            
            couchDAO.createResource(processors);
        }
        catch(Exception e)
        {
            logger.error(e);
            processors = null;
        }
        
        return processors;
    } 
    
    public ProcessorRequest updateProject(ProcessorRequest project)
    {
        try
        {
            // reset links
            project.getLinks().clear();
            project.getLinks().add(new RelLink("self", "GET", "/Projects/" + project.getName().toString()));
            project.getLinks().add(new RelLink("update", "PUT", "/Projects/" + project.getName().toString()));
            project.getLinks().add(new RelLink("delete", "DELETE", "/Projects/" + project.getName().toString()));
                        
            couchDAO.updateResource(project);
            project = couchDAO.getProjectByDocId(project.getId());
        }
        catch(Exception e)
        {
            logger.error(e);
            return null;
        }
        
        return project;
    }  
    
    public List<Engine> fetchEngines()
    {
        List<Engine> engines = couchDAO.getAllEngines();
        
        return engines;
    }
    
    public Engine fetchEngine(String name)
    {
        Engine engine = couchDAO.getEngine(name);
        return engine;
    }
    
    public Engine fetchEngine(UUID id)
    {
        Engine engine = couchDAO.getEngine(id);
        return engine;
    }
    
    public EngineStatus fetchEngineStatus(Engine engine) throws IOException
    {
        EngineStatus status = new EngineStatus();
        
        String urlString = engine.getEngineURL();
        if(!urlString.endsWith("/")) urlString += "/";
        
        URL url = new URL(urlString + "Engine/Status");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Accept", "application/json");

        if (conn.getResponseCode() == 200) 
        {
            status = jsonObjectMapper.readValue(conn.getInputStream(), EngineStatus.class);
        }
        
        return status;
    }
    
    public EngineStatus fetchEngineStatus(UUID id) throws IOException
    {
        Engine engine = fetchEngine(id);
        return fetchEngineStatus(engine);
    }
    
    public EngineStatus fetchEngineStatus(String name) throws IOException
    {
        Engine engine = fetchEngine(name);
        return fetchEngineStatus(engine);
    }
    
    public ProcessorRequest fetchProject(String name)
    {
        ProcessorRequest result = null;
        
        List<ProcessorRequest> projects = fetchProjects(null);
        
        for(ProcessorRequest project : projects)
        {
            if(project.getName().equals(name))
            {
                result = project;
                break;
            }
        }
        
        return result;
    }
    
    public List<ProcessorRequest> fetchProjects(String userFilter)
    {
        List<ProcessorRequest> results = new ArrayList<ProcessorRequest>();
        
        results = couchDAO.getAllProjectsResources();
        
        for(int i = 0; i < results.size(); i++)
        {
            ProcessorRequest proc = results.get(i);
            if(userFilter != null && !proc.getUser().equals(userFilter))
            {
                results.remove(i);
                i--; 
            }
        }
        
        return results;
    }
    
    public boolean deleteProject(String name)
    {
        try
        {
            couchDAO.removeResource(fetchProject(name));
            // should check if it still exists...
            return true;
        }
        catch(Exception e)
        {
            logger.error(e);
            return false;
        }
    }
    
    @SuppressWarnings("unchecked")
    public RequestParameters performRequest(RequestParameters request) throws IOException
    {
        // clear out results, if they were inadvertently submitted
        for(@SuppressWarnings("rawtypes") Processor processor : request.getProcessors())
        {
            for(Object key : processor.getOutputNodes().keySet())
            {
                List<UUID> features = (List<UUID>) processor.getOutputNodes().get(key);
                features.clear();
            }
        }

        try
        {
            boolean valid = processValidator(request.getProcessors());
            if(!valid)
            {
                return null;
            }
        }
        catch(Exception e)
        {
            logger.error(e);
        }
        
        // set the engine ID to handle this request
        Engine engineToUse = findAvailableEngine(false);
        
        if(engineToUse != null)
        {
            request.setEngineID(engineToUse.getEngineID());
            couchDAO.createResource(request);
        }
        else
        {
            request = null;
        }
        
        return request;
    }
    
    public RequestParameters performRequest(ProcessorRequest processors) throws IOException
    {
        RequestParameters request = new RequestParameters();
        request.setRequestID(UUID.randomUUID());
        request.setCreationTime(new Date());
        request.setProcessors(processors.getProcessors());
        request.setPriority(processors.getPriority());

        return performRequest(request);
    }
    
    public boolean flushQueue()
    {
        try
        {
            // could change this to specify an engine
            // and clear that engines queue?
            return true;
        }
        catch(Exception e)
        {
            logger.error(e);
            return false;
        }
    }
    
    public boolean clearResults()
    {
        try
        {
            requestExecutionEngine.getRequestResults().clear();
            return true;
        }
        catch(Exception e)
        {
            logger.error(e);
            return false;
        }
    }
    
    public boolean startStopTask(String id, boolean halt)
    {
        try
        {
            RequestParameters task = fetchTaskResults(id);
            if(task.getClass() == TaskParameters.class)
            {
                ((TaskParameters)task).setHalted(halt);
                ((TaskParameters)task).setNextExecutionTime(null);
                ((TaskParameters)task).setStartTime(null);
                ((TaskParameters)task).setCompletionTime(null);
                ((TaskParameters)task).setRunning(false);
                // persist change to the db?
                
                RequestParameters persistedTask = this.fetchTaskResults(id);
                ((TaskParameters)persistedTask).setHalted(halt);
                ((TaskParameters)persistedTask).setNextExecutionTime(null);
                ((TaskParameters)persistedTask).setStartTime(null);
                ((TaskParameters)persistedTask).setCompletionTime(null);
                ((TaskParameters)persistedTask).setRunning(false);
                
                couchDAO.updateResource((TaskParameters)persistedTask);
                
                return true;
            }
            else return false;
        }
        catch(Exception e)
        {
            logger.error(e);
            return false;
        }
    }
    
    public boolean restartEngine()
    {
        return requestExecutionEngine.restartEngine();
    }
    
    public boolean requestEngineIsRunning()
    {
        return requestExecutionEngine.getExecutorService().isTerminated() || requestExecutionEngine.getExecutorService().isShutdown();
    }
    
    public boolean shutdownRequestEngine()
    {
        boolean cleanerShutdown = requestExecutionEngine.getRequestCleanerFuture().cancel(true);
        requestExecutionEngine.getExecutorService().shutdownNow();
        
        return cleanerShutdown;
    }
    
    public boolean deleteLogs()
    {
        try
        {
            logs.clear();
        }
        catch(Exception e)
        {
            return false;
        }
        
        return true;
    }
    
    public List<LogMessage> fetchLogs()
    {
        if(logs == null) logs = new ArrayList<LogMessage>();
        
        if(couchDAO != null)
        {
            List<LogMessage> logMessages = couchDAO.getAllLogMessages();
            
            if(logMessages != null) logMessages.addAll(logs);
            else logMessages = logs;
            
            return logMessages;
        }
        else return logs;
    }
    
    public ResponseEntity<JsonNode> handleError(Exception e) throws IOException
    {
        return new ResponseEntity<JsonNode>(getErrorMessageAsJson(e), HttpStatus.BAD_REQUEST);
    }
    
    public JsonNode getErrorMessageAsJson(Exception e) throws IOException
    {
        return jsonObjectMapper.readValue(("{ \"status\": \"ERROR\", \"message\": \"" + e.getMessage() + "\" }").replaceAll("\\r\\n|\\r|\\n", " "), JsonNode.class);
    }

    public int getRunningTasks()
    {
        return runningTasks;
    }

    public void setRunningTasks(int runningTasks)
    {
        this.runningTasks = runningTasks;
    }
    
    public boolean createUser(VTSUser user)
    {
        try
        {
            // check for duplicates?
            for(VTSUser existingUser : couchDAO.getAllUsersResources())
            {
                if(existingUser.getName().equals(user.getName()))
                {
                    return false;
                }
            }
            
            couchDAO.createResource(user);
        }
        catch(Exception e)
        {
            logger.error(e);
            return false;
        }
        
        return true;
    }
    
    public boolean updateUser(VTSUser user)
    {
        try
        {
            // ensure name change isn't invalid/duplicate
            for(VTSUser existingUser : couchDAO.getAllUsersResources())
            {
                if(existingUser.getName().equals(user.getName()) && !existingUser.getId().equals(user.getId()))
                {
                    return false;
                }
            }
            
            couchDAO.updateResource(user);
        }
        catch(Exception e)
        {
            logger.error(e);
            return false;
        }
        
        return true;
    }
    
    @SuppressWarnings("rawtypes")
    public boolean processValidator(List<Processor> processors) throws InstantiationException, IllegalAccessException, IllegalArgumentException, InvocationTargetException
    {
        boolean valid = false;
        
        for(Processor processor : processors)
        {
            List<Integer> thisProcessorsRelatedProcs = getProcessProcessorIDs(processor);
            
            if(thisProcessorsRelatedProcs.size() > 0)
            {
                if(thisProcessorsRelatedProcs.contains(processor.getProcessorID()))
                {
                    valid = false;
                    break;
                }
                
                valid = walkList(thisProcessorsRelatedProcs, processors, processor.getProcessorID());
                
                if(!valid) break;
            }
        }
        
        return valid;
    }
    
    @SuppressWarnings("rawtypes")
    private boolean walkList(List<Integer> walkIds, List<Processor> processors, Integer initialId) throws IllegalAccessException, IllegalArgumentException, InvocationTargetException
    {
        boolean valid = true;
        
        for(Processor processor : processors)
        {
            if(walkIds.contains(processor.getProcessorID()))
            {
                List<Integer> thisProcessorsRelatedProcs = getProcessProcessorIDs(processor);
                
                if(thisProcessorsRelatedProcs.size() > 0)
                {
                    if(thisProcessorsRelatedProcs.contains(processor.getProcessorID()) || thisProcessorsRelatedProcs.contains(initialId))
                    {
                        valid = false;
                        break;
                    }
    
                    valid = walkList(thisProcessorsRelatedProcs, processors, initialId);
                    
                    if(!valid) break;
                }
            }
        }
        
        return valid;
    }
    
    @SuppressWarnings({ "rawtypes", "unchecked" })
    private List<Integer> getProcessProcessorIDs(Processor processor) throws IllegalAccessException, IllegalArgumentException, InvocationTargetException
    {
        List<Integer> results = new ArrayList<Integer>();
        
        Class<? extends Processor> c = processor.getClass();        

        // superclass to featureProcessor, superclass to Processor
        Method[] allMethods = c.getSuperclass().getSuperclass().getDeclaredMethods();
        
        for (Method method : allMethods) 
        {
            String methodName = method.getName();
            if(methodName.equals("getInputNodes"))
            {
                Map<String, List<NodeMap>> inputNodes = (HashMap<String, List<NodeMap>>)method.invoke(processor);
                for(String key : inputNodes.keySet())
                {
                    List<NodeMap> nodes = inputNodes.get(key);
                    for(NodeMap node : nodes)
                    {
                        results.add(node.getProcessorID());
                    }
                }
            }
        }
        
        return results;  
    }
    
    public boolean deleteEngine(Engine engine)
    {
        try
        {
            couchDAO.removeResource(engine);
            return true;
        }
        catch(Exception e)
        {
            logger.error(e.getMessage());
        }
        
        return false;
    }
    
    public boolean deleteEngine(UUID id)
    {
        return deleteEngine(fetchEngine(id));
    }
    
    public boolean deleteEngine(String name)
    {
        return deleteEngine(fetchEngine(name));
    }
    
    public Feature getFeature(UUID id)
    {
        return couchDAO.getGeometry(id);
    }
}
