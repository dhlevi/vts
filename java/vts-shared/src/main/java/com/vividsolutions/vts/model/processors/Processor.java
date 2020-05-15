package com.vividsolutions.vts.model.processors;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.processors.io.JsonReader;
import com.vividsolutions.vts.model.processors.io.KmlReader;
import com.vividsolutions.vts.model.processors.io.KmlWriter;
import com.vividsolutions.vts.model.processors.io.OracleReader;
import com.vividsolutions.vts.model.processors.io.OracleWriter;
import com.vividsolutions.vts.model.processors.io.ShapeFileReader;
import com.vividsolutions.vts.model.processors.io.ShapeFileWriter;
import com.vividsolutions.vts.model.processors.measurement.AreaCalculator;
import com.vividsolutions.vts.model.processors.measurement.BoundingBox;
import com.vividsolutions.vts.model.processors.measurement.CenterOfMass;
import com.vividsolutions.vts.model.processors.measurement.Centroid;
import com.vividsolutions.vts.model.processors.measurement.LengthCalculator;
import com.vividsolutions.vts.model.processors.transformation.Aggregator;
import com.vividsolutions.vts.model.processors.transformation.AreaAmalgamater;
import com.vividsolutions.vts.model.processors.transformation.BufferFeature;
import com.vividsolutions.vts.model.processors.transformation.OverlayOperator;
import com.vividsolutions.vts.model.processors.transformation.PolygonCenterLine;
import com.vividsolutions.vts.model.processors.transformation.Projector;
import com.vividsolutions.vts.model.processors.transformation.Triangulator;
import com.vividsolutions.vts.model.processors.transformation.Voronoi;
import com.vividsolutions.vts.model.processors.transformation.ConvexHullCreator;
import com.vividsolutions.vts.model.processors.transformation.Deaggregator;
import com.vividsolutions.vts.model.processors.transformation.DonutExtracter;
import com.vividsolutions.vts.model.processors.transformation.DonutRemover;
import com.vividsolutions.vts.model.processors.transformation.FeatureSimplifier;
import com.vividsolutions.vts.model.processors.transformation.Force2D;
import com.vividsolutions.vts.model.processors.transformation.LineAmalgamater;
import com.vividsolutions.vts.model.processors.utility.AttributeCalculator;
import com.vividsolutions.vts.model.processors.utility.AttributeCreator;
import com.vividsolutions.vts.model.processors.utility.AttributeRemover;
import com.vividsolutions.vts.model.processors.utility.AttributeRenamer;
import com.vividsolutions.vts.model.processors.utility.ConditionalFilter;
import com.vividsolutions.vts.model.processors.utility.FeatureHolder;
import com.vividsolutions.vts.model.processors.utility.FeatureValidator;
import com.vividsolutions.vts.model.processors.utility.SpatialFilter;
import com.vividsolutions.vts.model.processors.utility.SpatialRelationFilter;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

@JsonTypeInfo
(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes
({
    @Type( name = "areaCalculator", value = AreaCalculator.class ),
    @Type( name = "lengthCalculator", value = LengthCalculator.class ),
    @Type( name = "convexHullCreator", value = ConvexHullCreator.class ),
    @Type( name = "bufferFeature", value = BufferFeature.class ),
    @Type( name = "bbox", value = BoundingBox.class ),
    @Type( name = "centroid", value = Centroid.class ),
    @Type( name = "centerOfMass", value = CenterOfMass.class ),
    @Type( name = "overlayOperator", value = OverlayOperator.class ),
    @Type( name = "aggregator", value = Aggregator.class ),
    @Type( name = "deaggregator", value = Deaggregator.class ),
    @Type( name = "featureSimplifier", value = FeatureSimplifier.class ),
    @Type( name = "featureValidator", value = FeatureValidator.class ),
    @Type( name = "attributeCreator", value = AttributeCreator.class ),
    @Type( name = "attributeRenamer", value = AttributeRenamer.class ),
    @Type( name = "attributeRemover", value = AttributeRemover.class ),
    @Type( name = "attributeCalculator", value = AttributeCalculator.class ),
    @Type( name = "oracleReader", value = OracleReader.class ),
    @Type( name = "oracleWriter", value = OracleWriter.class ),
    @Type( name = "spatialFilter", value = SpatialFilter.class ),
    @Type( name = "spatialRelationFilter", value = SpatialRelationFilter.class ),
    @Type( name = "conditionalFilter", value = ConditionalFilter.class ),
    @Type( name = "voronoi", value = Voronoi.class ),
    @Type( name = "triangulator", value = Triangulator.class ),
    @Type( name = "shapeFileReader", value = ShapeFileReader.class ),
    @Type( name = "shapeFileWriter", value = ShapeFileWriter.class ),
    @Type( name = "jsonReader", value = JsonReader.class ),
    @Type( name = "kmlReader", value = KmlReader.class ),
    @Type( name = "kmlWriter", value = KmlWriter.class ),
    @Type( name = "force2d", value = Force2D.class ),
    @Type( name = "donutRemover", value = DonutRemover.class ),
    @Type( name = "donutExtracter", value = DonutExtracter.class ),
    @Type( name = "areaAmalgamater", value = AreaAmalgamater.class ),
    @Type( name = "lineAmalgamater", value = LineAmalgamater.class ),
    @Type( name = "polygonCenterLine", value = PolygonCenterLine.class ),
    @Type( name = "projector", value = Projector.class ),
    @Type( name = "featureHolder", value = FeatureHolder.class )
})

@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class Processor<T> implements Serializable
{
    private static final long serialVersionUID = 3307679231075139932L;
 
    public enum Type {
        AREA_CALCULATOR( AreaCalculator.class ),
        LENGTH_CALCULATOR( LengthCalculator.class ),
        CONVEX_HULL_CREATOR( ConvexHullCreator.class ),
        BUFFER_FEATURE( BufferFeature.class ),
        BOUNDING_BOX( BoundingBox.class ),
        CENTROID( Centroid.class ),
        AGGREGATOR( Aggregator.class ),
        DEAGGREGATOR( Deaggregator.class ),
        OVERLAY_OPERATOR( OverlayOperator.class ),
        CENTER_OF_MASS( CenterOfMass.class ),
        FEATURE_SIMPLIFIER( FeatureSimplifier.class ),
        FEATURE_VALIDATOR( FeatureValidator.class ),
        ATTRIBUTE_CREATOR( AttributeCreator.class ),
        ATTRIBUTE_REMOVER( AttributeRemover.class ),
        ATTRIBUTE_RENAMER( AttributeRenamer.class ),
        ATTRIBUTE_CALCULATOR( AttributeCalculator.class ),
        ORACLE_READER( OracleReader.class ),
        ORACLE_WRITER( OracleWriter.class ),
        SPATIAL_FILTER( SpatialFilter.class ),
        SPATIAL_RELATION_FILTER( SpatialRelationFilter.class ),
        CONDITIONAL_FILTER( ConditionalFilter.class ),
        VORONOI( Voronoi.class ),
        TRIANGULATOR( Triangulator.class ),
        SHAPEFILE_READER( ShapeFileReader.class ),
        SHAPEFILE_WRITER( ShapeFileWriter.class ),
        JSON_READER( JsonReader.class ),
        KML_READER( KmlReader.class ),
        KML_WRITER( KmlWriter.class ),
        FORCE2D( Force2D.class ),
        DONUT_REMOVER( DonutRemover.class ),
        DONUT_EXTRACTER( DonutExtracter.class ),
        AREA_AMALGAMATER( AreaAmalgamater.class ),
        LINE_AMALGAMATER( LineAmalgamater.class ),
        POLYGON_CENTER_LINE( PolygonCenterLine.class ),
        PROJECTOR( Projector.class ),
        FEATURE_HOLDER( AreaCalculator.class );
        
        private final Class<?> processorClass;

        private Type( Class<?> c ) 
        {
            processorClass = c;
        }

        @SuppressWarnings("rawtypes")
        public Processor create() 
        {
            try 
            {
                //return (Processor)processorClass.getConstructor(null).newInstance();
                //return (Processor)processorClass.getConstructor(new Class[0]).newInstance();
                return (Processor)processorClass.getConstructor().newInstance();
            } 
            catch (Exception e) 
            {
                return null;
            }
        }
    };
    
    private boolean isProcessed;
    private Integer processorID;
    private String name;
    
    private Map<String, List<NodeMap>> inputNodes;
    private Map<String, List<UUID>> outputNodes;
    
    private String type;
    private List<String> messages;
    
    private Integer x;
    private Integer y;
    
    public static final String FEATURES = "features";
    
    public Processor()
    {
        this.getInputNodes().put(FEATURES, new ArrayList<NodeMap>(0));
        this.getOutputNodes().put(FEATURES, new ArrayList<UUID>(0));
    }

    @SuppressWarnings("rawtypes")
    public abstract boolean process(List<Processor> parentProcesses, CouchDAO couchDAO) throws Exception;
    public abstract boolean process() throws Exception;
    @JsonIgnore
    public abstract FeatureProcessor getSimpleResults();

    public Integer getProcessorID()
    {
        return processorID;
    }

    public void setProcessorID(Integer processorID)
    {
        this.processorID = processorID;
    }

    public boolean isProcessed()
    {
        return isProcessed;
    }

    public void setProcessed(boolean isProcessed)
    {
        this.isProcessed = isProcessed;
    }
    
    @JsonIgnore
    public String getType() {
        return type;
    }

    public void setType(String type)
    {
        this.type = type;
    }

    public List<String> getMessages()
    {
        if(messages == null) messages = new ArrayList<String>();
        return messages;
    }

    public void setMessages(List<String> messages)
    {
        this.messages = messages;
    }
    
    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }
    
    public Integer getX()
    {
        return x;
    }

    public void setX(Integer x)
    {
        this.x = x;
    }

    public Integer getY()
    {
        return y;
    }

    public void setY(Integer y)
    {
        this.y = y;
    }

    public Map<String, List<NodeMap>> getInputNodes()
    {
        if(inputNodes == null) inputNodes = new HashMap<String, List<NodeMap>>();
        return inputNodes;
    }

    public void setInputNodes(Map<String, List<NodeMap>> inputNodes)
    {
        this.inputNodes = inputNodes;
    }

    public Map<String, List<UUID>> getOutputNodes()
    {
        if(outputNodes == null) outputNodes = new HashMap<String, List<UUID>>();
        return outputNodes;
    }

    public void setOutputNodes(Map<String, List<UUID>> outputNodes)
    {
        this.outputNodes = outputNodes;
    }
}
