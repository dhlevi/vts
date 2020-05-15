package com.vividsolutions.vts.model.processors.io;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.bedatadriven.jackson.datatype.jts.JtsModule;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.geojson.GeoJsonReader;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class JsonReader extends FeatureProcessor
{
    private static final long serialVersionUID = 3408477069845455244L;

    private static Log logger = LogFactory.getLog(JsonReader.class);
    
    private boolean deleteAfterRead;
    private String path;
    
    public JsonReader()
    {
        super();
        this.setType(Processor.Type.JSON_READER.toString());
    }
    
    @Override
    public boolean process() throws FileNotFoundException, IOException
    {
        if(!isProcessed())
        {
            connect();
            this.setProcessed(true);
        }
        
        return true;
    }

    @SuppressWarnings("rawtypes")
    @Override
    public boolean process(List<Processor> parentProcesses, CouchDAO couchDAO) throws Exception
    {
        boolean initProcess = super.process(parentProcesses, couchDAO);
        return process() && initProcess;
    }

    public void connect() throws FileNotFoundException, IOException
    {
        logger.debug(" >> connect()");
        
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JtsModule());
        
        JsonNode json = null;
        try(InputStream fileStream = new FileInputStream(path))
        {
            json = mapper.readValue(fileStream, JsonNode.class);
        }

        if(json.isArray())
        {
            for(JsonNode node : json)
            {
                Feature feature = processNode(node);
                if(feature != null) 
                {
                    getCouchDAO().createResource(feature);
                    getOutputNodes().get(FEATURES).add(feature.getGeometryID());
                }
            }
        }
        else
        {
            Feature feature = processNode(json);
            if(feature != null) 
            {
                getCouchDAO().createResource(feature);
                getOutputNodes().get(FEATURES).add(feature.getGeometryID());
            }
        }
        
        if(deleteAfterRead)
        {
            File file = new File(path); 
            
            if(!file.delete()) 
            {
                logger.error("Source file at " + path + " could not be deleted.");
                this.getMessages().add("Source file at " + path + " could not be deleted.");
            }
        }
        
        logger.debug(" << connect()");
    }

    private Feature processNode(JsonNode node) throws JsonParseException, JsonMappingException, IOException
    {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JtsModule());
        
        Feature feature = null;
        
        try
        {
            feature = mapper.readValue(node.toString(), Feature.class);
        }
        catch(Exception e)
        {
            logger.info("JSON Reader could not read record as a Feature. Attempting to read as GeoJSON");
            // not a defined Feature. Try to see if it's geojson
            
            try
            {
                GeoJsonReader jsonReader = new GeoJsonReader();
                Geometry parsedGeom = jsonReader.read(node.toString());

                feature = new Feature();
                feature.setGeometryID(UUID.randomUUID());
                feature.setNode(FEATURES);
                feature.setProcessorID(getProcessorID());
                feature.setFromGeometryObject(parsedGeom);
            }
            catch(Exception ie)
            {
                // Can't parse, so this is a null feature.
                // we can ignore the error and include an empty feature
                logger.info("JSON Reader could not read record as a GeoJSON. Feature ignored.");
                
                feature = null;
            }
        }
        
        return feature;
    }
    
    public String getPath()
    {
        return path;
    }

    public void setPath(String path)
    {
        this.path = path;
    }

    public boolean isDeleteAfterRead()
    {
        return deleteAfterRead;
    }

    public void setDeleteAfterRead(boolean deleteAfterRead)
    {
        this.deleteAfterRead = deleteAfterRead;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        JsonReader copy = new JsonReader();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
