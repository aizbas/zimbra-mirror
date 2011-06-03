package com.zimbra.qa.selenium.projects.ajax.tests.addressbook.contacts;


import java.util.List;

import org.testng.annotations.Test;

import com.zimbra.qa.selenium.framework.items.*;
import com.zimbra.qa.selenium.framework.items.FolderItem.SystemFolder;
import com.zimbra.qa.selenium.framework.ui.*;
import com.zimbra.qa.selenium.framework.util.*;
import com.zimbra.qa.selenium.projects.ajax.core.AjaxCommonTest;
import com.zimbra.qa.selenium.projects.ajax.ui.*;


public class MoveContact extends AjaxCommonTest  {
	public MoveContact() {
		logger.info("New "+ MoveContact.class.getCanonicalName());
		
		// All tests start at the Address page
		super.startingPage = app.zPageAddressbook;

		super.startingAccountPreferences = null;		
		
	}
	private void MoveAndVerify(FolderItem emailedContacts, ContactItem contactItem, DialogMove dialogContactMove) throws HarnessException {
		
	    //enter the moved folder
        dialogContactMove.zClickTreeFolder(emailedContacts);
        dialogContactMove.zClickButton(Button.B_OK);
       
        //verify toasted message 1 contact moved to "Emailed Contacts"
        Toaster toast = app.zPageMain.zGetToaster();
        String toastMsg = toast.zGetToastMessage();
        ZAssert.assertStringContains(toastMsg, "1 contact moved to \"Emailed Contacts\"", "Verify toast message '1 contact moved to \"Emailed Contacts\"'");

        //verify moved contact not displayed in folder Contacts
        List<ContactItem> contacts = app.zPageAddressbook.zListGetContacts(); 
 	           
		boolean isFileAsEqual=false;
		for (ContactItem ci : contacts) {
			if (ci.fileAs.equals(contactItem.fileAs)) {
	            isFileAsEqual = true;	 
				break;
			}
		}
		
        ZAssert.assertFalse(isFileAsEqual, "Verify contact fileAs (" + contactItem.fileAs + ") not displayed in folder Contacts");
        
 
        //verify moved contact displayed in folder Emailed Contacts
        // refresh folder Emailed Contacts
        app.zTreeContacts.zTreeItem(Action.A_LEFTCLICK, emailedContacts);
   	 
        contacts = app.zPageAddressbook.zListGetContacts(); 
         
		isFileAsEqual=false;
		for (ContactItem ci : contacts) {
			if (ci.fileAs.equals(contactItem.fileAs)) {
	            isFileAsEqual = true;	 
				break;
			}
		}
		
        ZAssert.assertTrue(isFileAsEqual, "Verify contact fileAs (" + contactItem.fileAs + ") displayed in folder Emailed Contacts");
                		
	}

	@Test(	description = "Move a contact item to different folder by click shortcut m",
			groups = { "functional" })
	public void ClickShortcutm() throws HarnessException {
		
		 // Create a contact via Soap then select
		ContactItem contactItem = app.zPageAddressbook.createUsingSOAPSelectContact(app, Action.A_LEFTCLICK);
	
	
		FolderItem emailedContacts = FolderItem.importFromSOAP(app.zGetActiveAccount(), SystemFolder.EmailedContacts);

		
		 //click shortcut m
	    DialogMove dialogContactMove = (DialogMove) app.zPageAddressbook.zKeyboardShortcut(Shortcut.S_MOVE);
      
        //Move contact and verify
        MoveAndVerify(emailedContacts,contactItem,dialogContactMove);
        
   	}

	@Test(	description = "Move a contact item to different folder by click Move on context menu",
			groups = { "functional" })
	public void ClickMoveOnContextmenu() throws HarnessException {
		
		 // Create a contact via Soap then select
		ContactItem contactItem = app.zPageAddressbook.createUsingSOAPSelectContact(app, Action.A_LEFTCLICK);
	
	
		FolderItem emailedContacts = FolderItem.importFromSOAP(app.zGetActiveAccount(), SystemFolder.EmailedContacts);

		
	    //click Move icon on context menu
	    DialogMove dialogContactMove = (DialogMove) app.zPageAddressbook.zListItem(Action.A_RIGHTCLICK, Button.B_MOVE, contactItem.fileAs);
	 
        //Move contact and verify
        MoveAndVerify(emailedContacts,contactItem,dialogContactMove);
        
   	}

	@Test(	description = "Move a contact item to different folder by click tool bar Move",
			groups = { "smoke" })
	public void ClickMoveOnToolbar() throws HarnessException {
		
		 // Create a contact via Soap then select
		ContactItem contactItem = app.zPageAddressbook.createUsingSOAPSelectContact(app, Action.A_LEFTCLICK);
	
	
		FolderItem emailedContacts = FolderItem.importFromSOAP(app.zGetActiveAccount(), SystemFolder.EmailedContacts);
		
       //click Move icon on toolbar
        DialogMove dialogContactMove = (DialogMove) app.zPageAddressbook.zToolbarPressButton(Button.B_MOVE);
    
        //Move contact and verify
        MoveAndVerify(emailedContacts,contactItem,dialogContactMove);
        
   	}

}

