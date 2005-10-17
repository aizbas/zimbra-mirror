/**
* Creates a new tab view that can be used to overload DwtTabView base class methods
* @constructor
* @class
*
* @author Parag Shah
* @param parent			the element that created this view
* @param appCtxt 		app context
* @param className 		class name for this view
* @param posStyle		positioning style
*/
function ZmApptTabViewPage(parent, appCtxt, className, posStyle) {
	DwtTabViewPage.call(this, parent, className, posStyle);
	this.setScrollStyle(DwtControl.CLIP);
	this._appCtxt = appCtxt;
	this._rendered = false;
	this._contactsSupported = this._appCtxt.get(ZmSetting.CONTACTS_ENABLED) || this._appCtxt.get(ZmSetting.GAL_ENABLED);

	var bComposeEnabled = this._appCtxt.get(ZmSetting.HTML_COMPOSE_ENABLED);
	var composeFormat = this._appCtxt.get(ZmSetting.COMPOSE_AS_FORMAT);
	this._composeMode = this._defaultComposeMode = bComposeEnabled && composeFormat == ZmSetting.COMPOSE_HTML
		? DwtHtmlEditor.HTML : DwtHtmlEditor.TEXT;
	this._supportTimeZones = this._appCtxt.get(ZmSetting.CAL_SHOW_TIMEZONE);

	this._attachCount = 0;
};

ZmApptTabViewPage.prototype = new DwtTabViewPage;
ZmApptTabViewPage.prototype.constructor = ZmApptTabViewPage;

ZmApptTabViewPage.prototype.toString = 
function() {
	return "ZmApptTabViewPage";
};


// Consts

ZmApptTabViewPage.ATTACH_HEIGHT = AjxEnv.isIE ? 24 : 22;
ZmApptTabViewPage.UPLOAD_FIELD_NAME = "attUpload";
ZmApptTabViewPage.ATTACH_IFRAME_NAME = Dwt.getNextId();

ZmApptTabViewPage.SHOWAS_OPTIONS = [
	{ label: ZmMsg.free, 				value: "free", 	selected: false 	},
	{ label: ZmMsg.replyTentative, 		value: "tentative", selected: false },
	{ label: ZmMsg.busy, 				value: "busy", 	selected: true },
	{ label: ZmMsg.outOfOffice,			value: "out", 	selected: false }];

ZmApptTabViewPage.REPEAT_OPTIONS = [
	{ label: ZmMsg.none, 				value: "NON", 	selected: true 	},
	{ label: ZmMsg.everyDay, 			value: "DAI", 	selected: false },
	{ label: ZmMsg.everyWeek, 			value: "WEE", 	selected: false },
	{ label: ZmMsg.everyMonth, 			value: "MON", 	selected: false },
	{ label: ZmMsg.everyYear, 			value: "YEA", 	selected: false },
	{ label: ZmMsg.custom, 				value: "CUS", 	selected: false }];


// Public

ZmApptTabViewPage.prototype.showMe = 
function() {
	if (this._rendered)
		this.parent.tabSwitched(this._tabKey);
};

ZmApptTabViewPage.prototype.initialize =
function() {
	if (!this._rendered) {
		this._createHTML();
		this._rendered = true;
		this.setComposeMode();
	}
	this._reset();
};

ZmApptTabViewPage.prototype._reset = 
function() {
	// reset the date/time values based on current time
	this._startDateField.value = this._endDateField.value = AjxDateUtil.simpleComputeDateStr(new Date());
	this._resetTimeSelect();

	// re-enable all input fields
	this.enableInputs(true);
	
	// set focus to first input element
	this._subjectField.focus();
};

ZmApptTabViewPage.prototype.cleanup = 
function() {
	if (this._recurDialog) {
		this._recurDialog.clearState();
		this._recurDialogRepeatValue = null;
	}

	// clear out all input fields
	this._subjectField.value = "";
	this._locationField.value = "";
	this._attendeesField.value = "";
	this._repeatDescField.innerHTML = "";
	this._notesHtmlEditor.clear();
	
	// reinit non-time sensitive selects option values
	this._calendarSelect.setSelectedValue("personal");
	this._showAsSelect.setSelectedValue(ZmApptTabViewPage.SHOWAS_OPTIONS[0].value);
	this._repeatSelect.setSelectedValue(ZmApptTabViewPage.REPEAT_OPTIONS[0].value);
	this._allDayCheckbox.checked = false;
	this._showTimeFields(true);

	// remove attachments if any were added
	this._removeAllAttachments();

	// reset compose view to html preference
	this.setComposeMode(this._defaultComposeMode);

	// disable all input fields
	this.enableInputs(false);
};

// Acceptable hack needed to prevent cursor from bleeding thru higher z-index'd views
ZmApptTabViewPage.prototype.enableInputs = 
function(bEnableInputs) {
	this._subjectField.disabled = !bEnableInputs;
	this._locationField.disabled = !bEnableInputs;
	this._attendeesField.disabled = !bEnableInputs;
	this._startDateField.disabled = !bEnableInputs;
	this._endDateField.disabled = !bEnableInputs;
};

ZmApptTabViewPage.prototype.isDirty =
function() {
	// any attachment activity => dirty
	if (this._gotAttachments())
		return true;

	var curFormValue = this._formValue();
	return (curFormValue.match(ZmApptComposeView.EMPTY_FORM_RE))
		? false
		: (curFormValue != this._origFormValue);
};

ZmApptTabViewPage.prototype.isValid = 
function() {
	DBG.prinln("TODO: check if all fields in appointment view tab are valid");
	return true;
};

ZmApptTabViewPage.prototype.getComposeMode = 
function() {
	return this._composeMode;
};

ZmApptTabViewPage.prototype.setComposeMode = 
function(composeMode) {
	this._composeMode = composeMode || this._composeMode;
	this._notesHtmlEditor.setMode(this._composeMode, true);
	
	// dont forget to reset the body field Id and object ref
	var bodyFieldId = this._notesHtmlEditor.getBodyFieldId();
	if (this._bodyFieldId != bodyFieldId) {
		this._bodyFieldId = bodyFieldId;
		this._bodyField = Dwt.getDomObj(this.getDocument(), this._bodyFieldId);
	}

	this._resizeNotes();
};

ZmApptTabViewPage.prototype.reEnableDesignMode = 
function() {
	if (this._composeMode == DwtHtmlEditor.HTML)
		this._notesHtmlEditor.reEnableDesignMode();
};

ZmApptTabViewPage.prototype.addAttachmentField =
function() {
	if (this._attachCount == 0) {
		this._initAttachIframe(ZmApptTabViewPage.ATTACH_HEIGHT);
	} else if (this._attachCount < 3) {
		this._attachmentRow.style.height = parseInt(this._attachmentRow.style.height) + ZmApptTabViewPage.ATTACH_HEIGHT;
		this._attachIframe.style.height = parseInt(this._attachIframe.style.height) + ZmApptTabViewPage.ATTACH_HEIGHT;
	}
	
	this._attachCount++;
	var attachRemoveId = "_att_" + Dwt.getNextId();
	var attachInputId = "_att_" + Dwt.getNextId();

	// add file input field w/in iframe
	var idoc = Dwt.getIframeDoc(this._attachIframe);
	var div = idoc.createElement("div");
	div.style.height = ZmApptTabViewPage.ATTACH_HEIGHT;

	var html = new Array();
	var i = 0;
	html[i++] = "<nobr>&nbsp;<input type='file' size=40 name='";
	html[i++] = ZmApptTabViewPage.UPLOAD_FIELD_NAME;
	html[i++] = "' id='";
	html[i++] = attachInputId;
	html[i++] = "'>&nbsp;<span onmouseover='this.style.cursor=\"pointer\"' onmouseout='this.style.cursor=\"default\"' style='color:blue;text-decoration:underline;' id='";
	html[i++] = attachRemoveId;
	html[i++] = "'>";
	html[i++] = ZmMsg.remove;
	html[i++] = "</span></nobr>";

	div.innerHTML = html.join("");

	if (this._attachDiv == null)
		this._attachDiv = Dwt.getDomObj(idoc, this._attachDivId);
	this._attachDiv.style.height = this._attachIframe.style.height;
	this._attachDiv.appendChild(div);

	// add event handlers as necessary
	var attachRemoveSpan = Dwt.getDomObj(idoc, attachRemoveId);
	attachRemoveSpan._tabViewPage = this;
	attachRemoveSpan._parentDiv = div;
	Dwt.setHandler(attachRemoveSpan, DwtEvent.ONCLICK, ZmApptTabViewPage._onClick);
	// trap key presses in IE for input field so we can ignore ENTER key (bug 961)
	if (AjxEnv.isIE) {
		var attachInputEl = Dwt.getDomObj(idoc, attachInputId);
		attachInputEl._tabViewPage = this;
		Dwt.setHandler(attachInputEl, DwtEvent.ONKEYDOWN, ZmApptTabViewPage._onKeyDown);
	}

	this._resizeNotes();
};

ZmApptTabViewPage.prototype.resize = 
function(newWidth, newHeight) {
	if (!this._rendered) return;

	if (newWidth) {
		this.setSize(newWidth);
		Dwt.setSize(this.getHtmlElement().firstChild, newWidth);
	}

	if (newHeight) {
		this.setSize(Dwt.DEFAULT, newHeight - 30);
		Dwt.setSize(this.getHtmlElement().firstChild, Dwt.DEFAULT, newHeight - 30);
		this._resizeNotes();
	}
};


// Private / protected methods

ZmApptTabViewPage.prototype._createHTML = 
function() {
	this._calcTimeOptions();
	this._createApptHtml();
	this._createSelects();
	this._createButtons();
	this._cacheFields();
	this._initNotesHtmlEditor();
	this._initAutocomplete();
	
	// add event listeners where necessary
	Dwt.setHandler(this._allDayCheckbox, DwtEvent.ONCLICK, ZmApptTabViewPage._onClick);
	Dwt.setHandler(this._repeatDescField, DwtEvent.ONCLICK, ZmApptTabViewPage._onClick);
	this._allDayCheckbox._tabViewPage = this._repeatDescField._tabViewPage = this;
	
	// save the original form data in its initialized state
	this._origFormValue = this._formValue();
};

ZmApptTabViewPage.prototype._createApptHtml = 
function() {
	var dims = this.parent.getSize();
	var half = (dims.x / 2) - 5;
	this.setSize(dims.x-2, dims.y-30);
	this._notesHtmlEditorId = Dwt.getNextId();

	var html = new Array();
	var i = 0;

	html[i++] = "<table border=0 style='table-layout:fixed; height:";
	html[i++] = dims.y-30;
	html[i++] = "px'><colgroup><col width=";
	html[i++] = half;
	html[i++] = "><col width=";
	html[i++] = half;
	html[i++] = "></colgroup><tr style='height:110px'><td valign=top><fieldset";
	if (AjxEnv.isMozilla)
		html[i++] = " style='border: 1px dotted #555555'";
	html[i++] = "><legend style='color:#555555'>";
	html[i++] = ZmMsg.details;
	html[i++] = "</legend><div style='height:";
	html[i++] = AjxEnv.isIE ? "90px;'>" : "80px;'>";
	html[i++] = this._getDetailsHtml();
	html[i++] = "</div></fieldset></td>";
	html[i++] = "<td valign=top><fieldset";
	if (AjxEnv.isMozilla)
		html[i++] = " style='border: 1px dotted #555555'";
	html[i++] = "><legend style='color:#555555'>";
	html[i++] = ZmMsg.time;
	html[i++] = "</legend><div style='height:";
	html[i++] = AjxEnv.isIE ? "90px;'>" : "80px;'>";
	html[i++] = this._getTimeHtml();
	html[i++] = "</div></fieldset>";
	html[i++] = "</td></tr><tr style='height:30px;'><td colspan=2>";
	html[i++] = this._getSchedulingHtml();
	html[i++] = "</td></tr><tr><td valign=top colspan=2 id='";
	html[i++] = this._notesHtmlEditorId;
	html[i++] = "'>";
	html[i++] = "</td></tr>";
	html[i++] = "</table>";
	
	this.getHtmlElement().innerHTML = html.join("");
};

ZmApptTabViewPage.prototype._createSelects = 
function() {
	var doc = this.getDocument();

	// create selects for details section
	this._calendarSelect = new DwtSelect(this);
	// TODO - get all folders/links w/ view set to "Appointment" we received from initial refresh block
	this._calendarSelect.addOption("Personal Calendar", true, "personal");
	var calCell = Dwt.getDomObj(doc, this._calSelectId);
	if (calCell)
		calCell.appendChild(this._calendarSelect.getHtmlElement());
	delete this._calSelectId;

	this._showAsSelect = new DwtSelect(this);
	for (var i = 0; i < ZmApptTabViewPage.SHOWAS_OPTIONS.length; i++) {
		var option = ZmApptTabViewPage.SHOWAS_OPTIONS[i];
		this._showAsSelect.addOption(option.label, option.selected, option.value);
	}
	var showAsCell = Dwt.getDomObj(doc, this._showAsSelectId);
	if (showAsCell)
		showAsCell.appendChild(this._showAsSelect.getHtmlElement());
	delete this._showAsSelectId;

	// create selects for Time section
	this._startTimeSelect = new DwtSelect(this);
	if (this._timeOptions) {
		for (var i = 0; i < this._timeOptions.length; i++) {
			var option = this._timeOptions[i];
			this._startTimeSelect.addOption(option.label, option.selected, option.value);
		}
	}
	var startTimeCell = Dwt.getDomObj(doc, this._startTimeSelectId);
	if (startTimeCell)
		startTimeCell.appendChild(this._startTimeSelect.getHtmlElement());
	delete this._startTimeSelectId;

	this._endTimeSelect = new DwtSelect(this);
	if (this._timeOptions) {
		for (var i = 0; i < this._timeOptions.length; i++) {
			var option = this._timeOptions[i];
			this._endTimeSelect.addOption(option.label, option.selected, option.value);
		}
	}
	var endTimeCell = Dwt.getDomObj(doc, this._endTimeSelectId);
	if (endTimeCell)
		endTimeCell.appendChild(this._endTimeSelect.getHtmlElement());
	delete this._endTimeSelectId;

	if (this._supportTimeZones) {
		this._endTZoneSelect = new DwtSelect(this);
		// XXX: this seems like overkill to list all 75 timezones!
		var timezones = ZmTimezones.getAbbreviatedZoneChoices();
		for (var i = 0; i < timezones.length; i++)
			this._endTZoneSelect.addOption(timezones[i].label, false, timezones[i].value);
		// init timezone to the local machine's time zone
		this._endTZoneSelect.setSelectedValue(ZmTimezones.guessMachineTimezone());
		var endTZoneCell = Dwt.getDomObj(doc, this._endTZoneSelectId);
		if (endTZoneCell)
			endTZoneCell.appendChild(this._endTZoneSelect.getHtmlElement());
		delete this._endTZoneSelectId;
	}
	
	this._repeatSelect = new DwtSelect(this);
	this._repeatSelect.addChangeListener(new AjxListener(this, this._repeatChangeListener));
	for (var i = 0; i < ZmApptTabViewPage.REPEAT_OPTIONS.length; i++) {
		var option = ZmApptTabViewPage.REPEAT_OPTIONS[i];
		this._repeatSelect.addOption(option.label, option.selected, option.value);
	}
	var repeatCell = Dwt.getDomObj(doc, this._repeatSelectId);
	if (repeatCell)
		repeatCell.appendChild(this._repeatSelect.getHtmlElement());
	delete this._repeatSelectId;
};

ZmApptTabViewPage.prototype._createButtons = 
function() {
	var doc = this.getDocument();

	var dateButtonListener = new AjxListener(this, this._dateButtonListener);
	this._startDateButton = new DwtButton(this);
	this._startDateButton.setImage("SelectPullDownArrow");
	this._startDateButton.addSelectionListener(dateButtonListener);
	this._startDateButton.setSize(20, 20);
	// reparent
	var startButtonCell = Dwt.getDomObj(doc, this._startMiniCalBtnId);
	if (startButtonCell)
		startButtonCell.appendChild(this._startDateButton.getHtmlElement());
	delete this._startMiniCalBtnId;
	
	this._endDateButton = new DwtButton(this);
	this._endDateButton.setImage("SelectPullDownArrow");
	this._endDateButton.addSelectionListener(dateButtonListener);
	this._endDateButton.setSize(20, 20);
	// reparent
	var endButtonCell = Dwt.getDomObj(doc, this._endMiniCalBtnId);
	if (endButtonCell)
		endButtonCell.appendChild(this._endDateButton.getHtmlElement());
	delete this._endMiniCalBtnId;

	this._attendeesBtnListener = new AjxListener(this, this._attendeesButtonListener);
	this._attendeesButton = new DwtButton(this);
	this._attendeesButton.setText(ZmMsg.attendees + "...");
	this._attendeesButton.setSize(80);
	this._attendeesButton.addSelectionListener(this._attendeesBtnListener);
	// reparent
	var attendeesButtonCell = Dwt.getDomObj(doc, this._attendeesBtnId);
	if (attendeesButtonCell)
		attendeesButtonCell.appendChild(this._attendeesButton.getHtmlElement());
	delete this._attendeesBtnId;
};

ZmApptTabViewPage.prototype._getDetailsHtml = 
function() {
	this._subjectFieldId 		= Dwt.getNextId();
	this._locationFieldId 		= Dwt.getNextId();
	this._calSelectId 			= Dwt.getNextId();
	this._showAsSelectId 		= Dwt.getNextId();

	var html = new Array();
	var i = 0;
	
	html[i++] = "<table border=0 width=100%>";
	html[i++] = "<tr><td width=1% class='ZmApptTabViewPageField'><sup>*</sup>";
	html[i++] = ZmMsg.subject;
	html[i++] = ":</td><td colspan=4><input style='width:100%; height:22px' type='text' id='";
	html[i++] = this._subjectFieldId;
	html[i++] = "'></td></tr>";
	html[i++] = "<tr><td width=1% class='ZmApptTabViewPageField'>";
	html[i++] = ZmMsg.location;
	html[i++] = ":</td><td colspan=4><input style='width:100%; height:22px' type='text' id='";
	html[i++] = this._locationFieldId;
	html[i++] = "'></td></tr>";
	html[i++] = "<tr><td width=1% class='ZmApptTabViewPageField'>";
	html[i++] = ZmMsg.calendar;
	html[i++] = ":</td><td width=1% id='"
	html[i++] = this._calSelectId;
	html[i++] = "'></td><td width=1% class='ZmApptTabViewPageField'>";
	html[i++] = ZmMsg.showAs;
	html[i++] = "</td><td width=1% id='";
	html[i++] = this._showAsSelectId;
	html[i++] = "'></td></tr>";
	html[i++] = "</td></tr></table>";
	
	return html.join("");
};

ZmApptTabViewPage.prototype._getTimeHtml = 
function() {
	var currDate = AjxDateUtil.simpleComputeDateStr(new Date());
	this._startDateFieldId 		= Dwt.getNextId();
	this._startMiniCalBtnId 	= Dwt.getNextId();
	this._startTimeSelectId 	= Dwt.getNextId();
	this._allDayCheckboxId 		= Dwt.getNextId();
	this._endDateFieldId 		= Dwt.getNextId();
	this._endMiniCalBtnId 		= Dwt.getNextId();
	this._endTimeSelectId 		= Dwt.getNextId();
	this._endTZoneSelectId 		= Dwt.getNextId();
	this._repeatSelectId 		= Dwt.getNextId();
	this._repeatDescId 			= Dwt.getNextId();

	var html = new Array();
	var i = 0;
	
	html[i++] = "<table border=0 width=1%>";
	html[i++] = "<tr><td class='ZmApptTabViewPageField'>";
	html[i++] = ZmMsg.start;
	html[i++] = ":</td><td>";
	html[i++] = "<table border=0 cellpadding=0 cellspacing=0><tr><td>";
	html[i++] = "<input style='height:22px;' type='text' size=11 maxlength=10 id='";
	html[i++] = this._startDateFieldId;
	html[i++] = "' value='";
	html[i++] = currDate;
	html[i++] = "'></td><td id='";
	html[i++] = this._startMiniCalBtnId;
	html[i++] = "'></td>";
	html[i++] = "</tr></table></td>";
	html[i++] = "<td>@</td><td id='";
	html[i++] = this._startTimeSelectId;
	html[i++] = "'></td><td width=1%><input type='checkbox' id='";
	html[i++] = this._allDayCheckboxId;
	html[i++] = "'></td><td><nobr>";
	html[i++] = ZmMsg.allDayEvent;
	html[i++] = "</td></tr><tr><td class='ZmApptTabViewPageField'>";
	html[i++] = ZmMsg.end;
	html[i++] = ":</td><td>";
	html[i++] = "<table border=0 cellpadding=0 cellspacing=0><tr><td>";
	html[i++] = "<input style='height:22px;' type='text' size=11 maxlength=10 id='";
	html[i++] = this._endDateFieldId;
	html[i++] = "' value='";
	html[i++] = currDate;
	html[i++] = "'></td><td id='";
	html[i++] = this._endMiniCalBtnId;
	html[i++] = "'></td>";
	html[i++] = "</tr></table></td>";
	html[i++] = "<td>@</td><td id='";
	html[i++] = this._endTimeSelectId;
	html[i++] = "'></td>";
	if (this._supportTimeZones) {
		html[i++] = "<td colspan=2 id='";
		html[i++] = this._endTZoneSelectId;
		html[i++] = "'></td>";
	}
	html[i++] = "</tr>";
	html[i++] = "<tr><td class='ZmApptTabViewPageField'>";
	html[i++] = ZmMsg.repeat;
	html[i++] = ":</td><td colspan=2 id='";
	html[i++] = this._repeatSelectId;
	html[i++] = "'><td colspan=10><span id='";
	html[i++] = this._repeatDescId;
	html[i++] = "' onmouseover='this.style.cursor=\"pointer\"' onmouseout='this.style.cursor=\"default\"' style='color:blue;text-decoration:underline;'";
	html[i++] = "></span></td>";
	html[i++] = "</tr>";
	html[i++] = "</table>";

	return html.join("");
};

ZmApptTabViewPage.prototype._getSchedulingHtml = 
function() {
	this._attendeesBtnId = Dwt.getNextId();
	this._attendeesFieldId = Dwt.getNextId();
	
	var html = new Array();
	var i = 0;
	
	html[i++] = "<table border=0 width=100%><tr>";
	if (this._contactsSupported) {
		html[i++] = "<td width=1% id='";
		html[i++] = this._attendeesBtnId;
		html[i++] = "'></td>";
	} else {
		html[i++] = "<td width=1% align=right>";
		html[i++] = ZmMsg.attendees;
		html[i++] = ":</td>";
	}
	html[i++] = "<td><input style='width:100%; height:22px' type='text' id='";
	html[i++] = this._attendeesFieldId;
	html[i++] = "'></td>";
	html[i++] = "</tr></table>";
	
	return html.join("");
};

ZmApptTabViewPage.prototype._initNotesHtmlEditor = 
function() {
	var doc = this.getDocument();

	// add notes html editor
	this._notesHtmlEditor = new ZmHtmlEditor(this, null, null, null, this._composeMode, this._appCtxt);
	var notesHtmlEditorDiv = Dwt.getDomObj(doc, this._notesHtmlEditorId);
	if (notesHtmlEditorDiv)
		notesHtmlEditorDiv.appendChild(this._notesHtmlEditor.getHtmlElement());
	delete this._notesHtmlEditorId;

	this._bodyField = Dwt.getDomObj(doc, this._notesHtmlEditor.getBodyFieldId());
	this._resizeNotes();
};

ZmApptTabViewPage.prototype._initAutocomplete = 
function() {
	if (this._autocomplete || !this._appCtxt.get(ZmSetting.CONTACTS_ENABLED))
		return;

	var shell = this._appCtxt.getShell();
	var contactsApp = shell ? shell.getData(ZmAppCtxt.LABEL).getApp(ZmZimbraMail.CONTACTS_APP) : null;
	var contactsList = contactsApp ? contactsApp.getContactList : null;
	var locCallback = new AjxCallback(this, this._getAcListLoc, this);
	var compCallback = new AjxCallback(this, this._handleAutoCompleteData);

	this._autocomplete = new ZmAutocompleteListView(this._appCtxt.getShell(), null, 
														  contactsApp, contactsList, 
														  ZmContactList.AC_VALUE_EMAIL, 
														  locCallback, compCallback);
	this._autocomplete.handle(this._attendeesField);
};

// cache all input fields so we dont waste time traversing DOM each time
ZmApptTabViewPage.prototype._cacheFields = 
function() {
	var doc = this.getDocument();
	
	this._subjectField 		= Dwt.getDomObj(doc, this._subjectFieldId); 		delete this._subjectFieldId;
	this._locationField 	= Dwt.getDomObj(doc, this._locationFieldId); 		delete this._locationFieldId;
	this._startDateField 	= Dwt.getDomObj(doc, this._startDateFieldId); 		delete this._startDateFieldId;
	this._endDateField 		= Dwt.getDomObj(doc, this._endDateFieldId);	 		delete this._endDateFieldId;
	this._attendeesField 	= Dwt.getDomObj(doc, this._attendeesFieldId); 		delete this._attendeesFieldId;
	this._allDayCheckbox 	= Dwt.getDomObj(doc, this._allDayCheckboxId);
	this._repeatDescField 	= Dwt.getDomObj(doc, this._repeatDescId);
};

ZmApptTabViewPage.prototype._calcTimeOptions = 
function() {
	if (this._timeOptions) return;

	this._timeOptions = new Array();
	
	var today = new Date((new Date()).setHours(0,0,0,0));
	var todayDate = today.getDate();

	while (today.getDate() == todayDate) {
		var props = new Object();
		props["label"] = AjxDateUtil.computeTimeString(today);
		props["value"] = today.UTC;
		props["selected"] = false;
		this._timeOptions.push(props);
		
		// increment date by 30 mins
		today.setMinutes(today.getMinutes() + 30);
	}
};

ZmApptTabViewPage.prototype._resetTimeSelect = 
function() {
	var now = new Date();
	var nextHour = now.getMinutes() > 30;
	var startIdx = now.getHours() * 2 + (now.getMinutes() >= 30 ? 2 : 1);
	var endIdx = startIdx + 1;
	// normalize
	if (startIdx == this._timeOptions.length) {
		startIdx = 0;
		endIdx = 1;

		// and reset the start/end dates to the next day
		now.setDate(now.getDate()+1);
		var tomString = AjxDateUtil.simpleComputeDateStr(now);
		this._startDateField.value = this._endDateField.value = tomString;
	}
	
	// get the start DwtSelect object
	this._startTimeSelect.setSelected(startIdx);
	this._endTimeSelect.setSelected(endIdx);
};

ZmApptTabViewPage.prototype._initAttachIframe = 
function() {
	// create new table row which will contain parent fieldset
	var table = this.getHtmlElement().firstChild;
	this._attachmentRow = table.insertRow(2);
	this._attachmentRow.style.height = AjxEnv.isIE ? 44 : 22;
	var cell = this._attachmentRow.insertCell(-1);
	cell.colSpan = 2;

	var src = AjxEnv.isIE && location.protocol == "https:" ? "'/zimbra/public/blank.html'" : null;

	// create fieldset and containing IFRAME and append to given table cell
	var html = new Array();
	var i = 0;
	html[i++] = "<fieldset";
	if (AjxEnv.isMozilla)
		html[i++] = " style='border:1px dotted #555555'";
	html[i++] = "><legend style='color:#555555'>";
	html[i++] = ZmMsg.attachments;
	html[i++] = "</legend>";
	html[i++] = "<iframe frameborder=0 vspace=0 hspace=0 marginwidth=0 marginheight=0 width=100% scrolling=no tabindex=-1 ";
	html[i++] = "style='overflow-x:visible; overflow-y:visible; height:";
	html[i++] = ZmApptTabViewPage.ATTACH_HEIGHT;
	html[i++] = "' name='";
	html[i++] = ZmApptTabViewPage.ATTACH_IFRAME_NAME;
	html[i++] = "' id='";
	html[i++] = ZmApptTabViewPage.ATTACH_IFRAME_NAME;
	html[i++] = src ? ("' src='" + src + "'>") : "'>";
	html[i++] = "</iframe></fieldset>";
	cell.innerHTML = html.join("");

	// populate iframe document w/ empty form and DIV which will hold file input fields
	var doc = this.getDocument();
	this._uploadFormId = Dwt.getNextId();
	this._attachDivId = Dwt.getNextId();
	this._attachIframe = Dwt.getDomObj(doc, ZmApptTabViewPage.ATTACH_IFRAME_NAME);
	//this._attachIframe.name = this._attachIframe.id = 
	
	var idoc = this._attachIframe ? Dwt.getIframeDoc(this._attachIframe) : null;
	if (idoc) {
		var html = new Array();
		var i = 0;
		html[i++] = "<html><head><style type='text/css'>";
		html[i++] = "P, TD, DIV, SPAN, SELECT, INPUT, TEXTAREA, BUTTON { font-family: Tahoma, Arial, Helvetica, sans-serif;	font-size:11px; }";
		html[i++] = "</style></head><body scroll=no bgcolor='#EEEEEE'><form style='margin:0;padding:0' method='POST' enctype='multipart/form-data' action='";
		html[i++] = (location.protocol + "//" + doc.domain + this._appCtxt.get(ZmSetting.CSFE_UPLOAD_URI));
		html[i++] = "' id='";
		html[i++] = this._uploadFormId;
		html[i++] = "'><div id='";
		html[i++] = this._attachDivId;
		html[i++] = "' style='overflow:auto'></div></form></body></html>";
		idoc.write(html.join(""));
		idoc.close();
	}
};

// Returns true if any of the attachment fields are populated
ZmApptTabViewPage.prototype._gotAttachments =
function() {
	var attachIframe = Dwt.getDomObj(this.getDocument(), ZmApptTabViewPage.ATTACH_IFRAME_NAME);
	var idoc = attachIframe ? Dwt.getIframeDoc(attachIframe) : null;
	var atts = idoc ? idoc.getElementsByName(ZmComposeView.UPLOAD_FIELD_NAME) : [];

	for (var i = 0; i < atts.length; i++)
		if (atts[i].value.length)
			return true;

	return false;
};

ZmApptTabViewPage.prototype._removeAttachment = 
function(removeId) {
	// get document of attachment's iframe
	var idoc = Dwt.getIframeDoc(this._attachIframe);
	var removeSpan = idoc ? Dwt.getDomObj(idoc, removeId) : null;
	if (removeSpan) {
		// have my parent kill me
		removeSpan._parentDiv.parentNode.removeChild(removeSpan._parentDiv);
		if ((this._attachCount-1) == 0) {
			this._removeAllAttachments();
		} else {
			if (--this._attachCount < 3) {
				// reset the iframe/etc heights - yuck
				this._attachmentRow.style.height = parseInt(this._attachmentRow.style.height) - ZmApptTabViewPage.ATTACH_HEIGHT;
				this._attachIframe.style.height = parseInt(this._attachIframe.style.height) - ZmApptTabViewPage.ATTACH_HEIGHT;
				this._attachDiv.style.height = this._attachIframe.style.height;
			}
		}
		this._resizeNotes();
	}
};

ZmApptTabViewPage.prototype._removeAllAttachments = 
function() {
	if (this._attachCount == 0) return;

	// let's be paranoid and really cleanup
	delete this._uploadFormId;
	delete this._attachDivId;
	delete this._attachRemoveId;
	delete this._attachDiv;
	delete this._attachIframe;
	this._attachIframe = this._attachDiv = this._attachRemoveId = this._attachDivId = this._uploadFormId = null;
	// finally, nuke the whole table row
	var table = this.getHtmlElement().firstChild;
	table.deleteRow(2);
	delete this._attachmentRow;
	this._attachmentRow = null;
	// reset any attachment related vars
	this._attachCount = 0;
};

ZmApptTabViewPage.prototype._showTimeFields = 
function(show) {
	Dwt.setVisibility(this._startTimeSelect.getHtmlElement(), show);
	Dwt.setVisibility(this._endTimeSelect.getHtmlElement(), show);
	if (this._supportTimeZones)
		Dwt.setVisibility(this._endTZoneSelect.getHtmlElement(), show);
	// also show/hide the "@" text
	Dwt.setVisibility(this._startTimeSelect.getHtmlElement().parentNode.previousSibling, show);
	Dwt.setVisibility(this._endTimeSelect.getHtmlElement().parentNode.previousSibling, show);
};

ZmApptTabViewPage.prototype._showRecurDialog = 
function(repeatType) {
	if (!this._recurDialog) {
		this._recurDialog = new ZmApptRecurDialog(this._appCtxt.getShell(), this._appCtxt);
		this._recurDialog.addSelectionListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._recurOkListener));
		this._recurDialog.addSelectionListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this._recurCancelListener));
	}
	var type = repeatType || this._recurDialogRepeatValue;
	this._recurDialog.initialize(this._startDateField.value, this._endDateField.value, type);
	this._recurDialog.popup();
};

// Returns a string representing the form content
ZmApptTabViewPage.prototype._formValue =
function() {
	var doc = this.getDocument();
	var vals = new Array();

	vals.push(this._subjectField.value);
	vals.push(this._locationField.value);
	vals.push(this._startDateField.value);
	vals.push(this._endDateField.value);
	vals.push(this._attendeesField.value);
	vals.push(this._notesHtmlEditor.getContent());

	var str = vals.join("|");
	str = str.replace(/\|+/, "|");
	return str;
};

ZmApptTabViewPage.prototype._resizeNotes = 
function() {
	// init html editor heights
	var rows = this.getHtmlElement().firstChild.rows;
	var lastRowIdx = rows.length-1;
	var rowHeight = 0;
	for (var i = 0; i < lastRowIdx; i++)
		rowHeight += Dwt.getSize(rows[i]).y;
	rowHeight = this.getSize().y - rowHeight;
	var fudge = this._composeMode == DwtHtmlEditor.HTML ? 75 : 15;
	Dwt.setSize(this._bodyField, Dwt.DEFAULT, rowHeight-fudge);
};


// Listeners

ZmApptTabViewPage.prototype._dateButtonListener = 
function(ev) {
	// init new DwtCalendar if not already created
	if (!this._dateCalendar) {
		this._dateCalendar = new DwtCalendar(this, null, DwtControl.ABSOLUTE_STYLE);

		this._dateCalendar.skipNotifyOnPage();
		this._dateCalendar.setSize("150");
		this._dateCalendar.setZIndex(Dwt.Z_VIEW);
		var calEl = this._dateCalendar.getHtmlElement();
		calEl.style.borderWidth = "2px";
		calEl.style.borderStyle = "solid";
		calEl.style.borderColor = "#B2B2B2 #000000 #000000 #B2B2B2";
		calEl.style.backgroundImage = "url(/zimbra/skins/steel/images/bg_pebble.gif)";

		this._dateCalendar.addSelectionListener(new AjxListener(this, this._dateCalSelectionListener));
		var workingWeek = [];
		var fdow = this._appCtxt.get(ZmSetting.CAL_FIRST_DAY_OF_WEEK) || 0;
		for (var i=0; i < 7; i++) {
			var d = (i+fdow)%7;
			workingWeek[i] = (d > 0 && d < 6);
		}
		this._dateCalendar.setWorkingWeek(workingWeek);
	} else {
		// only toggle display if user clicked on same button calendar is being shown for
		if (this._dateCalendar.getHtmlElement().parentNode == ev.dwtObj.getHtmlElement())
			this._dateCalendar.setVisible(!this._dateCalendar.getVisible());
		else
			this._dateCalendar.setVisible(true);
	}
	// reparent calendar based on which button was clicked
	var calEl = this._dateCalendar.getHtmlElement();
	ev.dwtObj.getHtmlElement().appendChild(calEl);

	// always reset the date to today's date
	this._dateCalendar.setDate(new Date(), true);
};

ZmApptTabViewPage.prototype._attendeesButtonListener = 
function(ev) {
	if (!this._contactPicker) {
		var buttonInfo = [ { id: 1, value: ZmMsg.add.toLowerCase() } ];
		this._contactPicker = new ZmContactPicker(this, this._appCtxt.getShell(), this._appCtxt, buttonInfo);
		this._contactPicker.registerCallback(DwtDialog.OK_BUTTON, this._contactPickerOk, this);
		this._contactPicker.registerCallback(DwtDialog.CANCEL_BUTTON, this._contactPickerCancel, this);
	}
	this._contactPicker.popup();
};

ZmApptTabViewPage.prototype._dateCalSelectionListener = 
function(ev) {
	// get the parent node this calendar currently belongs to
	var parentButton = this._dateCalendar.getHtmlElement().parentNode;
	// and get reference to its respective text field
	var textField = parentButton == this._startDateButton.getHtmlElement()
		? this._startDateField : this._endDateField;

	if (textField)
		textField.value = AjxDateUtil.simpleComputeDateStr(ev.detail);
	
	this._dateCalendar.setVisible(false);
};

ZmApptTabViewPage.prototype._repeatChangeListener = 
function(ev) {	
	var newSelectVal = ev._args.newValue;
	if (newSelectVal == "CUS") {
		this._oldRepeatValue = ev._args.oldValue;
		this._showRecurDialog();
	} else {
		// per new select value, change the recur description
		var recurDesc = null;
		switch (newSelectVal) {
			case "DAI": recurDesc = ZmMsg.everyDay;   break;
			case "WEE": recurDesc = ZmMsg.everyWeek;  break;
			case "MON": recurDesc = ZmMsg.everyMonth; break;
			case "YEA": recurDesc = ZmMsg.everyYear;  break;
		}
		this._repeatDescField.innerHTML = recurDesc ? (recurDesc + " (" + ZmMsg.noEndDate + ")") : "";
	}
};

ZmApptTabViewPage.prototype._recurOkListener = 
function(ev) {
	// TODO
	// - and get the recur rules to update the recur language
	this._recurDialogRepeatValue = this._recurDialog.getSelectedRepeatValue();
	if (this._recurDialogRepeatValue == "NON") {
		this._repeatSelect.setSelectedValue(this._recurDialogRepeatValue);
		this._repeatDescField.innerHTML = "";
	} else {
		this._repeatSelect.setSelectedValue("CUS");
	}
	
	this._recurDialog.popdown();
};

ZmApptTabViewPage.prototype._recurCancelListener = 
function(ev) {
	// reset the selected option to whatever it was before user canceled
	this._repeatSelect.setSelectedValue(this._oldRepeatValue);
	this._recurDialog.popdown();
};


// Callbacks

// Transfers addresses from the contact picker to the compose view.
ZmApptTabViewPage.prototype._contactPickerOk =
function(args) {
	var addrs = args[0];

	// populate attendees field w/ chosen contacts from picker
	var vec = addrs[1];
	var addr = vec.size() ? (vec.toString(ZmEmailAddress.SEPARATOR) + ZmEmailAddress.SEPARATOR) : "";
	this._attendeesField.value += addr;
	this._contactPicker.popdown();

	this.enableInputs(true);
	this.reEnableDesignMode();
};

ZmApptTabViewPage.prototype._contactPickerCancel = 
function(args) {
	this.enableInputs(true);
	this.reEnableDesignMode();
};

ZmApptTabViewPage.prototype._getAcListLoc = 
function(ev) {
	if (this._attendeesField) {
		var loc = Dwt.getLocation(this._attendeesField);
		var height = Dwt.getSize(this._attendeesField).y;
		return (new DwtPoint(loc.x, loc.y+height));
	}
	return null;
};


// Static methods

ZmApptTabViewPage._onClick = 
function(ev) {
	// IE doesn't pass events from IFRAMES, might have to go fishing for it
	if (AjxEnv.isIE && !window.event)
		ev = parent.window.frames[ZmApptTabViewPage.ATTACH_IFRAME_NAME].event;

	var el = DwtUiEvent.getTarget(ev);
	var tvp = el._tabViewPage;

	// figure out which input field was clicked
	if (el.id == tvp._allDayCheckboxId) {
		tvp._showTimeFields(el.checked ? false : true);
	} else if (el.id == tvp._repeatDescId) {
		tvp._oldRepeatValue = tvp._repeatSelect.getValue();
		tvp._showRecurDialog(tvp._oldRepeatValue);
	} else if (el.id.indexOf("_att_") != -1) {
		tvp._removeAttachment(el.id);
	}
};

ZmApptTabViewPage._onKeyDown = 
function(ev) {
	// IE doesn't pass events from IFRAMES, might have to go fishing for it
	if (AjxEnv.isIE && !window.event)
		ev = parent.window.frames[ZmApptTabViewPage.ATTACH_IFRAME_NAME].event;

	var el = DwtUiEvent.getTarget(ev);

	if (el.id.indexOf("_att_") != -1) {
		// ignore enter key press in IE otherwise it tries to send the attachment!
		var key = DwtKeyEvent.getCharCode(ev);
		return (key != DwtKeyEvent.KEY_ENTER && key != DwtKeyEvent.KEY_END_OF_TEXT);
	}
};
