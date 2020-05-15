package com.vividsolutions.vts.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vividsolutions.vts.controller.VTSController;
import com.vividsolutions.vts.engine.RequestParameters;
import com.vividsolutions.vts.engine.TaskParameters;
import com.vividsolutions.vts.model.Engine;
import com.vividsolutions.vts.model.EngineStatus;
import com.vividsolutions.vts.model.LogMessage;
import com.vividsolutions.vts.model.VTSUser;
import com.vividsolutions.vts.model.processors.ProcessorRequest;

@CrossOrigin
@RestController
@RequestMapping("/Admin/")
@PropertySource("classpath:application.properties")
public class VTSAdminService
{
private static Log logger = LogFactory.getLog(VTSService.class);
    
    @Autowired
    private VTSController vtsController;
    
    @Autowired
    private ObjectMapper jsonObjectMapper;

    @GetMapping(value = "/Jobs")
    @ResponseBody
    public ResponseEntity<JsonNode> getRunningJobs(@RequestParam(value="verbose", required=false) boolean verbose) throws IOException 
    {
        logger.debug(" >> getRunningJobs()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting jobs response...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            List<RequestParameters> requests = vtsController.getRunningServiceRequests();
            
            if(verbose) 
            {
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requests, JsonNode.class), httpHeaders, HttpStatus.OK);
            }
            else
            {
                String taskJson = "";
                String requestJson = "";
                for(RequestParameters params : requests)
                {
                    if(params.getClass() == TaskParameters.class)
                    {
                        taskJson += "\"" + ((TaskParameters)params).getName() + "\",";
                    }
                    else
                    {
                        requestJson += "\"" + params.getRequestID() + "\",";
                    }
                }
                
                if(taskJson.length() > 0) taskJson = taskJson.substring(0, taskJson.length() - 1);
                if(requestJson.length() > 0) requestJson = requestJson.substring(0, requestJson.length() - 1);
                
                String resultJson = "{ \"requests\": [" + requestJson + "], \"scheduledTasks\": [" + taskJson + "] }";
                
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(resultJson, JsonNode.class), httpHeaders, HttpStatus.OK);
            }   
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating job list: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Jobs request complete. Response: " + result.getStatusCode().name());
        logger.debug(" << getRunningJobs()");
        return result;
    }
    
    @DeleteMapping(value = "/Jobs/Flush")
    @ResponseBody
    public ResponseEntity<JsonNode> flushQueue() throws IOException 
    {
        logger.debug(" >> flushQueue()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting queue flush...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            boolean flushSuccess = vtsController.flushQueue();
            
            String resultJson = "{ \"request\": \"Flush Queue\", \"success\": " + flushSuccess + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(resultJson, JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error flushing queue list: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Jobs flush complete. Response: " + result.getStatusCode().name());
        logger.debug(" << flushQueue()");
        return result;
    }
    
    @DeleteMapping(value = "/Jobs/Clear")
    @ResponseBody
    public ResponseEntity<JsonNode> clearResults() throws IOException 
    {
        logger.debug(" >> clearResults()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting results flush...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            boolean flushSuccess = vtsController.clearResults();
            
            String resultJson = "{ \"request\": \"Clear Results\", \"success\": " + flushSuccess + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(resultJson, JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error flushing results list: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    results flush complete. Response: " + result.getStatusCode().name());
        logger.debug(" << clearResults()");
        return result;
    }
    
    @PutMapping(value = "/Jobs/{id}/Halt")
    @ResponseBody
    public ResponseEntity<JsonNode> haltTask(@PathVariable String id) throws IOException 
    {
        logger.debug(" >> haltTask()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting task halt...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            boolean flushSuccess = vtsController.startStopTask(id, true);
            
            String resultJson = "{ \"request\": \"Halt Task\", \"success\": " + flushSuccess + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(resultJson, JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error halting task: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    halt task complete. Response: " + result.getStatusCode().name());
        logger.debug(" << haltTask()");
        return result;
    }
    
    @PutMapping(value = "/Jobs/{id}/Start")
    @ResponseBody
    public ResponseEntity<JsonNode> startTask(@PathVariable String id) throws IOException 
    {
        logger.debug(" >> tartTask()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting task ...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            boolean flushSuccess = vtsController.startStopTask(id, false);
            
            String resultJson = "{ \"request\": \"Start Task\", \"success\": " + flushSuccess + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(resultJson, JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error starting task: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    start task complete. Response: " + result.getStatusCode().name());
        logger.debug(" << tartTask()");
        return result;
    }
    
    @PostMapping(value = "/Engine/Restart")
    @ResponseBody
    public ResponseEntity<JsonNode> restartEngine() throws IOException 
    {
        logger.debug(" >> restartEngine()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Restarting task engine ...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            boolean restartSuccess = vtsController.restartEngine();
            
            String resultJson = "{ \"request\": \"Restart Engine\", \"success\": " + restartSuccess + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(resultJson, JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error starting task: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    start task engine complete. Response: " + result.getStatusCode().name());
        logger.debug(" << restartEngine()");
        return result;
    }
    
    @GetMapping(value = "/Logs")
    @ResponseBody
    public ResponseEntity<JsonNode> getLogs() throws IOException 
    {
        logger.debug(" >> getLogs()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching logs...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            List<LogMessage> logs = vtsController.fetchLogs();
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(logs, JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error fetching logs: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    fetch logs complete. Response: " + result.getStatusCode().name());
        logger.debug(" << getLogs()");
        return result;
    }
    
    @DeleteMapping(value = "/Logs")
    @ResponseBody
    public ResponseEntity<JsonNode> clearLogs() throws IOException 
    {
        logger.debug(" >> clearLogs()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Deleting logs...");

            boolean isDeleted = vtsController.deleteLogs();
            
            String message = "{ \"request\": \"Clear Logs\", \"cleared\": " + Boolean.toString(isDeleted) + " }";
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(message, JsonNode.class), HttpStatus.OK);
            
        }
        catch(Exception e)
        {
            logger.error("    ## Error fetching logs: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    delete logs complete. Response: " + result.getStatusCode().name());
        logger.debug(" << clearLogs()");
        return result;
    }
    
    @PostMapping(value = "/Projects")
    @ResponseBody
    public ResponseEntity<JsonNode> createProject(@RequestBody ProcessorRequest request) throws IOException 
    {
        logger.debug(" >> createProject()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Creating topologyProcess Project...");

            ProcessorRequest requestParams = vtsController.createProject(request);
            
            if(requestParams != null)
            {
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
            }
            else
            {
                String message = "{ \"requestStatus\": \"Failed to create project\", \"reason\": \"Could not write project to disk.\" }";
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(message, JsonNode.class), HttpStatus.FORBIDDEN);
            }
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating topologyProcess: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << createProject()");
        return result;
    }
    
    @PutMapping(value = "/Projects")
    @ResponseBody
    public ResponseEntity<JsonNode> updateProject(@RequestBody ProcessorRequest request) throws IOException 
    {
        logger.debug(" >> updateProject()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Updating topologyProcess Project...");

            ProcessorRequest requestParams = vtsController.updateProject(request);
            
            if(requestParams != null)
            {
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
            }
            else
            {
                String message = "{ \"requestStatus\": \"Failed to create project\", \"reason\": \"Could not write project to disk\" }";
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(message, JsonNode.class), HttpStatus.FORBIDDEN);
            }
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating topologyProcess: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << updateProject()");
        return result;
    }
    
    @DeleteMapping(value = "/Projects/{name}")
    @ResponseBody
    public ResponseEntity<JsonNode> deleteProject(@PathVariable String name) throws IOException 
    {
        logger.debug(" >> deleteProject()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Deleting project...");

            boolean isDeleted = vtsController.deleteProject(name);
            
            String message = "{ \"projectName\": \"" + name + "\", \"deleted\": " + Boolean.toString(isDeleted) + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(message, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << delete()");
        return result;
    }
    
    @GetMapping(value = "/Projects")
    @ResponseBody
    public ResponseEntity<JsonNode> fetchProjects(@RequestParam(value="user", required=false) String user) throws IOException 
    {
        logger.debug(" >> fetchProjects()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching proejcts...");
            
            List<ProcessorRequest> requestParams = vtsController.fetchProjects(user);

            List<String> projectNames = new ArrayList<String>();
            
            for(ProcessorRequest req : requestParams)
            {
                projectNames.add(req.getName());
            }
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(projectNames, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << fetchProjects()");
        return result;
    }
    
    @GetMapping(value = "/Projects/{name}")
    @ResponseBody
    public ResponseEntity<JsonNode> fetchProject(@PathVariable String name) throws IOException 
    {
        logger.debug(" >> fetchProject()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching projectt...");
            ProcessorRequest requestParams = vtsController.fetchProject(name);
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << results()");
        return result;
    }
    
    @PostMapping(value = "/Users/Login")
    @ResponseBody
    public ResponseEntity<JsonNode> loginUser(@RequestBody VTSUser request) throws IOException 
    {
        logger.debug(" >> loginUser()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Logging in user...");

            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue("", JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << loginUser()");
        return result;
    }
    
    @PostMapping(value = "/Users")
    @ResponseBody
    public ResponseEntity<JsonNode> createUser(@RequestBody VTSUser user) throws IOException 
    {
        logger.debug(" >> createUser()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Creating user...");
            boolean createdUser = vtsController.createUser(user);
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            String message = "{ \"action\": \"Create User\", \"created\": " + Boolean.toString(createdUser) + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(message, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << createUser()");
        return result;
    }
    
    @PutMapping(value = "/Users")
    @ResponseBody
    public ResponseEntity<JsonNode> updateUser(@RequestBody VTSUser user) throws IOException 
    {
        logger.debug(" >> updateUser()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Updating user...");
            boolean createdUser = vtsController.updateUser(user);
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            String message = "{ \"action\": \"Update User\", \"created\": " + Boolean.toString(createdUser) + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(message, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << updateUser()");
        return result;
    }
    
    @GetMapping(value = "/Engines")
    @ResponseBody
    public ResponseEntity<JsonNode> fetchEngines() throws IOException 
    {
        logger.debug(" >> fetchEngines()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching Engines...");
            List<Engine> requestParams = vtsController.fetchEngines();
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << fetchEngines()");
        return result;
    }
    
    @GetMapping(value = "/Engines/{name}")
    @ResponseBody
    public ResponseEntity<JsonNode> fetchEngine(@PathVariable String name) throws IOException 
    {
        logger.debug(" >> fetchEngine()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching Engine...");
            
            Engine requestParams = null;
            
            try
            {
                requestParams = vtsController.fetchEngine(UUID.fromString(name));
            }
            catch(Exception e)
            {
                requestParams = vtsController.fetchEngine(name);
            }
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << fetchEngine()");
        return result;
    }
    
    @GetMapping(value = "/Engines/{name}/Status")
    @ResponseBody
    public ResponseEntity<JsonNode> fetchEngineStatus(@PathVariable String name) throws IOException 
    {
        logger.debug(" >> fetchEngineStatus()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching Engine Status...");
            
            EngineStatus requestParams = null;
            
            try
            {
                requestParams = vtsController.fetchEngineStatus(UUID.fromString(name));
            }
            catch(Exception e)
            {
                requestParams = vtsController.fetchEngineStatus(name);
            }
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << fetchEngineStatus()");
        return result;
    }
    
    @DeleteMapping(value = "/Engines/{name}")
    @ResponseBody
    public ResponseEntity<JsonNode> deleteEngine(@PathVariable String name) throws IOException 
    {
        logger.debug(" >> fetchEngine()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching Engine...");
            
            boolean deleted = false;
            
            try
            {
                deleted = vtsController.deleteEngine(UUID.fromString(name));
            }
            catch(Exception e)
            {
                deleted = vtsController.deleteEngine(name);
            }
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue("{ \"action\": \"Delete Engine\", \"successful\": " + Boolean.toString(deleted) + "}", JsonNode.class), deleted ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << fetchEngine()");
        return result;
    }
}
