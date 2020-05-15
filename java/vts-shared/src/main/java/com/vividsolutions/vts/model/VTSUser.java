package com.vividsolutions.vts.model;

import java.util.ArrayList;
import java.util.List;

import org.ektorp.support.CouchDbDocument;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class VTSUser extends CouchDbDocument
{
    private static final long serialVersionUID = -9013482896007333302L;
 
    public enum Role { user, admin };
    
    private String name;
    private String password;
    private String email;
    private List<String> favoriteProjects;
    private Role role;
    
    public VTSUser()
    {
        
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    @JsonIgnore
    public String getRealPassword()
    {
        return password;
    }
    
    public String getPassword()
    {
        return "******";
    }

    public void setPassword(String password)
    {
        this.password = password;
    }

    public Role getRole()
    {
        return role;
    }

    public void setRole(Role role)
    {
        this.role = role;
    }

    public String getEmail()
    {
        return email;
    }

    public void setEmail(String email)
    {
        this.email = email;
    }

    public List<String> getFavoriteProjects()
    {
        if(favoriteProjects == null) return new ArrayList<String>();
        return favoriteProjects;
    }

    public void setFavoriteProjects(List<String> favoriteProjects)
    {
        this.favoriteProjects = favoriteProjects;
    }
}
