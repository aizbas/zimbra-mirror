/**
* Creates a new, empty "traditional view" controller.
* @constructor
* @class
* This class manages the two-pane message view. The top pane contains a list
* view of the messages in the conversation, and the bottom pane contains the current
* message.
*
* @author Parag Shah
* @param appCtxt	app context
* @param container	containing shell
* @param mailApp	containing app
*/
function ZmTradController(appCtxt, container, mailApp) {
	ZmDoublePaneController.call(this, appCtxt, container, mailApp);
};

ZmTradController.prototype = new ZmDoublePaneController;
ZmTradController.prototype.constructor = ZmTradController;

// Public methods

ZmTradController.prototype.toString = 
function() {
	return "ZmTradController";
};

/**
* Displays the given conversation in a two-pane view. The view is actually
* created in _loadItem(), since it is a scheduled method and must execute
* last.
*
* @param searchString	the current search query string
* @param activeSearch	the current search results
*/
ZmTradController.prototype.show =
function(search, searchString) {
	this._list = search.getResults(ZmItem.MSG);

	// call base class
	ZmDoublePaneController.prototype.show.call(this, search, searchString, this._list);
	this._setViewMenu(ZmController.TRAD_VIEW);
	this._setGroupMailBy(ZmItem.MSG);
	this._resetNavToolBarButtons(ZmController.TRAD_VIEW);
};

ZmTradController.prototype._createDoublePaneView = 
function() {
	return new ZmTradView(this._container, null, Dwt.ABSOLUTE_STYLE, this, this._dropTgt);
};

ZmTradController.prototype._getViewType =
function() {
	return ZmController.TRAD_VIEW;
};

ZmTradController.prototype._getItemType =
function() {
	return ZmItem.MSG;
};

ZmTradController.prototype._defaultView =
function() {
	return ZmController.TRAD_VIEW;
};

ZmTradController.prototype._setupViewMenu =
function(view) {
	var menu = this._setupGroupByMenuItems(this, view);
	new DwtMenuItem(menu, DwtMenuItem.SEPARATOR_STYLE);
	this._setupReadingPaneMenuItem(view, menu, true);
};

ZmTradController.prototype.switchView =
function(view) {
	if (view == ZmController.READING_PANE_VIEW) {
		ZmDoublePaneController.prototype.switchView.call(this, view);
	} else if (view == ZmController.CONVLIST_VIEW) {
		var sc = this._appCtxt.getSearchController();
		var sortBy = this._appCtxt.get(ZmSetting.SORTING_PREF, ZmController.CONVLIST_VIEW);
		var limit = this._appCtxt.get(ZmSetting.PAGE_SIZE); // bug fix #3365
		sc.redoSearch(this._appCtxt.getCurrentSearch(), null, {types: [ZmItem.CONV], offset: 0, sortBy: sortBy, limit: limit});
	}
};

ZmTradController.prototype._paginate = 
function(view, bPageForward, convIdx) {
	view = view || this._currentView;
	return ZmDoublePaneController.prototype._paginate.call(this, view, bPageForward, convIdx);
};

ZmTradController.prototype._paginateCallback = 
function(args) {
	ZmDoublePaneController.prototype._paginateCallback.call(this, args);
	
	var convIdx = args[1];
	var newConv = convIdx ? this._list.getVector().get(convIdx) : null;
	if (newConv)
		this._listView[this._currentView].emulateDblClick(newConv);
};

ZmTradController.prototype._doDelete = 
function(params) {
	ZmDoublePaneController.prototype._doDelete.call(this, params);
	this._resetOperations(this._toolbar[this._currentView], 
						  this._listView[this._currentView].getSelectedItems().size());
};

ZmTradController.prototype._doMove = 
function(params) {
	ZmDoublePaneController.prototype._doMove.call(this, params);
	this._resetOperations(this._toolbar[this._currentView], 
						  this._listView[this._currentView].getSelectedItems().size());
};

ZmTradController.prototype._resetNavToolBarButtons = 
function(view) {
	ZmDoublePaneController.prototype._resetNavToolBarButtons.call(this, view);
	this._navToolBar.setToolTip(ZmOperation.PAGE_BACK, ZmMsg.previous + " " + ZmMsg.page);	
	this._navToolBar.setToolTip(ZmOperation.PAGE_FORWARD, ZmMsg.next + " " + ZmMsg.page);
};

ZmTradController.prototype._processPrePopView = 
function(view) {
	this._resetNavToolBarButtons(view);
};
