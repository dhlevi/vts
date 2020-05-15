package com.vividsolutions.vts.controller;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;
import java.util.UUID;

import javax.annotation.PostConstruct;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.engine.RequestExecutionEngine;
import com.vividsolutions.vts.engine.TaskParameters;
import com.vividsolutions.vts.model.Engine;
import com.vividsolutions.vts.model.EngineStatus;
import com.vividsolutions.vts.model.LogMessage;

@PropertySource("classpath:application.properties")
@Controller
@DependsOn("couchDAO")
public class VTSEngineController
{
    private static Log logger = LogFactory.getLog(VTSEngineController.class);
    
    @Autowired
    private RequestExecutionEngine requestExecutionEngine;
    
    @Autowired
    private ObjectMapper jsonObjectMapper;

    @Autowired
    private CouchDAO couchDAO;
    
    @Autowired
    private Environment env;
    
    private Engine engineRegistration;
    private boolean registered;
    
    public VTSEngineController() throws InterruptedException
    {
    }
    
    @PostConstruct
    public void init() throws MalformedURLException
    {
        registered = false;
        engineRegistration = null;
        
        // fetch engine registration if it exists, otherwise, create a new registration in the couchDB
        String engineName = env.getProperty("engine.name");
        String engineURL = env.getProperty("engine.url");
        boolean acceptsRequests = Boolean.parseBoolean(env.getProperty("engine.accept.requests"));
        boolean acceptsTasks = Boolean.parseBoolean(env.getProperty("engine.accept.tasks"));
        
        engineRegistration = couchDAO.getEngine(engineName);
        
        if(engineRegistration == null)
        {
            // create a new one
            engineRegistration = new Engine();
            engineRegistration.setEngineID(UUID.randomUUID());
            engineRegistration.setEngineName(engineName);
            engineRegistration.setEngineURL(engineURL);
            engineRegistration.setAcceptRequests(acceptsRequests);
            engineRegistration.setAcceptTasks(acceptsTasks);
            engineRegistration.setHalted(false);
            
            couchDAO.createResource(engineRegistration);
        }
        
        registered = true;
    }
    
    public EngineStatus getEngineStatus()
    {
        EngineStatus result = new EngineStatus();
        result.setEngineID(engineRegistration.getEngineID());
        result.setEngineName(engineRegistration.getEngineName());
        result.setHalted(engineRegistration.isHalted());
        result.setRegistered(registered);
        result.setRunningRequests(couchDAO.getAllRequestResources(engineRegistration.getEngineID()).size()); // add a count query instead of pulling resources
        result.setRunningTasks(couchDAO.getAllTasksResources(engineRegistration.getEngineID()).size());
        
        return result;
    }
    
    public boolean running()
    {
        return engineRegistration != null && registered && !engineRegistration.isHalted();
    }
    
    public boolean haltEngine()
    {
        if(running())
        {
            try
            {
                engineRegistration.setHalted(true);
                couchDAO.updateResource(engineRegistration);
                
                requestExecutionEngine.shutdownEngine();
                return true;
            }
            catch(Exception e)
            {
                logger.error(e);
                log("Failed to halt engine: " + e.getMessage());
            }
        }
        
        return false;
    }
    
    public boolean startEngine()
    {
        if(registered)
        {
            engineRegistration.setHalted(false);
            couchDAO.updateResource(engineRegistration);
            requestExecutionEngine.init();
            return true;
        }
        
        return false;
    }
    
    public boolean restartEngine()
    {
        if(running())
        {
            engineRegistration.setHalted(true);
            couchDAO.updateResource(engineRegistration);
            engineRegistration.setHalted(requestExecutionEngine.restartEngine());
            couchDAO.updateResource(engineRegistration);
            return engineRegistration.isHalted();
        }
        
        return false;
    }
    
    public boolean flushCache()
    {
        if(running())
        {
            try
            {
                couchDAO.flushCache();
                return true;
            }
            catch(Exception e)
            {
                logger.error(e);
                log("Failed to flush feature cache: " + e.getMessage());
            }
        }
        
        return false;
    }
    
    public List<TaskParameters> getScheduledTaskList()
    {
        return requestExecutionEngine.getTaskResults();
    }
    
    public void log(String message)
    {
        if(couchDAO != null) couchDAO.createResource(new LogMessage("Engine", engineRegistration.getEngineName(), message));
    }
    
    public void log(LogMessage log)
    {
        if(couchDAO != null) couchDAO.createResource(log);
    }
    
    public ResponseEntity<JsonNode> handleError(Exception e) throws IOException
    {
        return new ResponseEntity<JsonNode>(getErrorMessageAsJson(e), HttpStatus.BAD_REQUEST);
    }
    
    public JsonNode getErrorMessageAsJson(Exception e) throws IOException
    {
        return jsonObjectMapper.readValue(("{ \"status\": \"ERROR\", \"message\": \"" + e.getMessage() + "\" }").replaceAll("\\r\\n|\\r|\\n", " "), JsonNode.class);
    }

    public Engine getEngineRegistration()
    {
        return engineRegistration;
    }

    public void setEngineRegistration(Engine engineRegistration)
    {
        this.engineRegistration = engineRegistration;
    }

    public boolean isRegistered()
    {
        return registered;
    }

    public void setRegistered(boolean registered)
    {
        this.registered = registered;
    }
}
