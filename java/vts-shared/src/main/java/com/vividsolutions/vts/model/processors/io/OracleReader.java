package com.vividsolutions.vts.model.processors.io;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geotools.geometry.jts.JTS;
import org.geotools.referencing.CRS;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.operation.MathTransform;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.CoordinateFilter;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.oracle.OraReader;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

import oracle.jdbc.pool.OracleDataSource;
import oracle.sql.STRUCT;

@SuppressWarnings("deprecation")
public class OracleReader extends FeatureProcessor
{
    private static final long serialVersionUID = -6325545385508347702L;

    private static Log logger = LogFactory.getLog(OracleReader.class);

    private String connection; // jdbc:oracle:thin:@//localhost:1521/XE connection style
    private String user;
    private String password;
    
    private String table;
    private String whereClause;
    private String customQuery;
    
    public OracleReader()
    {
        super();
        this.setType(Processor.Type.ORACLE_READER.toString());
    }
    
    @Override
    public boolean process() throws Exception
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
        setFeatures(new ArrayList<UUID>());
        boolean initProcess = super.process(parentProcesses, couchDAO);
        return process() && initProcess;
    }

    public void connect() throws Exception
    {
        logger.debug(" >> connect()");
        
        logger.info("Fetching records from '" + table + "' with user '" + user + "'");
        
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        
        try
        {
            if(!connection.startsWith("jdbc:oracle:thin:@")) connection = "jdbc:oracle:thin:@" + connection;
            
            OracleDataSource dataSource = new OracleDataSource();
            dataSource.setURL(connection);
            dataSource.setUser(user);
            dataSource.setPassword(password);
            
            conn = dataSource.getConnection();
            
            String sql = "";
            if(customQuery == null || (customQuery != null && customQuery.length() < 12))
            {
                sql ="SELECT * FROM " + table;
                if(whereClause != null && whereClause.length() > 0)
                {
                    sql += " WHERE " + whereClause;
                }
            }
            else
            {
                sql = customQuery;
            }
            
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();
            ResultSetMetaData rsMetaData = rs.getMetaData();

            int numberOfColumns = rsMetaData.getColumnCount();
            List<Attribute> baseAttributes = new ArrayList<Attribute>();
            // get the column names; column indexes start from 1
            for (int i = 1; i < numberOfColumns + 1; i++) 
            {
                Attribute newAttribute = new Attribute();
                
                newAttribute.setName(rsMetaData.getColumnName(i));
                newAttribute.setAlias(rsMetaData.getColumnLabel(i));
                newAttribute.setDisplayOrder(i);
                newAttribute.setLength(rsMetaData.getScale(i));
             
                int columnType = rsMetaData.getColumnType(i);
                // column type
                if(columnType == Types.BIGINT ||
                   columnType == Types.DECIMAL ||
                   columnType == Types.FLOAT ||
                   columnType == Types.DOUBLE ||
                   columnType == Types.INTEGER ||
                   columnType == Types.NUMERIC ||
                   columnType == Types.SMALLINT ||
                   columnType == Types.TINYINT) 
                {
                    newAttribute.setDataType(DataType.number);
                    newAttribute.setDecimalPrecision(rsMetaData.getPrecision(i));
                }
                else if(columnType == Types.DATE ||
                        columnType == Types.TIME ||
                        columnType == Types.TIMESTAMP) 
                {
                    newAttribute.setDataType(DataType.date);
                    newAttribute.setDateFormat("YYYY-MM-DD HH:MM:SS");
                }
                else if(columnType == Types.STRUCT) newAttribute.setDataType(DataType.geometry);
                else if(columnType == Types.BOOLEAN) newAttribute.setDataType(DataType.bool);
                else newAttribute.setDataType(DataType.string);
                
                baseAttributes.add(newAttribute);
            }
            
            // get the results!
            while(rs.next())
            {
                Feature loadedFeature = new Feature();
                loadedFeature.setGeometryID(UUID.randomUUID());
                loadedFeature.setNode(FEATURES);
                loadedFeature.setProcessorID(getProcessorID());
                
                for(Attribute attribute : baseAttributes)
                {
                    Attribute attributeCopy = new Attribute(attribute);

                    if(attribute.getDataType() == DataType.geometry)
                    {
                        // load geometry struct
                        STRUCT resultOracleStruct = (STRUCT) rs.getObject(attribute.getDisplayOrder());
                        OraReader reader = new OraReader();
                        Geometry geometry = reader.read(resultOracleStruct);
                        
                        /* Old prototype test only handled WGS 84. 
                        // project to wgs84
                        CoordinateReferenceSystem targetCRS = CRS.parseWKT(WGS84_WKT);
                        CoordinateReferenceSystem sourceCRS = null;
                        
                        if(geometry.getSRID() == 3005 || geometry.getSRID() == 1000003005) 
                        {
                            sourceCRS = CRS.parseWKT(BCALBERS_WKT);
                        }
                        else sourceCRS = CRS.decode("EPSG:" + geometry.getSRID());
                        
                        MathTransform transform = CRS.findMathTransform(sourceCRS, targetCRS, true);
                        
                        geometry = JTS.transform(geometry, transform);
                        geometry.apply(new InvertCoordinateFilter());
                        
                        geometry.setSRID(4326);

                        loadedFeature.setCrs("EPSG:4326"); 
                        */
                        
                        // old BC Gov datasets (particularly MoFR stuff) has an old temp SRID number.
                        // revert to the standard BC Albers.
                        // Note, that the problem here is we may not be able to write back to those sources?
                        if(geometry.getSRID() == 1000003005) 
                        {
                            geometry.setSRID(3005);
                        }
                        
                        loadedFeature.setFromGeometryObject(geometry);
                    }
                    else
                    {
                        attributeCopy.setValue(rs.getString(attribute.getDisplayOrder()));
                    }
                    
                    loadedFeature.getAttributes().add(attributeCopy);
                }

                getCouchDAO().createResource(loadedFeature);
                
                getOutputNodes().get(FEATURES).add(loadedFeature.getGeometryID());
            }
        }
        catch(Exception e)
        {
            throw e;
        }
        finally
        {
            if(rs != null && !rs.isClosed()) rs.close();
            if(ps != null && !ps.isClosed()) ps.close();
            if(conn != null && !conn.isClosed()) conn.close();
        }
        
        logger.debug(" << connect()");
    }
    
    public String getConnection()
    {
        return connection;
    }

    public void setConnection(String connection)
    {
        this.connection = connection;
    }

    public String getUser()
    {
        return user;
    }

    public void setUser(String user)
    {
        this.user = user;
    }

    public String getPassword()
    {
        return password;
    }

    public void setPassword(String password)
    {
        this.password = password;
    }

    public String getTable()
    {
        return table;
    }

    public void setTable(String table)
    {
        this.table = table;
    }

    public String getWhereClause()
    {
        return whereClause;
    }

    public void setWhereClause(String whereClause)
    {
        this.whereClause = whereClause;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        OracleReader copy = new OracleReader();
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
