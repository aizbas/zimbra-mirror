/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Server
 * Copyright (C) 2011, 2013 Zimbra Software, LLC.
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

package com.zimbra.soap.account.type;

import java.util.List;
import java.util.Map;

import com.google.common.collect.Multimap;

import com.zimbra.common.service.ServiceException;

public interface Attrs {
    public Attrs setAttrs(Iterable<? extends Attr> attrs);
    public Attrs setAttrs(Map<String, ? extends Object> attrs)
        throws ServiceException;
    public Attrs addAttr(Attr attr);
    public List<? extends Attr> getAttrs();
    public Multimap<String, String> getAttrsMultimap();
    public String getFirstMatchingAttr(String name);
    public Map<String, Object> getAttrsAsOldMultimap();
}
