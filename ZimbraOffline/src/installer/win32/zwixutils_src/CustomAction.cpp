
#include "stdafx.h"
#include "direct.h"
#include "stdio.h"
#include "stdlib.h"
#include "string.h"

//no "deprecated" warnings
#pragma warning(disable : 4996)
#pragma warning(disable : 4995)

static int FindAndReplace(const char *file, int num, char* tokens[], char* values[]) {
	char line[512];
	char *tmpfile = new char[strlen(file) + 5];
	FILE *fi, *fo;
	int i;
  
	fi = fopen(file, "r");
	if (!fi) {
		WcaLog(LOGMSG_STANDARD, "Unable to open file %s", file);
		return 1;
	}

	sprintf(tmpfile, "%s.tmp", file);
	fo = fopen(tmpfile, "w");
	if (!fo) {
		WcaLog(LOGMSG_STANDARD, "Unable to open file %s", tmpfile);
		fclose(fi);
		return 1;
	}

	while(fgets(line, 512, fi) != NULL) {
		char *out = line;
		char buf[1024];
		char *tok;

		buf[0] = '\0';
		for (i = 0; i < num; ++i) {
			tok = strstr(line, tokens[i]);
			if (tok) {
				WcaLog(LOGMSG_VERBOSE, "Token replacement: token=%s, value=%s, file=%s",
					tokens[i], values[i], file);
				strncat(buf, line, tok - line);
				strcat(buf, values[i]);
				strcat(buf, tok + strlen(tokens[i]));	
				out = buf;
				break;
			}
		}
		fprintf(fo, "%s", out);
	}  

	fclose(fi);
	fclose(fo);

	unlink(file);
	rename(tmpfile, file);
	return 0;
}

UINT __stdcall ZTokenReplace(MSIHANDLE hInstall) {
	HRESULT hr = S_OK;
	UINT er = ERROR_SUCCESS;

	hr = WcaInitialize(hInstall, "ZTokenReplace");
	ExitOnFailure(hr, "Failed to initialize");
	WcaLog(LOGMSG_STANDARD, "Initialized.");

    UINT rc;
	char file[2048];
    char prop[1024];
	DWORD filesize = sizeof(file);
    DWORD propsize = sizeof(prop);

    rc = MsiGetProperty(hInstall, "File", &file[0], &filesize);
    if (rc != ERROR_SUCCESS) {
		WcaLog(LOGMSG_STANDARD, "Unable to get property: File");
        return WcaFinalize(ERROR_INSTALL_FAILURE);
    }

    rc = MsiGetProperty(hInstall, "NumberOfTokens", &prop[0], &propsize);
    if (rc != ERROR_SUCCESS) {
		WcaLog(LOGMSG_STANDARD, "Unable to get property: NumberOfTokens");
        return WcaFinalize(ERROR_INSTALL_FAILURE);
    }

	int num = atoi(prop);
	if (num > 0) {
		char **tokens = new char *[num];
		char **values = new char *[num];
		for (int i = 0; i < num; ++i) {
			char key[32];

			propsize = sizeof(prop);
			sprintf(key, "Token%u", i + 1);
			MsiGetProperty(hInstall, key, &prop[0], &propsize);
			tokens[i] = strdup(prop);

			propsize = sizeof(prop);
			sprintf(key, "Value%u", i + 1);
			MsiGetProperty(hInstall, key, &prop[0], &propsize);
			values[i] = strdup(prop);
			if (values[i][propsize - 1] == '\\')
				values[i][propsize - 1] = '\0';
		}

		int ret = FindAndReplace(file, num, tokens, values);
	
		for (int i = 0; i < num; ++i) {
			free(tokens[i]);
			free(values[i]);
		}

		if (ret)
			return WcaFinalize(ERROR_INSTALL_FAILURE);
	}

LExit:
	er = SUCCEEDED(hr) ? ERROR_SUCCESS : ERROR_INSTALL_FAILURE;
	return WcaFinalize(er);
}

UINT __stdcall ZTouchFolder(MSIHANDLE hInstall) {
	HRESULT hr = S_OK;
	UINT er = ERROR_SUCCESS;

	hr = WcaInitialize(hInstall, "ZTouchFolder");
	ExitOnFailure(hr, "Failed to initialize");
	WcaLog(LOGMSG_STANDARD, "Initialized.");

    UINT rc;
	char folder[4096];
	DWORD foldersize = sizeof(folder);

    rc = MsiGetProperty(hInstall, "Folder", &folder[0], &foldersize);
    if (rc != ERROR_SUCCESS) {
		WcaLog(LOGMSG_STANDARD, "Unable to get property: Folder");
        return WcaFinalize(ERROR_INSTALL_FAILURE);
    }

	char path[4096];
	sprintf(path, "%s\\removeme", folder);
	if (CreateDirectory(path, NULL) == TRUE) {
		WcaLog(LOGMSG_STANDARD, "temp directory created %s", path);
		RemoveDirectory(path);
	} else {
		WcaLog(LOGMSG_STANDARD, "unable to create temp directory %s", path);
	}

LExit:
	er = SUCCEEDED(hr) ? ERROR_SUCCESS : ERROR_INSTALL_FAILURE;
	return WcaFinalize(er);
}

// DllMain - Initialize and cleanup WiX custom action utils.
extern "C" BOOL WINAPI DllMain(__in HINSTANCE hInst, __in ULONG ulReason, __in LPVOID) {
	switch(ulReason)
	{
	case DLL_PROCESS_ATTACH:
		WcaGlobalInitialize(hInst);
		break;

	case DLL_PROCESS_DETACH:
		WcaGlobalFinalize();
		break;
	}

	return TRUE;
}
