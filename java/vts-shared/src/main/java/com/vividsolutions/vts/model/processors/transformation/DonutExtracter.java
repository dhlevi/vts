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

public class DonutExtracter  extends FeatureProcessor
{
    private static final long serialVersionUID = -2793655709177101849L;

    private static Log logger = LogFactory.getLog(DonutExtracter.class);

    public DonutExtracter()
    {
        super();
        this.setType(Processor.Type.DONUT_EXTRACTER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures() .size() > 0) fetchDonuts();
            
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

    private void fetchDonuts() throws ParseException, JsonParseException, JsonMappingException, IOException
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
                    
                    List<Geometry> donuts = new ArrayList<Geometry>();
                    
                    for(int i = 0; i < polygon.getNumInteriorRing(); i++)
                    {
                        LinearRing ring = (LinearRing) polygon.getInteriorRingN(i);
                        Geometry donut = factory.createPolygon(ring, null);
                        donuts.add(donut);
                    }
                    
                    if(donuts.size() == 1)
                    {
                        copy.setFromGeometryObject(donuts.get(0));
                    }
                    else
                    {
                        MultiPolygon multiPolygon = factory.createMultiPolygon(donuts.toArray(new Polygon[donuts.size()]));
                        copy.setFromGeometryObject(multiPolygon);
                    }
                }
                else if (geom instanceof MultiPolygon) 
                {
                    MultiPolygon mp = (MultiPolygon)geom;
                    Geometry allGeoms = null;
                    
                    for (int i = 0; i < mp.getNumGeometries(); i++) 
                    {
                        Polygon polygon = (Polygon)mp.getGeometryN(i);
    
                        List<Geometry> donuts = new ArrayList<Geometry>();
                        for(int j = 0; j < polygon.getNumInteriorRing(); j++)
                        {
                            LinearRing ring = (LinearRing) polygon.getInteriorRingN(j);
                            Geometry donut = factory.createPolygon(ring, null);
                            donuts.add(donut);
                        }
    
                        for(Geometry donutGeom : donuts)
                        {
                            if (allGeoms == null) allGeoms = donutGeom;
                            else  allGeoms = allGeoms.union(donutGeom);
                        }
                    }
                    
                    copy.setFromGeometryObject(allGeoms);
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
        DonutExtracter copy = new DonutExtracter();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(null);
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}