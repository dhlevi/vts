package com.vividsolutions.vts;

import java.net.MalformedURLException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.web.multipart.commons.CommonsMultipartResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

import com.bedatadriven.jackson.datatype.jts.JtsModule;
import com.fasterxml.jackson.core.JsonParser.Feature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vividsolutions.vts.controller.VTSEngineController;
import com.vividsolutions.vts.engine.RequestExecutionEngine;
import com.vividsolutions.vts.dao.CouchDAO;

@Configuration
@EnableWebMvc
@ComponentScan(basePackages = "com.vividsolutions.*")
@PropertySource("classpath:application.properties")
public class WebConfig extends WebMvcConfigurerAdapter
{
    private static Log logger = LogFactory.getLog(WebConfig.class);

    @Autowired
    private Environment env;
    
    @Bean
    public VTSEngineController vtsEngineController() throws InterruptedException
    {
        return new VTSEngineController();
    }
    
    @Bean
    public RequestExecutionEngine requestExecutionEngine()
    {
        return new RequestExecutionEngine();
    }
    
    @Bean
    public CommonsMultipartResolver multipartResolver()
    {
        logger.info(" >>> Creating MultiPart resolver bean...");
        
        CommonsMultipartResolver resolver = new CommonsMultipartResolver();
        resolver.setMaxUploadSize(new Long(env.getProperty("attachment.max.size")));

        logger.info(" <<< Successfully created MultiPart resolver bean");
        
        return resolver;
    }
    
    @Bean
    public ObjectMapper jsonObjectMapper()
    {
        logger.info(" >>> Creating jsonObjectMapper bean");
        
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);
        mapper.registerModule(new JtsModule());
        
        logger.info(" <<< Successfully created jsonObjectMapper bean");
        
        return mapper;
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry)
    {
        registry.addMapping("/**");
    }
    
    @Bean
    public CouchDAO couchDAO() throws MalformedURLException
    {
        String userDb = env.getProperty("couchdb.users");
        String requestsDb = env.getProperty("couchdb.requests");
        String taskDb = env.getProperty("couchdb.tasks");
        String projectDb = env.getProperty("couchdb.projects");
        String geometryDb  = env.getProperty("couchdb.geometry.cache");
        String engineDb  = env.getProperty("couchdb.engines");
        String logDb  = env.getProperty("couchdb.logs");
        int cacheLimit = Integer.parseInt(env.getProperty("couchdb.cache.limit"));
        logger.debug(" >> WebConfig.couchDAO() : Initialize Couch DAO for databases: " + userDb + ", " + requestsDb + ", " + taskDb + ", " + projectDb + ", " + geometryDb + ", " + engineDb + ", " + logDb);
        logger.debug(" >> WebConfig.couchDAO() : Initialize Couch DAO cache to a max of " + cacheLimit + " cached features");
        
        String url = env.getProperty("couchdb.url");
        String user = env.getProperty("couchdb.admin.name");
        String password = env.getProperty("couchdb.admin.password");

        return new CouchDAO(url, userDb, requestsDb, taskDb, projectDb, geometryDb, engineDb, logDb, user, password, cacheLimit);
    }
}