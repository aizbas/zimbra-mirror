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
package com.zimbra.qa.selenium.projects.ajax.tests.preferences.addressbook;

import java.util.HashMap;

import org.testng.annotations.Test;

import com.zimbra.qa.selenium.framework.ui.*;
import com.zimbra.qa.selenium.framework.util.*;
import com.zimbra.qa.selenium.projects.ajax.core.AjaxCommonTest;
import com.zimbra.qa.selenium.projects.ajax.ui.preferences.TreePreferences.TreeItem;

public class ZimbraPrefSharedAddrBookAutoCompleteEnabledFalse extends AjaxCommonTest {

	public ZimbraPrefSharedAddrBookAutoCompleteEnabledFalse() {
		
		
		super.startingPage = app.zPagePreferences;
		super.startingAccountPreferences = new HashMap<String, String>() {
			private static final long serialVersionUID = -8420219563029115185L;
			{				
				put("zimbraPrefSharedAddrBookAutoCompleteEnabled", "TRUE");
			}
		};
		
		
	}

	@Test(
			description = "Set zimbraPrefSharedAddrBookAutoCompleteEnabled to 'FALSE'",
			groups = { "functional" }
	)
	public void ZimbraPrefSharedAddrBookAutoCompleteEnabledFalse_01() throws HarnessException {

		//-- DATA Setup
		
		
		
		//-- GUI Actions
		
		// Navigate to preferences -> mail -> composing
		app.zTreePreferences.zTreeItem(Action.A_LEFTCLICK, TreeItem.AddressBook);

		
		// Click radio button for "	Initially search the Global Address List when using the contact picker"
		app.zPagePreferences.sClick("css=div[id$='AUTOCOMPLETE_SHARED_ADDR_BOOKS_control'] input[id$='AUTOCOMPLETE_SHARED_ADDR_BOOKS']");

		// Click save
		app.zPagePreferences.zToolbarPressButton(Button.B_SAVE);

		
		
		//-- VERIFICATION
		
		app.zGetActiveAccount().soapSend(
						"<GetPrefsRequest xmlns='urn:zimbraAccount'>"
				+			"<pref name='zimbraPrefSharedAddrBookAutoCompleteEnabled'/>"
				+		"</GetPrefsRequest>");

		String value = app.zGetActiveAccount().soapSelectValue("//acct:pref[@name='zimbraPrefSharedAddrBookAutoCompleteEnabled']", null);
		ZAssert.assertEquals(value, "FALSE", "Verify the zimbraPrefSharedAddrBookAutoCompleteEnabled preference was changed to 'FALSE'");

	}
	
}
