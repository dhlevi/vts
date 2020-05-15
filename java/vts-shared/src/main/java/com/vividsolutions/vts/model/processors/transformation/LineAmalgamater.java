package com.vividsolutions.vts.model.processors.transformation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiLineString;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.operation.linemerge.LineMerger;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class LineAmalgamater extends FeatureProcessor
{
    private static final long serialVersionUID = 1458289736180823550L;

    private static Log logger = LogFactory.getLog(LineAmalgamater.class);

    public LineAmalgamater()
    {
        super();
        this.setType(Processor.Type.LINE_AMALGAMATER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!this.isProcessed())
        {   
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) mergeFeatures();
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

    @SuppressWarnings("rawtypes")
    private void mergeFeatures() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        // needs to persist attributes
        // currently this will dissolve linestrings and destroy attribute lists.
        
        logger.debug(" >> mergeFeatures()");
        
        LineMerger merger = new LineMerger();
        List<LineString> lines = new ArrayList<LineString>();
        
        Feature defaultFeature = null;
        
        for(UUID featureId : getFeatures())
        {
            Feature feature = getCouchDAO().getGeometry(featureId);
            
            if(defaultFeature == null) defaultFeature = feature;
            
            Geometry featureGeom = feature.getAsGeometryObject();
            
            if(featureGeom instanceof LineString)
            {
                lines.add((LineString)featureGeom);
            }
            else if(featureGeom instanceof MultiLineString)
            {
                for(int i = 0; i < featureGeom.getNumGeometries(); i++)
                {
                    lines.add((LineString)featureGeom.getGeometryN(i));
                }
            }
        }
        
        merger.add(lines);
        Collection mergedLines = merger.getMergedLineStrings();
        lines = new ArrayList<LineString>();
        for(Object o : mergedLines)
        {
            lines.add((LineString)o);
        }
        
        LineString[] lineArray = lines.toArray(new LineString[lines.size()]);
        
        for(int i = 0; i < lineArray.length; i++)
        {
            Feature lineFeature = new Feature(getProcessorID(), FEATURES, defaultFeature);
            lineFeature.setFromGeometryObject(lineArray[i]);
            getCouchDAO().createResource(lineFeature);
            
            getOutputNodes().get(FEATURES).add(lineFeature.getGeometryID());
        }
        
        logger.debug(" << mergeFeatures()");
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        LineAmalgamater copy = new LineAmalgamater();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}