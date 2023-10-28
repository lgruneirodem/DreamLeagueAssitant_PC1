var StopAllAdsAntiAdblocker = {};
var SAA_StdStyle = 'height: 3px !important; ' + 'display: block !important; ' + 'visibility: visible !important; ' +	'position: absolute !important; ' +	'top: -2000px; left: -2000px;';


StopAllAdsAntiAdblocker.hideDetector = {
	//Sets a global variable
	//Needs to inject that part of the script, otherwise the global vars can't be accessed.
	setVariable: function(name, value) {
		StopAllAdsAntiAdblocker.hideDetector.injectSetVariableJs(name, value);
	},

	injectSetVariableJs: function(name, value) {
		var varScript = 'const ' + name + ' = ' + value + ';'

		StopAllAdsAntiAdblocker.hideDetector.injectScript(varScript);
	},

	//Adds element to the DOM tree
	addElement: function(idOrClass, style, elementType) {
		elementType = elementType === undefined ? 'div' : elementType;

		var element = document.createElement(elementType);

		if (idOrClass !== undefined) {
			element.setAttribute('id', idOrClass);
			element.setAttribute('class', idOrClass);
		}

		if (style !== undefined) {
			element.setAttribute('style', style);
		}

		document.documentElement.appendChild(element);
	},

	injectPopUp: function() {
		var ele = document.createElement('div');
		ele.setAttribute('id', '_bd');
		document.documentElement.appendChild(ele);
	},

	injectScript: function(script) {
		var element = StopAllAdsAntiAdblocker.hideDetector.createJavascriptElement(script);
		document.documentElement.appendChild(element);
	},

	createJavascriptElement: function(script) {
		var element = document.createElement('script');
		element.type = 'text/javascript';
		element.innerHTML = script;
		return element;
	},
};



//Rules which may be used for multiple hosts
var SAA_regex = {
	'tester': function() { StopAllAdsAntiAdblocker.hideDetector.addElement('tester'); },
	'banner300': function() {
		StopAllAdsAntiAdblocker.hideDetector.addElement(
			'banner300',
			SAA_StdStyle);
	},
	'adBlockerVariable': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('adBlockDetected', false);
	},
	'pubVariable': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('pub', true);
	},
	'isloadedVariable': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('isloaded', true);
	},
	'crazy': function() { StopAllAdsAntiAdblocker.hideDetector.addElement('crazy', SAA_StdStyle); },
	'wired': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('blockAdBlock', false);
	},
	'adfly': function() {
		StopAllAdsAntiAdblocker.hideDetector.injectPopUp();
		setInterval(function () {
        document.getElementById('abC').click();
    }, 1000);
	},
	'watchfreeinhd': function () {
		StopAllAdsAntiAdblocker.hideDetector.addElement('_amd', SAA_StdStyle);
		StopAllAdsAntiAdblocker.hideDetector.addElement('_afd', SAA_StdStyle);
	},
	'antiblock': function() {
		window.addEventListener('DOMNodeInserted', function(event) {
			var element = event.target;
			if (element.parentNode == document.body &&
				element.innerHTML.indexOf("Please disable your ad blocker") < 5)
			{
				element.parentNode.removeChild(element);
			}
		});
	},
	'adb2Variable': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('adb2', false);
	},
	'hasloadedVariable': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('hasloaded', true);
	},
	'AdElement': function() {
		StopAllAdsAntiAdblocker.hideDetector.addElement('Ad', SAA_StdStyle);
	},
	'vVariable': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('v', false);
		StopAllAdsAntiAdblocker.hideDetector.addElement('zd', SAA_StdStyle);
		StopAllAdsAntiAdblocker.hideDetector.addElement('xd', SAA_StdStyle);
	},
	'adblockVariable': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('adblock', false);
	},
	'extensionDetection': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('AddonDetection',
			'{ onTestFinished: function() {return true;}, ' +
			'runDeferred: function() {return true;}, ' +
			'onAddonDetected: function() {return true;}, ' +
			'onAllTestsFinished: function() {return true;}}'
		);
	},
	'blahyblaci1Element': function() {
		StopAllAdsAntiAdblocker.hideDetector.addElement('blahyblaci1', SAA_StdStyle);
	},
	'kinoLive2': function() {
		StopAllAdsAntiAdblocker.hideDetector.injectScript('window.ab = false;');
	},
	'thesimsresource': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('isAdblocked', false);
		StopAllAdsAntiAdblocker.hideDetector.injectScript('window.iHaveLoadedAds = true;');
	},
	'kissanime': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('isBlockAds2', false);
		StopAllAdsAntiAdblocker.hideDetector.setVariable('isBlock3', false);
	},
	'slideplayer': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('force_remove_ads', true);
	},
	'freegamehosting':function () {
		StopAllAdsAntiAdblocker.hideDetector.injectScript("var opts = 'div#adtest'.replace('.', ':className:').replace('#', ':id:').split(':'); var bait = document.createElement(opts[0]);bait.setAttribute(opts[1], opts[2]);bait.innerHTML = '<br>';document.documentElement.appendChild(bait);");
	},
	'forbes':function () {
		StopAllAdsAntiAdblocker.hideDetector.injectScript("if (window.location.pathname.indexOf('/welcome') > -1) {setCookie=function(e,o,t,i){var n=new Date;n.setTime((new Date).getTime()+(t||31536e6)),document.cookie=e+'='+encodeURIComponent(o)+';expires='+n.toGMTString()+';path='+(i||'/')},getCookie=function(e){var o='; '+document.cookie,t=o.split('; '+e+'=');return 2==t.length?t.pop().split(';').shift():void 0},setCookie('welcomeAd','true',864e5,'/'),setCookie('dailyWelcomeCookie','true',864e5,'/'),window.location=getCookie('toUrl')||'http://www.forbes.com/';}");
	},
	'bildde': function() {
		StopAllAdsAntiAdblocker.hideDetector.injectScript("var de=de||{};de.bild=de.bild||{};var x=de.bild;Object.defineProperty(x,'cmsKonfig',{value:'true',writable:false,enumerable:true,configurable:true});");
	},
	'nunl': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('is_adblocker_in_use', false);
	},
	'tweakersnet': function() {
		StopAllAdsAntiAdblocker.hideDetector.setVariable('hasBanner', true);
		StopAllAdsAntiAdblocker.hideDetector.addElement('notifications', SAA_StdStyle);
	},
	'mangahost': function () {
		StopAllAdsAntiAdblocker.hideDetector.injectScript("Object.defineProperty(window, 'testDisplay', {enumerable : true,writable : false,value : false});");
	},
	'megogo': function () {
		StopAllAdsAntiAdblocker.hideDetector.injectScript("Object.defineProperty(window, 'adBlock', {enumerable : true,writable : false,value : false});Object.defineProperty(window, 'showAdBlockMessage', {enumerable : true,writable : false,value : function () {}});");
	},
	'slideplayer':function () {
		StopAllAdsAntiAdblocker.hideDetector.injectScript("Object.defineProperty(window, 'force_remove_ads', {enumerable : true,writable : false,value : true});");
	},
	'gamingroom':function () {
		StopAllAdsAntiAdblocker.hideDetector.injectScript("window.adblock_detect = function () {}; window.GR_adblock_hide_video = function () {};window.adblock_video_msg_start = function () {};window.adblock_video_msg_stop = function () {};window.disable_chat = function () {};");
	},
	'testRule': function() {
		StopAllAdsAntiAdblocker.hideDetector.injectScript(
			'const maliciousAddons = {detected: false, autoHide: undefined, superfish: null, jollyWalletBar: null, getSavin: null};');
		StopAllAdsAntiAdblocker.hideDetector.addElement('abd-container', SAA_StdStyle);
		StopAllAdsAntiAdblocker.hideDetector.injectScript(
			'const maliciousAddons = {detected: false, autoHide: false, superfish: null, jollyWalletBar: null, getSavin: null};');
		StopAllAdsAntiAdblocker.hideDetector.injectScript(
			'var maliciousAddons = {}; ' +
			'Object.defineProperty(maliciousAddons, "detected", { ' +
  				'value: false, writable: false, enumerable: true, configurable: true ' +
			'});');
	}
};

//Assigns certain hosts (regex) to rules defined above
var hideDetectorPagesToRules = {
	'wired.com': [SAA_regex['wired']],
	'forbes.com': [SAA_regex['forbes']],
	'freegamehosting.eu': [SAA_regex['freegamehosting']],
	'adf.ly': [SAA_regex['adfly']],
	'tweakers.net': [SAA_regex['tweakersnet']],
	'nu.nl': [SAA_regex['nunl']],
	'kino-live2.org': [SAA_regex['kinoLive2']],
	'thesimsresource.com': [SAA_regex['thesimsresource']],
	'kissanime.com': [SAA_regex['kissanime']],
	'slideplayer.com': [SAA_regex['slideplayer']],
	'bild.de': [SAA_regex['bildde']],
	'(sockshare|putlocker).com': [
		SAA_regex['tester'],
		SAA_regex['banner300']
	],
	'notre-planete.info': [SAA_regex['pubVariable']],
	'receive-sms.com': [SAA_regex['isloadedVariable']],
	'streamupload.org': [SAA_regex['crazy']],
	'watchfreeinhd.com': [SAA_regex['watchfreeinhd']],
	'cloudvidz.net': [SAA_regex['antiblock']],
	'youwatch.org': [
		SAA_regex['antiblock'],
		SAA_regex['adblockVariable']
	],
	'slickvid.com': [SAA_regex['adb2Variable']],
	'pcgamesdownloadfree.com': [SAA_regex['hasloadedVariable']],
	'siliconinvestor.com': [SAA_regex['tester']],
	'nzbstars.com': [SAA_regex['AdElement']],
	'solarmovies.com': [SAA_regex['isloadedVariable']],
	'mmatko.com': [SAA_regex['antiblock']],
	'qrrro.com': [SAA_regex['vVariable']],
	'eventhubs.com': [SAA_regex['blahyblaci1Element']],
	'(gmx|web).(net|de)': [SAA_regex['extensionDetection']],
	'mangahost.com': [SAA_regex['mangahost']],
	'megogo.net': [SAA_regex['megogo']],
	'slideplayer.*':[SAA_regex['slideplayer']],
	'gamingroom.tv':[SAA_regex['gamingroom']],
};

//Runs through each page and checks for a match for the current host
for (var k in hideDetectorPagesToRules) {
	if (window.location.host.match(k) != null) {
		//Executes all SAA_regex for the given match
		for (var i = 0; i < hideDetectorPagesToRules[k].length; i++) {
			hideDetectorPagesToRules[k][i]();
		}
	}
}