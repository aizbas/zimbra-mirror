/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
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

/**
 * Creates an address input field that shows addresses as bubbles.
 * @constructor
 * @class
 * This class creates and manages a control for entering email addresses and displaying
 * them in bubbles. An address's surrounding bubble can be used to remove it, or, if the
 * address is a distribution list, expand it.
 *
 * It is not a DwtInputField. If you don't want bubbles, use that instead.
 *
 * @author Conrad Damon
 *
 * @param {ZmAutocompleteListView}	autocompleteListView
 * @param {string}      			params.inputId			an explicit ID to use for the control's INPUT element
 */
ZmAddressInputField = function(params) {

	params.parent = params.parent || appCtxt.getShell();
	params.className = params.className || "addrBubbleContainer";
	DwtControl.call(this, params);

	this._initialize(params);

	if (params.autocompleteListView) {
		this.setAutocompleteListView(params.autocompleteListView);
		this._bubbleAddedCallback = params.bubbleAddedCallback;
		this._bubbleRemovedCallback = params.bubbleRemovedCallback;
	}

	this._bubbleClassName = "addrBubble";
	this._selectedBubbleClassName = this._bubbleClassName + "-" + DwtCssStyle.SELECTED;

	this._reset();
};

ZmAddressInputField.prototype = new DwtControl;
ZmAddressInputField.prototype.constructor = ZmAddressInputField;

ZmAddressInputField.prototype.TEMPLATE = "share.Widgets#ZmAddressInputField";

ZmAddressInputField.prototype.toString =
function() {
	return "ZmAddressInputField";
};

// tie a bubble SPAN to a widget that can handle clicks
ZmAddressInputField.BUBBLE_OBJ_ID = {};

ZmAddressInputField.prototype.setAutocompleteListView =
function(aclv) {

	this._aclv = aclv;
	this._separator = (aclv._separator) || AjxEmailAddress.SEPARATOR;
	aclv.addCallback(ZmAutocompleteListView.CB_KEYPRESS, new AjxCallback(this, this._keyPressCallback), this._inputId);
	aclv.addCallback(ZmAutocompleteListView.CB_ADDR_FOUND, new AjxCallback(this, this._addrFoundCallback), this._inputId);
};

/**
 * Creates a bubble for the given address and adds it into the holding area.
 *
 * @param {string}					address		address text to go in the bubble
 * @param {ZmAutocompleteMatch}		match		match object (optional)
 * @param {boolean}	dontCallBubbleAddedCallback  this is for the case the bubble was added by the compose view and it already takes care of what needed to be done on add
 */
ZmAddressInputField.prototype.add =
function(address, match, dontCallBubbleAddedCallback) {

	if (!address) { return; }

	// if it's a local group, expand it and add each address separately
	if (match && match.isGroup && match.type == ZmAutocomplete.AC_TYPE_CONTACT) {
		var addrs = AjxEmailAddress.split(address);
		for (var i = 0, len = addrs.length; i < len; i++) {
			this._add(addrs[i].toString(), match);
		}
	}
	else {
		this._add(address, match);
	}

	this._input.value = "";


	if (this._bubbleAddedCallback && !dontCallBubbleAddedCallback) {
		this._bubbleAddedCallback.run();
	}
};

ZmAddressInputField.prototype._add =
function(address, match) {

	var params = {
		address:	address,
		returnSpan:	true,
		className:	this._bubbleClassName,
		canRemove:	true,
		canExpand:	match && match.isDL,
		dlAddress:	match && match.email,
		separator:	this._separator,
		parentId:	this._htmlElId
	};
	var bubble = ZmAddressInputField.getBubble(params);

	var bubbleId = bubble.id;
	this._bubble[bubbleId] = bubble;
	this._addresses.push(address);
	this._addressHash[address] = true;
	this._bubbleAddress[bubbleId] = address;

	this._holder.appendChild(bubble);
	Dwt.setHandler(bubble, DwtEvent.ONCLICK, ZmAddressInputField.onClick);
	this.focus();
};

/**
 * Generates HTML content for an address bubble and returns either HTML, or the bubble
 * itself (a SPAN).
 *
 * @param {hash}		params		a hash of params:
 * @param {string}		id			element ID for the bubble (optional)
 * @param {string}		className	CSS class for the bubble (optional)
 * @param {string}		address		email address to display in the bubble
 * @param {boolean}		canRemove	if true, an x will be provided to remove the address bubble
 * @param {boolean}		canExpand	if true, a + will be provided to expand the DL address
 * @param {boolean}		returnSpan	if true, return SPAN element rather than HTML
 * @param {string}		separator	address separator - hidden, present for copy of text (optional)
 *
 * @return {Element|string}	SPAN element or HTML string
 */
ZmAddressInputField.getBubble =
function(params) {

	params = params || {};
	var id = params.id || Dwt.getNextId();
	var className = params.className || "addrBubble";
	var address = AjxStringUtil.htmlEncode(params.address);

	var expandLinkText = "", removeLinkText = "";
	var style = "display:inline-block;cursor:pointer;";
	if (AjxEnv.isIE) {
		// hack - IE won't display block elements inline via inline-block
		style = style + "*display:inline;zoom:1;";
	}

	if (params.canRemove) {
		var removeLinkId = id + "_remove";
		var removeLink = 'ZmAddressInputField.removeBubble("' + id + '");';
		var removeLinkText = AjxImg.getImageHtml("BubbleDelete", style, "id='" + removeLinkId + "' onclick='" + removeLink + "'");
	}

	if (params.canExpand) {
		var addr = params.dlAddress || params.address;
		var expandLinkId = id + "_expand";
		var expandLink = 'ZmAddressInputField.expandBubble("' + id + '","' + addr + '");';
		var expStyle = style + "margin-right:3px;";
		var expandLinkText = AjxImg.getImageHtml("BubbleExpand", expStyle, "id='" + expandLinkId + "' onclick='" + expandLink + "'");
	}

	if (params.separator) {
		var sep = AjxStringUtil.trim(params.separator);
		var separator = "<span style='visibility:hidden'>" + sep + "</span>";
	}

	var content = expandLinkText + address + separator + removeLinkText;
	if (params.returnSpan) {
		var bubble = document.createElement("span");
		bubble.id = id;
		if (params.parentId) {
			bubble._aifId = params.parentId;
		}
		bubble.className = className;
		bubble.innerHTML = content;
		return bubble;
	} else {
		if (params.parentId) {
			ZmAddressInputField.BUBBLE_OBJ_ID[id] = params.parentId;
		}
		var html = [], idx = 0;
		html[idx++] = "<span class='" + className + "' id='" + id + "'>";
		html[idx++] = content;
		html[idx++] = "</span>";
		return html.join("");
	}
};

/**
 * Removes all bubbles from the holding area.
 */
ZmAddressInputField.prototype.clear =
function() {

	for (var id in this._bubble) {
		this.removeBubble(id);
	}
	this._reset();
};

/**
 * Returns a string of concatenated bubble addresses.
 */
ZmAddressInputField.prototype.getValue =
function() {

	var list = [].concat(this._addresses);
	if (this._input.value) {
		list.push(this._input.value);
	}
	return list.join(this._separator);
};

/**
 * Parses the given text into email addresses, and adds a bubble for each one
 * that we don't already have. Any part that doesn't parse is left in the input.
 *
 * @param {string}	text	email addresses
 * @param {boolean}	add		if true, control is not cleared first
 * @param {boolean}	dontCallBubbleAddedCallback  this is for the case the bubble was added by the compose view picker, or paste, or any other case that already takes care of what needed to be done on add
 */
ZmAddressInputField.prototype.setValue =
function(text, add, dontCallBubbleAddedCallback) {

	if (!add) {
		this.clear();
	}
	if (!text) { return; }
	
	var parsed = AjxEmailAddress.parseEmailString(text);
	var addrs = parsed.good.getArray();
	for (var i = 0, len = addrs.length; i < len; i++) {
		var addr = addrs[i].toString();
		if (!this._addressHash[addr]) {
			this.add(addr, null, dontCallBubbleAddedCallback);
		}
	}
	if (parsed.bad && parsed.bad.size()) {
		this._input.value = parsed.bad.toString(AjxEmailAddress.SEPARATOR);
	}
	else {
		this._input.value = "";
	}
};

/**
 * Removes the selected bubble. If none are selected, selects the last one.
 */
ZmAddressInputField.prototype.handleDelete =
function() {

	if (this._selectedBubbleId) {
		ZmAddressInputField.removeBubble(this._selectedBubbleId);
	}
	else {
		var bubble = this._holder.lastChild;
		if (bubble) {
			this.setSelected(bubble.id);
		}
	}
};

/**
 * Toggles selection of the bubble with the given ID.
 *
 * @param {string}	bubbleId	ID of bubble to select
 */
ZmAddressInputField.prototype.setSelected =
function(bubbleId) {

	var bubble = this._bubble[bubbleId];
	if (!bubble) { return; }
	var curSel = this._selectedBubbleId;
	if (curSel == bubbleId) {
		bubble.className = this._bubbleClassName;
		this._selectedBubbleId = null;
	}
	else {
		bubble.className = this._selectedBubbleClassName;
		var curBubble = curSel && document.getElementById(curSel);
		if (curBubble) {
			curBubble.className = this._bubbleClassName;
		}
		this._selectedBubbleId = bubbleId;
	}
};

/**
 * Clicking a bubble toggles its selection.
 * 
 * @param ev
 */
ZmAddressInputField.onClick =
function(ev) {

	var bubble = DwtUiEvent.getTarget(ev);
	var addrInput = bubble && DwtControl.ALL_BY_ID[bubble._aifId];
	if (addrInput) {
		addrInput.setSelected(bubble.id);
	}
};

/**
 * Makes bubbles out of addresses in pasted text.
 *
 * @param ev
 */
ZmAddressInputField.onPaste =
function(ev) {

	var input = DwtUiEvent.getTarget(ev);
	var addrInput = input && DwtControl.ALL_BY_ID[input._aifId];
	if (addrInput) {
		// give browser time to update input - easier than dealing with clipboard
		AjxTimedAction.scheduleAction(new AjxTimedAction(addrInput, addrInput._handlePaste), 100);
	}
};

/**
 * Deselects selected bubble.
 *
 * @param ev
 */
ZmAddressInputField.onBlur =
function(ev) {

	var input = DwtUiEvent.getTarget(ev);
	var addrInput = input && DwtControl.ALL_BY_ID[input._aifId];
	if (addrInput && addrInput._selectedBubbleId) {
		addrInput.setSelected(addrInput._selectedBubbleId);
	}
};

ZmAddressInputField.prototype._handlePaste =
function() {

	var text = this._input.value;
	if (text) {
		this.setValue(text, true, true);
		if (this._bubbleAddedCallback) {
			//it might have not added anything. but in case we paste lots of emails, better to call the callback once (since I can't think of a case where it matters if only one bubble was added, or multiple)
			//if there will be a case like that, remove this part and the "true" 2nd param to setValue above
			this._bubbleAddedCallback.run();
		}
	}
};

// focus input when holder div is clicked
ZmAddressInputField.onHolderClick =
function(ev) {

	var holder = DwtUiEvent.getTarget(ev);
	var addrInput = holder && DwtControl.ALL_BY_ID[holder._aifId];
	if (addrInput) {
		addrInput.focus();
	}
};

/**
 * Removes the bubble with the given ID from the holding area.
 *
 * @param {string}	bubbleId	ID of bubble to remove
 * @param {boolean}	dontCallBubbleRemovedCallback
 */
ZmAddressInputField.prototype.removeBubble =
function(bubbleId, dontCallBubbleRemovedCallback) {

	var bubble = document.getElementById(bubbleId);
	if (bubble) {
		bubble.parentNode.removeChild(bubble);
	}

	var addr = this._bubbleAddress[bubbleId];
	AjxUtil.arrayRemove(this._addresses, addr);
	delete this._bubbleAddress[bubbleId];
	this._bubble[bubbleId] = null;
	delete this._bubble[bubbleId];
	delete this._addressHash[addr];
	if (bubbleId == this._selectedBubbleId) {
		this._selectedBubbleId = null;
	}

	if (this._bubbleRemovedCallback && !dontCallBubbleRemovedCallback) {
		this._bubbleRemovedCallback.run();
	}

};

/**
 * Removes the bubble with the given ID from the holding area.
 *
 * @param {string}	bubbleId	ID of bubble to remove
 * @param {boolean}	dontCallBubbleRemovedCallback
 *
 */
ZmAddressInputField.removeBubble =
function(bubbleId, dontCallBubbleRemovedCallback) {

	var bubble = document.getElementById(bubbleId);
	var parentId = bubble._aifId || ZmAddressInputField.BUBBLE_OBJ_ID[bubbleId];
	var addrInput = bubble && DwtControl.ALL_BY_ID[parentId];
	if (addrInput && addrInput.getEnabled()) {
		addrInput.removeBubble(bubbleId, dontCallBubbleRemovedCallback);
		addrInput.focus();
	}
};

/**
 * Expands the distribution list address of the bubble with the given ID.
 *
 * @param {string}	bubbleId	ID of bubble
 * @param {string}	email		address to expand
 */
ZmAddressInputField.prototype.expandBubble =
function(bubbleId, email) {

	var bubble = document.getElementById(bubbleId);
	if (bubble) {
		var loc = Dwt.getLocation(bubble);
		loc.y += Dwt.getSize(bubble).y + 2;
		this._aclv.expandDL(email, bubble.id, null, null, loc);
	}
};

/**
 * Expands the distribution list address of the bubble with the given ID.
 *
 * @param {string}	bubbleId	ID of bubble
 * @param {string}	email		address to expand
 */
ZmAddressInputField.expandBubble =
function(bubbleId, email) {

	var bubble = document.getElementById(bubbleId);
	var parentId = bubble._aifId || ZmAddressInputField.BUBBLE_OBJ_ID[bubbleId];
	var addrInput = bubble && DwtControl.ALL_BY_ID[parentId];
	if (addrInput && addrInput.getEnabled()) {
		addrInput.expandBubble(bubbleId, email);
	}
};

ZmAddressInputField.prototype.getInputElement =
function() {

	return this._input;
};

ZmAddressInputField.prototype.setEnabled =
function(enabled) {

	DwtControl.prototype.setEnabled.call(this, enabled);
	this._input.disabled = !enabled;
};

ZmAddressInputField.prototype._initialize =
function(params) {

	this._holderId = Dwt.getNextId();
	this._inputId = params.inputId || Dwt.getNextId();
	var data = {
		holderId:	this._holderId,
		inputId:	this._inputId
	};
	this._createHtmlFromTemplate(params.templateId || this.TEMPLATE, data);

	this._holder = document.getElementById(this._holderId);
	this._holder._aifId = this._htmlElId;
	this._input = document.getElementById(this._inputId);

	Dwt.setHandler(this._holder, DwtEvent.ONCLICK, ZmAddressInputField.onHolderClick);
	Dwt.setHandler(this._input, DwtEvent.ONPASTE, ZmAddressInputField.onPaste);
	Dwt.setHandler(this._input, DwtEvent.ONBLUR, ZmAddressInputField.onBlur);
};

ZmAddressInputField.prototype._reset =
function() {
	this._bubble		= {};	// bubbles by bubble ID
	this._addresses		= [];	// ordered address list
	this._addressHash	= {};	// used addresses, so we can check for dupes
	this._bubbleAddress	= {};	// addresses by bubble ID
	this._input.value	= "";
};

/**
 * Focuses on this control.
 */
ZmAddressInputField.prototype.focus =
function() {
	if (this.getEnabled()) {
		this._hasFocus = true;
		this.getInputElement().focus();
	}
};

/**
 * Blurs this control.
 */
ZmAddressInputField.prototype.blur =
function() {
	this.getInputElement().blur();
};

// deselect if user enters or removes text
ZmAddressInputField.prototype._keyPressCallback =
function(ev, aclv) {
	if (this._selectedBubbleId && ev.inputLengthChanged) {
		this.setSelected(this._selectedBubbleId);
	}
};

ZmAddressInputField.prototype._addrFoundCallback =
function(aclv, addr, delim) {

	this.add(addr);
	return true;
};
