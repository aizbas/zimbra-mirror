/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Server
 * Copyright (C) 2009 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */
package com.zimbra.cs.store.file;

import java.io.IOException;

import com.zimbra.cs.mailbox.Mailbox;
import com.zimbra.cs.store.Blob;
import com.zimbra.cs.store.StagedBlob;

public class VolumeStagedBlob extends StagedBlob {
    private Blob mLocalBlob;
    private boolean mWasStagedDirectly;

    VolumeStagedBlob(Mailbox mbox, Blob blob) {
        super(mbox);
        mLocalBlob = blob;
    }

    public Blob getLocalBlob() {
        return mLocalBlob;
    }

    VolumeStagedBlob markStagedDirectly() {
        mWasStagedDirectly = true;
        return this;
    }

    boolean wasStagedDirectly() {
        return mWasStagedDirectly;
    }

    @Override public long getSize() throws IOException {
        return mLocalBlob.getRawSize();
    }

    @Override public String getDigest() throws IOException {
        return mLocalBlob.getDigest();
    }
}
