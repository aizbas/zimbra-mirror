/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite, Network Edition.
 * Copyright (C) 2007, 2008 Zimbra, Inc.  All Rights Reserved.
 * ***** END LICENSE BLOCK *****
 */

package com.zimbra.zme.client;

import java.util.Vector;

public class Folder extends MailboxItem {
	public Vector mSubfolders;
	public Folder mParent;
    public String mView;
    
    public Folder() {
        mItemType = FOLDER;
        mSubfolders = new Vector();
    }
    public boolean showThisFolder() {
        // 4.5.x may have view set to empty even for
        // email folders.  5.x correctly sets the email
        // folders view to message.
        return mView == null || 
            (mView.compareTo(ZClientMobile.MSG_TYPE) == 0 ||
             mView.compareTo(ZClientMobile.APPT_TYPE) == 0);
    }
    public StringBuffer getPath() {
        StringBuffer buf;
        if (mParent != null)
            buf = mParent.getPath();
        else
            buf = new StringBuffer();
        if (mName != null)
            buf.append("/").append(mName);
        return buf;
    }
    public boolean hasChildren() {
        return mSubfolders.size() > 0;
    }
    public boolean hasParent() {
        return mParent != null && mParent.mParent != null;
    }
}
