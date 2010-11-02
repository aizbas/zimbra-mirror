package projects.ajax.tests.login;

import java.util.Calendar;
import java.util.GregorianCalendar;

import org.testng.annotations.Test;

import projects.ajax.core.AjaxCommonTest;
import projects.ajax.ui.PageLogin;

import framework.util.HarnessException;
import framework.util.ZAssert;

public class LoginScreen extends AjaxCommonTest {

	public LoginScreen() {
		logger.info("New "+ LoginScreen.class.getCanonicalName());

		// All tests start at the login page
		super.startingPage = app.zPageLogin;
		super.startingAccount = null;

	}

	@Test(	description = "Verify the label text on the mobile client login screen",
			groups = { "smoke" })
	public void LoginScreen01() throws HarnessException {
		
		String username = app.zPageLogin.sGetText(PageLogin.displayedusername);
		ZAssert.assertEquals(username, app.getLocaleString("usernameLabel"), "Verify the displayed label 'username'");
		

	}
	
	@Test(	description = "Verify the copyright on the login screen contains the current year",
			groups = { "smoke" })
	public void LoginScreen02() {
		
		Calendar calendar = new GregorianCalendar();
		String thisYear = "" + calendar.get(Calendar.YEAR);
		
		String copyright = app.zPageLogin.sGetText(PageLogin.displayedcopyright);
		
		String message = String.format("Verify the copyright (%s) on the login screen contains the current year (%s)", copyright, thisYear);
		ZAssert.assertStringContains(copyright, thisYear, message);
		

	}

}
