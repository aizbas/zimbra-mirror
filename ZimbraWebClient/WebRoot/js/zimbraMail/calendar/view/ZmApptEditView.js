/*
 * ***** BEGIN LICENSE BLOCK *****
 * 
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2007 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * 
 * ***** END LICENSE BLOCK *****
 */
/**
 * Creates a new calendar item edit view.
 * @constructor
 * @class
 * This is the main screen for creating/editing an appointment. It provides
 * inputs for the various appointment details.
 *
 * @author Parag Shah
 *
 * @param parent			[DwtControl]				some container
 * @param attendees			[hash]						attendees/locations/equipment
 * @param dateInfo			[object]					hash of date info
 * @param controller		[ZmController]				the compose controller for this view
 */
ZmApptEditView = function(parent, attendees, controller, dateInfo) {

	ZmCalItemEditView.call(this, parent, attendees, controller, dateInfo);

	// cache so we dont keep calling appCtxt
	this.GROUP_CALENDAR_ENABLED = appCtxt.get(ZmSetting.GROUP_CALENDAR_ENABLED);

	this._attTypes = [];
	if (this.GROUP_CALENDAR_ENABLED) {
		this._attTypes.push(ZmCalBaseItem.PERSON);
	}
	this._attTypes.push(ZmCalBaseItem.LOCATION);
	if (appCtxt.get(ZmSetting.GAL_ENABLED) && this.GROUP_CALENDAR_ENABLED) {
		this._attTypes.push(ZmCalBaseItem.EQUIPMENT);
	}
};

ZmApptEditView.prototype = new ZmCalItemEditView;
ZmApptEditView.prototype.constructor = ZmApptEditView;

// Consts

ZmApptEditView.SHOWAS_OPTIONS = [
	{ label: ZmMsg.free, 				value: "F", 	selected: false },
	{ label: ZmMsg.replyTentative, 		value: "T", 	selected: false },
	{ label: ZmMsg.busy, 				value: "B", 	selected: true  },
	{ label: ZmMsg.outOfOffice,			value: "O", 	selected: false }
];

ZmApptEditView.PRIVACY_OPTIONS = [
	{ label: ZmMsg._public,				value: "PUB",	selected: true	},
	{ label: ZmMsg._private,			value: "PRI"					}
//	{ label: ZmMsg.confidential,		value: "CON"					}		// see bug #21205
];


// Public Methods

ZmApptEditView.prototype.toString =
function() {
	return "ZmApptEditView";
};

ZmApptEditView.prototype.show =
function() {
	ZmCalItemEditView.prototype.show.call(this);
	this._setAttendees();
};

ZmApptEditView.prototype.blur =
function(useException) {
	if (this._activeInputField) {
		this._handleAttendeeField(this._activeInputField, useException);
		//bug: 15251 - to avoid race condition, active field will anyway be cleared
        //by onblur handler for input field
        //this._activeInputField = null;
	}
};

ZmApptEditView.prototype.cleanup =
function() {
	ZmCalItemEditView.prototype.cleanup.call(this);

	this._attInputField[ZmCalBaseItem.PERSON].setValue("");
	this._attInputField[ZmCalBaseItem.LOCATION].setValue("");

	if (this._resourcesContainer) {
		Dwt.setDisplay(this._resourcesContainer, Dwt.DISPLAY_NONE);
		this._resourcesData.innerHTML = "";
	}

	this._allDayCheckbox.checked = false;
	this._showTimeFields(true);
	this._isKnownLocation = false;

	// reset autocomplete lists
	if (this._acContactsList) {
		this._acContactsList.reset();
		this._acContactsList.show(false);
	}
	if (this._acLocationsList) {
		this._acLocationsList.reset();
		this._acLocationsList.show(false);
	}
};

// Acceptable hack needed to prevent cursor from bleeding thru higher z-index'd views
ZmApptEditView.prototype.enableInputs =
function(bEnableInputs) {
	ZmCalItemEditView.prototype.enableInputs.call(this, bEnableInputs);

	this._attInputField[ZmCalBaseItem.PERSON].setEnabled(bEnableInputs);
	this._attInputField[ZmCalBaseItem.LOCATION].setEnabled(bEnableInputs);
};

ZmApptEditView.prototype.isValid =
function() {
	var errorMsg;

	// check for required subject
	var subj = AjxStringUtil.trim(this._subjectField.getValue());

	if (subj && subj.length) {
		if (this._allDayCheckbox.checked) {
			var startDate = AjxDateUtil.simpleParseDateStr(this._startDateField.value);
			var endDate = AjxDateUtil.simpleParseDateStr(this._endDateField.value);
			if (!startDate || !endDate || (startDate.valueOf() > endDate.valueOf())) {
				errorMsg = ZmMsg.errorInvalidDates;
			}
		} else {
			if (!ZmTimeSelect.validStartEnd(this._startTimeSelect, this._endTimeSelect, this._startDateField, this._endDateField)) {
				errorMsg = ZmMsg.errorInvalidDates;
			}
		}
	} else {
		errorMsg = ZmMsg.errorMissingSubject;
	}

	if (errorMsg) {
		throw errorMsg;
	}

	return true;
};

// called by schedule tab view when user changes start date field
ZmApptEditView.prototype.updateDateField =
function(newStartDate, newEndDate) {
	this._startDateField.value = newStartDate;
	this._endDateField.value = newEndDate;
};

ZmApptEditView.prototype.updateAllDayField =
function(isAllDay) {
	this._allDayCheckbox.checked = isAllDay;
	this._showTimeFields(!isAllDay);
};

ZmApptEditView.prototype.toggleAllDayField =
function() {
	this.updateAllDayField(!this._allDayCheckbox.checked);
};

ZmApptEditView.prototype.updateTimeField =
function(dateInfo) {
	this._startTimeSelect.setSelected(dateInfo.startHourIdx, dateInfo.startMinuteIdx, dateInfo.startAmPmIdx);
	this._endTimeSelect.setSelected(dateInfo.endHourIdx, dateInfo.endMinuteIdx, dateInfo.endAmPmIdx);
};

ZmApptEditView.prototype.updateTimezone =
function(dateInfo) {
    this._tzoneSelect.setSelectedValue(dateInfo.timezone);
};

// Private / protected methods

ZmApptEditView.prototype._initTzSelect =
function() {
    // XXX: this seems like overkill, list all timezones!?
    var options = AjxTimezone.getAbbreviatedZoneChoices();
    if (options.length != this._tzCount) {
        this._tzCount = options.length;
        this._tzoneSelect.clearOptions();
        for (var i = 0; i < options.length; i++) {
            this._tzoneSelect.addOption(options[i]);
        }
    }
};

ZmApptEditView.prototype._addTabGroupMembers =
function(tabGroup) {
	tabGroup.addMember(this._subjectField);
	tabGroup.addMember(this._attInputField[ZmCalBaseItem.LOCATION]);
	tabGroup.addMember(this._attInputField[ZmCalBaseItem.PERSON]);
	var bodyFieldId = this._notesHtmlEditor.getBodyFieldId();
	tabGroup.addMember(document.getElementById(bodyFieldId));
};

ZmApptEditView.prototype._finishReset =
function() {
	ZmCalItemEditView.prototype._finishReset.call(this);

	// save the original form data in its initialized state
	this._origFormValueMinusAttendees = this._formValue(true);
};

ZmApptEditView.prototype._getClone =
function() {
	return ZmAppt.quickClone(this._calItem);
};

/**
 * sets any recurrence rules w/in given ZmAppt object
*/
// bug fix #17048 - reset weekly day to reflect start date in case user changed
// it. We should not be needing this anymore as we are auto adjusting the start
// date like outlook. See bug 12945
/*
ZmApptEditView.prototype._getRecurrence =
function(calItem) {
	ZmCalItemEditView.prototype._getRecurrence.call(this, calItem);

    if (calItem.getRecurType() == "WEE" &&
		calItem._recurrence.repeatCustomCount == 1 &&
		calItem._recurrence.repeatWeeklyDays.length == 1)
	{
		var day = ZmCalItem.SERVER_WEEK_DAYS[calItem.startDate.getDay()];
		calItem._recurrence.repeatWeeklyDays = [day];
	}
};
*/

ZmApptEditView.prototype._populateForSave =
function(calItem) {
	ZmCalItemEditView.prototype._populateForSave.call(this, calItem);

	calItem.freeBusy = this._showAsSelect.getValue();
	calItem.privacy = this._privacySelect.getValue();

	// set the start date by aggregating start date/time fields
	var startDate = AjxDateUtil.simpleParseDateStr(this._startDateField.value);
	var endDate = AjxDateUtil.simpleParseDateStr(this._endDateField.value);
	if (this._allDayCheckbox.checked) {
		calItem.setAllDayEvent(true);
	} else {
		calItem.setAllDayEvent(false);
		startDate = this._startTimeSelect.getValue(startDate);
		endDate = this._endTimeSelect.getValue(endDate);
	}
	calItem.setStartDate(startDate, true);
	calItem.setEndDate(endDate, true);
	if (Dwt.getVisibility(this._tzoneSelect.getHtmlElement()))
		calItem.timezone = this._tzoneSelect.getValue();

	// set attendees
	for (var t = 0; t < this._attTypes.length; t++) {
		var type = this._attTypes[t];
		calItem.setAttendees(this._attendees[type].getArray(), type);
	}
	calItem.location = AjxStringUtil.trim(this._attInputField[ZmCalBaseItem.LOCATION].getValue());

	// set any recurrence rules LAST
	this._getRecurrence(calItem);

	return calItem;
};

ZmApptEditView.prototype._populateForEdit =
function(calItem, mode) {
	ZmCalItemEditView.prototype._populateForEdit.call(this, calItem, mode);

	this._showAsSelect.setSelectedValue(calItem.freeBusy);
	this._privacySelect.setSelectedValue(calItem.privacy);

	// reset the date/time values based on current time
	var sd = new Date(calItem.startDate.getTime());
	var ed = new Date(calItem.endDate.getTime());
	var isAllDayAppt = calItem.isAllDayEvent();
	if (isAllDayAppt) {
		this._allDayCheckbox.checked = true;
		this._showTimeFields(false);

		// set time anyway to current time and default duration (in case user changes mind)
		var now = AjxDateUtil.roundTimeMins(new Date(), 30);
		this._startTimeSelect.set(now);

		now.setTime(now.getTime() + ZmCalViewController.DEFAULT_APPOINTMENT_DURATION);
		this._endTimeSelect.set(now);

		// bug 9969: HACK - remove the all day durtion for display
        var isNew = (mode == ZmCalItem.MODE_NEW || mode == ZmCalItem.MODE_NEW_FROM_QUICKADD);
        if (!isNew && ed.getHours() == 0 && ed.getMinutes() == 0 && ed.getSeconds() == 0) {
			ed.setHours(-12);
		}
	} else {
		this._showTimeFields(true);
		this._startTimeSelect.set(calItem.startDate);
		this._endTimeSelect.set(calItem.endDate);
	}
	this._startDateField.value = AjxDateUtil.simpleComputeDateStr(sd);
	this._endDateField.value = AjxDateUtil.simpleComputeDateStr(ed);

    this._initTzSelect();
	this._resetTimezoneSelect(calItem, isAllDayAppt);

	// attendees
	var tp;
	var attendees = calItem.getAttendees(ZmCalBaseItem.PERSON);
	if (attendees && attendees.length) {
		this._attInputField[ZmCalBaseItem.PERSON].setValue(calItem.getAttendeesText(ZmCalBaseItem.PERSON));
		this._attendees[ZmCalBaseItem.PERSON] = AjxVector.fromArray(attendees);
		tp = this.parent.getTabPage(ZmApptComposeView.TAB_ATTENDEES);
		if (tp) tp._chooser.transfer(attendees, null, true);
	}

	// set the location *label*
	this._attInputField[ZmCalBaseItem.LOCATION].setValue(calItem.getLocation());

	// set the location attendee(s)
	var locations = calItem.getAttendees(ZmCalBaseItem.LOCATION);
	if (locations && locations.length) {
		this._attendees[ZmCalBaseItem.LOCATION] = AjxVector.fromArray(locations);
		tp = this.parent.getTabPage(ZmApptComposeView.TAB_LOCATIONS);
		if (tp) {
			if (locations.length > 1)
				tp.enableMultipleLocations(true);
			tp._chooser.transfer(locations, null, true);
		}
	}

	// set the equipment attendee(s)
	var equipment = calItem.getAttendees(ZmCalBaseItem.EQUIPMENT);
	if (equipment && equipment.length) {
		this._attendees[ZmCalBaseItem.EQUIPMENT] = AjxVector.fromArray(equipment);
		tp = this.parent.getTabPage(ZmApptComposeView.TAB_EQUIPMENT);
		if (tp) tp._chooser.transfer(equipment, null, true);
	}

	this._addResourcesDiv();
};

ZmApptEditView.prototype._addResourcesDiv =
function(calItem) {
	if (!(this._resourcesData && this._resourcesContainer)) { return; }

	var html = [];
	var i = 0;
	var location = ZmApptViewHelper.getAttendeesString(this._attendees[ZmCalBaseItem.LOCATION].getArray(), ZmCalBaseItem.LOCATION);
	var equipment = ZmApptViewHelper.getAttendeesString(this._attendees[ZmCalBaseItem.EQUIPMENT].getArray(), ZmCalBaseItem.EQUIPMENT);
	if (location.length || equipment.length) {
		Dwt.setDisplay(this._resourcesContainer, Dwt.DISPLAY_BLOCK);
		if (location.length) {
			html[i++] = "<div style='padding-left:2px'>";
			html[i++] = AjxImg.getImageSpanHtml("Location");
			html[i++] = "&nbsp;<a href='javascript:;' onclick='ZmApptEditView._switchTab(";
			html[i++] = '"' + ZmCalBaseItem.LOCATION + '"';
			html[i++] = ")'>";
			html[i++] = location;
			html[i++] = "</a></div>";
		}
		if (equipment.length) {
			html[i++] = "<div style='padding-left:2px'>";
			html[i++] = AjxImg.getImageSpanHtml("Resource");
			html[i++] = "&nbsp;<a href='javascript:;' onclick='ZmApptEditView._switchTab(";
			html[i++] = '"' + ZmCalBaseItem.EQUIPMENT + '"';
			html[i++] = ")'>";
			html[i++] = equipment;
			html[i++] = "</a></div>";
		}
	} else {
		Dwt.setDisplay(this._resourcesContainer, Dwt.DISPLAY_NONE);
	}
	this._resourcesData.innerHTML = html.join("");
};

ZmApptEditView.prototype._createHTML =
function() {
	// cache these Id's since we use them more than once
	this._allDayCheckboxId 	= this._htmlElId + "_allDayCheckbox";
	this._repeatDescId 		= this._htmlElId + "_repeatDesc";
    this._startTimeAtLblId  = this._htmlElId + "_startTimeAtLbl";
    this._endTimeAtLblId	= this._htmlElId + "_endTimeAtLbl";

    var subs = {
		id: this._htmlElId,
		height: (this.parent.getSize().y - 30),
		currDate: (AjxDateUtil.simpleComputeDateStr(new Date())),
		isGalEnabled: appCtxt.get(ZmSetting.GAL_ENABLED),
		isAppt: true,
		isGroupCalEnabled: this.GROUP_CALENDAR_ENABLED
	};

	this.getHtmlElement().innerHTML = AjxTemplate.expand("calendar.Appointment#EditView", subs);
};

ZmApptEditView.prototype._createWidgets =
function(width) {
	ZmCalItemEditView.prototype._createWidgets.call(this, width);

	this._attInputField = {};

	// add attendee input field
	var params = {parent: this, type: DwtInputField.STRING, skipCaretHack: true, rows: 3, parentElement: (this._htmlElId + "_person")};
	var input = this._attInputField[ZmCalBaseItem.PERSON] = new DwtInputField(params);
	var inputEl = input.getInputElement();
	Dwt.setSize(inputEl, "100%", "50px");
	inputEl._attType = ZmCalBaseItem.PERSON;

	// add location input field
	params = {parent: this, type: DwtInputField.STRING, skipCaretHack: true, parentElement: (this._htmlElId + "_location")};
	var input = this._attInputField[ZmCalBaseItem.LOCATION] = new DwtInputField(params);
	var inputEl = input.getInputElement();
	Dwt.setSize(inputEl, width, "22px");
	inputEl._attType = ZmCalBaseItem.LOCATION;

	this._resourcesContainer = document.getElementById(this._htmlElId + "_resourcesContainer");
	this._resourcesData = document.getElementById(this._htmlElId + "_resourcesData");

	// show-as DwtSelect
	this._showAsSelect = new DwtSelect({parent:this, parentElement: (this._htmlElId + "_showAsSelect")});
	for (var i = 0; i < ZmApptEditView.SHOWAS_OPTIONS.length; i++) {
		var option = ZmApptEditView.SHOWAS_OPTIONS[i];
		this._showAsSelect.addOption(option.label, option.selected, option.value);
	}

	// privacy DwtSelect
	this._privacySelect = new DwtSelect({parent:this, parentElement: (this._htmlElId + "_privacySelect")});
	for (var j = 0; j < ZmApptEditView.PRIVACY_OPTIONS.length; j++) {
		var option = ZmApptEditView.PRIVACY_OPTIONS[j];
		this._privacySelect.addOption(option.label, option.selected, option.value);
	}
	this._privacySelect.addChangeListener(new AjxListener(this, this._privacyListener));
	this._folderSelect.addChangeListener(new AjxListener(this, this._privacyListener));	

	// time ZmTimeSelect
	var timeSelectListener = new AjxListener(this, this._timeChangeListener);
	this._startTimeSelect = new ZmTimeSelect(this, ZmTimeSelect.START);
	this._startTimeSelect.reparentHtmlElement(this._htmlElId + "_startTimeSelect");
	this._startTimeSelect.addChangeListener(timeSelectListener);
	this._endTimeSelect = new ZmTimeSelect(this, ZmTimeSelect.END);
	this._endTimeSelect.reparentHtmlElement(this._htmlElId + "_endTimeSelect");
	this._endTimeSelect.addChangeListener(timeSelectListener);

	// timezone DwtSelect
	var timezoneListener = new AjxListener(this, this._timezoneListener);

	this._tzoneSelect = new DwtSelect({parent:this, parentElement: (this._htmlElId + "_tzoneSelect")});
	this._tzoneSelect.addChangeListener(timezoneListener);
	// NOTE: tzone select is initialized later

	// init auto-complete widget if contacts app enabled
	if (appCtxt.get(ZmSetting.CONTACTS_ENABLED)) {
		this._initAutocomplete();
	}
};

ZmApptEditView.prototype._privacyListener =
function() {
	if (!this._privacySelect || !this._folderSelect) { return; }

	var value = this._privacySelect.getValue();
	var calId = this._folderSelect.getValue();	
	var isRemote = (calId.match(/:/));

	if (value == "PRI" && isRemote) {
		this._privacySelect.setSelectedValue("PUB");
		this._privacySelect.disable();
	} else {
		this._privacySelect.enable();
	}
};

ZmApptEditView.prototype._initAutocomplete =
function() {
	var acCallback = new AjxCallback(this, this._autocompleteCallback);
	this._acList = {};

	// autocomplete for attendees
	if (appCtxt.get(ZmSetting.CONTACTS_ENABLED) &&
		this.GROUP_CALENDAR_ENABLED)
	{
		var app = appCtxt.getApp(ZmApp.CONTACTS);
		var params = {
			parent: appCtxt.getShell(),
			dataClass: app,
			dataLoader: app.getContactList,
			matchValue: ZmContactsApp.AC_VALUE_FULL,
			compCallback: acCallback
		};
		this._acContactsList = new ZmAutocompleteListView(params);
		this._acContactsList.handle(this._attInputField[ZmCalBaseItem.PERSON].getInputElement());
		this._acList[ZmCalBaseItem.PERSON] = this._acContactsList;
	}

	if (appCtxt.get(ZmSetting.GAL_ENABLED)) {
		// autocomplete for locations
		var app = appCtxt.getApp(ZmApp.CALENDAR);
		var params = {
			parent: appCtxt.getShell(),
			dataClass: app,
			dataLoader: app.getLocations,
			matchValue: ZmContactsApp.AC_VALUE_NAME,
			compCallback: acCallback
		};
		this._acLocationsList = new ZmAutocompleteListView(params);
		this._acLocationsList.handle(this._attInputField[ZmCalBaseItem.LOCATION].getInputElement());
		this._acList[ZmCalBaseItem.LOCATION] = this._acLocationsList;
	}
};

ZmApptEditView.prototype._autocompleteCallback =
function(text, el, match) {
	if (!match) {
		DBG.println(AjxDebug.DBG1, "ZmApptEditView: match empty in autocomplete callback; text: " + text);
		return;
	}
	var attendee = match.item;
	if (attendee) {
		var type = el._attType;
		this.parent.parent.updateAttendees(attendee, type, ZmApptComposeView.MODE_ADD);

		if (type == ZmCalBaseItem.LOCATION) {
			this._addResourcesDiv();
			this._isKnownLocation = true;
		}
	}
};

ZmApptEditView.prototype._addEventHandlers =
function() {
	var edvId = AjxCore.assignId(this);

	// add event listeners where necessary
	Dwt.setHandler(this._allDayCheckbox, DwtEvent.ONCLICK, ZmCalItemEditView._onClick);
	Dwt.setHandler(this._repeatDescField, DwtEvent.ONCLICK, ZmCalItemEditView._onClick);
	Dwt.setHandler(this._repeatDescField, DwtEvent.ONMOUSEOVER, ZmCalItemEditView._onMouseOver);
	Dwt.setHandler(this._repeatDescField, DwtEvent.ONMOUSEOUT, ZmCalItemEditView._onMouseOut);
	Dwt.setHandler(this._startDateField, DwtEvent.ONCHANGE, ZmCalItemEditView._onChange);
	Dwt.setHandler(this._endDateField, DwtEvent.ONCHANGE, ZmCalItemEditView._onChange);

	this._allDayCheckbox._editViewId = this._repeatDescField._editViewId = edvId;
	this._startDateField._editViewId = this._endDateField._editViewId = edvId;

	var inputEl = this._attInputField[ZmCalBaseItem.PERSON].getInputElement();
	inputEl.onfocus = AjxCallback.simpleClosure(this._handleOnFocus, this, inputEl);
	inputEl.onblur = AjxCallback.simpleClosure(this._handleOnBlur, this, inputEl);

	inputEl = this._attInputField[ZmCalBaseItem.LOCATION].getInputElement();
	inputEl.onkeypress = AjxCallback.simpleClosure(this._handleKeyPress, this);
};

// cache all input fields so we dont waste time traversing DOM each time
ZmApptEditView.prototype._cacheFields =
function() {
	ZmCalItemEditView.prototype._cacheFields.call(this);
	this._allDayCheckbox = document.getElementById(this._allDayCheckboxId);
};

ZmApptEditView.prototype._resetTimezoneSelect =
function(calItem, isAllDayAppt) {
	this._tzoneSelect.setSelectedValue(calItem.timezone);
};
ZmApptEditView.prototype._setTimezoneVisible =
function(dateInfo) {
    var showTimezone = !dateInfo.isAllDay;
    if (showTimezone) {
        showTimezone = appCtxt.get(ZmSetting.CAL_SHOW_TIMEZONE) ||
                       dateInfo.timezone != AjxTimezone.getServerId(AjxTimezone.DEFAULT);
    }
    Dwt.setVisibility(this._tzoneSelect.getHtmlElement(), showTimezone);
};

ZmApptEditView.prototype._showTimeFields =
function(show) {
	Dwt.setVisibility(this._startTimeSelect.getHtmlElement(), show);
	Dwt.setVisibility(this._endTimeSelect.getHtmlElement(), show);
    this._setTimezoneVisible(this._dateInfo);

	// also show/hide the "@" text
    Dwt.setVisibility(document.getElementById(this._startTimeAtLblId), show);
    Dwt.setVisibility(document.getElementById(this._endTimeAtLblId), show);
};

// Returns a string representing the form content
ZmApptEditView.prototype._formValue =
function(excludeAttendees) {
	var vals = [];

	vals.push(this._subjectField.getValue());
	vals.push(this._attInputField[ZmCalBaseItem.LOCATION].getValue());
	vals.push(ZmApptViewHelper.getAttendeesString(this._attendees[ZmCalBaseItem.LOCATION].getArray(), ZmCalBaseItem.LOCATION));
	vals.push(ZmApptViewHelper.getAttendeesString(this._attendees[ZmCalBaseItem.EQUIPMENT].getArray(), ZmCalBaseItem.EQUIPMENT));
	vals.push(this._showAsSelect.getValue());
	vals.push(this._privacySelect.getValue());
	vals.push(this._folderSelect.getValue());
    vals.push(this._reminderSelect.getValue());
    var startDate = AjxDateUtil.simpleParseDateStr(this._startDateField.value);
	var endDate = AjxDateUtil.simpleParseDateStr(this._endDateField.value);
	startDate = this._startTimeSelect.getValue(startDate);
	endDate = this._endTimeSelect.getValue(endDate);
	vals.push(
		AjxDateUtil.getServerDateTime(startDate),
		AjxDateUtil.getServerDateTime(endDate)
	);
	vals.push("" + this._allDayCheckbox.checked);
	if (Dwt.getVisibility(this._tzoneSelect.getHtmlElement()))
		vals.push(this._tzoneSelect.getValue());
	vals.push(this._repeatSelect.getValue());
	if (!excludeAttendees) {
		vals.push(ZmApptViewHelper.getAttendeesString(this._attendees[ZmCalBaseItem.PERSON].getArray(), ZmCalBaseItem.PERSON));
	}
	vals.push(this._notesHtmlEditor.getContent());

	var str = vals.join("|");
	str = str.replace(/\|+/, "|");
	return str;
};


// Listeners

ZmApptEditView.prototype._timeChangeListener =
function(ev) {
	ZmTimeSelect.adjustStartEnd(ev, this._startTimeSelect, this._endTimeSelect, this._startDateField, this._endDateField);
	ZmApptViewHelper.getDateInfo(this, this._dateInfo);
};

ZmApptEditView.prototype._timezoneListener =
function(ev) {
	ZmApptViewHelper.getDateInfo(this, this._dateInfo);
};

/**
* Sets the values of the attendees input fields to reflect the current lists of
* attendees.
*/
ZmApptEditView.prototype._setAttendees =
function() {
	for (var t = 0; t < this._attTypes.length; t++) {
		var type = this._attTypes[t];
		var attendees = this._attendees[type].getArray();
		var list = [];
		for (var i = 0; i < attendees.length; i++) {
			list.push(attendees[i].getAttendeeText(type));
		}
		var val = list.length ? list.join(ZmAppt.ATTENDEES_SEPARATOR) : "";

		if (type == ZmCalBaseItem.LOCATION) {
			var curVal = AjxStringUtil.trim(this._attInputField[type].getValue());
			if (curVal == "" || this._isKnownLocation) {
				this._attInputField[type].setValue(val);
				this._isKnownLocation = true;
			}
		} else if (type == ZmCalBaseItem.PERSON) {
			this._attInputField[type].setValue(val);
		}
	}
	this._addResourcesDiv();
};

ZmApptEditView.prototype._handleAttendeeField =
function(type, useException) {
	if (!this._activeInputField) { return; }

	this._controller._invalidAttendees = [];
	var value = this._attInputField[type].getValue();
	var attendees = new AjxVector();
	var items = AjxEmailAddress.split(value);

	for (var i = 0; i < items.length; i++) {
		var item = AjxStringUtil.trim(items[i]);
		if (!item) continue;

		// see if it's an attendee we already know about (added via autocomplete or other tab)
		var attendee = this._getAttendeeByName(type, item) ||
					   this._getAttendeeByItem(item, type) ||
					   ZmApptViewHelper.getAttendeeFromItem(item, type);
		if (attendee) {
			attendees.add(attendee);
		} else {
			this._controller._invalidAttendees.push(item);
		}
	}

	// *always* force replace of attendees list with what we've found
	this.parent.parent.updateAttendees(attendees, type);
	
};

ZmApptEditView.prototype._getAttendeeByName =
function(type, name) {
	var a = this._attendees[type].getArray();
	for (var i = 0; i < a.length; i++) {
		if (a[i].getFullName() == name) {
			return a[i];
		}
	}
	return null;
};

ZmApptEditView.prototype._getAttendeeByItem =
function(item, type) {
	var attendees = this._attendees[type].getArray();
	for (var i = 0; i < attendees.length; i++) {
		var value = (type == ZmCalBaseItem.PERSON) ? attendees[i].getEmail() : attendees[i].getFullName();
		if (item == value) {
			return attendees[i];
		}
	}
	return null;
};


// Callbacks

ZmApptEditView.prototype._emailValidator =
function(value) {
	// first parse the value string based on separator
	var attendees = AjxStringUtil.trim(value);
	if (attendees.length > 0) {
		var addrs = AjxEmailAddress.parseEmailString(attendees);
		if (addrs.bad.size() > 0) {
			throw ZmMsg.errorInvalidEmail2;
		}
	}

	return value;
};

ZmApptEditView.prototype._handleOnClick =
function(el) {
	if (el.id == this._allDayCheckboxId) {
        var edv = AjxCore.objectWithId(el._editViewId);
        ZmApptViewHelper.getDateInfo(edv, edv._dateInfo);
		this._showTimeFields(el.checked ? false : true);
		if(el.checked && this._reminderSelect) {
			this._reminderSelect.setSelectedValue(1080);
		}
	} else {
		ZmCalItemEditView.prototype._handleOnClick.call(this, el);
	}
};

ZmApptEditView.prototype._handleOnFocus =
function(inputEl) {
	this._activeInputField = inputEl._attType;
};

ZmApptEditView.prototype._handleOnBlur =
function(inputEl) {
	this._handleAttendeeField(inputEl._attType);
	this._activeInputField = null;
};

ZmApptEditView.prototype._handleKeyPress =
function() {
	this._isKnownLocation = false;
};

ZmApptEditView._switchTab =
function(type) {
	var appCtxt = window.parentAppCtxt || window.appCtxt;
	var tabView = appCtxt.getApp(ZmApp.CALENDAR).getApptComposeController().getTabView();
	var key = (type == ZmCalBaseItem.LOCATION)
		? tabView._tabKeys[ZmApptComposeView.TAB_LOCATIONS]
		: tabView._tabKeys[ZmApptComposeView.TAB_EQUIPMENT];
	tabView.switchToTab(key);
};
