/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Server
 * Copyright (C) 2012, 2013 Zimbra Software, LLC.
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

package com.zimbra.cs.store.external;

import java.io.IOException;

import com.zimbra.common.util.ZimbraLog;
import com.zimbra.cs.mailbox.Mailbox;
import com.zimbra.cs.store.Blob;
import com.zimbra.cs.store.MailboxBlob;
import com.zimbra.cs.store.StoreManager;

/**
 * MailboxBlob implementation which accesses ExternalStoreManager to retrieve blobs for local use
 */
public class ExternalMailboxBlob extends MailboxBlob {

    protected ExternalMailboxBlob(Mailbox mbox, int itemId, int revision, String locator) {
        super(mbox, itemId, revision, locator);
    }

    @Override
    public Blob getLocalBlob() throws IOException {
        ExternalStoreManager sm = (ExternalStoreManager) StoreManager.getInstance();
        Blob blob = sm.getLocalBlob(getMailbox(), getLocator());

        setSize(blob.getRawSize());
        if (digest != null) {
            setDigest(blob.getDigest());
        }
        return blob;
    }

    @Override
    public int hashCode() {
        return getLocator().hashCode();
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        } else if (!(other instanceof ExternalMailboxBlob)) {
            return false;
        }
        return getLocator().equals(((ExternalMailboxBlob) other).getLocator());
    }

    /**
     * Test if a MailboxBlob is valid and exists in remote store.
     * Default implementation preemptively fetches the complete blob to cache.
     * However, implementors may override this to do a HEAD or similar 'exists' operation
     * @return true if the blob is valid (i.e. locator exists)
     */
    public boolean validateBlob() {
        try {
            getLocalBlob();
            return true;
        } catch (IOException e) {
            ZimbraLog.store.debug("Unable to validate blob [%s] due to IOException", this, e);
            return false;
        }
    }

}
