﻿//	WebHelp 5.10.001
var garrSortChar=new Array();
var gaFtsStop=new Array();
var gaFtsStem=new Array();
var gbWhLang=false;

garrSortChar[0] = 0;
garrSortChar[1] = 1;
garrSortChar[2] = 2;
garrSortChar[3] = 3;
garrSortChar[4] = 4;
garrSortChar[5] = 5;
garrSortChar[6] = 6;
garrSortChar[7] = 7;
garrSortChar[8] = 8;
garrSortChar[9] = 40;
garrSortChar[10] = 41;
garrSortChar[11] = 42;
garrSortChar[12] = 43;
garrSortChar[13] = 44;
garrSortChar[14] = 9;
garrSortChar[15] = 10;
garrSortChar[16] = 11;
garrSortChar[17] = 12;
garrSortChar[18] = 13;
garrSortChar[19] = 14;
garrSortChar[20] = 15;
garrSortChar[21] = 16;
garrSortChar[22] = 17;
garrSortChar[23] = 18;
garrSortChar[24] = 19;
garrSortChar[25] = 20;
garrSortChar[26] = 21;
garrSortChar[27] = 22;
garrSortChar[28] = 23;
garrSortChar[29] = 24;
garrSortChar[30] = 25;
garrSortChar[31] = 26;
garrSortChar[32] = 38;
garrSortChar[33] = 45;
garrSortChar[34] = 46;
garrSortChar[35] = 47;
garrSortChar[36] = 48;
garrSortChar[37] = 49;
garrSortChar[38] = 50;
garrSortChar[39] = 33;
garrSortChar[40] = 51;
garrSortChar[41] = 52;
garrSortChar[42] = 53;
garrSortChar[43] = 88;
garrSortChar[44] = 54;
garrSortChar[45] = 34;
garrSortChar[46] = 55;
garrSortChar[47] = 56;
garrSortChar[48] = 115;
garrSortChar[49] = 119;
garrSortChar[50] = 121;
garrSortChar[51] = 123;
garrSortChar[52] = 125;
garrSortChar[53] = 126;
garrSortChar[54] = 127;
garrSortChar[55] = 128;
garrSortChar[56] = 129;
garrSortChar[57] = 130;
garrSortChar[58] = 57;
garrSortChar[59] = 58;
garrSortChar[60] = 89;
garrSortChar[61] = 90;
garrSortChar[62] = 91;
garrSortChar[63] = 59;
garrSortChar[64] = 60;
garrSortChar[65] = 131;
garrSortChar[66] = 148;
garrSortChar[67] = 150;
garrSortChar[68] = 154;
garrSortChar[69] = 158;
garrSortChar[70] = 168;
garrSortChar[71] = 171;
garrSortChar[72] = 173;
garrSortChar[73] = 175;
garrSortChar[74] = 185;
garrSortChar[75] = 187;
garrSortChar[76] = 189;
garrSortChar[77] = 191;
garrSortChar[78] = 193;
garrSortChar[79] = 197;
garrSortChar[80] = 214;
garrSortChar[81] = 216;
garrSortChar[82] = 218;
garrSortChar[83] = 220;
garrSortChar[84] = 225;
garrSortChar[85] = 230;
garrSortChar[86] = 240;
garrSortChar[87] = 242;
garrSortChar[88] = 244;
garrSortChar[89] = 246;
garrSortChar[90] = 252;
garrSortChar[91] = 61;
garrSortChar[92] = 62;
garrSortChar[93] = 63;
garrSortChar[94] = 64;
garrSortChar[95] = 66;
garrSortChar[96] = 67;
garrSortChar[97] = 131;
garrSortChar[98] = 148;
garrSortChar[99] = 150;
garrSortChar[100] = 154;
garrSortChar[101] = 158;
garrSortChar[102] = 168;
garrSortChar[103] = 171;
garrSortChar[104] = 173;
garrSortChar[105] = 175;
garrSortChar[106] = 185;
garrSortChar[107] = 187;
garrSortChar[108] = 189;
garrSortChar[109] = 191;
garrSortChar[110] = 193;
garrSortChar[111] = 197;
garrSortChar[112] = 214;
garrSortChar[113] = 216;
garrSortChar[114] = 218;
garrSortChar[115] = 220;
garrSortChar[116] = 225;
garrSortChar[117] = 230;
garrSortChar[118] = 240;
garrSortChar[119] = 242;
garrSortChar[120] = 244;
garrSortChar[121] = 251;
garrSortChar[122] = 252;
garrSortChar[123] = 68;
garrSortChar[124] = 69;
garrSortChar[125] = 70;
garrSortChar[126] = 71;
garrSortChar[127] = 27;
garrSortChar[128] = 114;
garrSortChar[129] = 28;
garrSortChar[130] = 82;
garrSortChar[131] = 170;
garrSortChar[132] = 85;
garrSortChar[133] = 112;
garrSortChar[134] = 109;
garrSortChar[135] = 110;
garrSortChar[136] = 65;
garrSortChar[137] = 113;
garrSortChar[138] = 223;
garrSortChar[139] = 86;
garrSortChar[140] = 213;
garrSortChar[141] = 29;
garrSortChar[142] = 255;
garrSortChar[143] = 30;
garrSortChar[144] = 31;
garrSortChar[145] = 80;
garrSortChar[146] = 81;
garrSortChar[147] = 83;
garrSortChar[148] = 84;
garrSortChar[149] = 111;
garrSortChar[150] = 36;
garrSortChar[151] = 37;
garrSortChar[152] = 79;
garrSortChar[153] = 229;
garrSortChar[154] = 222;
garrSortChar[155] = 87;
garrSortChar[156] = 212;
garrSortChar[157] = 32;
garrSortChar[158] = 254;
garrSortChar[159] = 251;
garrSortChar[160] = 39;
garrSortChar[161] = 72;
garrSortChar[162] = 97;
garrSortChar[163] = 98;
garrSortChar[164] = 99;
garrSortChar[165] = 100;
garrSortChar[166] = 73;
garrSortChar[167] = 101;
garrSortChar[168] = 74;
garrSortChar[169] = 102;
garrSortChar[170] = 133;
garrSortChar[171] = 93;
garrSortChar[172] = 103;
garrSortChar[173] = 35;
garrSortChar[174] = 104;
garrSortChar[175] = 75;
garrSortChar[176] = 105;
garrSortChar[177] = 92;
garrSortChar[178] = 122;
garrSortChar[179] = 124;
garrSortChar[180] = 76;
garrSortChar[181] = 106;
garrSortChar[182] = 107;
garrSortChar[183] = 108;
garrSortChar[184] = 77;
garrSortChar[185] = 120;
garrSortChar[186] = 199;
garrSortChar[187] = 94;
garrSortChar[188] = 116;
garrSortChar[189] = 117;
garrSortChar[190] = 118;
garrSortChar[191] = 78;
garrSortChar[192] = 131;
garrSortChar[193] = 131;
garrSortChar[194] = 131;
garrSortChar[195] = 131;
garrSortChar[196] = 131;
garrSortChar[197] = 131;
garrSortChar[198] = 131;
garrSortChar[199] = 150;
garrSortChar[200] = 158;
garrSortChar[201] = 158;
garrSortChar[202] = 158;
garrSortChar[203] = 158;
garrSortChar[204] = 175;
garrSortChar[205] = 175;
garrSortChar[206] = 175;
garrSortChar[207] = 175;
garrSortChar[208] = 154;
garrSortChar[209] = 193;
garrSortChar[210] = 197;
garrSortChar[211] = 197;
garrSortChar[212] = 197;
garrSortChar[213] = 197;
garrSortChar[214] = 197;
garrSortChar[215] = 95;
garrSortChar[216] = 197;
garrSortChar[217] = 230;
garrSortChar[218] = 230;
garrSortChar[219] = 230;
garrSortChar[220] = 230;
garrSortChar[221] = 246;
garrSortChar[222] = 227;
garrSortChar[223] = 224;
garrSortChar[224] = 131;
garrSortChar[225] = 131;
garrSortChar[226] = 131;
garrSortChar[227] = 131;
garrSortChar[228] = 131;
garrSortChar[229] = 131;
garrSortChar[230] = 131;
garrSortChar[231] = 150;
garrSortChar[232] = 158;
garrSortChar[233] = 158;
garrSortChar[234] = 158;
garrSortChar[235] = 158;
garrSortChar[236] = 175;
garrSortChar[237] = 175;
garrSortChar[238] = 175;
garrSortChar[239] = 175;
garrSortChar[240] = 154;
garrSortChar[241] = 193;
garrSortChar[242] = 197;
garrSortChar[243] = 197;
garrSortChar[244] = 197;
garrSortChar[245] = 197;
garrSortChar[246] = 197;
garrSortChar[247] = 96;
garrSortChar[248] = 197;
garrSortChar[249] = 230;
garrSortChar[250] = 230;
garrSortChar[251] = 230;
garrSortChar[252] = 230;
garrSortChar[253] = 246;
garrSortChar[254] = 227;
garrSortChar[255] = 250;

gaFtsStop[0] = "0";
gaFtsStop[1] = "1";
gaFtsStop[2] = "2";
gaFtsStop[3] = "3";
gaFtsStop[4] = "4";
gaFtsStop[5] = "5";
gaFtsStop[6] = "6";
gaFtsStop[7] = "7";
gaFtsStop[8] = "8";
gaFtsStop[9] = "9";
gaFtsStop[10] = "ab";
gaFtsStop[11] = "aber";
gaFtsStop[12] = "alle";
gaFtsStop[13] = "allem";
gaFtsStop[14] = "allen";
gaFtsStop[15] = "aller";
gaFtsStop[16] = "alles";
gaFtsStop[17] = "als";
gaFtsStop[18] = "am";
gaFtsStop[19] = "an";
gaFtsStop[20] = "anschließend";
gaFtsStop[21] = "auch";
gaFtsStop[22] = "auf";
gaFtsStop[23] = "ausser";
gaFtsStop[24] = "ausserdem";
gaFtsStop[25] = "außer";
gaFtsStop[26] = "außerdem";
gaFtsStop[27] = "beide";
gaFtsStop[28] = "beiden";
gaFtsStop[29] = "beider";
gaFtsStop[30] = "beides";
gaFtsStop[31] = "beliebige";
gaFtsStop[32] = "beliebigem";
gaFtsStop[33] = "beliebigen";
gaFtsStop[34] = "beliebiger";
gaFtsStop[35] = "beliebiges";
gaFtsStop[36] = "benutzen";
gaFtsStop[37] = "benutzt";
gaFtsStop[38] = "benötigen";
gaFtsStop[39] = "benötigt";
gaFtsStop[40] = "besser";
gaFtsStop[41] = "Bezug";
gaFtsStop[42] = "bin";
gaFtsStop[43] = "bist";
gaFtsStop[44] = "brauchen";
gaFtsStop[45] = "braucht";
gaFtsStop[46] = "da";
gaFtsStop[47] = "dadurch";
gaFtsStop[48] = "dafür";
gaFtsStop[49] = "daher";
gaFtsStop[50] = "dahin";
gaFtsStop[51] = "dahinter";
gaFtsStop[52] = "damit";
gaFtsStop[53] = "daneben";
gaFtsStop[54] = "dann";
gaFtsStop[55] = "darauf";
gaFtsStop[56] = "darf";
gaFtsStop[57] = "darunter";
gaFtsStop[58] = "darüber";
gaFtsStop[59] = "das";
gaFtsStop[60] = "davon";
gaFtsStop[61] = "Dein";
gaFtsStop[62] = "Deine";
gaFtsStop[63] = "deinem";
gaFtsStop[64] = "deinen";
gaFtsStop[65] = "dem";
gaFtsStop[66] = "den";
gaFtsStop[67] = "denen";
gaFtsStop[68] = "denn";
gaFtsStop[69] = "der";
gaFtsStop[70] = "deren";
gaFtsStop[71] = "derer";
gaFtsStop[72] = "des";
gaFtsStop[73] = "dessen";
gaFtsStop[74] = "die";
gaFtsStop[75] = "diese";
gaFtsStop[76] = "diesem";
gaFtsStop[77] = "diesen";
gaFtsStop[78] = "dieser";
gaFtsStop[79] = "dieses";
gaFtsStop[80] = "dir";
gaFtsStop[81] = "dort";
gaFtsStop[82] = "dran";
gaFtsStop[83] = "Du";
gaFtsStop[84] = "dürfen";
gaFtsStop[85] = "ein";
gaFtsStop[86] = "eine";
gaFtsStop[87] = "einem";
gaFtsStop[88] = "einen";
gaFtsStop[89] = "einer";
gaFtsStop[90] = "eines";
gaFtsStop[91] = "einfach";
gaFtsStop[92] = "einige";
gaFtsStop[93] = "einigen";
gaFtsStop[94] = "einiger";
gaFtsStop[95] = "einiges";
gaFtsStop[96] = "entlang";
gaFtsStop[97] = "er";
gaFtsStop[98] = "es";
gaFtsStop[99] = "Fall";
gaFtsStop[100] = "falls";
gaFtsStop[101] = "fertig";
gaFtsStop[102] = "folgende";
gaFtsStop[103] = "folgendem";
gaFtsStop[104] = "folgenden";
gaFtsStop[105] = "folgender";
gaFtsStop[106] = "folgendermaßen";
gaFtsStop[107] = "früher";
gaFtsStop[108] = "für";
gaFtsStop[109] = "gebrauchen";
gaFtsStop[110] = "gebraucht";
gaFtsStop[111] = "gehabt";
gaFtsStop[112] = "geht";
gaFtsStop[113] = "gemacht";
gaFtsStop[114] = "genau";
gaFtsStop[115] = "getan";
gaFtsStop[116] = "Gleiche";
gaFtsStop[117] = "gross";
gaFtsStop[118] = "habe";
gaFtsStop[119] = "haben";
gaFtsStop[120] = "hast";
gaFtsStop[121] = "hat";
gaFtsStop[122] = "hatte";
gaFtsStop[123] = "hatten";
gaFtsStop[124] = "hier";
gaFtsStop[125] = "hierher";
gaFtsStop[126] = "hinab";
gaFtsStop[127] = "hinter";
gaFtsStop[128] = "holen";
gaFtsStop[129] = "ihm";
gaFtsStop[130] = "ihn";
gaFtsStop[131] = "ihnen";
gaFtsStop[132] = "Ihr";
gaFtsStop[133] = "Ihre";
gaFtsStop[134] = "ihrem";
gaFtsStop[135] = "ihren";
gaFtsStop[136] = "ihrer";
gaFtsStop[137] = "im";
gaFtsStop[138] = "immer";
gaFtsStop[139] = "in";
gaFtsStop[140] = "innerhalb";
gaFtsStop[141] = "ist";
gaFtsStop[142] = "Ja";
gaFtsStop[143] = "jede";
gaFtsStop[144] = "jedem";
gaFtsStop[145] = "jeden";
gaFtsStop[146] = "jeder";
gaFtsStop[147] = "jedes";
gaFtsStop[148] = "kann";
gaFtsStop[149] = "kein";
gaFtsStop[150] = "keine";
gaFtsStop[151] = "keinem";
gaFtsStop[152] = "keiner";
gaFtsStop[153] = "keins";
gaFtsStop[154] = "klein";
gaFtsStop[155] = "können";
gaFtsStop[156] = "könnte";
gaFtsStop[157] = "lieber";
gaFtsStop[158] = "mehr";
gaFtsStop[159] = "mein";
gaFtsStop[160] = "meine";
gaFtsStop[161] = "meinem";
gaFtsStop[162] = "meinen";
gaFtsStop[163] = "meiner";
gaFtsStop[164] = "meines";
gaFtsStop[165] = "mir";
gaFtsStop[166] = "mit";
gaFtsStop[167] = "muss";
gaFtsStop[168] = "möchten";
gaFtsStop[169] = "mögen";
gaFtsStop[170] = "müssen";
gaFtsStop[171] = "nach";
gaFtsStop[172] = "neben";
gaFtsStop[173] = "nicht";
gaFtsStop[174] = "noch";
gaFtsStop[175] = "normal";
gaFtsStop[176] = "ob";
gaFtsStop[177] = "oben";
gaFtsStop[178] = "oder";
gaFtsStop[179] = "ohne";
gaFtsStop[180] = "OK";
gaFtsStop[181] = "okay";
gaFtsStop[182] = "per";
gaFtsStop[183] = "pro";
gaFtsStop[184] = "schon";
gaFtsStop[185] = "sei";
gaFtsStop[186] = "seid";
gaFtsStop[187] = "seine";
gaFtsStop[188] = "seinem";
gaFtsStop[189] = "seinen";
gaFtsStop[190] = "seit";
gaFtsStop[191] = "sich";
gaFtsStop[192] = "Sie";
gaFtsStop[193] = "siehe";
gaFtsStop[194] = "sind";
gaFtsStop[195] = "so";
gaFtsStop[196] = "sobald";
gaFtsStop[197] = "sonstige";
gaFtsStop[198] = "sonstiges";
gaFtsStop[199] = "stattdessen";
gaFtsStop[200] = "stets";
gaFtsStop[201] = "tun";
gaFtsStop[202] = "und";
gaFtsStop[203] = "unser";
gaFtsStop[204] = "unsere";
gaFtsStop[205] = "unserem";
gaFtsStop[206] = "unseren";
gaFtsStop[207] = "unseres";
gaFtsStop[208] = "unter";
gaFtsStop[209] = "verwenden";
gaFtsStop[210] = "verwendet";
gaFtsStop[211] = "viel";
gaFtsStop[212] = "viele";
gaFtsStop[213] = "vielen";
gaFtsStop[214] = "vieler";
gaFtsStop[215] = "vieles";
gaFtsStop[216] = "vielleicht";
gaFtsStop[217] = "vom";
gaFtsStop[218] = "von";
gaFtsStop[219] = "vor";
gaFtsStop[220] = "voran";
gaFtsStop[221] = "voraus";
gaFtsStop[222] = "wann";
gaFtsStop[223] = "war";
gaFtsStop[224] = "waren";
gaFtsStop[225] = "warum";
gaFtsStop[226] = "was";
gaFtsStop[227] = "Weg";
gaFtsStop[228] = "weil";
gaFtsStop[229] = "Weise";
gaFtsStop[230] = "weiter";
gaFtsStop[231] = "weitere";
gaFtsStop[232] = "weiteren";
gaFtsStop[233] = "weiterer";
gaFtsStop[234] = "welche";
gaFtsStop[235] = "welcher";
gaFtsStop[236] = "welches";
gaFtsStop[237] = "wenn";
gaFtsStop[238] = "werden";
gaFtsStop[239] = "weshalb";
gaFtsStop[240] = "weswegen";
gaFtsStop[241] = "wie";
gaFtsStop[242] = "wieso";
gaFtsStop[243] = "wir";
gaFtsStop[244] = "wird";
gaFtsStop[245] = "wo";
gaFtsStop[246] = "wofür";
gaFtsStop[247] = "woher";
gaFtsStop[248] = "wonach";
gaFtsStop[249] = "woran";
gaFtsStop[250] = "woraus";
gaFtsStop[251] = "wovon";
gaFtsStop[252] = "wäre";
gaFtsStop[253] = "wären";
gaFtsStop[254] = "zwischen";



// as javascript 1.3 support unicode instead of ISO-Latin-1
// need to transfer come code back to ISO-Latin-1 for compare purpose
// Note: Different Language(Code page) maybe need different array:
var gaUToC=new Array();
gaUToC[8364]=128;
gaUToC[8218]=130;
gaUToC[402]=131;
gaUToC[8222]=132;
gaUToC[8230]=133;
gaUToC[8224]=134;
gaUToC[8225]=135;
gaUToC[710]=136;
gaUToC[8240]=137;
gaUToC[352]=138;
gaUToC[8249]=139;
gaUToC[338]=140;
gaUToC[381]=142;
gaUToC[8216]=145;
gaUToC[8217]=146;
gaUToC[8220]=147;
gaUToC[8221]=148;
gaUToC[8226]=149;
gaUToC[8211]=150;
gaUToC[8212]=151;
gaUToC[732]=152;
gaUToC[8482]=153;
gaUToC[353]=154;
gaUToC[8250]=155;
gaUToC[339]=156;
gaUToC[382]=158;
gaUToC[376]=159;

var gsBiggestChar="";
function getBiggestChar()
{
	if(gsBiggestChar.length==0)
	{
		if(garrSortChar.length<256)
			gsBiggestChar=String.fromCharCode(255);
		else
		{
			var nBiggest=0;
			var nBigChar=0;
			for(var i=0;i<=255;i++)
			{
				if(garrSortChar[i]>nBiggest)
				{
					nBiggest=garrSortChar[i];
					nBigChar=i;
				}
			}
			gsBiggestChar=String.fromCharCode(nBigChar);
		}

	}	
	return gsBiggestChar;
}

function getCharCode(str,i)
{
	var code=str.charCodeAt(i)
	return code;
}

function compare(strText1,strText2)
{
	var strt1=strText1.toLowerCase();
	var strt2=strText2.toLowerCase();
	if(strt1<strt2) return -1;
	if(strt1>strt2) return 1;
	return 0;
}
gbWhLang=true;