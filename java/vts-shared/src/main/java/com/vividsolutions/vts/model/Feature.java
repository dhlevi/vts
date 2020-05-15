package com.vividsolutions.vts.model;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.ektorp.support.CouchDbDocument;

import com.bedatadriven.jackson.datatype.jts.JtsModule;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.geojson.GeoJsonReader;
import com.vividsolutions.jts.io.geojson.GeoJsonWriter;

public class Feature extends CouchDbDocument
{
    private static final long serialVersionUID = 428124884200690818L;
    
    private UUID geometryID;
    private Integer processorID;
    private String node;
    private JsonNode geometry;
    private List<Attribute> attributes;
    private String crs;
    
    public Feature()
    {
        
    }
    
    public Feature(Feature copy)
    {
        geometry = copy.getGeometry().deepCopy();
        attributes = copy.cloneAttributes();
        crs = copy.getCrs();
    }
    
    public Feature(Integer processorId, String node, Feature copy)
    {
        geometryID = UUID.randomUUID();
        processorID = processorId;
        this.node = node;
        geometry = copy.getGeometry().deepCopy();
        attributes = copy.cloneAttributes();
        crs = copy.getCrs();
    }
    
    public JsonNode getGeometry()
    {
        return geometry;
    }

    public void setGeometry(JsonNode geometry)
    {
        this.geometry = geometry;
    }

    @JsonIgnore
    public Geometry getAsGeometryObject() throws ParseException
    {
        // problematic if this method returns null, so always force to an empty geometry. We may not know the type if geom json is also null
        GeometryFactory factory = new GeometryFactory();
        Geometry parsedGeom = factory.createPolygon(new Coordinate[0]);
        
        if(getGeometry() != null)
        {
            GeoJsonReader jsonReader = new GeoJsonReader();
            
            try
            {
                String geomString = getGeometry().toString();
                System.out.println(geomString);
                
                // check for empty coordinates. If the geometry is empty, skip the parse (it will blow up hard on empty coord arrays)
                
                boolean containsEmptyCoords = geomString.contains("\"coordinates\":[]");
                
                if(!containsEmptyCoords)
                {
                    parsedGeom = jsonReader.read(getGeometry().toString()); // can result in java.lang.NoSuchMethodError from GeoJsonReader.createPolygon????
                }
                else
                {
                    System.out.println("Empty geomString cannot be parsed by JTS");
                    
                    // recreate parsedGeom = factory.createPolygon(new Coordinate[0]); by the geojson type, if available
                }
            }
            catch(Exception e)
            {
                // Note that this will kill the executing thread in a runnable. May need to change to use callable?
                System.out.println(e.getMessage());
                e.printStackTrace();
                throw e;
            }
        }
        return parsedGeom;
    }
    
    @JsonIgnore
    public void setFromGeometryObject(Geometry geometry) throws JsonParseException, JsonMappingException, IOException
    {
        if(geometry != null)
        {
            GeoJsonWriter jsonWriter = new GeoJsonWriter();
            String geomString = jsonWriter.write(geometry);
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JtsModule());
    
            this.geometry = mapper.readValue(geomString, JsonNode.class);
            
            crs = "EPSG:" + geometry.getSRID();
        }
    }
    
    @JsonIgnore
    public List<Attribute> cloneAttributes()
    {
        List<Attribute> results = new ArrayList<Attribute>();
        
        if(attributes != null)
        {
            for(Attribute attribute : attributes)
            {
                results.add(new Attribute(attribute));
            }
        }
        
        return results;
    }
    
    public List<Attribute> getAttributes()
    {
        if(attributes == null) attributes = new ArrayList<Attribute>();
        return attributes;
    }

    public void setAttributes(List<Attribute> attributes)
    {
        this.attributes = attributes;
    }

    public String getCrs()
    {
        if(this.getGeometry() != null && (crs == null ||(crs != null && crs.length() == 0))) 
        {
            try
            {
                crs = Integer.toString(getAsGeometryObject().getSRID());
            } 
            catch (ParseException e)
            {
                e.printStackTrace();
            }
        }
        if(!crs.toUpperCase().startsWith("EPSG:")) crs = "EPSG:" + crs;
        return crs;
    }

    public void setCrs(String crs)
    {
        if(!crs.toUpperCase().startsWith("EPSG:")) crs = "EPSG:" + crs;
        this.crs = crs;
    }

    public UUID getGeometryID()
    {
        return geometryID;
    }

    public void setGeometryID(UUID geometryID)
    {
        this.geometryID = geometryID;
    }

    public Integer getProcessorID()
    {
        return processorID;
    }

    public void setProcessorID(Integer processorID)
    {
        this.processorID = processorID;
    }

    public String getNode()
    {
        return node;
    }

    public void setNode(String node)
    {
        this.node = node;
    }
}
