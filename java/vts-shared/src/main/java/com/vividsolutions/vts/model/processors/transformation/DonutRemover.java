package com.vividsolutions.vts.model.processors.transformation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LinearRing;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

public class DonutRemover  extends FeatureProcessor
{
    private static final long serialVersionUID = -5483815904110789595L;

    private static Log logger = LogFactory.getLog(DonutRemover.class);

    public DonutRemover()
    {
        super();
        this.setType(Processor.Type.DONUT_REMOVER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) stripDonuts();
            
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

    private void stripDonuts() throws ParseException, JsonParseException, JsonMappingException, IOException
    {
        logger.debug(" >> stripDonuts()");
        
        getFeatures().parallelStream().forEach((featureId) -> 
        {
            try
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                
                Feature copy = new Feature(getProcessorID(), FEATURES, feature);
    
                Geometry geom = copy.getAsGeometryObject();
    
                GeometryFactory factory = geom.getFactory();
                        
                if (geom instanceof Polygon) 
                {
                    Polygon polygon = (Polygon)geom;
                    LinearRing ring = (LinearRing) polygon.getExteriorRing();
                    Geometry hull = factory.createPolygon(ring, null);
                    copy.setFromGeometryObject(hull);
                }
                else if (geom instanceof MultiPolygon) 
                {
                    MultiPolygon mp = (MultiPolygon)geom;
                    Geometry allGeoms = null;
                    
                    for (int i = 0; i < mp.getNumGeometries(); i++) 
                    {
                        Geometry child = mp.getGeometryN(i);
                        
                        Polygon polygon = (Polygon)child;
                        LinearRing ring = (LinearRing) polygon.getExteriorRing();
                        Geometry hull = factory.createPolygon(ring, null);
    
                        if (allGeoms == null) allGeoms = hull;
                        else  allGeoms = allGeoms.union(hull);
                    }
                }
                
                getCouchDAO().createResource(copy);
                getOutputNodes().get(FEATURES).add(copy.getGeometryID());
            }
            catch(Exception e)
            {
                logger.error(e.getMessage());
                throw new RuntimeException(e);
            }
        });
        
        logger.debug(" << stripDonuts()");
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        DonutRemover copy = new DonutRemover();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}