package com.vividsolutions.vts.model.processors.io;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Map.Entry;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.geojson.GeoJsonReader;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class KmlReader extends FeatureProcessor
{
    private static final long serialVersionUID = 7097779022344310156L;

    private static Log logger = LogFactory.getLog(JsonReader.class);
    
    private boolean deleteAfterRead;
    private String path;
    
    public KmlReader()
    {
        super();
        this.setType(Processor.Type.KML_READER.toString());
    }
    
    @Override
    public boolean process() throws FileNotFoundException, IOException, SAXException, ParserConfigurationException, ParseException
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

    public void connect() throws FileNotFoundException, IOException, SAXException, ParserConfigurationException, ParseException
    {
        logger.debug(" >> connect()");

        // doesn't like local paths (pukes on the ':' ?) C:\...\file.kml
        byte[] encoded = Files.readAllBytes(Paths.get(path));
        ObjectNode json = convertKmlDocument(encoded);
        
        // loop through everything in the feature collection
        JsonNode featureCollection = json.get("features");
        
        for(JsonNode node : featureCollection)
        {
            GeoJsonReader jsonReader = new GeoJsonReader();
            Geometry parsedGeom = jsonReader.read(node.get("geometry").toString());
    
            Feature feature = new Feature();
            feature.setGeometryID(UUID.randomUUID());
            feature.setNode(FEATURES);
            feature.setProcessorID(getProcessorID());
            feature.setFromGeometryObject(parsedGeom);
        
            JsonNode properties = node.get("properties");
            
            Iterator<Entry<String, JsonNode>> propertyNodes = properties.fields();

            int count = 0;
            while (propertyNodes.hasNext()) 
            {
                Map.Entry<String, JsonNode> entry = (Map.Entry<String, JsonNode>) propertyNodes.next();
                
                Attribute attribute = new Attribute();
                attribute.setName(entry.getKey());
                attribute.setAlias(entry.getKey());
                attribute.setDataType(DataType.string);
                attribute.setValue(entry.getValue().textValue());
                attribute.setDisplayOrder(count);
                
                feature.getAttributes().add(attribute);
                
                count++;
            }
            
            getCouchDAO().createResource(feature);
            getOutputNodes().get(FEATURES).add(feature.getGeometryID());
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

    private static final String STYLE_URL = "styleUrl";
    private static final String TYPE = "type";
    private static final String FEATURE_COLLECTION = "FeatureCollection";
    private static final String PROPERTIES = "properties";
    private static final String GEOMETRY_CCOLLECTION = "GeometryCollection";
    private static final String GEOMETRIES = "geometries";
    private static final String POINT = "Point";
    private static final String POLYGON = "Polygon";
    private static final String LINESTRING = "LineString";
    private static final String DESCRIPTION = "description";
    private static final String COORDINATES = "coordinates";
    private static final String REPLACE_COORD_STRING = "\\r\\n|\\r|\\n";
    
    private static ObjectNode convertKmlDocument(byte[] document) throws SAXException, IOException, ParserConfigurationException
    {
        ObjectNode convertedJson = JsonNodeFactory.instance.objectNode();
        convertedJson.put(TYPE, FEATURE_COLLECTION);
        ArrayNode featureArray = convertedJson.putArray(FEATURES);
        
        logger.debug("Parsing KML xml from document...");
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        
        ByteArrayInputStream docStream = new ByteArrayInputStream(document);
        
        Document doc = factory.newDocumentBuilder().parse(docStream);
        logger.debug("Successfully parsed KML doc. Looping through placemarks...");
        
        docStream.close();
        
        // Process the placemark geometry
        NodeList featureNodes = doc.getElementsByTagName("Placemark");
        
        if (featureNodes != null)
        {
            for (int featureIndex = 0; featureIndex < featureNodes.getLength(); featureIndex++)
            {
                if (featureNodes.item(featureIndex).getNodeType() == Node.ELEMENT_NODE)
                {
                    processKmlFeatureNode((Element)featureNodes.item(featureIndex), featureArray);
                }
            }
        }
        
        // Now that the json object is built, convert it to bytes and send back
        return convertedJson;
    }
    
    private static void processKmlFeatureNode(Element feature, ArrayNode featureArray)
    {
        ObjectNode featureJson = featureArray.addObject();
        
        featureJson.put(TYPE, "Feature");
        ObjectNode jsonProperties = featureJson.putObject(PROPERTIES);
        
        // add the style ID as a property
        try
        {
            jsonProperties.put(STYLE_URL, feature.getElementsByTagName(STYLE_URL).item(0).getTextContent());
        }
        catch(Exception e)
        {
            // style not found. We can ignore this
        }
        
        // determine geometry type
        ObjectNode geometryObject = featureJson.putObject("geometry");
        
        NodeList geoms = null;
        
        geoms = feature.getElementsByTagName("MultiGeometry");
        if(geoms != null && geoms.getLength() > 0)
        {
            // we have a multigeom section
            processKmlMultiGeometry(geometryObject, geoms);
        }
        else
        {
            // process a single geometry
            processKmlSingleGeometry(geometryObject, feature);
        }
        
        // fetch DESCRIPTION attribute
        if(feature.getElementsByTagName(DESCRIPTION).getLength() != 0)
        {
            String description = feature.getElementsByTagName(DESCRIPTION).item(0).getTextContent();
            jsonProperties.put(DESCRIPTION, description);
        }
        
        // read ExtendedData properties, if they exist
        if(feature.getElementsByTagName("ExtendedData").getLength() != 0)
        {
            HashMap<String, String> attributeData = new HashMap<String, String>();
            
            NodeList attributes = feature.getElementsByTagName("ExtendedData").item(0).getChildNodes();
            for (int attrIndex = 0; attrIndex < attributes.getLength(); attrIndex++)
            {
                if (attributes.item(attrIndex).getNodeType() == Node.ELEMENT_NODE)
                {
                    processKmlExtendedData((Element) attributes.item(attrIndex), attributeData);
                }
            }
            
            // go through attribute final list and create properties
            for (Map.Entry<String, String> entry : attributeData.entrySet()) 
            {
                jsonProperties.put(entry.getKey(), entry.getValue());
            }
        }
    }
    
    private static void processKmlExtendedData(Element attribute, HashMap<String, String> attributeData)
    {
        if(attribute.getTagName().equals("Data"))
        {
            try
            {
                // We now have a Data tag. read the name
                String attrName = attribute.getAttribute("name");
                // check if there is a displayName tag. If so, Use that instead
                if(attribute.getElementsByTagName("displayName").getLength() != 0)
                {
                    attrName = attribute.getElementsByTagName("displayName").item(0).getTextContent();
                }
                
                // clean the attrName to get rid of spaces. They aren't allowed in the Json
                attrName = attrName.replace(" ", "-");
                
                // now get the value
                String attrVal = attribute.getElementsByTagName("value").item(0).getTextContent();
                
                // if the KML contains more than one of the same attribute name (invalid!)
                // this will silently overwrite it.
                if(attrName != null && attrName.length() > 0) attributeData.put(attrName, attrVal);
            }
            catch(Exception e)
            {
                // Likely the doc is invalid here, but we don't really want to stop checking.
                logger.debug("Invalid attribute in KML!");
            }
        }
    }
    
    private static void processKmlSingleGeometry(ObjectNode geometryObject, Element feature)
    {
        NodeList geoms = null;
        
        geoms = feature.getElementsByTagName(POINT);
        if(geoms != null && geoms.getLength() > 0) processKmlGeometryObject(geometryObject, geoms, POINT);
        
        geoms = feature.getElementsByTagName(POLYGON);
        if(geoms != null && geoms.getLength() > 0) processKmlGeometryObject(geometryObject, geoms, POLYGON);
        
        geoms = feature.getElementsByTagName(LINESTRING);
        if(geoms != null && geoms.getLength() > 0) processKmlGeometryObject(geometryObject, geoms, LINESTRING);
    }
    
    private static void processKmlMultiGeometry(ObjectNode geometryObject, NodeList geoms)
    {
        geometryObject.put(TYPE, GEOMETRY_CCOLLECTION);
        ArrayNode multiGeoms = geometryObject.putArray(GEOMETRIES);
        
        for(int geomIndex = 0; geomIndex < geoms.getLength(); geomIndex++)
        {
            if(geoms.item(geomIndex).getNodeType() == Node.ELEMENT_NODE)
            {
                Element innerFeature = (Element) geoms.item(geomIndex); 
                ObjectNode innerGeomObject = multiGeoms.addObject();
                
                processKmlSingleGeometry(innerGeomObject, innerFeature);
            }
        }
    }
    
    private static void processKmlLinestring(ObjectNode geometryObject, NodeList geoms)
    {
        geometryObject.put(TYPE, LINESTRING);
        ArrayNode coords = geometryObject.putArray(COORDINATES);
        
        //each coord pair is an array added to coordGroups
        String kmlCoords = geoms.item(0).getFirstChild().getNextSibling().getTextContent().trim().replaceAll(REPLACE_COORD_STRING, " ");
        for(String coord : kmlCoords.split(" "))
        {
            ArrayNode innerCoordArray = coords.addArray();
            innerCoordArray.add(new BigDecimal(coord.split(",")[0])); //x
            innerCoordArray.add(new BigDecimal(coord.split(",")[1])); //y
            //innerCoordArray.add(new BigDecimal(coord.split(",")[2])); //z
        }
    }
    
    private static void processKmlPolygon(Element ring, ArrayNode coordGroups)
    {
        //find all outer boundaries
        NodeList outerRings = ring.getElementsByTagName("outerBoundaryIs");
        NodeList innerRings = ring.getElementsByTagName("innerBoundaryIs");
        
        for(int index = 0; index < outerRings.getLength(); index++)
        {
            if (outerRings.item(index).getNodeType() == Node.ELEMENT_NODE)
            {
                Element outerRing = (Element) outerRings.item(index);
                
                ArrayNode innerCoordArray = coordGroups.addArray();
                
                // ring.Boundary.LinearRing.coordinates
                String kmlCoords = outerRing.getFirstChild().getFirstChild().getFirstChild().getTextContent().trim().replaceAll(REPLACE_COORD_STRING, " ");
                for(String coord : kmlCoords.split(" "))
                {
                    ArrayNode polyCoordArray = innerCoordArray.addArray();
                    polyCoordArray.add(new BigDecimal(coord.split(",")[0])); //x
                    polyCoordArray.add(new BigDecimal(coord.split(",")[1])); //y
                    //innerCoordArray.add(new BigDecimal(coord.split(",")[2])); //z
                }
            }
        }
        
        for(int index = 0; index < innerRings.getLength(); index++)
        {
            if (innerRings.item(index).getNodeType() == Node.ELEMENT_NODE)
            {
                Element innerRing = (Element) innerRings.item(index);
                
                ArrayNode innerCoordArray = coordGroups.addArray();
                
                // ring.Boundary.LinearRing.coordinates
                String kmlCoords = innerRing.getFirstChild().getFirstChild().getFirstChild().getTextContent().trim().replaceAll(REPLACE_COORD_STRING, " ");
                for(String coord : kmlCoords.split(" "))
                {
                    ArrayNode polyCoordArray = innerCoordArray.addArray();
                    polyCoordArray.add(new BigDecimal(coord.split(",")[0])); //x
                    polyCoordArray.add(new BigDecimal(coord.split(",")[1])); //y
                    //innerCoordArray.add(new BigDecimal(coord.split(",")[2])); //z
                }
            }
        }
    }
    
    private static void processKmlPoint(ObjectNode geometryObject, NodeList geoms)
    {
        geometryObject.put(TYPE, POINT);
        ArrayNode coords = geometryObject.putArray(COORDINATES);
        
        String kmlCoords = geoms.item(0).getFirstChild().getNextSibling().getTextContent().trim().replaceAll(REPLACE_COORD_STRING, " ");
        coords.add(new BigDecimal(kmlCoords.split(",")[0])); //x
        coords.add(new BigDecimal(kmlCoords.split(",")[1])); //y
        //coords.add(new BigDecimal(kmlCoords.split(",")[2])); //z
    }
    
    private static void processKmlGeometryObject(ObjectNode geometryObject, NodeList geoms, String type)
    {
        if(type.equals(POINT))
        {
            processKmlPoint(geometryObject, geoms);
        }
        else if(type.equals(POLYGON))
        {
            geometryObject.put(TYPE, POLYGON);
            ArrayNode coordGroups = geometryObject.putArray(COORDINATES);
            // add the exterior ring
            for(int ringIndex = 0; ringIndex < geoms.getLength(); ringIndex++)
            {
                if (geoms.item(ringIndex).getNodeType() == Node.ELEMENT_NODE)
                {
                    processKmlPolygon((Element)geoms.item(ringIndex), coordGroups);
                }
            }
            // add any interior rings
        }
        else if(type.equals(LINESTRING))
        {
            processKmlLinestring(geometryObject, geoms);
        }
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
        KmlReader copy = new KmlReader();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
