package com.vividsolutions.vts.model.processors.io;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geotools.geometry.jts.JTS;
import org.geotools.referencing.CRS;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.operation.MathTransform;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.CoordinateFilter;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.kml.KMLWriter;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class KmlWriter extends FeatureProcessor
{
    private static final long serialVersionUID = 6613879584336100091L;

    private static Log logger = LogFactory.getLog(JsonReader.class);

    private String destination;
    private File zipFile;
    private String fileName;
    private String style;
    
    public KmlWriter()
    {
        super();
        this.setType(Processor.Type.KML_WRITER.toString());
    }
    
    @Override
    public boolean process() throws ParseException, FactoryException, FileNotFoundException
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) createKmlFile();
            this.setProcessed(true);
        }
        
        return true;
    }

    @SuppressWarnings({ "rawtypes" })
    @Override
    public boolean process(List<Processor> parentProcesses, CouchDAO couchDAO) throws Exception
    {
        boolean initProcess = super.process(parentProcesses, couchDAO);
        return process() && initProcess;
    }
    
    public void createKmlFile() throws ParseException, FactoryException, FileNotFoundException
    {
        logger.debug(" >> createKmlFile()");

        CoordinateReferenceSystem targetCRS = CRS.parseWKT(WGS84_WKT);
        
        List<String> kmlSnippets = new ArrayList<String>();
        for(UUID featureId : getFeatures())
        {
            Feature feature = getCouchDAO().getGeometry(featureId);
            
            Geometry geom = null;
            
            try
            {
                geom = feature.getAsGeometryObject();
            }
            catch(ParseException e)
            {
                logger.debug(" ### empty or invalid geometry found. KMLWriter will skip this feature");
            }
            catch(Exception e)
            {
                logger.debug(" ### Error: " + e.getMessage());
                e.printStackTrace();
            }
            
            // If geometry is null, we can skip most of this
            
            if(geom != null)
            {
                //reproject if needed
                try
                {
                    CoordinateReferenceSystem sourceCRS = null;
                    
                    if(geom.getSRID() == 3005) 
                    {
                        sourceCRS = CRS.parseWKT(BCALBERS_WKT);
                    }
                    else sourceCRS = CRS.decode("EPSG:" + geom.getSRID());
                    
                    MathTransform transform = CRS.findMathTransform(sourceCRS, targetCRS, true);
                    
                    geom = JTS.transform(geom, transform);
                    
                    if(geom.getSRID() == 3005) geom.apply(new InvertCoordinateFilter());
                }
                catch(Exception e)
                {
                    // failed to project. Default to WGS84
                }
                
                String snippet = "<Placemark><styleUrl>#defaultStyle</styleUrl><description><![CDATA[]]></description>";
                
                KMLWriter writer = new KMLWriter();
    
                snippet += writer.write(geom);
                
                snippet += "<ExtendedData>";
                
                for(Attribute attribute : feature.getAttributes())
                {
                    snippet += "<Data name=\"" + attribute.getName() + "\"><displayName>" + attribute.getAlias() + "</displayName><value>" + attribute.getValue() + "</value></Data>";
                }
                
                snippet += "</ExtendedData></Placemark>";
                
                kmlSnippets.add(snippet);
            }
        }
        
        String resultString = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><kml xmlns=\"http://www.opengis.net/kml/2.2\" xmlns:gx=\"http://www.google.com/kml/ext/2.2\" xmlns:kml=\"http://www.opengis.net/kml/2.2\" xmlns:atom=\"http://www.w3.org/2005/Atom\"><Document>";
        
        //style
        resultString += "<Style id=\"defaultStyle\">" + style + "</Style>";
        
        for(String snippet : kmlSnippets)
        {
            resultString += snippet;    
        }
        
        resultString += "</Document></kml>";
        
        // write to destination
        if(!destination.endsWith("\\")) destination += "\\";
        if(fileName == null ||(fileName != null && fileName.length() == 0)) fileName = "newKmlFile";
        
        try (PrintWriter out = new PrintWriter(destination + fileName + ".kml")) {
            out.println(resultString);
        }
        
        logger.debug(" << createKmlFile()");
    }

    public String getDestination()
    {
        return destination;
    }

    public void setDestination(String destination)
    {
        this.destination = destination;
    }

    public File getZipFile()
    {
        return zipFile;
    }

    public void setZipFile(File zipFile)
    {
        this.zipFile = zipFile;
    }

    public String getFileName()
    {
        return fileName;
    }

    public void setFileName(String fileName)
    {
        this.fileName = fileName;
    }

    public String getStyle()
    {
        return style;
    }

    public void setStyle(String style)
    {
        this.style = style;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        KmlWriter copy = new KmlWriter();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
    
    private static final String WGS84_WKT = "GEOGCS[" + "\"WGS 84\"," + "  DATUM[" + "    \"WGS_1984\","
            + "    SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],"
            + "    TOWGS84[0,0,0,0,0,0,0]," + "    AUTHORITY[\"EPSG\",\"6326\"]],"
            + "  PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],"
            + "  UNIT[\"DMSH\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9108\"]],"
            + "  AXIS[\"Lat\",NORTH]," + "  AXIS[\"Long\",EAST],"
            + "  AUTHORITY[\"EPSG\",\"4326\"]]";
    
    private static final String BCALBERS_WKT = "PROJCS[\"NAD83 / BC Albers\","
            + "GEOGCS[\"NAD83\", "
            + "  DATUM[\"North_American_Datum_1983\", "
            + "    SPHEROID[\"GRS 1980\", 6378137.0, 298.257222101, AUTHORITY[\"EPSG\",\"7019\"]], "
            + "    TOWGS84[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], "
            + "    AUTHORITY[\"EPSG\",\"6269\"]], "
            + "  PRIMEM[\"Greenwich\", 0.0, AUTHORITY[\"EPSG\",\"8901\"]], "
            + "  UNIT[\"degree\", 0.017453292519943295], "
            + "  AXIS[\"Lon\", EAST], "
            + "  AXIS[\"Lat\", NORTH], "
            + "  AUTHORITY[\"EPSG\",\"4269\"]], "
            + "PROJECTION[\"Albers_Conic_Equal_Area\"], "
            + "PARAMETER[\"central_meridian\", -126.0], "
            + "PARAMETER[\"latitude_of_origin\", 45.0], "
            + "PARAMETER[\"standard_parallel_1\", 50.0], "
            + "PARAMETER[\"false_easting\", 1000000.0], "
            + "PARAMETER[\"false_northing\", 0.0], "
            + "PARAMETER[\"standard_parallel_2\", 58.5], "
            + "UNIT[\"m\", 1.0], "
            + "AXIS[\"x\", EAST], "
            + "AXIS[\"y\", NORTH], "
            + "AUTHORITY[\"EPSG\",\"3005\"]]";
    
    private static class InvertCoordinateFilter implements CoordinateFilter 
    {
        public void filter(Coordinate coord) 
        {
            double oldX = coord.x;
            coord.x = coord.y;
            coord.y = oldX;
        }
    }
}
