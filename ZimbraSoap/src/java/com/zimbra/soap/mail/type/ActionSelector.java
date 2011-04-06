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

package com.zimbra.soap.mail.type;

import com.google.common.base.Objects;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;

import com.zimbra.common.soap.MailConstants;

@XmlAccessorType(XmlAccessType.FIELD)
public class ActionSelector {

    // Comma separated list
    @XmlAttribute(name=MailConstants.A_ID, required=true)
    private final String ids;

    @XmlAttribute(name=MailConstants.A_OPERATION, required=true)
    private final String operation;

    @XmlAttribute(name=MailConstants.A_TARGET_CONSTRAINT, required=false)
    private String constraint;

    @XmlAttribute(name=MailConstants.A_TAG, required=false)
    private Integer tag;

    @XmlAttribute(name=MailConstants.A_FOLDER, required=false)
    private String folder;

    @XmlAttribute(name=MailConstants.A_RGB, required=false)
    private String rgb;

    @XmlAttribute(name=MailConstants.A_COLOR, required=false)
    private Byte color;

    @XmlAttribute(name=MailConstants.A_NAME, required=false)
    private String name;

    @XmlAttribute(name=MailConstants.A_FLAGS, required=false)
    private String flags;

    @XmlAttribute(name=MailConstants.A_TAGS, required=false)
    private String tags;

    /**
     * no-argument constructor wanted by JAXB
     */
    @SuppressWarnings("unused")
    private ActionSelector() {
        this((String) null, (String) null);
    }

    public ActionSelector(String ids, String operation) {
        this.ids = ids;
        this.operation = operation;
    }

    public void setConstraint(String constraint) {
        this.constraint = constraint;
    }
    public void setTag(Integer tag) { this.tag = tag; }
    public void setFolder(String folder) { this.folder = folder; }
    public void setRgb(String rgb) { this.rgb = rgb; }
    public void setColor(Byte color) { this.color = color; }
    public void setName(String name) { this.name = name; }
    public void setFlags(String flags) { this.flags = flags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getIds() { return ids; }
    public String getOperation() { return operation; }
    public String getConstraint() { return constraint; }
    public Integer getTag() { return tag; }
    public String getFolder() { return folder; }
    public String getRgb() { return rgb; }
    public Byte getColor() { return color; }
    public String getName() { return name; }
    public String getFlags() { return flags; }
    public String getTags() { return tags; }

    @Override
    public String toString() {
        return Objects.toStringHelper(this)
            .add("ids", ids)
            .add("operation", operation)
            .add("constraint", constraint)
            .add("tag", tag)
            .add("folder", folder)
            .add("rgb", rgb)
            .add("color", color)
            .add("name", name)
            .add("flags", flags)
            .add("tags", tags)
            .toString();
    }
}
