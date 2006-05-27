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

//////////////////////////////////////////////////////////////////////////////
// ZmContactSplitView
// - parent for the simple list view and xform view
//////////////////////////////////////////////////////////////////////////////
function ZmContactSplitView(parent, className, posStyle, controller, dropTgt) {
	if (arguments.length == 0) return;

	className = className || "ZmContactSplitView";
	posStyle = posStyle || Dwt.ABSOLUTE_STYLE;
	DwtComposite.call(this, parent, className, posStyle);

	this._controller = controller;
	this._appCtxt = controller._appCtxt;

	this._addrbookTree = this._appCtxt.getTree(ZmOrganizer.ADDRBOOK);
	this._addrbookTree.addChangeListener(new AjxListener(this, this._addrbookTreeListener));

	this._tagList = this._appCtxt.getTree(ZmOrganizer.TAG);
	this._tagList.addChangeListener(new AjxListener(this, this._tagChangeListener));
	this._tagCellId = Dwt.getNextId();

	// find out if the user's locale has a alphabet defined
	this.alphabetBarEnabled = this._hasAlphabetBar = ZmMsg.alphabet && ZmMsg.alphabet.length>0;
	if (this._hasAlphabetBar) {
		this._createAlphabetHtml();
	}

	this._listPart = new ZmContactSimpleView(this, null, posStyle, controller, dropTgt);
	this._contactPart = new DwtComposite(this, "ZmContactInfoView", posStyle);

	this._changeListener = new AjxListener(this, this._contactChangeListener);

	this._contactPart._setMouseEventHdlrs(); // needed by object manager
	// this manages all the detected objects within the view
	this._objectManager = new ZmObjectManager(this._contactPart, this.shell.getData(ZmAppCtxt.LABEL));
};

ZmContactSplitView.prototype = new DwtComposite;
ZmContactSplitView.prototype.constructor = ZmContactSplitView;


// Consts
ZmContactSplitView.ALPHABET_HEIGHT = 35;

ZmContactSplitView.prototype.toString = 
function() {
	return "ZmContactSplitView";
};

ZmContactSplitView.prototype.getListView = 
function() {
	return this._listPart;
};

ZmContactSplitView.prototype.getController =
function() {
	return this._controller;
}

ZmContactSplitView.prototype.setSize = 
function(width, height) {
	DwtComposite.prototype.setSize.call(this, width-10, height-10);
	this._sizeChildren(width, height);
};

ZmContactSplitView.prototype.setBounds = 
function(x, y, width, height) {
	DwtComposite.prototype.setBounds.call(this, x, y, width-10, height-10);
	this._sizeChildren(width, height);
};

ZmContactSplitView.prototype.getTitle = 
function() {
	return [ZmMsg.zimbraTitle, ZmMsg.contacts].join(": ");
};

ZmContactSplitView.prototype.setContact = 
function(contact, isGal) {

	if (this._objectManager)
		this._objectManager.reset();

	if (!isGal) {
		// Remove and re-add listeners for current contact if exists
		if (this._contact)
			this._contact.removeChangeListener(this._changeListener);
		contact.addChangeListener(this._changeListener);
	}
	
	this._contact = contact;

	if (this._contact.isLoaded()) {
		this._setContact(contact, isGal);
	} else {
		var callback = new AjxCallback(this, this._handleResponseLoad, [isGal]);
		var errorCallback = new AjxCallback(this, this._handleErrorLoad);
		this._contact.load(callback);
	}
};

ZmContactSplitView.prototype._handleResponseLoad =
function(isGal, contact) {
	if (contact.id == this._contact.id)
		this._setContact(this._contact, isGal);
};

ZmContactSplitView.prototype._handleErrorLoad =
function(ex) {
	this._clear();
	// TODO - maybe display some kind of error?
};

ZmContactSplitView.prototype.clear = 
function() {
	// clear the right pane
	this._contactPart.getHtmlElement().innerHTML = "";
	this._htmlInitialized = false;
};

ZmContactSplitView.prototype.enableAlphabetBar =
function(enable) {
	if (this.alphabetBarEnabled == enable) return;

	this.alphabetBarEnabled = enable;

	var alphabetBarEl = document.getElementById(this._alphabetBarId);
	if (alphabetBarEl) {
		alphabetBarEl.className = enable ? "AlphabetBarTable" : "AlphabetBarTable AlphabetBarDisabled";
	}
};

ZmContactSplitView.prototype._sizeChildren = 
function(width, height) {
	var padding = 5;		// css padding value (see ZmContactSplitView css class)
	var listWidth = 200;	// fixed width size of list view

	// calc. height for children of this view
	var alphabetBarHeight = this._hasAlphabetBar ? ZmContactSplitView.ALPHABET_HEIGHT : null;
	var childHeight = (height - (padding * 2)) - (alphabetBarHeight || 0);
	// always set the list part width to 200px (should be in css?)
	this._listPart.setSize(listWidth, childHeight);
	this._listPart.setLocation(Dwt.DEFAULT, (alphabetBarHeight || Dwt.DEFAULT));

	// explicitly set the size for the xform part
	var listSize = this._listPart.getSize();
	var contactWidth = width - ((padding * 5) + listWidth);
	var contactXPos = (padding * 3) + listWidth;
	this._contactPart.setSize(contactWidth, childHeight);
	this._contactPart.setLocation(contactXPos, (alphabetBarHeight || Dwt.DEFAULT));

	this._contactPartWidth = contactWidth;
	this._contactPartHeight = childHeight;

	if (this._htmlInitialized) {
		var bodyDiv = document.getElementById(this._contactBodyId);
		bodyDiv.style.width = this._contactPartWidth;
		bodyDiv.style.height = this._contactPartHeight - 40;
	}
};

ZmContactSplitView.prototype._createHtml =
function() {
	this._contactHeaderRowId = Dwt.getNextId();
	this._contactHeaderId = Dwt.getNextId();
	this._contactBodyId = Dwt.getNextId();

	var html = new Array();
	var idx = 0;

	html[idx++] = "<table border=0 cellpadding=0 cellspacing=0 width=100% height=100%>";
	html[idx++] = "<tr class='contactHeaderRow' id='";
	html[idx++] = this._contactHeaderRowId;
	html[idx++] = "'><td width=20><center>";
	html[idx++] = AjxImg.getImageHtml("Person");
	html[idx++] = "</center></td><td width='";
	html[idx++] = this._contactPartWidth - 20;
	html[idx++] = "' id='";
	html[idx++] = this._contactHeaderId;
	html[idx++] = "'></td></tr>";
	html[idx++] = "<tr height=100%><td colspan=3 valign=top><div style='width:";
	html[idx++] = this._contactPartWidth;
	html[idx++] = "; height:";
	html[idx++] = this._contactPartHeight - 40;
	html[idx++] = "; overflow: auto' id='";
	html[idx++] = this._contactBodyId;
	html[idx++] = "'></div></td></tr></table>";

	this._contactPart.getHtmlElement().innerHTML = html.join("");

	this._htmlInitialized = true;
};

ZmContactSplitView.prototype._createAlphabetHtml =
function() {
	this._alphabetBarId = Dwt.getNextId();
	var alphabet = ZmMsg.alphabet.split(",");

	var html = new Array();
	var idx = 0;

	html[idx++] = "<center>";
	html[idx++] = "<table class='AlphabetBarTable' border=0 cellpadding=2 cellspacing=2 width=80%><tr>"

	for (var i = 0; i < alphabet.length; i++) {
		html[idx++] = "<td onclick='ZmContactSplitView._alphabetClicked(";
		if (i > 0)
			html[idx++] = '"' + alphabet[i] + '"';
		html[idx++] = "); return false;'";
		if (i == 0) {
			html[idx++] = " class='AlphabetBarCellFirst'>";
		} else {
			html[idx++] = " class='AlphabetBarCell'>";
		}
		html[idx++] = alphabet[i];
		html[idx++] = "</td>";
	}

	html[idx++] = "</tr></table>";
	html[idx++] = "</center>";

	this.getHtmlElement().innerHTML = html.join("");
};

ZmContactSplitView.prototype._contactChangeListener = 
function(ev) {
	if (ev.type != ZmEvent.S_CONTACT || ev.source != this._contact)
		return;

	this._setContact(ev.source);
};

ZmContactSplitView.prototype._addrbookTreeListener =
function(ev, treeView) {
	var fields = ev.getDetail("fields");
	if (ev.event == ZmEvent.E_MODIFY && fields && fields[ZmOrganizer.F_COLOR]) {
		var organizers = ev.getDetail("organizers");
		if (!organizers && ev.source)
			organizers = [ev.source];

		for (var i = 0; i < organizers.length; i++) {
			var organizer = organizers[i];
			var folderId = this._contact.isShared()
				? this._addrbookTree.getById(this._contact.folderId).id
				: this._contact.folderId;

			if (organizer.id == folderId)
				this._setHeaderColor(organizer);
		}
	}
};

ZmContactSplitView.prototype._generateObject =
function(data, type) {
	return this._objectManager.findObjects(data, true, type);
};

ZmContactSplitView.prototype._setContact = 
function(contact, isGal) {

	// if folderId is null, that means user did a search (did not click on a addrbook)
	var folderId = this._controller.getFolderId();
	if (folderId && contact.folderId != folderId && !contact.isShared())
		return;

	if (!this._htmlInitialized)
		this._createHtml();

	folderId = folderId || contact.folderId;
	var folder = folderId ? this._addrbookTree.getById(folderId) : null;

	this._setHeaderColor(folder);

	// set contact header (file as)
	var contactHdr = document.getElementById(this._contactHeaderId);
	var hdrHtml = new Array();
	var idx = 0;
	hdrHtml[idx++] = "<table border=0 width=100% cellpadding=0 cellspacing=0><tr><td class='contactHeader'>";
	hdrHtml[idx++] = contact.getFileAs();
	hdrHtml[idx++] = "</td><td align=right id='";
	hdrHtml[idx++] = this._tagCellId;
	hdrHtml[idx++] = "'>";
	if (this._appCtxt.get(ZmSetting.TAGGING_ENABLED)) {
		hdrHtml[idx++] = this._getTagHtml(contact);
	}
	hdrHtml[idx++] = "</td></tr></table>";

	contactHdr.innerHTML = hdrHtml.join("");

	// set body
	var contactBodyDiv = document.getElementById(this._contactBodyId);

	var width = this._contactPart.getSize().x / 2;

	var html = new Array();
	idx = 0;

	// set company name and folder this contact belongs to
	html[idx++] = "<table border=0 cellpadding=2 cellspacing=2 width=100%><tr>";
	html[idx++] = "<td width=100% class='companyName'>";
	html[idx++] = (contact.getCompanyField() || "&nbsp;");
	html[idx++] = "</td>";
	if (folder) {
		html[idx++] = "<td width=20>";
		html[idx++] = AjxImg.getImageHtml(folder.getIcon());
		html[idx++] = "</td><td class='companyFolder'>";
		html[idx++] = folder.getName();
		html[idx++] = "</td>";
	}
	html[idx++] = "</tr></table>";


	html[idx++] = "<table border=0 width=100% cellpadding=3 cellspacing=3>";

	// add email fields
	var email  = contact.getAttr(ZmContact.F_email);
	var email2 = contact.getAttr(ZmContact.F_email2);
	var email3 = contact.getAttr(ZmContact.F_email3);
	var hasEmail = email || email2 || email3;

	if (hasEmail) {
		html[idx++] = "<tr><td colspan=4 valign=top class='sectionLabel'>";
		html[idx++] = ZmMsg.email;
		html[idx++] = "</td></tr><tr><td width=5>&nbsp;</td><td class='contactOutput'>";
		if (email) 	{ html[idx++] = this._generateObject(email,  ZmObjectManager.EMAIL); html[idx++] = "<br>"; }
		if (email2) { html[idx++] = this._generateObject(email2, ZmObjectManager.EMAIL); html[idx++] = "<br>"; }
		if (email3) { html[idx++] = this._generateObject(email3, ZmObjectManager.EMAIL); html[idx++] = "<br>"; }
		html[idx++] = "</td></tr>";
		html[idx++] = "<tr><td><br></td></tr>";
	}

	// add work fields
	var workField	= AjxStringUtil.nl2br(contact.getWorkAddrField());
	var workPhone	= contact.getAttr(ZmContact.F_workPhone);
	var workPhone2	= contact.getAttr(ZmContact.F_workPhone2);
	var workFax		= contact.getAttr(ZmContact.F_workFax);
	var workAsst	= contact.getAttr(ZmContact.F_assistantPhone);
	var workCompany = contact.getAttr(ZmContact.F_companyPhone);
	var workCallback= contact.getAttr(ZmContact.F_callbackPhone);
	var workURL 	= contact.getAttr(ZmContact.F_workURL);
	var hasWork		= workField || workPhone || workPhone2 || workFax || workAsst || workCompany || workCallback || workURL;

	if (hasWork) {
		html[idx++] = "<tr><td colspan=4 valign=top class='sectionLabel'>";
		html[idx++] = ZmMsg.work;
		html[idx++] = "</td></tr>";
	
		// - column 1
		html[idx++] = "<tr><td width=5>&nbsp;</td><td valign=top width='";
		html[idx++] = width;
		html[idx++] = "'>";
		
		if (workField || workURL) {
			html[idx++] = "<div class='contactOutput'>";
			if (workField) 	html[idx++] = (workField + "<br>");
			if (workURL) 	html[idx++] = this._generateObject(workURL, ZmObjectManager.URL);
			html[idx++] = "</div>";
		}
		html[idx++] = "</td>";
	
		// - column 2
		html[idx++] = "<td valign=top><table border=0>";
		if (workPhone)		idx = this._getObjectHtml(html, idx, ZmMsg.phone, workPhone, ZmObjectManager.PHONE);
		if (workPhone2)		idx = this._getObjectHtml(html, idx, ZmMsg.phone2, workPhone2, ZmObjectManager.PHONE);
		if (workFax)		idx = this._getObjectHtml(html, idx, ZmMsg.fax, workFax, ZmObjectManager.PHONE);
		if (workAsst)		idx = this._getObjectHtml(html, idx, ZmMsg.AB_FIELD_assistantPhone, workAsst, ZmObjectManager.PHONE);
		if (workCompany)	idx = this._getObjectHtml(html, idx, ZmMsg.company, workCompany, ZmObjectManager.PHONE);
		if (workCallback)	idx = this._getObjectHtml(html, idx, ZmMsg.AB_FIELD_callbackPhone, workCallback, ZmObjectManager.PHONE);
		html[idx++] = "</table>";
		html[idx++] = "</td></tr>";
		html[idx++] = "<tr><td><br></td></tr>";
	}
	
	// add home fields
	var homeField = AjxStringUtil.nl2br(contact.getHomeAddrField());
	var homePhone = contact.getAttr(ZmContact.F_homePhone);
	var homePhone2 = contact.getAttr(ZmContact.F_homePhone2);
	var homeFax = contact.getAttr(ZmContact.F_homeFax);
	var mobile = contact.getAttr(ZmContact.F_mobilePhone);
	var pager = contact.getAttr(ZmContact.F_pager);
	var homeURL = contact.getAttr(ZmContact.F_homeURL);
	var hasHome = homeField || homePhone || homePhone2 || homeFax || mobile || pager || homeURL;

	if (hasHome) {
		html[idx++] = "<tr><td colspan=4 valign=top class='sectionLabel'>";
		html[idx++] = ZmMsg.home;
		html[idx++] = "</td></tr>";

		// - column 1
		html[idx++] = "<tr><td width=5>&nbsp;</td><td valign=top width='";
		html[idx++] = width;
		html[idx++] = "'>";

		if (homeField || homeURL) {
			html[idx++] = "<div class='contactOutput'>";
			if (homeField) 	html[idx++] = homeField + "<br>";
			if (homeURL) 	html[idx++] = this._generateObject(homeURL, ZmObjectManager.URL);
			html[idx++] = "</div>";
		}
		html[idx++] = "</td>";
	
		// - column 2
		html[idx++] = "<td valign=top><table border=0>";
		if (homePhone)		idx = this._getObjectHtml(html, idx, ZmMsg.phone, homePhone, ZmObjectManager.PHONE);
		if (homePhone2)		idx = this._getObjectHtml(html, idx, ZmMsg.phone2, homePhone2, ZmObjectManager.PHONE);
		if (homeFax)		idx = this._getObjectHtml(html, idx, ZmMsg.fax, homeFax, ZmObjectManager.PHONE);
		if (mobile)			idx = this._getObjectHtml(html, idx, ZmMsg.mobile, mobile, ZmObjectManager.PHONE);
		if (pager)			idx = this._getObjectHtml(html, idx, ZmMsg.AB_FIELD_pager, pager, ZmObjectManager.PHONE);
		html[idx++] = "</table></td></tr>";
		html[idx++] = "<tr><td><br></td></tr>";
	}
	
	// add other fields
	var otherField = AjxStringUtil.nl2br(contact.getOtherAddrField());
	var otherPhone = contact.getAttr(ZmContact.F_otherPhone);
	var otherFax = contact.getAttr(ZmContact.F_otherFax);
	var otherURL = contact.getAttr(ZmContact.F_otherURL);
	var hasOther = otherField || otherPhone || otherFax || otherURL;

	if (hasOther) {
		html[idx++] = "<tr><td colspan=4 valign=top class='sectionLabel'>";
		html[idx++] = ZmMsg.other;
		html[idx++] = "</td></tr>";

		// - column 1
		html[idx++] = "<tr><td width=5>&nbsp;</td><td valign=top width='";
		html[idx++] = width;
		html[idx++] = "'>";
	
		if (otherField || otherURL) {
			html[idx++] = "<div class='contactOutput'>";
			if (otherField) html[idx++] = otherField + "<br>";
			if (otherURL) 	html[idx++] = this._generateObject(otherURL, ZmObjectManager.URL);
			html[idx++] = "</div>";
		}
		html[idx++] = "</td>";
	
		// - column 2
		html[idx++] = "<td valign=top><table border=0>";
		if (otherPhone)		idx = this._getObjectHtml(html, idx, ZmMsg.AB_FIELD_otherPhone, otherPhone, ZmObjectManager.PHONE);
		if (otherFax)		idx = this._getObjectHtml(html, idx, ZmMsg.AB_FIELD_otherFax, otherFax, ZmObjectManager.PHONE);
		html[idx++] = "</table></td></tr>";
		html[idx++] = "<tr><td><br></td></tr>";
	}

	// add notes field
	var notes = this._generateObject(contact.getAttr(ZmContact.F_notes));
	if (notes) {
		html[idx++] = "<tr><td valign=top colspan=4 class='sectionLabel'>";
		html[idx++] = ZmMsg.notes;
		html[idx++] = "</td></tr><tr><td colspan=4 class='contactOutput'>";
		html[idx++] = AjxStringUtil.nl2br(notes);
		html[idx++] = "<br><br></td></tr>";
	}

	html[idx++] = "</table>";
	html[idx++] = "</div>";
	
	contactBodyDiv.innerHTML = html.join("");
};

ZmContactSplitView.prototype._getTagHtml =
function(contact) {
	var html = new Array();
	var idx = 0;

	// get sorted list of tags for this msg
	var ta = new Array();
	for (var i = 0; i < contact.tags.length; i++)
		ta.push(this._tagList.getById(contact.tags[i]));
	ta.sort(ZmTag.sortCompare);

	for (var j = 0; j < ta.length; j++) {
		var tag = ta[j];
		if (!tag) continue;
		var icon = ZmTag.COLOR_MINI_ICON[tag.color];
		var attr = ["id='", this._tagCellId, tag.id, "'"].join("");
		// XXX: set proper class name for link once defined!
		html[idx++] = "<a href='javascript:;' class='' onclick='ZmContactSplitView._tagClicked(";
		html[idx++] = '"' + tag.id + '"';
		html[idx++] = "); return false;'>"
		html[idx++] = AjxImg.getImageSpanHtml(icon, null, attr, tag.name);
		html[idx++] = "</a>&nbsp;";
	}
	return html.join("");
};

ZmContactSplitView.prototype._getObjectHtml = 
function(html, idx, label, field, objMgr) {
	html[idx++] = "<tr><td class='contactLabel'>";
	html[idx++] = label;
	html[idx++] = ":</td><td class='contactOutput'>";
	html[idx++] = this._generateObject(field, objMgr);
	html[idx++] = "</td></tr>";

	return idx;
};

ZmContactSplitView.prototype._setHeaderColor =
function(folder) {
	// set background color of header
	var color = folder ? folder.color : ZmAddrBook.DEFAULT_COLOR;
	var bkgdColor = ZmOrganizer.COLOR_TEXT[color] + "Bg";
	var contactHdrRow = document.getElementById(this._contactHeaderRowId);
	contactHdrRow.className = "contactHeaderRow " + bkgdColor;
};

ZmContactSplitView.prototype._tagChangeListener =
function(ev) {
	if (ev.type != ZmEvent.S_TAG)
		return;

	var fields = ev.getDetail("fields");
	var changed = fields && (fields[ZmOrganizer.F_COLOR] || fields[ZmOrganizer.F_NAME]);
	if ((ev.event == ZmEvent.E_MODIFY && changed) ||
		ev.event == ZmEvent.E_DELETE ||
		ev.event == ZmEvent.MODIFY)
	{
		var tagCell = document.getElementById(this._tagCellId);
		tagCell.innerHTML = this._getTagHtml(this._contact);
	}
};

ZmContactSplitView._alphabetClicked =
function(letter) {
	var appCtxt = window._zimbraMail._appCtxt;
	var clc = appCtxt.getApp(ZmZimbraMail.CONTACTS_APP).getContactListController();
	if (clc.getParentView().alphabetBarEnabled)
		clc.searchAlphabet(letter);
};

ZmContactSplitView._tagClicked =
function(tagId) {
	var appCtxt = window._zimbraMail._appCtxt;
	var sc = appCtxt ? appCtxt.getSearchController() : null;
	if (sc) {
		var tag = appCtxt.getTree(ZmOrganizer.TAG).getById(tagId);
		var query = 'tag:"' + tag.name + '"';
		sc.search({query: query});
	}
};

//////////////////////////////////////////////////////////////////////////////
// ZmContactSimpleView
// - a simple contact list view (contains only full name)
//////////////////////////////////////////////////////////////////////////////
function ZmContactSimpleView(parent, className, posStyle, controller, dropTgt) {
	className = className || "ZmContactSimpleView";
	ZmContactsBaseView.call(this, parent, className, posStyle, ZmController.CONTACT_SIMPLE_VIEW, controller, null, dropTgt);
};

ZmContactSimpleView.prototype = new ZmContactsBaseView;
ZmContactSimpleView.prototype.constructor = ZmContactSimpleView;

ZmContactSimpleView.prototype.toString = 
function() {
	return "ZmContactSimpleView";
};

ZmContactSimpleView.prototype.set =
function(list, defaultColumnSort) {
	ZmContactsBaseView.prototype.set.call(this, list, defaultColumnSort, this._controller.getFolderId());
	if (!(this._list instanceof AjxVector) || this._list.size() == 0) {
		this.parent.clear();
		this._controller._navToolBar.setText("");
	}

	this.parent.enableAlphabetBar(!list.isGal);
};

ZmContactSimpleView.prototype._modifyContact =
function(ev) {
	ZmContactsBaseView.prototype._modifyContact.call(this, ev);
	
	if (ev.getDetail("fileAsChanged")) {
		var selected = this.getSelection()[0];
		this._layout();
		this.setSelection(selected, true);
	}
};

ZmContactSimpleView.prototype._layout =
function() {
	// explicitly remove each child (setting innerHTML causes mem leak)
	while (this._parentEl.hasChildNodes()) {
		cDiv = this._parentEl.removeChild(this._parentEl.firstChild);
		AjxCore.unassignId(cDiv._itemIndex);
	}

	var size = this._list.size();
	for (var i = 0; i < size; i++) {
		var item = this._list.get(i);
		var div = item ? this._createItemHtml(item, this._now) : null;
		if (div)
			this._addRow(div);
	}
};

ZmContactSimpleView.prototype._createItemHtml =
function(contact, now, isDndIcon) {

	// in canonical view, don't show contacts in the Trash
	if (contact.list.isCanonical && (contact.folderId == ZmFolder.ID_TRASH))
		return null;

	var div = this._getDiv(contact, isDndIcon);
	
	if (isDndIcon) {
		div.style.width = "175px";
		div.style.padding = "4px";
	}
	div.className = div._styleClass = div._styleClass + " SimpleContact";
	div._selectedStyleClass += " SimpleContact";
	// XXX: commented out b/c slows down loading contact (DOM tree is too deep!)
	//div._hoverStyleClass = "SimpleContactHover";
	div.id = this._getItemId(contact);

	var htmlArr = new Array();
	var idx = 0;

	// table/row
	idx = this._getTable(htmlArr, idx, isDndIcon);
	idx = this._getRow(htmlArr, idx, contact);

	// icon
	htmlArr[idx++] = "<td style='vertical-align:middle;' width=16>";
	htmlArr[idx++] = AjxImg.getImageHtml("Person");
	htmlArr[idx++] = "</td>";

	// file as
	htmlArr[idx++] = "<td style='vertical-align:middle;'>&nbsp;";
	htmlArr[idx++] = AjxStringUtil.htmlEncode(contact.getFileAs());
	htmlArr[idx++] = AjxEnv.isNav ? ZmListView._fillerString : "";
	htmlArr[idx++] = "</td>";

	// tags
	if (this._appCtxt.get(ZmSetting.TAGGING_ENABLED)) {
		var cellId = this._getFieldId(contact, ZmItem.F_TAG_CELL);
		htmlArr[idx++] = "<td style='vertical-align:middle;' width=16 class='Tag' id='";
		htmlArr[idx++] = cellId;
		htmlArr[idx++] = "'>";
		htmlArr[idx++] = this._getTagImgHtml(contact, ZmItem.F_TAG);
		htmlArr[idx++] = "</td>";
	}
	
	htmlArr[idx++] = "</tr></table>";

	div.innerHTML = htmlArr.join("");

	return div;
};

// this is used by mixed view to create the old listview version of contact list
ZmContactSimpleView.prototype._createContactHtmlForMixed =
function(contact, now, isDndIcon) {
	var	div = this._getDiv(contact, isDndIcon);
	div.className = div._styleClass;

	var htmlArr = new Array();
	var idx = 0;

	// Table
	idx = this._getTable(htmlArr, idx, isDndIcon);

	// Row
	idx = this._getRow(htmlArr, idx, contact);
	
	for (var i = 0; i < this._headerList.length; i++) {
		var id = this._headerList[i]._id;
		// IE does not obey box model properly so we over compensate :(
		var width = AjxEnv.isIE ? (this._headerList[i]._width + 4) : this._headerList[i]._width;

		if (id.indexOf(ZmListView.FIELD_PREFIX[ZmItem.F_ICON]) == 0) {
			// Type icon
			idx = this._getField(htmlArr, idx, contact, ZmItem.F_ITEM_TYPE, i);
		} else if (id.indexOf(ZmListView.FIELD_PREFIX[ZmItem.F_FLAG]) == 0) {
			// Flag
			idx = this._getField(htmlArr, idx, contact, ZmItem.F_FLAG, i);
		} else if (id.indexOf(ZmListView.FIELD_PREFIX[ZmItem.F_TAG]) == 0) {
			// Tags
			idx = this._getField(htmlArr, idx, contact, ZmItem.F_TAG, i);
		} else if (id.indexOf(ZmListView.FIELD_PREFIX[ZmItem.F_PARTICIPANT]) == 0) {
			// Name (fileAs)
			htmlArr[idx++] = "<td width=" + width;
			htmlArr[idx++] = " id='" + this._getFieldId(contact, ZmItem.F_PARTICIPANT) + "'>";
			htmlArr[idx++] = AjxStringUtil.htmlEncode(contact.getFileAs());
			if (AjxEnv.isNav)
				htmlArr[idx++] = ZmListView._fillerString;
			htmlArr[idx++] = "</td>";
		} else if (id.indexOf(ZmListView.FIELD_PREFIX[ZmItem.F_ATTACHMENT]) == 0) {
			// Attachment icon
			idx = this._getField(htmlArr, idx, contact, ZmItem.F_ATTACHMENT, i);
		} else if (id.indexOf(ZmListView.FIELD_PREFIX[ZmItem.F_SUBJECT]) == 0) {
			// Company
			htmlArr[idx++] = "<td id='" + this._getFieldId(contact, ZmItem.F_COMPANY) + "'>";
			htmlArr[idx++] = AjxStringUtil.htmlEncode(contact.getCompanyField());
			htmlArr[idx++] = AjxEnv.isNav ? ZmListView._fillerString : "";
			htmlArr[idx++] = "</td>";
		} else if (id.indexOf(ZmListView.FIELD_PREFIX[ZmItem.F_DATE]) == 0) {
			htmlArr[idx++] = "<td width=" + width;
			htmlArr[idx++] = " id='" + this._getFieldId(contact, ZmItem.F_DATE) + "'>";
			htmlArr[idx++] = AjxDateUtil.computeDateStr(now, contact.modified);
			if (AjxEnv.isNav)
				htmlArr[idx++] = ZmListView._fillerString;
			htmlArr[idx++] = "</td>";
		}
	}
	htmlArr[idx++] = "</tr></table>";

	div.innerHTML = htmlArr.join("");
	return div;
};
