/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Server
 * Copyright (C) 2011 Zimbra, Inc.
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

package com.zimbra.soap.mail.message;

import com.google.common.base.Objects;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlElements;
import javax.xml.bind.annotation.XmlRootElement;

import com.zimbra.common.soap.MailConstants;
import com.zimbra.soap.mail.type.CalDataSourceNameOrId;
import com.zimbra.soap.mail.type.CaldavDataSourceNameOrId;
import com.zimbra.soap.mail.type.GalDataSourceNameOrId;
import com.zimbra.soap.mail.type.ImapDataSourceNameOrId;
import com.zimbra.soap.mail.type.NameOrId;
import com.zimbra.soap.mail.type.Pop3DataSourceNameOrId;
import com.zimbra.soap.mail.type.RssDataSourceNameOrId;
import com.zimbra.soap.mail.type.UnknownDataSourceNameOrId;
import com.zimbra.soap.mail.type.YabDataSourceNameOrId;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name=MailConstants.E_IMPORT_DATA_REQUEST)
public class ImportDataRequest {

    @XmlElements({
        @XmlElement(name=MailConstants.E_DS_IMAP /* imap */,
            type=ImapDataSourceNameOrId.class),
        @XmlElement(name=MailConstants.E_DS_POP3 /* pop3 */,
            type=Pop3DataSourceNameOrId.class),
        @XmlElement(name=MailConstants.E_DS_CALDAV /* caldav */,
            type=CaldavDataSourceNameOrId.class),
        @XmlElement(name=MailConstants.E_DS_YAB /* yab */,
            type=YabDataSourceNameOrId.class),
        @XmlElement(name=MailConstants.E_DS_RSS /* rss */,
            type=RssDataSourceNameOrId.class),
        @XmlElement(name=MailConstants.E_DS_GAL /* gal */,
            type=GalDataSourceNameOrId.class),
        @XmlElement(name=MailConstants.E_DS_CAL /* cal */,
            type=CalDataSourceNameOrId.class),
        @XmlElement(name=MailConstants.E_DS_UNKNOWN /* unknown */,
            type=UnknownDataSourceNameOrId.class)
    })
    private NameOrId dataSource;

    public ImportDataRequest() {
    }

    public void setDataSource(NameOrId dataSource) {
        this.dataSource = dataSource;
    }
    public NameOrId getDataSource() { return dataSource; }

    public Objects.ToStringHelper addToStringInfo(
                Objects.ToStringHelper helper) {
        return helper
            .add("dataSource", dataSource);
    }

    @Override
    public String toString() {
        return addToStringInfo(Objects.toStringHelper(this))
                .toString();
    }
}
