package com.vividsolutions.vts.model.processors.io;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.Serializable;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geotools.data.DefaultTransaction;
import org.geotools.data.FeatureWriter;
import org.geotools.data.Transaction;
import org.geotools.data.collection.ListFeatureCollection;
import org.geotools.data.shapefile.ShapefileDataStore;
import org.geotools.data.shapefile.ShapefileDataStoreFactory;
import org.geotools.data.shapefile.files.BasicShpFileWriter;
import org.geotools.data.shapefile.files.ShpFileType;
import org.geotools.data.shapefile.files.ShpFiles;
import org.geotools.data.shapefile.shp.ShapeType;
import org.geotools.data.simple.SimpleFeatureIterator;
import org.geotools.data.simple.SimpleFeatureSource;
import org.geotools.data.simple.SimpleFeatureStore;
import org.geotools.factory.Hints;
import org.geotools.feature.DefaultFeatureCollections;
import org.geotools.feature.simple.SimpleFeatureBuilder;
import org.geotools.feature.simple.SimpleFeatureTypeBuilder;
import org.geotools.referencing.CRS;
import org.geotools.referencing.ReferencingFactoryFinder;
import org.opengis.referencing.crs.CRSAuthorityFactory;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.NoSuchAuthorityCodeException;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class ShapeFileWriter extends FeatureProcessor
{
    private static final long serialVersionUID = -3158764284008213368L;

    private static Log logger = LogFactory.getLog(ShapeFileWriter.class);
    
    private String destination;
    private File zipFile;
    private String fileName;
    
    public ShapeFileWriter()
    {
        super();
        
        this.setType(Processor.Type.SHAPEFILE_WRITER.toString());
        fileName = "newFile" + UUID.randomUUID().toString();
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) writeShapeFile();                
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
    
    private void writeShapeFile() throws ParseException, IOException, NoSuchAuthorityCodeException, FactoryException
    {
        logger.debug(" >> writeShapeFile()");
        
        // create db, shp. Write physical file to temp space
        // zip physical file. Result returns link where zip
        // can be downloaded from. 
        
        Feature defaults = getCouchDAO().getGeometry(getFeatures().get(0));
        
        if(defaults != null)
        {
            Geometry defGeom = defaults.getAsGeometryObject();
            
            ShapeType shapeType = ShapeType.UNDEFINED;
            
            if(defGeom.getGeometryType().toUpperCase().equals("POINT")) shapeType = ShapeType.POINT;
            else if(defGeom.getGeometryType().toUpperCase().equals("LINESTRING")) shapeType = ShapeType.ARC;
            else if(defGeom.getGeometryType().toUpperCase().equals("POLYGON")) shapeType = ShapeType.POLYGON;
            else if(defGeom.getGeometryType().toUpperCase().equals("MULTIPOINT")) shapeType = ShapeType.MULTIPOINT;
            else if(defGeom.getGeometryType().toUpperCase().equals("MULTILINESTRING")) shapeType = ShapeType.ARC;
            else if(defGeom.getGeometryType().toUpperCase().equals("MULTIPOLYGON")) shapeType = ShapeType.POLYGON;
            
            Path tempPath = Files.createTempDirectory(UUID.randomUUID().toString());
            File shpFilePath = destination == null ? Files.createTempFile(tempPath, fileName, ".shp").toFile() : Files.createTempFile(Paths.get(destination), fileName, ".shp").toFile();
            File zipFilePath = Files.createTempFile(fileName, ".zip").toFile();
            
            ShpFiles shpFile = new ShpFiles(shpFilePath);
            
            buildShapeFile(defaults, shpFile, shapeType,  new BasicShpFileWriter("writer"));
    
            // copy shape file to destination, if it exists.
            /*if(this.destination != null)
            {
                try 
                {
                    FileUtils.copyDirectory(tempPath.toFile(), new File(destination));
                } 
                catch (IOException e) 
                {
                    logger.error("Failed to copy shape to destination " + destination + ". The directory could not be found");
                }
            }*/
            
            //create zip file for fetching via service
            try (FileOutputStream fos = new FileOutputStream(zipFilePath);
                 ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(fos))) 
            {
                zos.setLevel(9); //level of compression
    
                for (File file : tempPath.toFile().listFiles()) 
                {
                    if (file.exists()) 
                    {
                        try (FileInputStream fis = new FileInputStream(file)) 
                        {
                            ZipEntry entry = new ZipEntry(file.getName());
                            zos.putNextEntry(entry);
                            
                            for (int c = fis.read(); c != -1; c = fis.read()) 
                            {
                                zos.write(c);
                            }
                            
                            zos.flush();
                        }
                    }
               }
           }
        
           zipFile = new File(zipFilePath.toString());
        
           if (!zipFile.exists()) 
           {
               throw new FileNotFoundException("The created zip file could not be found");
           }
       
        }
        logger.debug(" << writeShapeFile()");
    }

    @SuppressWarnings("deprecation")
    private void buildShapeFile(Feature defaults, ShpFiles shpFile, ShapeType shapeType, BasicShpFileWriter writer) throws NoSuchAuthorityCodeException, FactoryException, ParseException, IOException
    {
        // Define the shapefile
        // grab the first thing on the list. If these are not consistent, the process will fail.
        Geometry defGeom = defaults.getAsGeometryObject();
        
        Hints hints = new Hints(Hints.FORCE_LONGITUDE_FIRST_AXIS_ORDER, Boolean.TRUE);
        CRSAuthorityFactory factory = ReferencingFactoryFinder.getCRSAuthorityFactory("EPSG", hints);
        
        CoordinateReferenceSystem crs = null;
        if(defaults.getCrs().endsWith("3005")) crs = CRS.parseWKT(BCALBERS_WKT);
        else crs = factory.createCoordinateReferenceSystem(defaults.getCrs());
        
        SimpleFeatureTypeBuilder builder = new SimpleFeatureTypeBuilder();
        builder.setName("SHAPE");
        builder.setCRS(crs);

        builder.add("the_geom", defGeom.getClass());
        
        for(Attribute attribute : defaults.getAttributes())
        {
            int length = attribute.getLength() <= 0 ? 256 : attribute.getLength();
                    
            if(attribute.getDataType().equals(DataType.geometry)) { /* ignore geometry */ }
            else if(attribute.getDataType().equals(DataType.number)) builder.add(attribute.getName(), attribute.getTypedValue().getClass());
            else if(attribute.getDataType().equals(DataType.date)) builder.add(attribute.getName(), attribute.getTypedValue().getClass());
            else if(attribute.getDataType().equals(DataType.bool)) builder.add(attribute.getName(), attribute.getTypedValue().getClass());
            else builder.length(length).add(attribute.getName(), String.class);
        }

        SimpleFeatureType shpFeatureType = builder.buildFeatureType();
        
        // create feature collection
        ListFeatureCollection collection = new ListFeatureCollection(DefaultFeatureCollections.newCollection());
        SimpleFeatureBuilder featureBuilder = new SimpleFeatureBuilder(shpFeatureType);

        for(UUID featureId : getFeatures())
        {
            Feature feature = getCouchDAO().getGeometry(featureId);
            
            if(feature != null)
            {
                featureBuilder.add(feature.getAsGeometryObject());
                
                for(Attribute attribute : feature.getAttributes())
                {
                    if(attribute.getDataType() == DataType.geometry) { /* ignore */ }
                    else featureBuilder.add(attribute.getTypedValue());
                }
                
                SimpleFeature shpFeature = featureBuilder.buildFeature(null);
                collection.add(shpFeature);
            }
        }
        
        /*
         * Get an output file name and create the new shapefile
         */
        File newFile = shpFile.acquireWriteFile(ShpFileType.SHP, writer);

        ShapefileDataStoreFactory dataStoreFactory = new ShapefileDataStoreFactory();

        Map<String, Serializable> params = new HashMap<String, Serializable>();
        params.put("url", newFile.toURI().toURL());
        params.put("create spatial index", Boolean.TRUE);

        ShapefileDataStore newDataStore = (ShapefileDataStore) dataStoreFactory.createNewDataStore(params);
        newDataStore.createSchema(shpFeatureType);
        
        /*
         * Write the features to the shapefile
         */
        Transaction transaction = new DefaultTransaction();

        String typeName = newDataStore.getTypeNames()[0];
        SimpleFeatureSource featureSource = newDataStore.getFeatureSource(typeName);

        if (featureSource instanceof SimpleFeatureStore) 
        {
            SimpleFeatureStore featureStore = (SimpleFeatureStore) featureSource;
            featureStore.setTransaction(transaction);
            
            try 
            {
                featureStore.addFeatures(collection);
                
                transaction.commit();
            } 
            catch (Exception e) 
            {
                e.printStackTrace();
                transaction.rollback();
            }
            finally 
            {
                transaction.close();
            }
        } 
        else 
        {
            logger.debug(typeName + " does not support read/write access");
        }
    }

    public String getFileName()
    {
        return fileName;
    }

    public void setFileName(String fileName)
    {
        this.fileName = fileName;
    }

    public String getDestination()
    {
        return destination;
    }

    public void setDestination(String destination)
    {
        this.destination = destination;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        ShapeFileWriter copy = new ShapeFileWriter();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(new ArrayList<UUID>());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
    
    /*private static final String WGS84_WKT = "GEOGCS[" + "\"WGS 84\"," + "  DATUM[" + "    \"WGS_1984\","
            + "    SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],"
            + "    TOWGS84[0,0,0,0,0,0,0]," + "    AUTHORITY[\"EPSG\",\"6326\"]],"
            + "  PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],"
            + "  UNIT[\"DMSH\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9108\"]],"
            + "  AXIS[\"Lat\",NORTH]," + "  AXIS[\"Long\",EAST],"
            + "  AUTHORITY[\"EPSG\",\"4326\"]]";*/
    
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
}
