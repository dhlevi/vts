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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vividsolutions.jts.geom.Envelope;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.vts.controller.VTSController;
import com.vividsolutions.vts.engine.RequestParameters;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.RelLink;
import com.vividsolutions.vts.model.ServiceDetails;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;
import com.vividsolutions.vts.model.processors.ProcessorRequest;
import com.vividsolutions.vts.model.processors.TaskRequest;

@CrossOrigin
@RestController
@RequestMapping("/")
@PropertySource("classpath:application.properties")
public class VTSService
{
    private static Log logger = LogFactory.getLog(VTSService.class);
    
    @Autowired
    private VTSController vtsController;
    
    @Autowired
    private ObjectMapper jsonObjectMapper;
    
    @GetMapping(value = "/")
    @ResponseBody
    public ResponseEntity<JsonNode> topLevel() throws IOException 
    {
        logger.debug(" >> topLevel()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting Top Level response...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);

            ServiceDetails details = new ServiceDetails();
            details.setName("Vivid Topology Service");
            details.setDetails("The Vivid Topology Service (VTS) is a RESTful service for processes batches of topology tasks for geojson inputs.");
            details.getLinks().add(new RelLink("self", "GET", "/"));
            details.getLinks().add(new RelLink("health", "GET", "/Health/"));
            details.getLinks().add(new RelLink("topologyProcess", "POST", "/TopologyProcess/"));
            details.getLinks().add(new RelLink("scheduledProcess", "POST", "/TopologyTask/"));
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(details, JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating top level: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Top Level request complete. Response: " + result.getStatusCode().name());
        logger.debug(" << topLevel()");
        return result;
    }
    
    @GetMapping(value = "/Health")
    @ResponseBody
    public ResponseEntity<JsonNode> healthCheck() throws IOException 
    {
        logger.debug(" >> healthCheck()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting health check...");
            
            final HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            String engineStatus = vtsController.requestEngineIsRunning() ? "\"requestEngineStatus\": \"RUNNING\"" : "\"requestEngineStatus\": \"OFFLINE\"";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue("{ \"serviceStatus\": \"RUNNING\", " + engineStatus + " }", JsonNode.class), httpHeaders, HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating health status: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Health check completed. Response: " + result.getStatusCode().name());
        logger.debug(" << healthCheck()");
        return result;
    }
    
    @PostMapping(value = "/TopologyTask")
    @ResponseBody
    public ResponseEntity<JsonNode> topologyTask(@RequestBody TaskRequest request) throws IOException 
    {
        logger.debug(" >> topologyTask()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting topologyTask...");

            RequestParameters requestParams = vtsController.performTaskRequest(request);
            
            if(requestParams.getCreationTime() != null)
            {
                requestParams.getLinks().add(new RelLink("self", "GET", "/TopologyTask/" + requestParams.getRequestID().toString()));
                requestParams.getLinks().add(new RelLink("Delete Task", "DELETE", "/TopologyTask/" + requestParams.getRequestID().toString()));
                
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
            }
            else
            {
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.BAD_REQUEST);
            }
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating topologyTask: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << topologyTask()");
        return result;
    }
    
    @SuppressWarnings("unchecked")
    @GetMapping(value = "/TopologyTask/{id}")
    @ResponseBody
    public ResponseEntity<JsonNode> taskResults(@PathVariable String id, @RequestParam(value="verbose", required=false) boolean verbose, @RequestParam(value="fetchSingleProcessorResults", required=false) Integer fetchSingleProcessorResults, @RequestParam(value="fetchGeometryOnly", required=false) boolean fetchGeometryOnly, @RequestParam(value="noGeometry", required=false) boolean noGeometry, @RequestParam(value="bbox", required=false) String bbox, @RequestParam(value="outputNode", required=false) String outputNode) throws IOException 
    {
        logger.debug(" >> taskResults()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching process result...");

            RequestParameters requestParams = vtsController.fetchTaskResults(id);
            
            // fetch a single processor result
            if(fetchSingleProcessorResults != null)
            {
                RequestParameters requestParamsCopy = new RequestParameters(requestParams);
                
                // trim out some of the params to simplify the result
                @SuppressWarnings("rawtypes")
                List<Processor> simpleResults = new ArrayList<Processor>();
                
                for(@SuppressWarnings("rawtypes") Processor processor : requestParams.getProcessors())
                {
                    if(processor.getProcessorID().equals(fetchSingleProcessorResults))
                    {
                        simpleResults.add(processor);
                        break;
                    }
                }
                
                requestParamsCopy.setProcessors(simpleResults);
                requestParams = requestParamsCopy;
            }
            
            // build a result response from the request params result set
            if(!verbose)
            {
                RequestParameters requestParamsCopy = new RequestParameters(requestParams);
                
                // trim out some of the params to simplify the result
                @SuppressWarnings("rawtypes")
                List<Processor> simpleResults = new ArrayList<Processor>();
                
                for(@SuppressWarnings("rawtypes") Processor processor : requestParams.getProcessors())
                {
                    FeatureProcessor simpleProc = processor.getSimpleResults();
                    if(noGeometry) simpleProc.getOutputNodes().clear();
                    
                    simpleResults.add(simpleProc);
                }
                
                requestParamsCopy.setProcessors(simpleResults);
                requestParams = requestParamsCopy;
            }
            
            if(fetchSingleProcessorResults != null && fetchGeometryOnly)
            {
                String geomString = "{\"type\": \"FeatureCollection\", \"features\": [";

                Envelope envelope = null;
                if(bbox != null)
                {
                    try
                    {
                        envelope = new Envelope(Double.parseDouble(bbox.split(",")[0].trim()), Double.parseDouble(bbox.split(",")[1].trim()), Double.parseDouble(bbox.split(",")[2].trim()), Double.parseDouble(bbox.split(",")[3].trim()));
                    }
                    catch(Exception e)
                    {
                        logger.error("Invalid bbox parameters (" + bbox + "): " + e.getMessage());
                    }
                }
                
                for(@SuppressWarnings("rawtypes") Processor processor : requestParams.getProcessors())
                {
                    // we should only have one at this point, but there may be multiple output ports... merge them all?
                    // or, add "output node" to query string so we can fetch the specific nodes results. default to "feature"
                    // which will be most nodes results.
                 // we should only have one at this point
                    for(Object keyObj : processor.getOutputNodes().keySet())
                    {
                        String key = keyObj.toString();
                        if(outputNode == null || (outputNode != null && key.equals(outputNode)))
                        {
                            List<UUID> results = (List<UUID>) processor.getOutputNodes().get(key);
                            for(UUID featureId : results)
                            {
                                Feature feature = vtsController.getFeature(featureId);
                                if(envelope != null)
                                {
                                    Geometry geom = feature.getAsGeometryObject();
                                    Envelope internalEnv = geom.getEnvelopeInternal();
                                    if(envelope.intersection(internalEnv) != null)
                                    {
                                        JsonNode geomNode = feature.getGeometry();
                                        geomString += "{\"type\": \"Feature\", \"geometry\": " + geomNode.toString() + ", \"properties\":{";
                                        
                                        if(feature.getAttributes() != null && feature.getAttributes().size() > 0)
                                        {
                                            for(Attribute attribute : feature.getAttributes())
                                            {
                                                geomString += "\"" + attribute.getName() + "\": \"" + attribute.getValue() + "\",";
                                            }
                                            if(geomString.endsWith(",")) geomString = geomString.substring(0, geomString.length() - 1);
                                        }
                                        
                                        geomString += "}},";
                                    }
                                }
                                else
                                {
                                    JsonNode geomNode = feature.getGeometry();
                                    geomString += "{\"type\": \"Feature\", \"geometry\": " + geomNode.toString() + ", \"properties\":{";
                                    
                                    if(feature.getAttributes() != null && feature.getAttributes().size() > 0)
                                    {
                                        for(Attribute attribute : feature.getAttributes())
                                        {
                                            geomString += "\"" + attribute.getName() + "\": \"" + attribute.getValue() + "\",";
                                        }
                                        if(geomString.endsWith(",")) geomString = geomString.substring(0, geomString.length() - 1);
                                    }
                                    
                                    geomString += "}},";
                                }
                            }
                        }
                    }
                }
                
                // trim last character ','
                if(geomString.endsWith(",")) geomString = geomString.substring(0, geomString.length() - 1);
                
                geomString += "]}";
                
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(geomString, JsonNode.class), HttpStatus.OK);
            }
            else
            {
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
            }
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << taskResults()");
        return result;
    }
    
    @DeleteMapping(value = "/TopologyTask/{id}")
    @ResponseBody
    public ResponseEntity<JsonNode> taskDelete(@PathVariable String id) throws IOException 
    {
        logger.debug(" >> taskDelete()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Deleting task...");

            boolean isDeleted = vtsController.deleteTaskRequest(id);
            
            String message = "{ \"Task\": \"" + id + "\", \"deleted\": " + Boolean.toString(isDeleted) + " }";
            
            result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(message, JsonNode.class), HttpStatus.OK);
        }
        catch(Exception e)
        {
            logger.error("    ## Error deleting task results: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << taskDelete()");
        return result;
    }
    
    @PostMapping(value = "/TopologyProcess")
    @ResponseBody
    public ResponseEntity<JsonNode> topologyProcess(@RequestBody ProcessorRequest request) throws IOException 
    {
        logger.debug(" >> topologyProcess()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Starting topologyProcess...");

            RequestParameters requestParams = vtsController.performRequest(request);
            
            if(requestParams != null)
            {
                requestParams.getLinks().add(new RelLink("self", "GET", "/TopologyProcess/" + requestParams.getRequestID().toString()));
                requestParams.getLinks().add(new RelLink("Delete Request", "DELETE", "/TopologyProcess/" + requestParams.getRequestID().toString()));
                
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
            }
            else
            {
                String message = "{ \"requestStatus\": \"Failed to Queue\", \"reason\": \"The maximum queue limit has been reached. Please attempt your request later.\" }";
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(message, JsonNode.class), HttpStatus.FORBIDDEN);
            }
        }
        catch(Exception e)
        {
            logger.error("    ## Error generating topologyProcess: " + e.getMessage());
            result = vtsController.handleError(e);
        }
        
        logger.info("    Completed. Response: " + result.getStatusCode().name());
        logger.debug(" << topologyProcess()");
        return result;
    }
    
    @SuppressWarnings("unchecked")
    @GetMapping(value = "/TopologyProcess/{id}")
    @ResponseBody
    public ResponseEntity<JsonNode> results(@PathVariable String id, @RequestParam(value="verbose", required=false) boolean verbose, @RequestParam(value="fetchSingleProcessorResults", required=false) Integer fetchSingleProcessorResults, @RequestParam(value="fetchGeometryOnly", required=false) boolean fetchGeometryOnly, @RequestParam(value="noGeometry", required=false) boolean noGeometry, @RequestParam(value="bbox", required=false) String bbox, @RequestParam(value="outputNode", required=false) String outputNode) throws IOException 
    {
        logger.debug(" >> results()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Fetching process result...");

            RequestParameters requestParams = vtsController.fetchResults(UUID.fromString(id));
            
            // fetch a single processor result
            if(fetchSingleProcessorResults != null)
            {
                RequestParameters requestParamsCopy = new RequestParameters(requestParams);
                
                // trim out some of the params to simplify the result
                @SuppressWarnings("rawtypes")
                List<Processor> simpleResults = new ArrayList<Processor>();
                
                for(@SuppressWarnings("rawtypes") Processor processor : requestParams.getProcessors())
                {
                    if(processor.getProcessorID().equals(fetchSingleProcessorResults))
                    {
                        simpleResults.add(processor);
                        break;
                    }
                }
                
                requestParamsCopy.setProcessors(simpleResults);
                requestParams = requestParamsCopy;
            }
            
            // build a result response from the request params result set
            if(!verbose)
            {
                RequestParameters requestParamsCopy = new RequestParameters(requestParams);
                
                // trim out some of the params to simplify the result
                @SuppressWarnings("rawtypes")
                List<Processor> simpleResults = new ArrayList<Processor>();
                
                for(@SuppressWarnings("rawtypes") Processor processor : requestParams.getProcessors())
                {
                    FeatureProcessor simpleProc = processor.getSimpleResults();
                    
                    if(noGeometry) simpleProc.getOutputNodes().clear();
                    
                    simpleResults.add(simpleProc);
                }
                
                requestParamsCopy.setProcessors(simpleResults);
                requestParams = requestParamsCopy;
            }
            
            if(fetchSingleProcessorResults != null && fetchGeometryOnly)
            {
                String geomString = "{\"type\": \"FeatureCollection\", \"features\": [";

                Envelope envelope = null;
                if(bbox != null)
                {
                    try
                    {
                        envelope = new Envelope(Double.parseDouble(bbox.split(",")[0].trim()), Double.parseDouble(bbox.split(",")[1].trim()), Double.parseDouble(bbox.split(",")[2].trim()), Double.parseDouble(bbox.split(",")[3].trim()));
                    }
                    catch(Exception e)
                    {
                        logger.error("Invalid bbox parameters (" + bbox + "): " + e.getMessage());
                    }
                }
                
                for(@SuppressWarnings("rawtypes") Processor processor : requestParams.getProcessors())
                {
                    // we should only have one at this point
                    for(Object keyObj : processor.getOutputNodes().keySet())
                    {
                        String key = keyObj.toString();
                        if(outputNode == null || (outputNode != null && key.equals(outputNode)))
                        {
                            List<UUID> results = (List<UUID>) processor.getOutputNodes().get(key);
                            for(UUID featureId : results)
                            {
                                Feature feature = vtsController.getFeature(featureId);
                                if(envelope != null)
                                {
                                    Geometry geom = feature.getAsGeometryObject();
                                    Envelope internalEnv = geom.getEnvelopeInternal();
                                    if(envelope.intersection(internalEnv) != null)
                                    {
                                        JsonNode geomNode = feature.getGeometry();
                                        geomString += "{\"type\": \"Feature\", \"geometry\": " + geomNode.toString() + ", \"properties\":{";
                                        
                                        if(feature.getAttributes() != null && feature.getAttributes().size() > 0)
                                        {
                                            for(Attribute attribute : feature.getAttributes())
                                            {
                                                String attVal = attribute.getValue();
                                                geomString += "\"" + attribute.getName() + "\": \"" + (attVal != null ? attVal.replace("\\", "\\\\") : "") + "\",";
                                            }
                                            if(geomString.endsWith(",")) geomString = geomString.substring(0, geomString.length() - 1);
                                        }
                                        
                                        geomString += "}},";
                                    }
                                }
                                else
                                {
                                    JsonNode geomNode = feature.getGeometry();
                                    geomString += "{\"type\": \"Feature\", \"geometry\": " + geomNode.toString() + ", \"properties\":{";
                                    
                                    if(feature.getAttributes() != null && feature.getAttributes().size() > 0)
                                    {
                                        for(Attribute attribute : feature.getAttributes())
                                        {
                                            String attVal = attribute.getValue();
                                            geomString += "\"" + attribute.getName() + "\": \"" + (attVal != null ? attVal.replace("\\", "\\\\") : "") + "\",";
                                        }
                                        if(geomString.endsWith(",")) geomString = geomString.substring(0, geomString.length() - 1);
                                    }
                                    
                                    geomString += "}},";
                                }
                            }
                        }
                    }
                }
                
                if(geomString.endsWith(",")) geomString = geomString.substring(0, geomString.length() - 1);
                geomString += "]}";
                
                System.out.println(geomString);
                
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.readValue(geomString, JsonNode.class), HttpStatus.OK);
            }
            else
            {
                result = new ResponseEntity<JsonNode>(jsonObjectMapper.convertValue(requestParams, JsonNode.class), HttpStatus.OK);
            }
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
    
    @DeleteMapping(value = "/TopologyProcess/{id}")
    @ResponseBody
    public ResponseEntity<JsonNode> delete(@PathVariable String id) throws IOException 
    {
        logger.debug(" >> delete()");
        ResponseEntity<JsonNode> result = null;
        
        try
        {
            logger.debug("    Deleting process result...");

            boolean isDeleted = vtsController.deleteRequest(UUID.fromString(id));
            
            String message = "{ \"requestId\": \"" + id + "\", \"deleted\": " + Boolean.toString(isDeleted) + " }";
            
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
}
