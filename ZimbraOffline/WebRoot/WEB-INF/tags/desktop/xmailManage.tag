<%@ tag body-content="empty" %>
<%@ attribute name="accountFlavor" required="true" %>
<%@ attribute name="uri" required="true" %>
<%@ attribute name="verb" required="false" %>

<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="com.zimbra.i18n" %>
<%@ taglib prefix="zdf" uri="com.zimbra.cs.offline.jsp" %>

<fmt:setBundle basename="/desktop/ZdMsg" scope="request"/>

<script type="text/javascript">
function InitScreen() {
<c:if test="${bean.password eq '' or not zdf:isValid(bean, 'password')}"> 
    zd.hide("editPasswordRow");
    zd.show("passwordRow");
</c:if>
}

function SetPort() {
    if (zd.isDisabled("port")) {
        if (${bean.type eq 'pop3'}) {
            if (${bean.ssl})
                zd.set("port", "995");
            else
                zd.set("port", "110");
        } else if (${bean.type eq 'imap'}) {
            if (zd.isChecked("ssl"))
                zd.set("port", "993");
            else
                zd.set("port", "143");
        }
    } else if (${bean.type eq 'zimbra'}) {
        if (zd.isChecked("ssl"))
            zd.set("port", "443");
        else
            zd.set("port", "80");
    }
}

function SetSmtpPort() {
    if (zd.isDisabled("smtpPort")) {
        if (${bean.ssl}) {
            zd.set("smtpPort", "465");
        } else {
            zd.set("smtpPort", "25");
        }
    }
}
</script>

<div id="newService" class="ZWizardPage">

<span class="padding">
<form name="accountForm" action="${uri}" method="POST">
    <input type="hidden" name="accountId" value="${bean.accountId}">
    <input type="hidden" name="accountFlavor" value="${accountFlavor}">
<c:if test="${bean.type ne 'zimbra' and not empty bean.domain}">
    <input type="hidden" name="domain" value="${bean.domain}">
</c:if>
    <input type="hidden" name="verb" value="${verb}">

        <tr>
            <td class="${zdf:isValid(bean, 'accountName') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='AccountName'/></td>
            <td><input class="ZField" type="text" id="accountName" name="accountName" value="${bean.accountName}" ${empty bean.accountId ? '' : 'disabled'}><td>
        </tr>
<c:if test="${bean.type ne 'zimbra'}">
        <tr>
            <td class="ZFieldLabel"><fmt:message key='FullName'/></td>
            <td><input class="ZField" type="text" id="fromDisplay" name="fromDisplay" value="${bean.fromDisplay}"></td>
        </tr>
</c:if>
        <tr id="emailRow">
            <td class="${zdf:isValid(bean, 'email') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='EmailAddress'/></td>
            <td><input class="ZField" type="text" id="email" name="email" value="${bean.email}"></td>
        </tr>
<c:if test="${bean.serverConfigSupported}">    
    <c:if test="${bean.usernameRequired}">    
        <tr id="receivingMailRow">
            <td class="ZSection" colspan="2"><fmt:message key='ReceivingMail'/></td>
        </tr>
        <tr><td><td></tr>
        <tr id="usernameRow">
            <td class="${zdf:isValid(bean, 'username') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='UserName'/></td>
            <td><input class="ZField" type="text" id="username" name="username" value="${bean.username}"></td>
        </tr>       
    </c:if>
</c:if>
        <tr id="editPasswordRow">
            <td class="${zdf:isValid(bean, 'password') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='Password'/></td>
            <td>
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td><input style="width:300px" class="ZField" type="password" id="editPassword" name="editPassword" value="${bean.password}" disabled></td>
                        <td align="right">&nbsp;<a href="#" onclick="onEditPassword('password');this.style.display='none'"><fmt:message key='Edit'/></a></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr id="passwordRow" style="display:none">
            <td class="${zdf:isValid(bean, 'password') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='Password'/></td>
            <td><input class="ZField" type="password" id="password" name="password" value="${bean.password}"></td>
        </tr>       
<c:if test="${bean.serverConfigSupported}">    
        <tr id="mailServerRow">
            <td class="${zdf:isValid(bean, 'host') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='InMailServer'/></td>
            <td>
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td><input style="width:200px" class="ZField" type="text" id="host" name="host" value="${bean.host}"></td>
                        <td class="${zdf:isValid(bean, 'port') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='Port'/>&nbsp;</td>
                        <td width="1%"><input style="width:40px" class="ZField" type="text" id="port" name="port" value="${bean.port}" "disabled"></td>
                        <td>&nbsp;<a href="#" onclick="onEditPort(this, 'port')"><fmt:message key='Edit'/></a></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr id="mailSecureRow">
            <td class="ZFieldLabel"></td>
            <td>
                <table cellpadding="0" cellspacing="0">
                    <tr>
                        <td><input class="ZCheckboxCell" type="checkbox" id="ssl" name="ssl" ${bean.ssl ? 'checked' : ''} onclick="SetPort()"></td>
                        <td><fmt:message key='UseSSL'/></td>
                    </tr>
                </table>
            </td>
        </tr>
<c:if test="${bean.smtpConfigSupported}">    
        <tr id="sendingMailRow">
            <td class="ZSection" colspan="2"><fmt:message key='SendingMail'/></td>
        </tr>
        <tr><td><td></tr>
        <tr id="smtpServerRow">
            <td class="${zdf:isValid(bean, 'smtpHost') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='OutMailServer'/></td>
            <td>
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td><input style="width:200px" class="ZField" type="text" id="smtpHost" name="smtpHost" value="${bean.smtpHost}"></td>
                        <td class="${zdf:isValid(bean, 'smtpPort') ? 'ZFieldLabel' : 'ZFieldError'}"><fmt:message key='Port'/>&nbsp;</td>
                        <td width="1%"><input style="width:40px" class="ZField" type="text" id="smtpPort" name="port" value="${bean.smtpPort}" "disabled"></td>
                        <td>&nbsp;<a href="#" onclick="onEditPort(this, 'smtpPort')"><fmt:message key='Edit'/></a></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr id="smtpSecureRow">
            <td class="ZFieldLabel"></td>
            <td>
                <table cellpadding="0" cellspacing="0">
                    <tr>
                        <td><input class="ZCheckboxCell" type="checkbox" id="smtpSsl" name="smtpSsl" ${bean.smtpSsl ? 'checked' : ''} onclick="SetSmtpPort()"></td>
                        <td><fmt:message key='UseSSL'/></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr id="smtpAuthRow">
            <td class="ZFieldLabel"></td>
            <td>
                <table cellpadding="0" cellspacing="0">
                    <tr>
                        <td><input class="ZCheckboxCell" type="checkbox" id="smtpAuth" name="smtpAuth" ${bean.smtpAuth ? 'checked' : ''} onclick='zd.toggle("smtpAuthSettingsRow", this.checked)'></td>
                        <td><fmt:message key='UsrPassForSend'/></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr id="smtpAuthSettingsRow" align="right" ${bean.smtpAuth ? '' : 'style="display:none"'}>
            <td class="ZFieldLabel"></td>
            <td align="right">
                <table cellpadding="5">
                    <tr>
                        <td class="${zdf:isValid(bean, 'smtpUsername') ? 'ZLabel' : 'ZFieldError'}"><nobr><fmt:message key='UserName'/></nobr></td>
                        <td><input style="width:240px" class="ZField" type="text" id="smtpUsername" name="smtpUsername" value="${bean.smtpUsername}" onkeypress='zd.markElementAsManuallyChanged(this)'></td>
                    </tr>
                    <tr>
                        <td class="${zdf:isValid(bean, 'smtpPassword') ? 'ZLabel' : 'ZFieldError'}"><nobr><fmt:message key='Password'/></nobr></td>
                        <td><input style="width:240px" class="ZField" type="password" id="smtpPassword" name="smtpPassword" value="${bean.smtpPassword}" onkeypress='zd.markElementAsManuallyChanged(this)'></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr id="replyToRow">
            <td class="ZFieldLabel"><fmt:message key='ReplyTo'/></td>
            <td align="right">
                <table cellpadding="5">
                    <tr>
                        <td align="right"><nobr><fmt:message key='Name'/></nobr></td>
                        <td><input style="width:240px;" class="ZField" type="text" id="replyToDisplay" name="replyToDisplay" value="${bean.replyToDisplay}" onkeypress='zd.markElementAsManuallyChanged(this)'></td>
                    </tr>
                    <tr>
                        <td align="right"><nobr><fmt:message key='EmailAddress'/></nobr></td>
                        <td><input style="width:240px;" class="ZField" type="text" id="replyTo" name="replyTo" value="${bean.replyTo}" onkeypress='zd.markElementAsManuallyChanged(this)'></td>
                    </tr>
                </table>
            </td>
        </tr>
</c:if>
</c:if>
        <tr><td class="ZSection" colspan="2"><fmt:message key='SyncOptions'/></td><tr>
        <tr>
            <td class="ZFieldLabel"><fmt:message key='SyncFrequency'/></td>
            <td>
                <select class="ZSelectSmall" id="syncFreqSecs" name="syncFreqSecs">
                    <option value="-1" ${bean.syncFreqSecs == -1 ? 'selected' : ''}><fmt:message key='SyncManually'/></option>
                    <option value="60" ${bean.syncFreqSecs == 60 ? 'selected' : ''}><fmt:message key='SyncEveryMin'/></option>
                    <option value="300" ${bean.syncFreqSecs == 300 ? 'selected' : ''}><fmt:message key='SyncEvery5'/></option>
                    <option value="900" ${bean.syncFreqSecs == 900 ? 'selected' : ''}><fmt:message key='SyncEvery15'/></option>
                    <option value="1800" ${bean.syncFreqSecs == 1800 ? 'selected' : ''}><fmt:message key='SyncEvery30'/></option>
                    <option value="3600" ${bean.syncFreqSecs == 3600 ? 'selected' : ''}><fmt:message key='SyncEvery1Hr'/></option>
                    <option value="14400" ${bean.syncFreqSecs == 14400 ? 'selected' : ''}><fmt:message key='SyncEvery4Hr'/></option>
                    <option value="43200" ${bean.syncFreqSecs == 43200 ? 'selected' : ''}><fmt:message key='SyncEvery12Hr'/></option>
                </select>
            </td>
        </tr>
<c:if test="${bean.type eq 'pop3'}">
        <tr id="popSettingsRow">
            <td class="ZFieldLabel"><fmt:message key='SyncMsgs'/></td>
            <td>
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td><input class="ZRadioCell" type="radio" id="leaveOnServer" name="leaveOnServer" ${bean.leaveOnServer ? '' : 'checked'} value="false"></td>
                        <td><nobr><fmt:message key='SyncMsgsDelete'/><nobr></td>
                        <td width="99%">&nbsp;</td>
                        <td><input type="radio" id="leaveOnServer" name="leaveOnServer" ${bean.leaveOnServer ? 'checked' : ''} value="true"></td>
                        <td><nobr><fmt:message key='SyncMsgsLeave'/></nobr></td>
                    </tr>
                </table>
            </td>
        </tr>
</c:if>
<c:if test="${bean.folderSyncSupported}">
        <tr id="syncFoldersRow" >
            <td class="ZFieldLabel"><fmt:message key='SyncFolders'/></td>
            <td>
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td><input type="radio" id="syncAllServerFolders" name="syncAllServerFolders" ${bean.syncAllServerFolders ? 'checked' : ''} value="true"></td>
                        <td><nobr><fmt:message key='SyncFoldersAll'/></nobr></td>
                        <td width="99%">&nbsp;</td>
                        <td><input class="ZRadioCell" type="radio" id="syncAllServerFolders" name="syncAllServerFolders" ${bean.syncAllServerFolders ? '' : 'checked'} value="false"></td>
                        <td><nobr><fmt:message key='SyncFoldersInbox'/><nobr></td>
                    </tr>
                </table>
            </td>
        </tr>
</c:if>
<c:if test="${bean.calendarSyncSupported}">
        <tr id="syncCalendarRow">
            <td class="ZFieldLabel"><fmt:message key='SyncCalendar'/></td>
            <td><input class="ZCheckboxCell" type="checkbox" id="calendarSyncEnabled" name="calendarSyncEnabled" ${bean.calendarSyncEnabled ? 'checked' : ''}></td>
        </tr>
</c:if>
<c:if test="${bean.contactSyncSupported}">
        <tr id="syncContactsRow" >
            <td class="ZFieldLabel"><fmt:message key='SyncContacts'/></td>
            <td><input class="ZCheckboxCell" type="checkbox" id="contactSyncEnabled" name="contactSyncEnabled" ${bean.contactSyncEnabled ? 'checked' : ''}></td>
        </tr>
</c:if>
<c:if test="${not empty bean.accountId}">
        <tr id="debugTraceRow">
            <td class="ZFieldLabel"><fmt:message key='EnableTrace'/></td>
            <td><input class="ZCheckboxCell" type="checkbox" id="debugTraceEnabled" name="debugTraceEnabled" ${bean.debugTraceEnabled ? 'checked' : ''}></td>
        </tr>
</c:if>
</form>
</div>
</span>
