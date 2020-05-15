package com.vividsolutions.vts.model.processors.io;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geotools.data.shapefile.dbf.DbaseFileHeader;
import org.geotools.data.shapefile.dbf.DbaseFileReader;
import org.geotools.data.shapefile.dbf.DbaseFileReader.Row;
import org.geotools.data.shapefile.files.ShpFiles;
import org.geotools.data.shapefile.shp.ShapefileException;
import org.geotools.data.shapefile.shp.ShapefileReader;
import org.geotools.data.shapefile.shp.ShapefileReader.Record;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class ShapeFileReader extends FeatureProcessor
{
    private static final long serialVersionUID = 2279453594409676865L;

    private static Log logger = LogFactory.getLog(ShapeFileReader.class);
    
    private boolean deleteAfterRead;
    private String path;
    
    public ShapeFileReader()
    {
        super();
        this.setType(Processor.Type.SHAPEFILE_READER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {
            if(path == null ||(path != null && path.length() < 5))
            {
                throw new Exception("Shapefile Path is Invalid, cannot process");
            }
            
            readShapeFile();
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
    
    private void readShapeFile() throws ParseException, ShapefileException, IOException
    {
        logger.debug(" >> readShapeFile()");

        ShpFiles shpFile = new ShpFiles(path);
        
        GeometryFactory geometryFactory = new GeometryFactory();
        
        DbaseFileReader dbReader = new DbaseFileReader(shpFile, true, Charset.defaultCharset());
        ShapefileReader shapeReader = new ShapefileReader(shpFile, false, true, geometryFactory);
        
        DbaseFileHeader dbHeader = dbReader.getHeader();
        
        while(shapeReader.hasNext())
        {
            Record record = shapeReader.nextRecord();
            
            Geometry geom = (Geometry) record.shape();
            
            Feature newFeature = new Feature();

            newFeature.setGeometryID(UUID.randomUUID());
            newFeature.setNode(FEATURES);
            newFeature.setProcessorID(getProcessorID());
            newFeature.setFromGeometryObject(geom);
         
            Row dbRecord = dbReader.readRow();
            
            for(int i = 0; i < dbHeader.getNumFields(); i++)
            {
                Object value = dbRecord.read(i);
                
                Attribute newAttribute = new Attribute();
                newAttribute.setValue(value.toString());
                newAttribute.setName(dbHeader.getFieldName(i));
                newAttribute.setAlias(dbHeader.getFieldName(i));
                newAttribute.setDisplayOrder(i);
                newAttribute.setDecimalPrecision(dbHeader.getFieldDecimalCount(i));
                
                char fieldType = dbHeader.getFieldType(i);

                if(fieldType == 'C') newAttribute.setDataType(DataType.string);
                else if(fieldType == 'N') newAttribute.setDataType(DataType.number);
                else if(fieldType == 'F') newAttribute.setDataType(DataType.number);
                else if(fieldType == 'L') newAttribute.setDataType(DataType.bool);
                else if(fieldType == 'D') newAttribute.setDataType(DataType.date);
                else if(fieldType == '@') newAttribute.setDataType(DataType.date);
                else newAttribute.setDataType(DataType.string);
                
                newFeature.getAttributes().add(newAttribute);
            }
            
            getCouchDAO().createResource(newFeature);
            
            getOutputNodes().get(FEATURES).add(newFeature.getGeometryID());
        }
        
        if(deleteAfterRead)
        {
            if(!shpFile.delete()) 
            {
                File file = new File(path);
                if(file.delete())
                {
                    logger.error("Source file at " + path + " could not be deleted.");
                    this.getMessages().add("Source file at " + path + " could not be deleted.");
                }
            }
        }
        
        logger.debug(" << readShapeFile()");
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
        ShapeFileReader copy = new ShapeFileReader();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setOutputNodes(this.getOutputNodes());
        
        return copy;
    }
}
