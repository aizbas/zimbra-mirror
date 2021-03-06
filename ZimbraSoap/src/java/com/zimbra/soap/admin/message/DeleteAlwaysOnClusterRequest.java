/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Server
 * Copyright (C) 2013 Zimbra Software, LLC.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.4 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

package com.zimbra.soap.admin.message;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlRootElement;

import com.zimbra.common.soap.AdminConstants;


/**
 * @zm-api-command-auth-required true
 * @zm-api-command-admin-auth-required true
 * @zm-api-command-description Delete a alwaysOnCluster
 * <br />
 * Note: this request is by default proxied to the referenced server
 */
@XmlRootElement(name=AdminConstants.E_DELETE_ALWAYSONCLUSTER_REQUEST)
public class DeleteAlwaysOnClusterRequest {

    /**
     * @zm-api-field-tag value-of-zimbra-id
     * @zm-api-field-description Zimbra ID
     */
    @XmlAttribute(name=AdminConstants.E_ID, required=true)
    private final String id;

    /**
     * no-argument constructor wanted by JAXB
     */
    @SuppressWarnings("unused")
    private DeleteAlwaysOnClusterRequest() {
        this(null);
    }

    public DeleteAlwaysOnClusterRequest(String id) { this.id = id; }

    public String getId() { return id; }
}
