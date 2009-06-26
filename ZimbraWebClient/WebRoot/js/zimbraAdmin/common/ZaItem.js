/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2004, 2005, 2006, 2007, 2008, 2009 Zimbra, Inc.
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

/**
* @class ZaItem
* @param app reference to the application instance
**/
ZaItem = function(iKeyName) {
	if (arguments.length == 0) return;
	this._iKeyName = iKeyName;
	ZaModel.call(this, true);

}

ZaItem.prototype = new ZaModel;
ZaItem.prototype.constructor = ZaItem;

ZaItem.loadMethods = new Object();
ZaItem.initMethods = new Object();
ZaItem.modifyMethods = new Object();
ZaItem.createMethods = new Object();
ZaItem.removeMethods = new Object();

ZaItem.ACCOUNT = "account";
ZaItem.DATASOURCE = "dataSource";
ZaItem.DL = "dl";
ZaItem.GROUP = "grp";
ZaItem.ALIAS = "alias";
ZaItem.RESOURCE = "calresource";
ZaItem.DOMAIN = "domain";
ZaItem.COS = "cos";
ZaItem.GLOBAL_CONFIG = "config";
ZaItem.GLOBAL_GRANT = "global";
ZaItem.SERVER = "server";
ZaItem.ZIMLET = "zimlet";
ZaItem.MAILQ_ITEM = "message";
ZaItem.MAILQ = "mailque";
ZaItem.A_objectClass = "objectClass";
ZaItem.A_zimbraId = "zimbraId";
ZaItem.A_cn = "cn" ;
ZaItem.A_zimbraACE = "zimbraACE";

/* Translation of  the attribute names to the screen names */
ZaItem._ATTR = new Object();
ZaItem._ATTR[ZaItem.A_zimbraId] = ZaMsg.attrDesc_zimbraId;

ZaItem.ID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/*
ZaItem.prototype.getTabToolTip =
function () {
	return	ZaMsg.TBB_Edit + " " +  this.type + " " + this.name ;
}

ZaItem.prototype.getTabIcon = 
function () {
	return this.type ;
}*/

ZaItem.prototype.toString = 
function() {
	if(this.name)
		return this.name;
	else if (this.id)
		return this.id;
	else
		return "ZaItem "+this.type+": name="+this.name+" id="+this.id;
}

ZaItem.compareNamesAsc = 
function(a,b) {
	var al = a.name.toLowerCase();
	var bl = b.name.toLowerCase();

	if (al < bl)
		return -1;
	if (al > bl)
		return 1;
	else
		return 0;
}

ZaItem.compareNamesDesc = 
function(a,b) {
	var al = a.name.toLowerCase();
	var bl = b.name.toLowerCase();

	if (al < bl)
		return 1;
	if (al > bl)
		return -1;
	else
		return 0;
}

ZaItem.compareDescription = 
function(a,b) {
	return ZaItem.compareAttr(a,b,"description");
}

ZaItem.compareAttr = 
function(a, b, attr) {
    if (a.attrs[attr] == null) {
        return -1 ;
    }

    if (b.attrs[attr] == null) {
        return 1 ;    
    }

	if (a.attrs[attr] < b.attrs[attr])
		return -1;
	if (a.attrs[attr] > b.attrs[attr])
		return 1;
	else
		return 0;
}

ZaItem.compareAttrAsc = ZaItem.compareAttr

ZaItem.compareAttrDesc =
function(a, b, attr) {
	if (a.attrs[attr] == null) {
        return 1 ;
    }

    if (b.attrs[attr] == null) {
        return -1 ;    
    }

    if (a.attrs[attr] < b.attrs[attr])
		return 1;
	if (a.attrs[attr] > b.attrs[attr])
		return -1;
	else
		return 0;
}


/**
* Item Factory
**/
ZaItem.getFromType = 
function (type) {
	switch (type) {
		case ZaItem.ACCOUNT:
			return new ZaAccount();

		case ZaItem.ALIAS:
			return new ZaAlias();

		case ZaItem.DL:
            return new ZaDistributionList();

		case ZaItem.RESOURCE:
			return new ZaResource();
		
		case ZaItem.DOMAIN:
			return new ZaDomain();

		case ZaItem.COS:
			return new ZaCos();

		case ZaItem.SERVER:
			return new ZaServer();

		case ZaItem.MAILQ:
			return new ZaMTA();
		
		case ZaItem.DATASOURCE:
			return new ZaDataSource();

	}
}

ZaItem.prototype.remove = 
function () {
	//Instrumentation code start
	if(ZaItem.removeMethods[this._iKeyName]) {
		var methods = ZaItem.removeMethods[this._iKeyName];
		var cnt = methods.length;
		for(var i = 0; i < cnt; i++) {
			if(typeof(methods[i]) == "function") {
				methods[i].call(this);
			}
		}
	}	
	//Instrumentation code end
}

ZaItem.prototype.refresh = 
function (skipRights,expandDefaults) {
	this.load(this.id ? "id" : null, this.id ? this.id : null,skipRights,expandDefaults);
}

ZaItem.prototype.copyTo = 
function (target/*, fullRecursion*/) {
	for(var a in this) {
		target[a] = this[a];
	}
}

ZaItem.prototype.parseTargetsRightsFromJS = function(targetObj) {
	if(targetObj) {
		this.noAttrsAvailable = true;
		this.rights = {};
		if(targetObj.right && targetObj.right instanceof Array) {
			var rights = targetObj.right;
			for(var r in rights) {
				this.rights[rights[r].n] = true;
			}
		}
		if(!this._defaultValues)
			this._defaultValues = {attrs:{}};

		if(!this.getAttrs)
			this.getAttrs = {};

		if(!this.setAttrs)
			this.setAttrs = {};
		
		if(AjxUtil.isEmpty(targetObj.getAttrs) && AjxUtil.isEmpty(targetObj.setAttrs)) {
			this.getAttrs = null;
			return;
		}
		this.attrsToGet = [];									
		if(targetObj.getAttrs && targetObj.getAttrs instanceof Array && 
			targetObj.getAttrs[0]) {
			if(targetObj.getAttrs[0].a && targetObj.getAttrs[0].a instanceof Array) {
				var getAttrs = targetObj.getAttrs[0].a;
				this.noAttrsAvailable = false;
				for (var a in getAttrs) {
					this.getAttrs[getAttrs[a].n] = true;
					this.attrsToGet.push(getAttrs[a].n);
					if(getAttrs[a]["default"] && getAttrs[a]["default"][0] && getAttrs[a]["default"][0].v && getAttrs[a]["default"][0].v instanceof Array) {
						var cnt = getAttrs[a]["default"][0].v.length; 
						if(cnt == 1) {
							this._defaultValues.attrs[getAttrs[a].n] = getAttrs[a]["default"][0].v[0]._content;
						} else if (cnt >1) {
							this._defaultValues.attrs[getAttrs[a].n] = new Array();
							for(var i = 0; i<cnt;i++) { 
								this._defaultValues.attrs[getAttrs[a].n][i] = getAttrs[a]["default"][0].v[i]._content;
							}
						}
					}
				}
			} 
			if (targetObj.getAttrs[0].all){
				this.getAttrs.all = true;
				this.noAttrsAvailable = false; 	
			}
		} 
				
		if(targetObj.setAttrs && targetObj.setAttrs instanceof Array && 
			targetObj.setAttrs[0]) {
				
			if(targetObj.setAttrs[0].a && targetObj.setAttrs[0].a instanceof Array) {
				var setAttrs = targetObj.setAttrs[0].a;
				if(!this.getAttrs)
					this.getAttrs = {};
					
				this.noAttrsAvailable = false;
				for (var a in setAttrs) {
					this.setAttrs[setAttrs[a].n] = true;
					this.getAttrs[setAttrs[a].n] = true;
					if(setAttrs[a]["default"] && setAttrs[a]["default"][0] && setAttrs[a]["default"][0].v && setAttrs[a]["default"][0].v instanceof Array) {
						var cnt = setAttrs[a]["default"][0].v.length; 
						if(cnt==1) {
							this._defaultValues.attrs[setAttrs[a].n] = setAttrs[a]["default"][0].v[0]._content;
						} else if (cnt > 1) {
							this._defaultValues.attrs[setAttrs[a].n] = new Array();
							for(var i = 0; i<cnt;i++) { 
								this._defaultValues.attrs[setAttrs[a].n][i] = setAttrs[a]["default"][0].v[i]._content;
							}
						}
					}					
				}
			} 
			if(targetObj.setAttrs[0].all) {
				this.noAttrsAvailable = false;
				this.setAttrs.all = true;
				this.getAttrs.all = true; 	
			}
		} 
	}
}

ZaItem.prototype.initEffectiveRightsFromJS = function(resp) {
	this._defaultValues = {attrs:{}};
	if(resp && resp.target && resp.target instanceof Array) {
		this.parseTargetsRightsFromJS(resp.target[0]);
		
		/*if(resp.target[0]) {
			if(resp.target[0].right && resp.target[0].right instanceof Array) {
				var rights = resp.target[0].right;
				if(!this.rights)
					this.rights = {};
					
				for(var r in rights) {
					this.rights[rights[r].n] = true;
				}
			}
			if(resp.target[0].getAttrs && resp.target[0].getAttrs instanceof Array && 
				resp.target[0].getAttrs[0]) {
				if(!this.getAttrs)
					this.getAttrs = {};
				if(resp.target[0].getAttrs[0].a && resp.target[0].getAttrs[0].a instanceof Array) {
					var getAttrs = resp.target[0].getAttrs[0].a;
					for (var a in getAttrs) {
						this.getAttrs[getAttrs[a].n] = true;
						if(getAttrs[a]["default"] && getAttrs[a]["default"][0] && getAttrs[a]["default"][0].v && getAttrs[a]["default"][0].v instanceof Array) {
							var cnt = getAttrs[a]["default"][0].v.length; 
							for(var i = 0; i<cnt;i++) { 
								this._defaultValues.attrs[getAttrs[a].n] = getAttrs[a]["default"][0].v[i]._content;
							}
						}
					}
				} 
				if (resp.target[0].getAttrs[0].all){
					this.getAttrs.all = true; 	
				}
			}			
			if(resp.target[0].setAttrs && resp.target[0].setAttrs instanceof Array && 
				resp.target[0].setAttrs[0]) {
				if(!this.setAttrs)
					this.setAttrs = {};
					
				if(resp.target[0].setAttrs[0].a && resp.target[0].setAttrs[0].a instanceof Array) {
					var setAttrs = resp.target[0].setAttrs[0].a;
					for (var a in setAttrs) {
						this.setAttrs[setAttrs[a].n] = true;
					}
				} 
				if(resp.target[0].setAttrs[0].all) {
					this.setAttrs.all = true;
				}
			}	
		}*/
	}
	
}

ZaItem.prototype.loadEffectiveRights = function (by, val, expandDefaults) {
	if(!this.type)
		return;
		
	var soapDoc = AjxSoapDoc.create("GetEffectiveRightsRequest", ZaZimbraAdmin.URN, null);
	if(expandDefaults) {
		soapDoc.setMethodAttribute("expandAllAttrs","getAttrs");
	}
	
	if(AjxUtil.isUndefined(val) || AjxUtil.isNull(val))
		val = "";
		
	var elTarget = soapDoc.set("target", val);
	
	if(!AjxUtil.isEmpty(by))
		elTarget.setAttribute("by",by);
		
	elTarget.setAttribute("type",this.type);


	var elGrantee = soapDoc.set("grantee", ZaZimbraAdmin.currentUserId);
	elGrantee.setAttribute("by","id");
	
	var csfeParams = new Object();
	csfeParams.soapDoc = soapDoc;	
	var reqMgrParams = {} ;
	reqMgrParams.controller = ZaApp.getInstance().getCurrentController();
	reqMgrParams.busyMsg = ZaMsg.BUSY_REQUESTING_ACCESS_RIGHTS ;
	try {
		var resp = ZaRequestMgr.invoke(csfeParams, reqMgrParams ).Body.GetEffectiveRightsResponse;
		this.initEffectiveRightsFromJS(resp);
	} catch (ex) {
		//not implemented yet
	}
}

ZaItem.prototype.loadNewObjectDefaults = function (domainBy, domain, cosBy, cos) {
	if(!this.type)
		return;
		
	var soapDoc = AjxSoapDoc.create("GetCreateObjectAttrsRequest", ZaZimbraAdmin.URN, null);
	var elTarget = soapDoc.set("target", "");
	elTarget.setAttribute("type",this.type);	

	
	if(!AjxUtil.isEmpty(domain) && !AjxUtil.isEmpty(domainBy)) {
		var elDomain = soapDoc.set("domain", domain);
		elDomain.setAttribute("by",domainBy);
	}

	if(!AjxUtil.isEmpty(cos) && !AjxUtil.isEmpty(cosBy)) {
		var elCos = soapDoc.set("cos", cos);
		elCos.setAttribute("by",cosBy);
	}
	
	var csfeParams = new Object();
	csfeParams.soapDoc = soapDoc;	
	var reqMgrParams = {} ;
	reqMgrParams.controller = ZaApp.getInstance().getCurrentController();
	reqMgrParams.busyMsg = ZaMsg.BUSY_REQUESTING_ACCESS_RIGHTS ;
	try {
		var resp = ZaRequestMgr.invoke(csfeParams, reqMgrParams ).Body.GetCreateObjectAttrsResponse;
		this.parseTargetsRightsFromJS(resp);
	} catch (ex) {
		//not implemented yet
	}	
}

ZaItem.prototype.load = function (by, val, skipRights, expandDefaults) {
	by = by ? by : "id";
	val = val ? val : this.id;
	//load rights
	if(!skipRights) {
		this.rights = {};
		this.getAttrs = {};
		this.setAttrs = {};
		this.loadEffectiveRights(by,val,expandDefaults);
	}	
	if(this.noAttrsAvailable) {
		return;
	}	
	//Instrumentation code start
	if(ZaItem.loadMethods[this._iKeyName]) {
		var methods = ZaItem.loadMethods[this._iKeyName];
		var cnt = methods.length;
		for(var i = 0; i < cnt; i++) {
			if(typeof(methods[i]) == "function") {
				methods[i].call(this, by, val);
			}
		}
	}	
	//Instrumentation code end
}

/**
 * this - the current instance should be the old instance
 * @param mods: modified attributes
 * @param tmpObj: the new data object of the view
 */
ZaItem.prototype.modify = function (mods, tmpObj) {
	//Instrumentation code start
	if(ZaItem.modifyMethods[this._iKeyName]) {
		var methods = ZaItem.modifyMethods[this._iKeyName];
		var cnt = methods.length;
		for(var i = 0; i < cnt; i++) {
			if(typeof(methods[i]) == "function") {
				methods[i].call(this, mods, tmpObj);
			}
		}
	}	
	//Instrumentation code end
}

/**
* Factory method
* creates a new object of class constructorFunction, then passes the new object to every method in
* ZaItem.createMethods[key] 
* @see ZaItem#createMethods
**/
ZaItem.create = function (tmpObj, constructorFunction, key) {
	var item = new constructorFunction();
	//Instrumentation code start
	if(ZaItem.createMethods[key]) {
		var methods = ZaItem.createMethods[key];
		var cnt = methods.length;
		for(var i = 0; i < cnt; i++) {
			if(typeof(methods[i]) == "function") {
				methods[i].call(this, tmpObj, item);
			}
		}
	}	
	//Instrumentation code end
	return item;
}

ZaItem.prototype.initFromDom =
function(node) {
	this.name = node.getAttribute("name");
	this.id = node.getAttribute("id");
	this.attrs = new Object();
	if(!AjxUtil.isEmpty(node.nodeName))
		this.type = node.nodeName;
	
	var children = node.childNodes;
	var cnt = children.length;
	for (var i=0; i< cnt;  i++) {
		var child = children[i];
		if (child.nodeName != 'a') continue;
		var name = child.getAttribute("n");
		var pd = child.getAttribute("pd");
		if(pd && pd==1)
			continue;
			
		if (child.firstChild != null) {
			var value = child.firstChild.nodeValue;
			if (name in this.attrs) {
				var vc = this.attrs[name];
				if ((typeof vc) == "object") {
					vc.push(value);
				} else {
					this.attrs[name] = [vc, value];
				}
			} else {
				this.attrs[name] = value;
			}
		}
	}
}

ZaItem.prototype.initFromJS = 
function (obj) {
	if(!obj)
		return;

	if(obj.name)	
		this.name = obj.name;

	if(obj.id)
		this.id = obj.id;

	if (obj.isgroup == false) {
		this.isgroup = 0 ;
	}else if (obj.isgroup == true){
		this.isgroup = 1 ;
	}
	this.attrs = new Object();
	if(obj.a) {
		var len = obj.a.length;
		for(var ix = 0; ix < len; ix++) {
			if(obj.a[ix].pd)
				continue;
				
			if(!this.attrs[[obj.a[ix].n]]) {
				this.attrs[[obj.a[ix].n]] = obj.a[ix]._content;
			}else {
				if(!(this.attrs[[obj.a[ix].n]] instanceof Array)) {
					this.attrs[[obj.a[ix].n]] = [this.attrs[[obj.a[ix].n]]];
				} 
				this.attrs[[obj.a[ix].n]].push(obj.a[ix]._content);
			}
		}
	}
	if(obj._attrs) {
		for (var ix in obj._attrs) {
			if(obj._attrs[ix].pd)
				continue;
							
			if(!this.attrs[ix]) {
				this.attrs[ix] = obj._attrs[ix];
			} else {
				if(!(this.attrs[ix] instanceof Array)) {
					this.attrs[ix] = [this.attrs[ix]];
				} 
				this.attrs[ix].push(obj._attrs[ix]);
			}
		}
	}
}

ZaItem.initAttrsFromJS =
function (obj) {
	if(!obj)
		return;

    var attrs = {} ;
	if(obj.a) {
		var len = obj.a.length;
		for(var ix = 0; ix < len; ix++) {
			if(obj.a[ix].pd)
				continue;
			
			if(!attrs[[obj.a[ix].n]]) {
				attrs[[obj.a[ix].n]] = obj.a[ix]._content;
			}else {
				if(!(attrs[[obj.a[ix].n]] instanceof Array)) {
					attrs[[obj.a[ix].n]] = [attrs[[obj.a[ix].n]]];
				}
				attrs[[obj.a[ix].n]].push(obj.a[ix]._content);
			}
		}
	}
	if(obj._attrs) {
		for (var ix in obj._attrs) {
			if(obj._attrs[ix].pd)
				continue;
							
			if(!attrs[ix]) {
				attrs[ix] = obj._attrs[ix];
			} else {
				if(!(attrs[ix] instanceof Array)) {
					attrs[ix] = [attrs[ix]];
				}
				attrs[ix].push(obj._attrs[ix]);
			}
		}
	}

    return attrs ;
}


// Adds a row to the tool tip.
ZaItem.prototype._addRow =
function(msg, value, html, idx) {
	if (value != null) {
		html[idx++] = "<tr valign='top'><td align='right' style='padding-right: 5px;'><b>";
		html[idx++] = AjxStringUtil.htmlEncode(msg);
		html[idx++] = "</b></td><td align='left'><div style='white-space:nowrap; overflow:hidden;'>";
		html[idx++] = AjxStringUtil.htmlEncode(value);
		html[idx++] = "</div></td></tr>";
	}
	return idx;
}

// Adds a row to the tool tip.
ZaItem.prototype._addAttrRow =
function(name, html, idx) {
	var value = this.attrs[name];
	if (value != null) {
		var desc = ZaItem._attrDesc(name);
		html[idx++] = "<tr valign='top'><td align='left' style='padding-right: 5px;'><b>";
		html[idx++] = AjxStringUtil.htmlEncode(desc) + ":";
		html[idx++] = "</b></td><td align='left'><div style='white-space:nowrap; overflow:hidden;'>";
		html[idx++] = AjxStringUtil.htmlEncode(value);
		html[idx++] = "</div></td></tr>";
	}
	return idx;
}

ZaItem._attrDesc = 
function(name) {
	var desc = ZaItem._ATTR[name];
	return (desc == null) ? name : desc;
}

ZaItem.prototype._init = function () {
	//Instrumentation code start
	if(ZaItem.initMethods[this._iKeyName]) {
		var methods = ZaItem.initMethods[this._iKeyName];
		var cnt = methods.length;
		for(var i = 0; i < cnt; i++) {
			if(typeof(methods[i]) == "function") {
				methods[i].call(this);
			}
		}
	}	
	//Instrumentation code end
}

/**
* @param newAlias
* addAlias adds one alias to the account. Adding each alias takes separate Soap Request
**/
ZaItem.prototype.addAlias = 
function (newAlias) {
	var soapCmd  ;
	switch(this.type) {
		case ZaItem.ACCOUNT: soapCmd = "AddAccountAliasRequest" ; break ;
		case ZaItem.DL: soapCmd = "AddDistributionListAliasRequest" ; break ;
		default: throw new Error("Can't add alias for account type: " + this.type) ;				
	}
	
	var soapDoc = AjxSoapDoc.create(soapCmd, ZaZimbraAdmin.URN, null);
	soapDoc.set("id", this.id);
	soapDoc.set("alias", newAlias);	
	
	//var command = new ZmCsfeCommand();
	var params = new Object();
	params.soapDoc = soapDoc;	
	var reqMgrParams = {
		controller : ZaApp.getInstance().getCurrentController(),
		busyMsg : ZaMsg.BUSY_ADD_ALIAS
	}
	ZaRequestMgr.invoke(params, reqMgrParams);
}

/**
* @param aliasToRemove
* addAlias adds one alias to the account. Adding each alias takes separate Soap Request
**/
ZaItem.prototype.removeAlias = 
function (aliasToRemove) {
	var soapCmd  ;
	
	switch(this.type) {
		case ZaItem.ACCOUNT: soapCmd = "RemoveAccountAliasRequest" ; break ;
		case ZaItem.DL: soapCmd = "RemoveDistributionListAliasRequest" ; break ;
		default: throw new Error("Can't add alias for account type: " + account.type) ;				
	}

	var soapDoc = AjxSoapDoc.create(soapCmd, ZaZimbraAdmin.URN, null);
	soapDoc.set("id", this.id);
	soapDoc.set("alias", aliasToRemove);	
	//var command = new ZmCsfeCommand();
	var params = new Object();
	params.soapDoc = soapDoc;	
	var reqMgrParams = {
		controller : ZaApp.getInstance().getCurrentController(),
		busyMsg : ZaMsg.BUSY_REMOVE_ALIAS
	}
	ZaRequestMgr.invoke(params, reqMgrParams);	
}

ZaItem.checkInteropSettings  =
function () {

    var controller =  ZaApp.getInstance().getCurrentController() ;

    try {

        //bug 29424 - save the settings before the check
        var oldSettingObj = controller._currentObject  ;
        var currentSettingObj = this.getForm().getInstance() ;
        ZaItem.checkFBSettings (oldSettingObj, currentSettingObj, controller) ;

        if (AjxEnv.hasFirebug) console.log("Checking the interop settings ...") ;
        var soapCmd  = "CheckExchangeAuthRequest";

        var soapDoc = AjxSoapDoc.create(soapCmd, ZaZimbraAdmin.URN, null);
        var params = new Object();
        params.soapDoc = soapDoc;
        var reqMgrParams = {
            controller : controller ,
            busyMsg : ZaMsg.BUSY_CHECKING_INTEROP_SETTINGS
        }
        var resp = ZaRequestMgr.invoke(params, reqMgrParams).Body.CheckExchangeAuthResponse;
        
        controller.popupMsgDialog(resp.code[0]._content + "<br />" + resp.message[0]._content) ;
    }catch (e) {
        controller._handleException(e)  ;
    }
}

ZaItem.checkFBSettings = function (oldSettingObj, currentSettingObj, controller) {
    var attrNames = [ZaDomain.A_zimbraFreebusyExchangeURL, ZaDomain.A_zimbraFreebusyExchangeAuthScheme,
                     ZaDomain.A_zimbraFreebusyExchangeAuthUsername, ZaDomain.A_zimbraFreebusyExchangeAuthPassword,
                     ZaDomain.A_zimbraFreebusyExchangeUserOrg ] ;

    var changedSettings = {} ;
    var isChanged = false ;
    for (var i=0; i < attrNames.length; i ++ ) {
        var n = attrNames [i] ;
        if (oldSettingObj.attrs[n] != currentSettingObj.attrs[n]) {
            changedSettings[n] = currentSettingObj.attrs[n];
            isChanged = true ;
        }
    }

    if (isChanged) {
        var soapCmd ;
        if (controller instanceof ZaDomainController) {
            //ModifyDomainRequest
            soapCmd = "ModifyDomainRequest" ;
        } else if (controller instanceof ZaGlobalConfigViewController) {
            //ModifyConfigRequest
            soapCmd = "ModifyConfigRequest" ;
        } else {
            throw new AjxException ("Invalid Controller Object") ;
        }

        var soapDoc = AjxSoapDoc.create(soapCmd, ZaZimbraAdmin.URN, null);

        if (controller instanceof ZaDomainController)    {
            soapDoc.set("id", currentSettingObj.id);
        }

        for (var aname in changedSettings) {
            var attr = soapDoc.set("a", changedSettings[aname]);
            attr.setAttribute("n", aname);
        }


        var params = new Object();
        params.soapDoc = soapDoc;
        var reqMgrParams = {
            controller : controller ,
            busyMsg : ZaMsg.BUSY_MODIFY_INTEROP_SETTINGS
        }
        ZaRequestMgr.invoke(params, reqMgrParams) ;
    }
}


//Sometimes, the admin extensions needs to modify the object value before it is set
//We can add the modifer function in the extension and it will be called by the main program
ZaItem.ObjectModifiers = {} ;
ZaItem.prototype.modifyObject =
function () {
    if(ZaItem.ObjectModifiers[this._iKeyName]) {
		var methods = ZaItem.ObjectModifiers[this._iKeyName];
		var cnt = methods.length;
		for(var i = 0; i < cnt; i++) {
			if(typeof(methods[i]) == "function") {
				methods[i].call(this);
			}
		}
	}
}

/** It is used to get the object description property value.
 *  especially when it has multi-values
 *
 * @param desp
 */
ZaItem.descriptionModelItem =  {id:"description", type: _LIST_, ref:"attrs/description",
            listItem:{type:_STRING_}
        } ;

ZaItem.descriptionXFormItem = {
    ref:"description",  msgName:ZaMsg.NAD_Description,
    label:ZaMsg.NAD_Description, labelLocation:_LEFT_, //cssClass:"admin_xform_name_input" ,
    labelCssStyle:"vertical-align:top",
    type:_REPEAT_,
    align:_LEFT_,
    repeatInstance:"",
    showAddButton:false,
    showRemoveButton:false,
    showAddOnNextRow:false,
//    enableDisableChecks:[ZaItem.hasWritePermission] ,
//    visibilityChecks:[ZaItem.hasReadPermission],
    items: [
        {ref:".", type:_TEXTFIELD_,
            enableDisableChecks:[ZaItem.hasWritePermission] ,
            visibilityChecks:[ZaItem.hasReadPermission],
            width:"30em"}
    ]
} ;

ZaItem.getDescriptionValue = function (desp) {
    if ( !desp)  desp = "";
    
    if (desp instanceof Array) {
        desp = desp.toString ();
    }

    return desp ;
}

/**
 *
 * @param entry
 * @param attrName
 * @return an new array object with the each value deep copied
 */
ZaItem.deepCloneListItem = function (sourceValue) {
   if (sourceValue == null) {
       return [];
    } else if (! (sourceValue instanceof Array)) {
       return [sourceValue] ;
    } else {
       var val = [] ;
       for (var i = 0 ; i < sourceValue.length; i ++) {
            val.push (sourceValue[i]) ;
       }
       return val ;
   }
}

/**
 * Method of XFormItem
 */
ZaItem.hasReadPermission = function (refToCheck, instance) {
	if(ZaZimbraAdmin.currentAdminAccount.attrs[ZaAccount.A_zimbraIsAdminAccount] == 'TRUE')
		return true;
	
	if(!instance)
		instance = this.getInstance();
	
	if (!instance.getAttrs)
		return false;
	
	var refPath=null;
	if(refToCheck) {
		refPath=refToCheck;
	} else {
		if(!this.refPath)
			return true;
		else
			refPath=this.refPath;
	}
		
	return ((instance.getAttrs.all === true) || (instance.getAttrs[refPath] === true));
}
XFormItem.prototype.hasReadPermission = ZaItem.hasReadPermission;
OSelect1_XFormItem.prototype.visibilityChecks = [ZaItem.hasReadPermission];
Checkbox_XFormItem.prototype.visibilityChecks = [ZaItem.hasReadPermission];
Textfield_XFormItem.prototype.visibilityChecks = [ZaItem.hasReadPermission];
Select1_XFormItem.prototype.visibilityChecks = [ZaItem.hasReadPermission];
Repeat_XFormItem.prototype.visibilityChecks = [ZaItem.hasReadPermission];

/**
 * Method of XFormItem
 */
ZaItem.hasWritePermission = function (refToCheck,instance) {
	if(ZaZimbraAdmin.currentAdminAccount.attrs[ZaAccount.A_zimbraIsAdminAccount] == 'TRUE')
		return true;

	if(!instance)
		instance = this.getInstance();
	
	if (!instance.setAttrs)
		return false;
	
	var refPath=null;
	if(refToCheck) {
		refPath=refToCheck;
	} else {
		if(!this.refPath)
			return true;
		else
			refPath=this.refPath;
	}
		
	return ((instance.setAttrs.all === true) || (instance.setAttrs[refPath] === true));
}
XFormItem.prototype.hasWritePermission = ZaItem.hasWritePermission;
Textfield_XFormItem.prototype.enableDisableChecks = [ZaItem.hasWritePermission];
OSelect1_XFormItem.prototype.enableDisableChecks = [ZaItem.hasWritePermission];
Checkbox_XFormItem.prototype.enableDisableChecks = [ZaItem.hasWritePermission];
Select1_XFormItem.prototype.enableDisableChecks = [ZaItem.hasWritePermission];
Repeat_XFormItem.prototype.enableDisableChecks = [ZaItem.hasWritePermission];

/**
 * Method of XFormItem
 */
ZaItem.hasRight = function (right, instance) {
	if(ZaZimbraAdmin.currentAdminAccount.attrs[ZaAccount.A_zimbraIsAdminAccount] == 'TRUE')
		return true;
		
	if(!instance)
		instance = this.getInstance();
		
	if (!instance.rights)
		return false;
	
	if(!right)
		return true;
		
	return (instance.rights[right] === true);
}
XFormItem.prototype.hasRight = ZaItem.hasRight;