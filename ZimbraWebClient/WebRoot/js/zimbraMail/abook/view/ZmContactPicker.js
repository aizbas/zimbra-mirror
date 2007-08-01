/*
 * ***** BEGIN LICENSE BLOCK *****
 * Version: ZPL 1.2
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.2 ("License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.zimbra.com/license
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is: Zimbra Collaboration Suite Web Client
 *
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2005, 2006 Zimbra, Inc.
 * All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK *****
 */

/**
* Creates a dialog that lets the user select addresses from a contact list.
* @constructor
* @class
* This class creates and manages a dialog that lets the user select addresses
* from a contact list. Two lists are maintained, one with contacts to select
* from, and one that contains the selected addresses. Between them are buttons
* to shuffle addresses back and forth between the two lists.
*
* @author Conrad Damon
* @param appCtxt		[ZmAppCtxt]		app context
* @param buttonInfo		[array]			transfer button IDs and labels
*/
ZmContactPicker = function(appCtxt, buttonInfo) {

	DwtDialog.call(this, appCtxt.getShell(), null, ZmMsg.selectAddresses);

	this._appCtxt = appCtxt;
	this._buttonInfo = buttonInfo;
	this._initialized = false;
	this._offset = 0;

	this._searchRespCallback = new AjxCallback(this, this._handleResponseSearch);
	this._searchErrorCallback = new AjxCallback(this, this._handleErrorSearch);
};

ZmContactPicker.prototype = new DwtDialog;
ZmContactPicker.prototype.constructor = ZmContactPicker;

// Consts

ZmContactPicker.CHOOSER_HEIGHT = 300;

// Public methods

ZmContactPicker.prototype.toString =
function() {
	return "ZmContactPicker";
};

/**
* Displays the contact picker dialog. The source list is populated with
* contacts, and the target list is populated with any addresses that are
* passed in. The address button that was used to popup the dialog is set
* as the active button.
*
* @param buttonId	[string]*	button ID of the button that called us
* @param addrs		[hash]*		hash of 3 vectors (one for each type of address)
* @param str		[string]*	initial search string
*/
ZmContactPicker.prototype.popup =
function(buttonId, addrs, str) {
	if (!this._initialized) {
		this._initialize();
		this._initialized = true;
	}

	this._offset = 0;

	// reset column sorting preference
	this._chooser.sourceListView.setSortByAsc(ZmItem.F_NAME, true);

	// reset button states
	this._chooser.reset();
	if (buttonId) {
		this._chooser._setActiveButton(buttonId);
	}

	// populate target list if addrs were passed in
	if (addrs) {
		for (var id in addrs) {
			this._chooser.addItems(addrs[id], DwtChooserListView.TARGET, true, id);
		}
	}

	// reset search field
	this._searchField.disabled = false;
	this._searchField.focus();
	if (str) {
		this._searchField.className = "";
		this._searchField.value = str;
		this._searchCleared = true;
	} else {
		this._searchField.className = "searchFieldHint";
		this._searchField.value = ZmMsg.contactPickerHint;
		this._searchCleared = false;
	}

	// reset paging buttons
	this._prevButton.setEnabled(false);
	this._nextButton.setEnabled(false);

	DwtDialog.prototype.popup.call(this);
};

/**
* Closes the dialog
*/
ZmContactPicker.prototype.popdown =
function() {
	// disable search field (hack to fix bleeding cursor)
	this._searchField.disabled = true;
	this._contactSource = null;

	DwtDialog.prototype.popdown.call(this);
};

ZmContactPicker.prototype.search =
function() {
	var query = this._searchCleared ? AjxStringUtil.trim(this._searchField.value) : "";
	if (query.length) {
		var queryHint;
		if (this._appCtxt.get(ZmSetting.CONTACTS_ENABLED) &&
			this._appCtxt.get(ZmSetting.GAL_ENABLED))
		{
			var searchFor = this._selectDiv.getSelectedOption().getValue();
			this._contactSource = (searchFor == ZmContactsApp.SEARCHFOR_CONTACTS || searchFor == ZmContactsApp.SEARCHFOR_PAS)
				? ZmItem.CONTACT
				: ZmSearchToolBar.FOR_GAL_MI;
			if (searchFor == ZmContactsApp.SEARCHFOR_PAS) {
				queryHint = ZmSearchController.QUERY_ISREMOTE;
			}
		}
		else {
			this._contactSource = this._appCtxt.get(ZmSetting.CONTACTS_ENABLED)
				? ZmItem.CONTACT
				: ZmSearchToolBar.FOR_GAL_MI;
		}

		// XXX: line below doesn't have intended effect (turn off column sorting for GAL search)
		this._chooser.sourceListView.enableSorting(this._contactSource == ZmItem.CONTACT);
		var params = {
			obj: this,
			ascending: true,
			query: query,
			queryHint: queryHint,
			offset: this._offset,
			respCallback: this._searchRespCallback,
			errorCallback: this._searchErrorCallback
		}
		ZmContactsHelper.search(params);
	}
};

ZmContactPicker.prototype._contentHtml =
function() {
	var showSelect = (this._appCtxt.get(ZmSetting.CONTACTS_ENABLED) ||
					  this._appCtxt.get(ZmSetting.GAL_ENABLED));
	var subs = {
		id: this._htmlElId,
		showSelect: showSelect
	};

	return (AjxTemplate.expand("zimbraMail.abook.templates.Contacts#ZmContactPicker", subs));
};

// called only when ZmContactPicker is first created. Sets up initial layout.
ZmContactPicker.prototype._initialize =
function() {

	// create static content and append to dialog parent
	this.setContent(this._contentHtml());

	// add search button
	var searchCellId = this._htmlElId + "_searchButton";
	this._searchButton = new DwtButton(this);
	this._searchButton.setText(ZmMsg.search);
	this._searchButton.addSelectionListener(new AjxListener(this, this._searchButtonListener));
	this._searchButton.reparentHtmlElement(searchCellId);

	// add select menu
	var selectCellId = this._htmlElId + "_listSelect";
	var selectCell = document.getElementById(selectCellId);
	if (selectCell) {
		this._selectDiv = new DwtSelect(this);
		if (this._appCtxt.get(ZmSetting.CONTACTS_ENABLED)) {
			this._selectDiv.addOption(ZmMsg.contacts, false, ZmContactsApp.SEARCHFOR_CONTACTS);

			if (this._appCtxt.get(ZmSetting.SHARING_ENABLED))
				this._selectDiv.addOption(ZmMsg.searchPersonalSharedContacts, false, ZmContactsApp.SEARCHFOR_PAS);
		}
		if (this._appCtxt.get(ZmSetting.GAL_ENABLED)) {
			this._selectDiv.addOption(ZmMsg.GAL, true, ZmContactsApp.SEARCHFOR_GAL);
		}

		this._selectDiv.reparentHtmlElement(selectCellId);
	}

	// add chooser
	this._chooser = new ZmContactChooser({parent:this, buttonInfo:this._buttonInfo, appCtxt:this._appCtxt});
	this._chooser.reparentHtmlElement(this._htmlElId + "_chooser");
	this._chooser.resize(this.getSize().x, ZmContactPicker.CHOOSER_HEIGHT);

	// add paging buttons
	var pageListener = new AjxListener(this, this._pageListener);
	this._prevButton = new DwtButton(this);
	this._prevButton.setText(ZmMsg.previous);
	this._prevButton.setImage("LeftArrow");
	this._prevButton.addSelectionListener(pageListener);
	this._prevButton.reparentHtmlElement(this._htmlElId + "_pageLeft");

	this._nextButton = new DwtButton(this, DwtLabel.IMAGE_RIGHT);
	this._nextButton.setText(ZmMsg.next);
	this._nextButton.setImage("RightArrow");
	this._nextButton.addSelectionListener(pageListener);
	this._nextButton.reparentHtmlElement(this._htmlElId + "_pageRight");

	var pageContainer = document.getElementById(this._htmlElId + "_paging");
	if (pageContainer) {
		Dwt.setSize(pageContainer, this._chooser.sourceListView.getSize().x);
	}

	// init listeners
	this.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._okButtonListener));
	this.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this._cancelButtonListener));

	this._searchField = document.getElementById(this._htmlElId + "_searchField");
	Dwt.setHandler(this._searchField, DwtEvent.ONKEYPRESS, ZmContactPicker._keyPressHdlr);
	Dwt.setHandler(this._searchField, DwtEvent.ONCLICK, ZmContactPicker._onclickHdlr);
	this._keyPressCallback = new AjxCallback(this, this._searchButtonListener);
};

// Listeners

ZmContactPicker.prototype._searchButtonListener =
function(ev) {
	this._offset = 0;
	this.search();
};

ZmContactPicker.prototype._handleResponseSearch =
function(result) {
	var resp = result.getResponse();

	var more = resp.getAttribute("more");
	this._prevButton.setEnabled(this._offset > 0);
	this._nextButton.setEnabled(more);

	var info = resp.getAttribute("info");
	if (info && info[0].wildcard[0].expanded == "0") {
		var d = this._appCtxt.getMsgDialog();
		d.setMessage(ZmMsg.errorSearchNotExpanded);
		d.popup();
	} else {
		var list = ZmContactsHelper._processSearchResponse(resp);
		// bug #2269 - enable/disable sort column per type of search
		this._resetColHeaders();
		this._chooser.setItems(AjxVector.fromArray(list));

		if (list.length == 0) {
			this._chooser.sourceListView._setNoResultsHtml();
		}
	}

	this._searchButton.setEnabled(true);
};

ZmContactPicker.prototype._handleErrorSearch =
function() {
	this._searchButton.setEnabled(true);
	return false;
};

ZmContactPicker.prototype._pageListener =
function(ev) {
	if (ev.item == this._prevButton) {
		this._offset -= ZmContactsApp.SEARCHFOR_MAX;
	} else {
		this._offset += ZmContactsApp.SEARCHFOR_MAX;
	}

	this.search();
};

ZmContactPicker.prototype._resetColHeaders =
function() {
	var slv = this._chooser.sourceListView;
	slv._headerColCreated = false;

	// find the participant column
	var part = 0;
	for (var i = 0; i < slv._headerList.length; i++) {
		if (DwtListHeaderItem.getHeaderField(slv._headerList[i]._id) == ZmItem.F_NAME) {
			part = i;
			break;
		}
	}

	var sortable = (this._selectDiv && this._selectDiv.getValue() == ZmContactsApp.SEARCHFOR_GAL)
		? null : ZmItem.F_NAME;
	slv._headerList[part]._sortable = sortable;
	slv.createHeaderHtml(sortable);
};

// Done choosing addresses, add them to the compose form
ZmContactPicker.prototype._okButtonListener =
function(ev) {
	var data = this._chooser.getItems();
	DwtDialog.prototype._buttonListener.call(this, ev, [data]);
}

// Call custom popdown method
ZmContactPicker.prototype._cancelButtonListener =
function(ev) {
	DwtDialog.prototype._buttonListener.call(this, ev);
	this.popdown();
};

ZmContactPicker._keyPressHdlr =
function(ev) {
    var stb = DwtUiEvent.getDwtObjFromEvent(ev);
	var charCode = DwtKeyEvent.getCharCode(ev);
	if (stb._keyPressCallback && (charCode == 13 || charCode == 3)) {
		stb._keyPressCallback.run();
	    return false;
	}
	return true;
};

ZmContactPicker._onclickHdlr =
function(ev) {
	var stb = DwtUiEvent.getDwtObjFromEvent(ev);
	if (!stb._searchCleared) {
		stb._searchField.className = stb._searchField.value = "";
		stb._searchCleared = true;
	}
};

/***********************************************************************************/

/**
* This class creates a specialized chooser for the contact picker.
*
* @param parent			[DwtComposite]	the contact picker
* @param buttonInfo		[array]			transfer button IDs and labels
*/
ZmContactChooser = function(params) {
	this._appCtxt = params.appCtxt;
	DwtChooser.call(this, params);
};

ZmContactChooser.prototype = new DwtChooser;
ZmContactChooser.prototype.constructor = ZmContactChooser;

ZmContactChooser.prototype._createSourceListView =
function() {
	return new ZmContactChooserSourceListView(this, this._appCtxt);
};

ZmContactChooser.prototype._createTargetListView =
function() {
	return new ZmContactChooserTargetListView(this, (this._buttonInfo.length > 1), this._appCtxt);
};

/*
* The item is a AjxEmailAddress. Its address is used for comparison.
*
* @param item	[AjxEmailAddress]	an email address
* @param list	[AjxVector]			list to check in
*/
ZmContactChooser.prototype._isDuplicate =
function(item, list) {
	return list.containsLike(item, item.getAddress);
};

/***********************************************************************************/

/**
* This class creates a specialized source list view for the contact chooser.
*/
ZmContactChooserSourceListView = function(parent, appCtxt) {
	DwtChooserListView.call(this, parent, DwtChooserListView.SOURCE);

	this.setScrollStyle(Dwt.CLIP);
	this._appCtxt = appCtxt;
};

ZmContactChooserSourceListView.prototype = new DwtChooserListView;
ZmContactChooserSourceListView.prototype.constructor = ZmContactChooserSourceListView;

ZmContactChooserSourceListView.prototype.toString =
function() {
	return "ZmContactChooserSourceListView";
};

ZmContactChooserSourceListView.prototype._getHeaderList =
function() {
	var headerList = [];
	headerList.push(new DwtListHeaderItem(ZmItem.F_TYPE, null, "Folder", 20));
	headerList.push(new DwtListHeaderItem(ZmItem.F_NAME, ZmMsg._name, null, 100));
	headerList.push(new DwtListHeaderItem(ZmItem.F_EMAIL, ZmMsg.email));

	return headerList;
};

ZmContactChooserSourceListView.prototype._mouseOverAction =
function(ev, div) {
	DwtChooserListView.prototype._mouseOverAction.call(this, ev, div);
	var id = ev.target.id || div.id;
	var item = this.getItemFromElement(div);

	if (id && item) {
		var contact = item.__contact;
		if (contact) {
			var tt = contact.getToolTip(item.address, contact.isGal);
			this.setToolTipContent(tt);
		} else {
			this.setToolTipContent(item.address);
		}
	} else {
		this.setToolTipContent(null);
	}

	return true;
};

ZmContactChooserSourceListView.prototype._getCellContents =
function(html, idx, item, field, colIdx, params) {
	return ZmContactsHelper._getEmailField(html, idx, item, field, colIdx, params);
};

/***********************************************************************************/

/**
* This class creates a specialized target list view for the contact chooser.
*/
ZmContactChooserTargetListView = function(parent, showType, appCtxt) {
	this._showType = showType; // call before base class since base calls getHeaderList

	DwtChooserListView.call(this, parent, DwtChooserListView.TARGET);

	this.setScrollStyle(Dwt.CLIP);
	this._appCtxt = appCtxt;
};

ZmContactChooserTargetListView.prototype = new DwtChooserListView;
ZmContactChooserTargetListView.prototype.constructor = ZmContactChooserTargetListView;

ZmContactChooserTargetListView.prototype.toString =
function() {
	return "ZmContactChooserTargetListView";
};

ZmContactChooserTargetListView.prototype._getHeaderList =
function() {
	var headerList = [];
	if (this._showType) {
		headerList.push(new DwtListHeaderItem(ZmItem.F_TYPE, null, "ContactsPicker", 20));
	}
	headerList.push(new DwtListHeaderItem(ZmItem.F_NAME, ZmMsg._name, null, 100));
	headerList.push(new DwtListHeaderItem(ZmItem.F_EMAIL, ZmMsg.email));

	return headerList;
};

ZmContactChooserTargetListView.prototype._mouseOverAction =
ZmContactChooserSourceListView.prototype._mouseOverAction;

// The items are AjxEmailAddress objects
ZmContactChooserTargetListView.prototype._getCellContents =
function(html, idx, item, field, colIdx, params) {
	if (field == ZmItem.F_TYPE) {
		item.setType(item._buttonId);
		html[idx++] = ZmMsg[item.getTypeAsString()];
		html[idx++] = ":";
	} else {
		idx = ZmContactsHelper._getEmailField(html, idx, item, field, colIdx);
	}
	return idx;
};
