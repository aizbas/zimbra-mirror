/*
 * ***** BEGIN LICENSE BLOCK *****
 *
 * Zimbra Collaboration Suite Zimlets
 * Copyright (C) 2006, 2007 Zimbra, Inc.
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

//Author: Raja Rao DV (rrao@zimbra.com)

function com_zimbra_tweetziTwitter(zimlet) {
	this.zimlet = zimlet;
	this.allSearches = new Array();
	this.allTrends = new Array();
	this.loadAllSearchesFromDB();
	this.consumerKey = this.zimlet.getUserProperty("tweetzi_twitter_consumer_key");
	this.consumerSecret = this.zimlet.getUserProperty("tweetzi_twitter_consumer_secret");

}

com_zimbra_tweetziTwitter.prototype._getTodayStr = function() {
	var todayDate = new Date();
	var todayStart = new Date(todayDate.getFullYear(),todayDate.getMonth(), todayDate.getDate());
	return this._normalizeDate(todayStart.getMonth()+1,  todayStart.getDate(), todayStart.getFullYear());
};

com_zimbra_tweetziTwitter.prototype._normalizeDate =
function(month, day, year) {
	var tmpArry = (I18nMsg.formatDateShort.toLowerCase()).split("/");
	if(tmpArry[0].indexOf("d") >=0 && tmpArry[1].indexOf("m") >=0) {
		return day + "/" + month + "/" + year;
	} else if(tmpArry[1].indexOf("d") >=0 && tmpArry[0].indexOf("m") >=0) {
		return month + "/" + day + "/" + year;
	} else if(tmpArry[1].indexOf("m") >=0 && tmpArry[2].indexOf("d") >=0) {
		return year + "/"+ month + "/" + day ;
	} else if(tmpArry[1].indexOf("d") >=0 && tmpArry[2].indexOf("m") >=0) {
			return year + "/"+ day + "/" + month ;
	}
};
com_zimbra_tweetziTwitter.prototype.getTwitterTrends =
function() {
	var entireurl = ZmZimletBase.PROXY + AjxStringUtil.urlComponentEncode("http://search.twitter.com/trends.json");
	AjxRpc.invoke(null, entireurl, null, new AjxCallback(this, this._trendsCallback), true);
};

com_zimbra_tweetziTwitter.prototype._trendsCallback =
function(response) {
	var text = response.text;
	var jsonObj = eval("(" + text + ")");
	var trends = jsonObj.trends;
	if (!response.success) {
		var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE,  ZmToast.FADE_OUT ];
		appCtxt.getAppController().setStatusMsg("Twitter Error: " + response.text, ZmStatusView.LEVEL_WARNING, null, transitions);
		return;
	}

	this.allTrends = new Array();
	for (var i = 0; i < trends.length; i++) {
		this.allTrends[trends[i].name] = true;
	}
	for (var i = 0; i < 1; i++) {
		var name = trends[i].name;
		var tableId = this.zimlet._showCard({headerName:name, type:"TREND", autoScroll:false});
		var sParams = {query:name, tableId:tableId, type:"TREND"};
		this.twitterSearch(sParams);
		var timer = setInterval(AjxCallback.simpleClosure(this.twitterSearch, this, sParams), 400000);
		this.zimlet.tableIdAndTimerMap[tableId] = timer;
	}
	this.zimlet._updateAllWidgetItems({updateTrendsTree:true});

};


com_zimbra_tweetziTwitter.prototype.twitterSearch =
function(params) {
	var entireurl = ZmZimletBase.PROXY + AjxStringUtil.urlComponentEncode("http://search.twitter.com/search.json??rpp=50&q=" + AjxStringUtil.urlComponentEncode(params.query));
	AjxRpc.invoke(null, entireurl, null, new AjxCallback(this, this._twitterSearchCallback, params), true);
};

com_zimbra_tweetziTwitter.prototype._twitterSearchCallback =
function(params, response) {
	var text = response.text;
	if (!response.success) {
		var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE,  ZmToast.FADE_OUT ];
		appCtxt.getAppController().setStatusMsg("Twitter Error: " + text, ZmStatusView.LEVEL_WARNING, null, transitions);
		return;
	}
	var jsonObj = eval("(" + text + ")");
	this.zimlet.createCardView(params.tableId, jsonObj.results, params.type);
};

com_zimbra_tweetziTwitter.prototype.getFriendsTimeLine =
function(params) {
	this.getMessages(params.tableId, params.account, params.callback, this.getFriendsTimelineUrl(params.account), "ACCOUNT");
};
com_zimbra_tweetziTwitter.prototype.getMentions =
function(params) {
	this.getMessages(params.tableId, params.account, params.callback, this.getMentionsUrl(params.account), "MENTIONS");
};

com_zimbra_tweetziTwitter.prototype.getSentMessages =
function(params) {
	this.getMessages(params.tableId, params.account, params.callback, this.getSentMessagesUrl(params.account), "SENT_MSGS");
};

com_zimbra_tweetziTwitter.prototype.getProfileMessages =
function(params) {
	this.getMessages(params.tableId, params.account, params.callback, this.getProfileMessagesUrl(params.account, params.screen_name), "ACCOUNT");
};

com_zimbra_tweetziTwitter.prototype.getDirectMessages =
function(params) {
	this.getMessages(params.tableId, params.account, params.callback, this.getDMSentUrl(params.account), "DIRECT_MSGS");
};

com_zimbra_tweetziTwitter.prototype.getMessages =
function(tableId, account, callback, url, type) {
	var entireurl = ZmZimletBase.PROXY + AjxStringUtil.urlComponentEncode(url);
	if(!callback){
		 callback = new AjxCallback(this, this._twitterItemsHandler, {account:account, tableId:tableId, type:type});
	}
	AjxRpc.invoke(null, entireurl, null, callback, true);
};
com_zimbra_tweetziTwitter.prototype.scanForUpdates =
function() {
		var account = "";
		var accountList = new Array();
		for(var id in this.zimlet.allAccounts) {
			account =  this.zimlet.allAccounts[id];
			if(account.type == "twitter") {
				accountList.push(account);
			}
		}
		if(accountList.length == 1){
			account =  accountList[0];
			var callback4 = new AjxCallback(this, this.addContentsToMail, {account:account, type:"ACCOUNT"});
			var callback3 = new AjxCallback(this, this.getFriendsTimeLine, {account:account, type:"ACCOUNT", callback:callback4});		
			var callback2 = new AjxCallback(this, this.addContentsToMail, {account:account, type:"DIRECT_MSGS", callback: callback3});
			var callback1 = new AjxCallback(this, this.getDirectMessages, {account:account, type:"DIRECT_MSGS", callback:callback2});
			var callback0 = new AjxCallback(this, this.addContentsToMail, {account:account, type:"MENTIONS", callback:callback1});
			this.getMentions({account:account, type:"MENTIONS", callback: callback0});			
		} else 	if(accountList.length == 2){
			var account1 =  accountList[0];
			var account2 =  accountList[1];
			var callback10 = new AjxCallback(this, this.addContentsToMail, {account:account2, type:"ACCOUNT"});
			var callback9 = new AjxCallback(this, this.getFriendsTimeLine, {account:account2, type:"ACCOUNT", callback:callback10});		
			var callback8 = new AjxCallback(this, this.addContentsToMail, {account:account2, type:"DIRECT_MSGS", callback: callback9});
			var callback7 = new AjxCallback(this, this.getDirectMessages, {account:account2, type:"DIRECT_MSGS", callback:callback8});
			var callback6 = new AjxCallback(this, this.addContentsToMail, {account:account2, type:"MENTIONS", callback:callback7});
			var callback5 = new AjxCallback(this, this.getMentions, {account:account2, type:"MENTIONS", callback:callback6});

			var callback4 = new AjxCallback(this, this.addContentsToMail, {account:account1, type:"ACCOUNT", callback:callback5});
			var callback3 = new AjxCallback(this, this.getFriendsTimeLine, {account:account1, type:"ACCOUNT", callback:callback4});		
			var callback2 = new AjxCallback(this, this.addContentsToMail, {account:account1, type:"DIRECT_MSGS", callback: callback3});
			var callback1 = new AjxCallback(this, this.getDirectMessages, {account:account1, type:"DIRECT_MSGS", callback:callback2});
			var callback0 = new AjxCallback(this, this.addContentsToMail, {account:account1, type:"MENTIONS", callback:callback1});
			this.getMentions({account:account1, type:"MENTIONS", callback: callback0});			
		}
};
com_zimbra_tweetziTwitter.prototype._twitterItemsHandler =
function(params, response) {
	var text = response.text;
	var jsonObj = eval("(" + text + ")");
	if(jsonObj.error) {
		var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE,  ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
		appCtxt.getAppController().setStatusMsg("Twitter Error: " +jsonObj.error, ZmStatusView.LEVEL_WARNING, null, transitions);
		var timer = this.zimlet.tableIdAndTimerMap[tableId];
		if (timer) { //remove update timers
			clearInterval(timer);
		}
		return;
	}
	this.zimlet.createCardView(params.tableId, jsonObj, params.type);
};


com_zimbra_tweetziTwitter.prototype.showUserProfile =
function(screen_name, tweetTableId) {
	var tableId = this.zimlet._showCard({headerName:screen_name, type:"PROFILE", tweetTableId:tweetTableId, autoScroll:true});
	var actionUrl = "https://twitter.com/users/show/" + screen_name + ".json";
	var entireurl = ZmZimletBase.PROXY + actionUrl;
	AjxRpc.invoke(null, entireurl, null, new AjxCallback(this, this.showUserProfileHandler, tableId), true);

};

com_zimbra_tweetziTwitter.prototype.showUserProfileHandler =
function(tableId, response) {
	var text = response.text;
	var jsonObj = eval("(" + text + ")");
	this._setUserProfileView(tableId, jsonObj);
};



com_zimbra_tweetziTwitter.prototype._setUserProfileView =
function(tableId, profileAccnt) {
	var html = [];
	var i = 0;
	var followMeDivIdAndAccountsMap = new Array();
	for(var id in this.zimlet.allAccounts) {
		var account =  this.zimlet.allAccounts[id];
		if(account.type == "twitter") {
			followMeDivIdAndAccountsMap.push({profileAccnt:profileAccnt, account:account, tableId:tableId, id:"tweetzi_followmebutton_"+Dwt.getNextId()});
		}
	}
	
	html[i++] = "<DIV  class='tweetzi_profileInnerDiv'>";
	html[i++] = "<DIV><img src=\"" + profileAccnt.profile_image_url + "\" /></DIV>";
	html[i++] = "<DIV>";
	html[i++] = "<TABLE width=100%>";
	html[i++] = "<TR><TD colspan=2>" + (profileAccnt.description == null ? "" :  profileAccnt.description) + "</TD></TR>";
	html[i++] = "<TR><TD width=25%>followers:</TD><TD>" + (profileAccnt.followers_count == null ? "" :  profileAccnt.followers_count) + "</TD></TR>";
	html[i++] = "<TR><TD  width=25%>friends:</TD><TD>"  + (profileAccnt.friends_count == null ? "" :  profileAccnt.friends_count) +  "</TD></TR>";
	html[i++] = "<TR><TD  width=25%>updates:</TD><TD>" + (profileAccnt.statuses_count == null ? "" :  profileAccnt.statuses_count) +  "</TD></TR>";
	html[i++] = "<TR><TD  width=25%>name:</TD><TD>" + (profileAccnt.name == null ? "" :  profileAccnt.name) +   "</TD></TR>";
	html[i++] = "<TR><TD  width=25%>location:</TD><TD>"  + (profileAccnt.location == null ? "" :  profileAccnt.location) +  "</TD></TR>";
	html[i++] = "<TR><TD  width=25%>timezone:</TD><TD>"  + (profileAccnt.time_zone == null ? "" :  profileAccnt.time_zone) + "</TD></TR>";
	html[i++] = "<TR><TD  width=25%>favourites:</TD><TD>"  + (profileAccnt.favourites_count == null ? "" :  profileAccnt.favourites_count) +   "</TD></TR>";
	html[i++] = "<TR><TD  width=25%>twitterPage:</TD><TD><a href='http://twitter.com/"+ profileAccnt.screen_name +"' target='_blank' >"  +"http://twitter.com/"+ profileAccnt.screen_name +   "</a></TD></TR>";

	for(var j=0; j< followMeDivIdAndAccountsMap.length; j++) {
		var obj =  followMeDivIdAndAccountsMap[j];
		html[i++] = "<TR><td>"+ obj.account.name+"</td><TD id='"+obj.id +"'></TD></TR>";
	}
	html[i++] = "</TABLE>";
	html[i++] = "</DIV>";
	html[i++] = "</DIV>";
	
	var msgsTableId = tableId+"__"+Dwt.getNextId();
	html[i++] = "<div id='"+msgsTableId+"' width=100%></div>";
	document.getElementById(tableId).style.backgroundImage = "url('" + profileAccnt.profile_background_image_url + "')";
	document.getElementById(tableId).innerHTML = html.join("");

	for(var j=0; j< followMeDivIdAndAccountsMap.length; j++) {
		var params =  followMeDivIdAndAccountsMap[j];
		this._checkIfFollowing(params);
	}
	this.zimlet.tableIdAndAccountMap[msgsTableId] = account;
	this.getProfileMessages({tableId: msgsTableId, account: account, screen_name: profileAccnt.screen_name});
};

com_zimbra_tweetziTwitter.prototype._checkIfFollowing = function(params) {
		var entireurl = ZmZimletBase.PROXY + AjxStringUtil.urlComponentEncode("https://twitter.com/friendships/show.json?source_screen_name="+params.account.name+"&target_screen_name="+params.profileAccnt.screen_name);
		AjxRpc.invoke(null, entireurl, null, new AjxCallback(this, this._checkIfFollowingCallback, params), true);
};

com_zimbra_tweetziTwitter.prototype._checkIfFollowingCallback = function(params, response) {
	var text = response.text;
	var jsonObj = eval("("+ text + ")");
	params["following"] = jsonObj.relationship.source.following;
	this._addFollowUnFollowBtn(params);
};

com_zimbra_tweetziTwitter.prototype._addFollowUnFollowBtn = function(params) {
	var btn = new DwtButton({parent:this.zimlet.getShell()});
	if(params.following) {
		btn.setText("Unfollow");
		btn.setImage("tweetzi_unFollowIcon");
		btn.addSelectionListener(new AjxListener(this, this._twitterFollowMe, params));
		document.getElementById(params.id).appendChild(btn.getHtmlElement());
	} else {
		btn.setText("follow me on twitter");
		btn.setImage("tweetzi_twitterIcon");
		btn.addSelectionListener(new AjxListener(this, this._twitterFollowMe, params));
		document.getElementById(params.id).appendChild(btn.getHtmlElement());
	}
};



com_zimbra_tweetziTwitter.prototype._twitterFollowMe =
function(origParams) {
	var profileAccnt = origParams.profileAccnt;
	var profileId = profileAccnt.id ? profileAccnt.id : profileAccnt.from_user_id;
	var createOrDestroy = "create";
	if(origParams.following)
		createOrDestroy = "destroy";

	var actionUrl = "https://twitter.com/friendships/"+createOrDestroy+"/" + profileId + ".json";
	var params = this.getFollowUserParams(actionUrl, origParams.profileId, origParams.account);
	var hdrs = new Array();
	hdrs["Content-type"] = "application/x-www-form-urlencoded";
	hdrs["Content-length"] = params.length;
	hdrs["Connection"] = "close";
	var entireurl = ZmZimletBase.PROXY + actionUrl;
	AjxRpc.invoke(params, entireurl, hdrs, new AjxCallback(this, this._twitterFollowMeCallback, origParams), false);
};


com_zimbra_tweetziTwitter.prototype._twitterFollowMeCallback =
function(origParams, response) {
	var text = response.text;
	var jsonObj = eval("("+text+ ")");
	if(jsonObj.error != undefined) {
		var msgDialog = appCtxt.getMsgDialog();
		var msg =  jsonObj.error;
		msgDialog.setMessage(msg, DwtMessageDialog.WARNING_STYLE);
		msgDialog.popup();
	}
	setTimeout(AjxCallback.simpleClosure(this._setUserProfileView, this, origParams.tableId, origParams.profileAccnt), 4000);//refresh table after 4 secs
};

com_zimbra_tweetziTwitter.prototype.getFollowUserParams =
function(actionUrl, profileId, account) {
	var ts = account.oauth_token_secret;
	var ot = account.oauth_token;
	var accessor = { consumerSecret: this.consumerSecret
		, tokenSecret   : ts};
	var message = { method: "POST"
		, action: actionUrl
		, parameters: new Array()
	};
	message.parameters.push(["oauth_consumer_key",this.consumerKey]);
	message.parameters.push(["oauth_version","1.0"]);
	message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
	message.parameters.push(["oauth_nonce", OAuth.nonce(11)]);
	message.parameters.push(["oauth_signature_method", "HMAC-SHA1"]);
	message.parameters.push(["oauth_token", ot]);

	OAuth.SignatureMethod.sign(message, accessor);
	var normalizedParams = OAuth.SignatureMethod.normalizeParameters(message.parameters);
	var signature = OAuth.getParameter(message.parameters, "oauth_signature");
	var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);

	var val = this._encodeNormalizedStr(normalizedParams);
	val = val + "&" + AjxStringUtil.urlComponentEncode("oauth_signature") + "=" + AjxStringUtil.urlComponentEncode(signature);
	return val;
};


com_zimbra_tweetziTwitter.prototype.postToTwitter =
function(account, message) {
	var isDM = false;
	var data = "";
	if(message.toLowerCase().indexOf("d @") == 0){//use this to make sure not to send message direct message to FB
		isDM = true;
	}
	if (account.__on == "true") {
		if(isDM) {
			data = this.getDMPostUrl(account);
			actionUrl = "https://twitter.com/direct_messages/new.json";
		} else {
			data = this.getUpdateUrl(account);
			actionUrl = "http://twitter.com/statuses/update.json";
		}
		
		var hdrs = new Array();
		hdrs["Content-type"] = "application/x-www-form-urlencoded";
		hdrs["Content-length"] = data.length;
		hdrs["Connection"] = "close";
		var entireurl = ZmZimletBase.PROXY +  AjxStringUtil.urlComponentEncode(actionUrl);
		AjxRpc.invoke(data, entireurl, hdrs, new AjxCallback(this, this._postToTweetCallback, account), false);
	}
};

com_zimbra_tweetziTwitter.prototype.getUpdateUrl =
function(account) {
	var data = document.getElementById("tweetzi_statusTextArea").value;
	var additionalParams  = new Array();
	additionalParams["status"] = data;
	params = {account:account, actionUrl:"http://twitter.com/statuses/update.json", http:"POST", additionalParams:additionalParams};
	return this.getTwitterUrl(params);
};

com_zimbra_tweetziTwitter.prototype.deletePost =
function(origParams) {
		var data = this.getdeletePostUrl(origParams);
		var hdrs = new Array();
		hdrs["Content-type"] = "application/x-www-form-urlencoded";
		hdrs["Content-length"] = data.length;
		hdrs["Connection"] = "close";
		var entireurl = ZmZimletBase.PROXY +  AjxStringUtil.urlComponentEncode("http://twitter.com/statuses/destroy/"+origParams.postId+".json");
		AjxRpc.invoke(data, entireurl, hdrs, new AjxCallback(this, this._deletePostCallback, origParams), false);

};
com_zimbra_tweetziTwitter.prototype._deletePostCallback =
function(origParams, response) {
	if(!response.success) {
		var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE,  ZmToast.FADE_OUT ];
		appCtxt.getAppController().setStatusMsg("Twitter Error: " + response.text, ZmStatusView.LEVEL_WARNING, null, transitions);
		return;
	}
	setTimeout(AjxCallback.simpleClosure(this._updateAccountStream, this, origParams.tableId, origParams.account), 3000);//refresh table after 3 secs

};

com_zimbra_tweetziTwitter.prototype.getdeletePostUrl =
function(origParams) {
	params = {account:origParams.account, actionUrl:"http://twitter.com/statuses/destroy/"+origParams.postId+".json", http:"POST"};
	return this.getTwitterUrl(params);
};

com_zimbra_tweetziTwitter.prototype.getDMPostUrl =
function(account) {
	var val = document.getElementById("tweetzi_statusTextArea").value;
	var arry = val.split(" ");
	var toUser = arry[1].replace("@", "");
	var data = "";
	for(var i=2; i< arry.length; i++) {
		if(data == "")
			data = arry[i];
		else
			data = data + " " +arry[i];
	}
	var additionalParams  = new Array();
	additionalParams["text"] = data;
	additionalParams["screen_name"] = toUser;
	params = {account:account, actionUrl:"https://twitter.com/direct_messages/new.json", http:"POST", additionalParams:additionalParams};
	return this.getTwitterUrl(params);
};

com_zimbra_tweetziTwitter.prototype.getMentionsUrl =
function(account) {
	var additionalParams  = new Array();
	additionalParams["count"] = "60";

	params = {account:account, actionUrl:"https://twitter.com/statuses/mentions.json", http:"GET", additionalParams:additionalParams};
	return this.getTwitterUrl(params);
};
com_zimbra_tweetziTwitter.prototype.getSentMessagesUrl =
function(account) {
	var additionalParams  = new Array();
	additionalParams["count"] = "60";

	params = {account:account, actionUrl:"http://twitter.com/statuses/user_timeline.json", http:"GET", additionalParams:additionalParams};
	return this.getTwitterUrl(params);
};
com_zimbra_tweetziTwitter.prototype.getProfileMessagesUrl =
function(account, screen_name) {
	var additionalParams  = new Array();
	additionalParams["count"] = "60";

	params = {account:account, actionUrl:"http://twitter.com/statuses/user_timeline/"+screen_name+".json", http:"GET", additionalParams:additionalParams};
	return this.getTwitterUrl(params);
};

com_zimbra_tweetziTwitter.prototype.getDMSentUrl =
function(account) {
	var additionalParams  = new Array();
	additionalParams["count"] = "60";

	params = {account:account, actionUrl:"https://twitter.com/direct_messages.json", http:"GET", additionalParams:additionalParams};
	return this.getTwitterUrl(params);
};

com_zimbra_tweetziTwitter.prototype.getTwitterUrl =
function(params) {
	var ignoreEncodingArray = new Array();
	var account = params.account;
	var actionUrl =  params.actionUrl;
	var http = params.http;
	var additionalParams = params.additionalParams;
	if(additionalParams == undefined) {
		additionalParams = new Array();
	}
	var ts = account.oauth_token_secret;
	var ot = account.oauth_token;
	var accessor = { consumerSecret: this.consumerSecret
		, tokenSecret   : ts};
	var message = { method: http
		, action: actionUrl
		, parameters: new Array()
	};
	message.parameters.push(["oauth_consumer_key",this.consumerKey]);
	message.parameters.push(["oauth_version","1.0"]);
	message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
	message.parameters.push(["oauth_nonce", OAuth.nonce(11)]);
	message.parameters.push(["oauth_signature_method", "HMAC-SHA1"]);
	message.parameters.push(["oauth_token", ot]);
	
	for(var name  in additionalParams) {
		message.parameters.push([name, additionalParams[name]]);
		ignoreEncodingArray.push(name);
	}

	OAuth.SignatureMethod.sign(message, accessor);
	var normalizedParams = OAuth.SignatureMethod.normalizeParameters(message.parameters);
	var signature = OAuth.getParameter(message.parameters, "oauth_signature");
	var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);

	var val = this._encodeNormalizedStr(normalizedParams, ignoreEncodingArray);
	val = val + "&" + "oauth_signature="+ AjxStringUtil.urlComponentEncode(signature);
	if(http == "GET")
		return actionUrl+"?"+val;
	else
		return val;
};

com_zimbra_tweetziTwitter.prototype._encodeNormalizedStr =
function(normalizedStr, ignoreEncodingArray) {
	if(!ignoreEncodingArray)
		ignoreEncodingArray = new Array();
	var encodStr = "";
	var tmp1 = normalizedStr.split("&");
	for (var i = 0; i < tmp1.length; i++) {
		var tmp2 = tmp1[i].split("=");
		var name =  tmp2[0];
		var value =  tmp2[1];
		var ignoreEncoding = false;
		for(var j=0; j < ignoreEncodingArray.length; j++){
			if(ignoreEncodingArray[j] == name){
				ignoreEncoding = true;
				break;
			}
		}

		if (encodStr == "")
			encodStr = AjxStringUtil.urlComponentEncode(name) + "=" + (ignoreEncoding ? value : AjxStringUtil.urlComponentEncode(value));
		else
			encodStr = encodStr + "&" + AjxStringUtil.urlComponentEncode(name) + "=" + (ignoreEncoding ? value : AjxStringUtil.urlComponentEncode(value));

	}
	return encodStr;
};

com_zimbra_tweetziTwitter.prototype._postToTweetCallback =
function(account, response) {
	var jsonObj = eval("("+response.text + ")");
	if (!response.success) {
		var msgDialog = appCtxt.getMsgDialog();
		var msg =  jsonObj.error;
		msgDialog.setMessage(msg, DwtMessageDialog.INFO_STYLE);
		msgDialog.popup();
		return;
	}
	document.getElementById("tweetzi_statusTextArea").value = "";
	this.zimlet.showNumberOfLetters();
	appCtxt.getAppController().setStatusMsg("Updates Sent", ZmStatusView.LEVEL_INFO);
	setTimeout(AjxCallback.simpleClosure(this._updateAccountStream, this, this.zimlet._getTableIdFromAccount(account), account), 3000);//refresh table after 3 secs
};


com_zimbra_tweetziTwitter.prototype.addContentsToMail =
function(params, response) {
	var pId = "";
	var unReadCount = 0;
	var text = response.text;
	var jsonObj = eval("(" + text + ")");
	if(jsonObj.error) {
		var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE,  ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
		appCtxt.getAppController().setStatusMsg("Twitter Error: " +jsonObj.error, ZmStatusView.LEVEL_WARNING, null, transitions);
		var timer = this.zimlet.tableIdAndTimerMap[tableId];
		if (timer) { //remove update timers
			clearInterval(timer);
		}
		//return;
	}
	var accnt = params.account;
	var type = params.type;
	if(!this.emailContentObj) {
		this.emailContentObj = new Array();
	}
	var items = new Array();
	var user = null;
	for (var k = 0; k < jsonObj.length; k++) {
		var obj = jsonObj[k];
		if(k == 0) {
			if (type == "ACCOUNT") {
				pId = accnt.__postId ? accnt.__postId : "";
			}else if (type == "MENTIONS") {
				pId = accnt.__mId ? accnt.__mId : "";
			}else if (type == "DIRECT_MSGS") {
				pId = accnt.__dmId ? accnt.__dmId : "";
			}else if (type == "SENT_MSGS") {
				pId = accnt.__smId ? accnt.__smId : "";
			}
		}
		
		if (obj.id > pId  || pId == "") {
			unReadCount++;
			if(unReadCount <5) {
				user = obj.user ? obj.user : obj.sender;
				items.push(user.screen_name + ": "+ obj.text);
			}
		}
	}

	if(!this.emailContentObj[accnt.name]) {
			this.emailContentObj[accnt.name] = {}
	}
	this.emailContentObj[accnt.name][type] = {unReadCount:unReadCount, items:items};
	if(params.callback) {
		params.callback.run(this);
	} else {
		this._addMessage(this._constructMime(this.emailContentObj));
	}
};

com_zimbra_tweetziTwitter.prototype._constructMime =
function(emailContentObj) {
	var html = new Array();
	var i = 0;
	html[i++] = "Return-Path: tweetzi@example.zimbra.com\n";
	html[i++] = "Received: from localhost (LHLO rr.zimbra.com) (127.0.0.1) by rr.zimbra.com\n";
	html[i++] = "with LMTP; "+(new Date()).toString()+"\n";
	html[i++] = "Received: by mail02.prod.aol.net (1.38.193.5/16.2) id AA10153;\n";
	html[i++] = (new Date()).toString()+"\n";
	html[i++] = "From: Zimbra TweetZi <tweetzi@zimbra.zimlet.com>\n";
	html[i++] = "Original-Sender: Zimbra TweetZi <tweetzi@zimbra.zimlet.com>\n";
	html[i++] = "To: "+appCtxt.getActiveAccount().name+"\n";
	html[i++] = "Date: "+(new Date()).toString()+"\n";
	var subject = new Array();
	var j =0;
	var totalUnreadCount = 0;
	var summary = new Array();
	for(var accntName in emailContentObj) {
		var accnt = emailContentObj[accntName];
		totalUnreadCount = totalUnreadCount + accnt.ACCOUNT.unReadCount; 
		totalUnreadCount = totalUnreadCount + accnt.DIRECT_MSGS.unReadCount;
		totalUnreadCount = totalUnreadCount + accnt.MENTIONS.unReadCount;
		summary[j++] = "----------------------------\n";
		summary[j++] = "Account: "+ accntName+"\n";
		summary[j++] = "----------------------------\n";
		summary[j++] = "Messages: "+ accnt.ACCOUNT.unReadCount  + "\n";
		summary[j++] = "Direct Messages: "+ accnt.DIRECT_MSGS.unReadCount + "\n";
		summary[j++] = "Mentions: "+ accnt.MENTIONS.unReadCount + "\n";
		summary[j++] = "\n\n";
	}
	html[i++] = "Subject: TweetZi update: You have "+totalUnreadCount+" new tweets\n\n";
	
	var body = new Array();
	var m = 0;
	for(var accntName in emailContentObj) {
		var accnt = emailContentObj[accntName];
		var props = ["ACCOUNT", "DIRECT_MSGS", "MENTIONS"];
		for(var j = 0; j < props.length; j++) {
			var prop = props[j];
			var propStr = "";
			if(prop == "ACCOUNT")
				propStr = accntName +": " +"new messages" + "(" + accnt[prop].unReadCount + ")";
			else
				propStr = accntName +": " + prop + "(" + accnt[prop].unReadCount + ")";
			body[m++] = "----------------------------------------------------\n" ; 
			body[m++] = propStr;
			body[m++] = "\n----------------------------------------------------\n\n" ; 

			var items = accnt[prop].items;
			for(var k = 0; k < items.length; k++) {
				body[m++] = items[k] ; 
				body[m++] = "\n\n"; 
			}
			if(items.length < accnt[prop].unReadCount) {
				body[m++] = "[Check TweetZi for "  + (accnt[prop].unReadCount - items.length) +" more]\n" ;
			}

		}
	}
	html[i++] = summary.join("") + body.join("");
	return html.join("");

};

com_zimbra_tweetziTwitter.prototype._addMessage =
function(mime) {
	var soapDoc = AjxSoapDoc.create("AddMsgRequest", "urn:zimbraMail");
	var m = soapDoc.set("m");
	m.setAttribute("l", "2");
	soapDoc.set("content", mime, m, "urn:zimbraMail");
	var callback = new AjxCallback(this, this._handleAddMessage);
	appCtxt.getAppController().sendRequest({soapDoc:soapDoc, asyncMode:true, callback:callback});
};

com_zimbra_tweetziTwitter.prototype._handleAddMessage =
function(response) {

};

com_zimbra_tweetziTwitter.prototype.getFriendsTimelineUrl =
function(account) {
	var additionalParams  = new Array();
	additionalParams["count"] = "60";
	params = {account:account, actionUrl:"https://twitter.com/statuses/friends_timeline.json", http:"GET", additionalParams:additionalParams};
	return this.getTwitterUrl(params);
};

com_zimbra_tweetziTwitter.prototype.performOAuth =
function() {
	var url = this.getRequestTokenUrl();
	var entireurl = ZmZimletBase.PROXY + AjxStringUtil.urlComponentEncode(url);
	AjxRpc.invoke(null, entireurl, null, new AjxCallback(this, this._twitterCallback), true);
};

com_zimbra_tweetziTwitter.prototype.getRequestTokenUrl =
function() {
	var accessor = { consumerSecret: this.consumerSecret
		, tokenSecret   : ""};
	var message = { method: "GET"
		, action: "https://twitter.com/oauth/request_token"
		, parameters: new Array()
	};
	message.parameters.push(["oauth_consumer_key",this.consumerKey]);
	message.parameters.push(["oauth_version","1.0"]);
	message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
	message.parameters.push(["oauth_nonce", OAuth.nonce(11)]);
	message.parameters.push(["oauth_signature_method", "HMAC-SHA1"]);
	OAuth.SignatureMethod.sign(message, accessor);
	var normalizedParams = OAuth.SignatureMethod.normalizeParameters(message.parameters);
	var signature = OAuth.getParameter(message.parameters, "oauth_signature");
	var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);

	return "https://twitter.com/oauth/request_token?" + normalizedParams + "&"+AjxStringUtil.urlComponentEncode("oauth_signature")+"=" + AjxStringUtil.urlComponentEncode(signature);
};

com_zimbra_tweetziTwitter.prototype.getAccessTokenUrl =
function(pin) {
	var accessor = { consumerSecret: this.consumerSecret
		, tokenSecret   : this._oauth_token_secret};
	var message = { method: "POST"
		, action: "https://twitter.com/oauth/access_token"
		, parameters: new Array()
	};
	message.parameters.push(["oauth_consumer_key",this.consumerKey]);
	message.parameters.push(["oauth_version","1.0"]);
	message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
	message.parameters.push(["oauth_nonce", OAuth.nonce(11)]);
	message.parameters.push(["oauth_signature_method", "HMAC-SHA1"]);

	OAuth.SignatureMethod.sign(message, accessor);
	var normalizedParams = OAuth.SignatureMethod.normalizeParameters(message.parameters);
	var signature = OAuth.getParameter(message.parameters, "oauth_signature");
	var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);

	var url = ["https://twitter.com/oauth/access_token?", normalizedParams, "&",
	           AjxStringUtil.urlComponentEncode("oauth_signature"), "=",  AjxStringUtil.urlComponentEncode(signature), "&",
			   AjxStringUtil.urlComponentEncode("oauth_verifier"), "=",  AjxStringUtil.urlComponentEncode(pin), "&",
	           AjxStringUtil.urlComponentEncode("oauth_token"), "=", AjxStringUtil.urlComponentEncode(this._oauth_token)].join("");

	return url;
};

com_zimbra_tweetziTwitter.prototype._twitterCallback =
function(response) {
	var txt = response.text;
	var tmp1 = txt.split("&");
	var token = "";
	for (var i = 0; i < tmp1.length; i++) {
		var name = tmp1[i];
		if (name.indexOf("oauth_token=") == 0) {
			this._oauth_token = name.replace("oauth_token=", "");
		} else if (name.indexOf("oauth_token_secret=") == 0) {
			this._oauth_token_secret = name.replace("oauth_token_secret=", "");
		}
	}

	var newWin = window.open("https://twitter.com/oauth/authorize?oauth_token=" + AjxStringUtil.urlComponentEncode(this._oauth_token), "", "toolbar=no,menubar=no,width=0.1px,height=0.1px");
	if (!newWin) {
		this.setStatusMsg(ZmMsg.popupBlocker, ZmStatusView.LEVEL_CRITICAL);
	}
	this._showGetPinDlg();
};

com_zimbra_tweetziTwitter.prototype._showGetPinDlg = function() {
	//if zimlet dialog already exists...
	if (this._getPinDialog) {
		document.getElementById("com_zimbra_twitter_pin_field").value = "";
		this._getPinDialog.popup();
		return;
	}
	this._getPinView = new DwtComposite(this.zimlet.getShell());
	this._getPinView.getHtmlElement().style.overflow = "auto";
	this._getPinView.getHtmlElement().innerHTML = this._createPINView();
	this._getPinDialog = this.zimlet._createDialog({title:"Enter Twitter PIN", view:this._getPinView, standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON]});
	this._getPinDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._okgetPinBtnListener));
	this._getPinDialog.popup();
};

com_zimbra_tweetziTwitter.prototype._createPINView =
function() {
	var html = new Array();
	var i = 0;
	html[i++] = "<DIV>";
	html[i++] = "<b>Steps to add twitter account:</b><BR/> 1. You will see a twitter.com page opened*. <br/>2. Please Enter your twitter account information over there <br/>";
	html[i++] = "3. Press Authorize <br>4. twitter will give you a 7 digit PIN code, like: <b>1234567</b> Copy that and paste it below";
	html[i++] = "</DIV>";
	html[i++] = "<DIV>";
	html[i++] = "<B>5. Enter Twitter PIN:<input id='com_zimbra_twitter_pin_field'  type='text'/></B>";
	html[i++] = "</DIV>";
	html[i++] = "<BR/>*If you don't see twitter.com page opened as mentioned in step 1, please check browser's popup blocker";

	return html.join("");
};

com_zimbra_tweetziTwitter.prototype._okgetPinBtnListener =
function() {

	var pin = document.getElementById("com_zimbra_twitter_pin_field").value;
	if(pin == "") {
		var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE,  ZmToast.FADE_OUT ];
		appCtxt.getAppController().setStatusMsg("Please enter 7 digit twitter PIN (Step 5)", ZmStatusView.LEVEL_WARNING, null, transitions);
		return;
	}
	var url = this.getAccessTokenUrl(pin);
	var entireurl = ZmZimletBase.PROXY + AjxStringUtil.urlComponentEncode(url);
	AjxRpc.invoke(null, entireurl, null, new AjxCallback(this, this._twitterAccessTokenCallbackHandler), false);

	this._getPinDialog.popdown();

};

com_zimbra_tweetziTwitter.prototype._twitterAccessTokenCallbackHandler =
function(response) {
	this.manageTwitterAccounts(response.text);
	this.zimlet.preferences._updateAccountsTable();
};

com_zimbra_tweetziTwitter.prototype.manageTwitterAccounts = function(text) {
	var nv = text.split("&");
	var tObj = {};
	for (var i = 0; i < nv.length; i++) {
		var tmp = nv[i].split("=");
		tObj[tmp[0]] = tmp[1];
	}
	if (tObj["__type"] == undefined) {
		tObj["__type"] = "twitter";
	}
	if (tObj["__on"] == undefined) {
		tObj["__on"] = "true";
	}
	if (tObj["__postId"] == undefined) {
		tObj["__postId"] = "";
	}
	//to normalize names with fb
	tObj.raw = text;
	tObj.name = tObj.screen_name;
	tObj.type = tObj["__type"];
	this.zimlet.allAccounts[tObj.user_id + tObj.screen_name] = tObj;
};


com_zimbra_tweetziTwitter.prototype.getAllSearchesAsString = function() {
	var str = "";
	for (var i = 0; i < this.allSearches.length; i++) {
		var search = this.allSearches[i];
		if (str == "") {
			str = search;
		} else {
			str = str + "::" + search;
		}
	}
	return str;
};

com_zimbra_tweetziTwitter.prototype.loadAllSearchesFromDB = function() {
	var allSearches = this.zimlet.getUserProperty("tweetzi_AllTwitterSearches");
	if (allSearches == "" || allSearches == undefined) {
		return;
	}
	this.allSearches = eval("(" + allSearches + ")");
};

com_zimbra_tweetziTwitter.prototype._updateAccountStream =
function(tableId, account) {
	this.getFriendsTimeLine({tableId: tableId, account: account});
};


com_zimbra_tweetziTwitter.prototype._updateAllSearches =
function(searchName, action, pId) {
	if(pId == undefined)
		pId = "";

	var needToUpdate = false;
	var hasSearches = false;
	var newAllSearches = new Array();


	for (var i = 0; i < this.allSearches.length; i++) {
		hasSearches = true;
		var origSearch = this.allSearches[i];
		var currSearchName = origSearch.name;
		if (currSearchName == searchName && action != "delete") {
			origSearch.axn = action;
			newAllSearches.push(origSearch);
			needToUpdate = true;
		} else if (currSearchName != searchName) {
			newAllSearches.push(origSearch);
		} else {//deleting the item
			needToUpdate = true;
		}
	}


	if (needToUpdate && hasSearches) {
		this.allSearches = newAllSearches;
		this.zimlet.setUserProperty("tweetzi_AllTwitterSearches", this.getAllSearchesAsJSON(), true);
		this.zimlet._updateAllWidgetItems({updateSearchTree:true, updateSystemTree:false, updateAccntCheckboxes:false, searchCards:false});
	}
};

com_zimbra_tweetziTwitter.prototype.getAllSearchesAsJSON =
function() {
	var html = new Array();
	var i = 0;
	html[i++] = "[";
	for (var j = 0; j < this.allSearches.length; j++) {
		var obj = this.allSearches[j];
		html[i++] = "{";
		html[i++] = "name:";
		html[i++] = "\"" + obj.name + "\"";
		html[i++] = ",axn:";
		html[i++] = "\"" + obj.axn + "\"";
		html[i++] = ",pId:";
		html[i++] = "\"" + obj.pId + "\"";
		html[i++] = "}";
		if (j != this.allSearches.length - 1) {
			html[i++] = ",";
		}
	}
	html[i++] = "]";
	return html.join("");
};
