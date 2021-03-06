/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Server
 * Copyright (C) 2004, 2005, 2006, 2007, 2009, 2010, 2013 Zimbra Software, LLC.
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

package com.zimbra.cs.client.soap;

import java.util.ArrayList;
import java.util.Iterator;

import org.dom4j.Element;
import org.dom4j.DocumentHelper;

import com.zimbra.common.service.ServiceException;
import com.zimbra.common.soap.MailConstants;

public class LmcGetTagRequest extends LmcSoapRequest {

    protected Element getRequestXML() {
        Element request = DocumentHelper.createElement(MailConstants.GET_TAG_REQUEST);
        return request;
    }

    protected LmcSoapResponse parseResponseXML(Element responseXML)
        throws ServiceException
    {
        // iterate over all the <tag> elements in the response
        ArrayList tags = new ArrayList();
        for (Iterator ait = responseXML.elementIterator(MailConstants.E_TAG); ait.hasNext(); ) {
            Element a = (Element) ait.next();
            tags.add(parseTag(a));
        }

        // create the response object and put in the tags
        LmcGetTagResponse response = new LmcGetTagResponse();
        response.setTags(tags);
        return response;
    }
}
