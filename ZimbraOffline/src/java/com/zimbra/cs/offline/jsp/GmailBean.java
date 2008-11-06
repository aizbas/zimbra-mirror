package com.zimbra.cs.offline.jsp;

import com.zimbra.cs.account.DataSource;

public class GmailBean extends ImapBean {
    public static final String Domain = "gmail.com";

    public GmailBean() {}
	
    @Override
    protected void doRequest() {
	domain = Domain;
        if (verb != null && (verb.isAdd() || verb.isModify())) {
            if (!isEmpty(email) && email.indexOf('@') < 0)
                email += '@' + domain;
	    username = email;
        }
	host = "imap.gmail.com";
	isSsl = true;
	port = "993";

	smtpHost = "smtp.gmail.com";
	smtpPort = "465";
	isSmtpSsl = true;
	isSmtpAuth = true;
	smtpUsername = email;
	smtpPassword = password;
	super.doRequest();
    }

    public boolean isCalendarSyncSupported() {
	return true;
    }

    public boolean isContactSyncSupported() {
	return true;
    }

    public boolean isServerConfigSupported() {
	return false;
    }

    public boolean isSmtpConfigSupported() {
	return false;
    }

    public boolean isUsernameRequired() {
	return false;
    }
}
