package com.vividsolutions.vts.service;

import java.io.IOException;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vividsolutions.vts.controller.VTSEngineController;
import com.vividsolutions.vts.engine.TaskParameters;
import com.vividsolutions.vts.model.EngineStatus;

@CrossOrigin
@RestController
@RequestMapping("/Engine")
@PropertySource("classpath:application.properties")
public class VTSEngineService
{
    private static Log logger = LogFactory.getLog(VTSEngineService.class);
    
    @Autowired
    private VTSEngineController vtsEngineController;
    
    @Autowired
    private ObjectMapper jsonObjectMapper;
    
    @GetMapping(value = "/Status")
    @ResponseBody
    public ResponseEntity<JsonNode> status() throws IOException 
    {
        logger.debug(" >> status()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting status response...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);

            EngineStatus status = vtsEngineController.getEngineStatus();
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(status, JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating status: " + e.getMessage());
            result = vtsEngineController.handleError(e);
        }
        
        logger.info("    Status request complete. Response: " + result.getStatusCode().name());
        logger.debug(" << status()");
        return result;
    }
    
    @PostMapping(value = "/Halt")
    @ResponseBody
    public ResponseEntity<JsonNode> halt() throws IOException 
    {
        logger.debug(" >> halt()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Attempting to halt engine...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);

            boolean engineHalted = vtsEngineController.haltEngine();
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue("{ \"action\": \"Halt Engine\", \"successful\": " + Boolean.toString(engineHalted) + "}", JsonNode.class), httpHeaders, engineHalted ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
        }
        catch(Exception e)
        {
            logger.error("    ## Error stopping engine: " + e.getMessage());
            result = vtsEngineController.handleError(e);
        }
        
        logger.info("    halt request complete. Response: " + result.getStatusCode().name());
        logger.debug(" << halt()");
        return result;
    }
    
    @PostMapping(value = "/Start")
    @ResponseBody
    public ResponseEntity<JsonNode> start() throws IOException 
    {
        logger.debug(" >> start()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Attempting to start engine...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);

            boolean engineStarted = vtsEngineController.startEngine();
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue("{ \"action\": \"Start Engine\", \"successful\": " + Boolean.toString(engineStarted) + "}", JsonNode.class), httpHeaders, engineStarted ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
        }
        catch(Exception e)
        {
            logger.error("    ## Error starting engine: " + e.getMessage());
            result = vtsEngineController.handleError(e);
        }
        
        logger.info("    start request complete. Response: " + result.getStatusCode().name());
        logger.debug(" << start()");
        return result;
    }
    
    @PostMapping(value = "/Restart")
    @ResponseBody
    public ResponseEntity<JsonNode> restart() throws IOException 
    {
        logger.debug(" >> restart()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Attempting to restart engine...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);

            boolean engineStarted = vtsEngineController.restartEngine();
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue("{ \"action\": \"Restart Engine\", \"successful\": " + Boolean.toString(engineStarted) + "}", JsonNode.class), httpHeaders, engineStarted ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
        }
        catch(Exception e)
        {
            logger.error("    ## Error restarting engine: " + e.getMessage());
            result = vtsEngineController.handleError(e);
        }
        
        logger.info("    restart request complete. Response: " + result.getStatusCode().name());
        logger.debug(" << restart()");
        return result;
    }
    
    @PostMapping(value = "/Cache/Flush")
    @ResponseBody
    public ResponseEntity<JsonNode> cacheFlush() throws IOException 
    {
        logger.debug(" >> cacheFlush()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Attempting to flush Feature Cache...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);

            boolean flushed = vtsEngineController.flushCache();
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue("{ \"action\": \"Flush Feature Cache\", \"successful\": " + Boolean.toString(flushed) + "}", JsonNode.class), httpHeaders, flushed ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
        }
        catch(Exception e)
        {
            logger.error("    ## Error flushing cache: " + e.getMessage());
            result = vtsEngineController.handleError(e);
        }
        
        logger.info("    cache flush request complete. Response: " + result.getStatusCode().name());
        logger.debug(" << cacheFlush()");
        return result;
    }
    
    @GetMapping(value = "/ScheduledTasks")
    @ResponseBody
    public ResponseEntity<JsonNode> fetchScheduledTasks() throws IOException 
    {
        logger.debug(" >> fetchScheduledTasks()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Attempting to fetch running scheduled task list...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            List<TaskParameters> processed = vtsEngineController.getScheduledTaskList();
            
            String json = "{ \"tasks\": [ ";
            
            for(TaskParameters params : processed)
            {
                json += "{ \"name\": \"" + params.getName() + "\", \"id\": \"" + params.getRequestID() + "\" },";
            }
            
            if(json.endsWith(",")) json.substring(0, json.length() - 1);
            
            json += "] }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(json, JsonNode.class), httpHeaders, processed != null ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
        }
        catch(Exception e)
        {
            logger.error("    ## Error creating task list: " + e.getMessage());
            result = vtsEngineController.handleError(e);
        }
        
        logger.info("    create task list complete. Response: " + result.getStatusCode().name());
        logger.debug(" << fetchScheduledTasks()");
        return result;
    }
}
