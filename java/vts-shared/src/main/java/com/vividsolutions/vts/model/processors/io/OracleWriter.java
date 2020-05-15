package com.vividsolutions.vts.model.processors.io;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Types;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.oracle.OraWriter;
import com.vividsolutions.vts.dao.CouchDAO;
import com.vividsolutions.vts.model.Attribute;
import com.vividsolutions.vts.model.Feature;
import com.vividsolutions.vts.model.Attribute.DataType;
import com.vividsolutions.vts.model.processors.FeatureProcessor;
import com.vividsolutions.vts.model.processors.Processor;

import oracle.jdbc.OracleConnection;
import oracle.jdbc.pool.OracleDataSource;
import oracle.sql.STRUCT;

@SuppressWarnings("deprecation")
public class OracleWriter extends FeatureProcessor
{
    private static final long serialVersionUID = -6325545385508347702L;

    private static Log logger = LogFactory.getLog(OracleReader.class);

    private String connection; // jdbc:oracle:thin:@//localhost:1521/XE connection style
    private String user;
    private String password;
    
    private String table;
    private boolean truncate;
    private String keyAttributeName;
    
    /*
     * Additional needed options:
     *  - Create the table if it doesn't exist
     *  - create the spatial index
     *  - drop/recreate index on large loads
     */
    
    public OracleWriter()
    {
        super();
        this.setType(Processor.Type.ORACLE_WRITER.toString());
    }
    
    @Override
    public boolean process() throws Exception
    {
        if(!isProcessed())
        {
            if(getFeatures() == null) setFeatures(new ArrayList<UUID>());
            if(getFeatures().size() > 0) connect();
            
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

    public void connect() throws Exception
    {
        logger.debug(" >> connect()");
        
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
            
            if(truncate)
            {
                // delete all objects in table
                ps = conn.prepareStatement("DELETE FROM " + table);
                
                boolean result = ps.execute();
                int updateCount = ps.getUpdateCount();
                
                if(result)
                {
                    logger.debug("Deleted " + updateCount + " records from " + table);
                    this.getMessages().add("Deleted " + updateCount + " records from " + table);
                }
                else
                {
                    logger.debug("Could not delete any records from " + table);
                    this.getMessages().add("Could not delete any records from " + table);
                }
                
                ps.close();
            }
            
            // should this be an update or an insert
            boolean isInsert = false;
            
            for(UUID featureId : getFeatures())
            {
                Feature feature = getCouchDAO().getGeometry(featureId);
                
                String keyValue = "";
                
                for(Attribute attribute : feature.getAttributes())
                {
                    if(attribute.getName().equals(keyAttributeName))
                    {
                        keyValue = attribute.getValue();
                        if(attribute.getDataType() == DataType.string)
                        {
                            keyValue = "'" + keyValue + "'";
                        }
                        
                        break;
                    }
                }

                String sql = "SELECT COUNT(*) AS DOES_EXIST FROM " + table + " WHERE " + keyAttributeName + " = " + keyValue;
                ps = conn.prepareStatement(sql);
                rs = ps.executeQuery();
                
                while(rs.next())
                {
                    int count = rs.getInt(1);
                    isInsert = count == 0;
                    
                    if(count > 1)
                    {
                        this.getMessages().add("Error inserting record. Multiple key values found");
                        
                        rs.close();
                        ps.close();
                        conn.close();
                        
                        throw new Exception("Error inserting record. Multiple key values found");
                    }
                    
                    break;
                }
                
                ps.close();
                rs.close();
                
                if(isInsert)
                {
                    // create a new record
                    sql = "INSERT INTO " + table + " VALUES (";
                    
                    for(@SuppressWarnings("unused") Attribute attribute : feature.getAttributes())
                    {
                        sql += "?,";
                    }
                    
                    // remove any trailing comma
                    if(sql.endsWith(",")) sql.substring(0, sql.length() - 2);
                    sql += ")";
                    
                    ps = conn.prepareStatement(sql);
                    
                    for(int i = 1; i < feature.getAttributes().size() + 1; i++)
                    {
                        Attribute attribute = feature.getAttributes().get(i - 1);
                        
                        if(attribute.getDataType() == DataType.string) ps.setString(i, attribute.getValue());
                        if(attribute.getDataType() == DataType.bool) ps.setBoolean(i, Boolean.parseBoolean(attribute.getValue()));
                        else if(attribute.getDataType() == DataType.number) ps.setObject(i, attribute.getValue(), Types.NUMERIC);
                        else if(attribute.getDataType() == DataType.date)
                        {
                            DateFormat format = new SimpleDateFormat(attribute.getDateFormat());
                            Date d = format.parse(attribute.getValue());
                            ps.setDate(i, new java.sql.Date(d.getYear(), d.getMonth(), d.getDay()));
                        }
                        else if(attribute.getDataType() == DataType.geometry)
                        {
                            Geometry geom = feature.getAsGeometryObject();
                            OraWriter orw = new OraWriter((OracleConnection)conn);
                            orw.setSRID(geom.getSRID());
                            
                            STRUCT geomStruct = orw. write(geom);
                            ps.setObject(i, geomStruct);
                        }
                    }
                    
                    boolean successfulInsert = ps.execute();
                    
                    if(!successfulInsert)
                    {
                        
                    }
                    
                    ps.close();
                }
                else
                {
                    // update an existing record
                    sql = "UPDATE " + table + " SET";
                    for(Attribute attribute : feature.getAttributes())
                    {
                        sql += " " + attribute.getName() + " = ";
                        
                        if(attribute.getDataType() == DataType.string) sql += "'" + attribute.getValue() + "'";
                        else if(attribute.getDataType() == DataType.geometry)
                        {
                            sql += "?";
                        }
                        else sql += attribute.getValue();
                        
                        sql += ",";
                    }
                    
                    // remove any trailing comma
                    if(sql.endsWith(",")) sql.substring(0, sql.length() - 2);
                    
                    Geometry geom = feature.getAsGeometryObject();
                    OraWriter orw = new OraWriter((OracleConnection)conn);
                    orw.setSRID(geom.getSRID());
                    
                    STRUCT geomStruct = orw. write(geom);
                    ps.setObject(1, geomStruct);
                }
                
                ps = conn.prepareStatement(sql);
                int updatedRecords = ps.executeUpdate();
                logger.debug("Updated " + updatedRecords + " records...");
            }
            
            rs.close();
            ps.close();
            conn.close();
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

    public boolean isTruncate()
    {
        return truncate;
    }

    public void setTruncate(boolean truncate)
    {
        this.truncate = truncate;
    }

    @Override
    @JsonIgnore
    public FeatureProcessor getSimpleResults()
    {
        OracleWriter copy = new OracleWriter();
        copy.setProcessed(this.isProcessed());
        copy.setProcessorID(this.getProcessorID());
        copy.setFeatures(new ArrayList<UUID>());
        copy.setOutputNodes(this.getOutputNodes());
        copy.setInputNodes(this.getInputNodes());
        
        return copy;
    }
}
