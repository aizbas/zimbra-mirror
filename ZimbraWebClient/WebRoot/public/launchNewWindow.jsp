<!-- 
***** BEGIN LICENSE BLOCK *****
Version: ZPL 1.2

The contents of this file are subject to the Zimbra Public License
Version 1.2 ("License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License at
http://www.zimbra.com/license

Software distributed under the License is distributed on an "AS IS"
basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
the License for the specific language governing rights and limitations
under the License.

The Original Code is: Zimbra Collaboration Suite Web Client

The Initial Developer of the Original Code is Zimbra, Inc.
Portions created by Zimbra are Copyright (C) 2006 Zimbra, Inc.
All Rights Reserved.

Contributor(s):

***** END LICENSE BLOCK *****
-->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title>Zimbra</title>
<%
	String contextPath = request.getContextPath();
	String full = request.getParameter("full");

    String skin = request.getParameter("skin");
    if (skin == null) {
        skin = "steel";
    }

	String mode = (String) request.getAttribute("mode");
	Boolean inDevMode = (mode != null) && (mode.equalsIgnoreCase("mjsf"));

	String vers = (String) request.getAttribute("version");
	if (vers == null) vers = "";

	String ext = (String) request.getAttribute("fileExtension");
	if (ext == null) ext = "";
%>
<script type="text/javascript" language="javascript">
	appContextPath = "<%= contextPath %>";
	appCurrentSkin = "<%=skin %>";
</script>

<script type="text/javascript" src="<%= contextPath %>/js/msgs/I18nMsg,AjxMsg,ZMsg,ZmMsg.js<%= ext %>?v=<%= vers %>"></script>
<style type="text/css">
	<!--
	@import url(<%= contextPath %>/img/loRes/imgs.css?v=<%= vers %>);
	@import url(<%= contextPath %>/img/loRes/skins/<%= skin %>/<%= skin %>.css?v=<%= vers %>);
	@import url(<%= contextPath %>/css/dwt,common,zm,spellcheck,skin.css?v=<%= vers %>&skin=<%= skin %>);
	-->
</style>

<% if (inDevMode) { %>
	<%if (full != null) {%>
		<jsp:include page="Ajax.jsp"/>
		<jsp:include page="Zimbra.jsp"/>
		<jsp:include page="ZimbraMail.jsp"/>
	<% } else { %>
		<jsp:include page="AjaxNewWindow.jsp"/>
		<jsp:include page="Zimbra.jsp"/>
		<jsp:include page="ZimbraNewWindow.jsp"/>
	<% } %>
<% } else { %>
	<%if (full != null) {%>
		<script type="text/javascript" src="<%= contextPath %>/js/Ajax_all.js<%= ext %>?v=<%= vers %>"></script>
		<script type="text/javascript" src="<%= contextPath %>/js/ZimbraMail_all.js<%= ext %>?v=<%= vers %>"></script>
	<% } else { %>
		<script type="text/javascript" src="<%= contextPath %>/js/AjaxNewWindow_all.js<%= ext %>?v=<%= vers %>"></script>
		<script type="text/javascript" src="<%= contextPath %>/js/ZimbraNewWindow_all.js<%= ext %>?v=<%= vers %>"></script>
	<% } %>
<% } %>

<script type="text/javascript" language="JavaScript">
    var cacheKillerVersion = "<%= vers %>";
	function launch() {
		DBG = new AjxDebug(AjxDebug.NONE, null, false);
		ZmNewWindow.run(document.domain);
	}
	AjxCore.addOnloadListener(launch);
	AjxCore.addOnunloadListener(ZmNewWindow.unload);
</script>
</head>
<body></body>
</html>