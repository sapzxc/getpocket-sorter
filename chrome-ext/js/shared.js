// Shared and Utility functions between Chrome and Safari
// Utility functions
function isValidURL(e) {
	return/^https?\:/i.test(e)
}
function isMac() {
	return navigator.platform.match(/^Mac/) !== null
}
function isSafari() {
	return window.safari !== undefined
}
function isOpera() {
	return/OPR/.test(window.navigator.userAgent)
}
function isChrome() {
	return window.chrome !== undefined && window.chrome.app !== undefined
}
function isChromeOnly() {
	return window.chrome !== undefined && window.chrome.app !== undefined && !isOpera()
}
function getVersionNumber() {
	var e = isSafari() ? safari.extension.displayVersion : chrome.app.getDetails().version;
	if (typeof e != "undefined")return e;
	appSettingsPath = isSafari() ? safari.extension.baseURI + "Info.plist" : chrome.extension.getURL("manifest.json");
	var t = new XMLHttpRequest;
	t.open("GET", appSettingsPath, !1), t.send(null);
	if (isSafari())$("dict > key", t.response).each(function () {
		if ($(this).text() == "CFBundleShortVersionString")return e = $(this).next().text(), !1
	}); else {
		var n = JSON.parse(t.responseText);
		e = n.version
	}
	return e
}
function getBackgroundPage() {
	var e = isChrome() ? chrome.extension.getBackgroundPage() : safari.extension.globalPage.contentWindow;
	return e
}
function getCurrentTab(e) {
	if (isChrome())chrome.tabs.getSelected(null, function (t) {
		e(t)
	}); else if (isSafari()) {
		var t = safari.application.activeBrowserWindow.activeTab;
		e(t)
	}
}
function getAllTabs(e) {
	if (isChrome())chrome.tabs.query({}, e); else if (isSafari()) {
		var t = safari.application.browserWindows, n = [];
		for (var r = 0; r < t.length; r++) {
			var i = t[r].tabs;
			for (var s = 0; s < i.length; s++)n.push(i[s])
		}
		e(n)
	} else e([])
}
function executeScriptInTab(e, t) {
	isChrome() ? chrome.tabs.executeScript(e.id, {code: t}) : isSafari() && e.page.dispatchMessage("executeScript", t)
}
function executeScriptInTabWithCallback(e, t, n) {
	isChrome() ? chrome.tabs.executeScript(e.id, {code: t}, n) : isSafari() && (executeScriptInTab(e, t), setTimeout(n, 100))
}
function executeScriptFromURLInTab(e, t) {
	if (isChrome())chrome.tabs.executeScript(e.id, {file: t}); else if (isSafari()) {
		var n = $.ajax({type: "GET", url: "../" + t, async: !1});
		executeScriptInTab(e, n.responseText)
	}
}
function executeScriptFromURLInTabWithCallback(e, t, n) {
	if (isChrome())chrome.tabs.executeScript(e.id, {file: t}, n); else if (isSafari()) {
		var r = $.ajax({type: "GET", url: "../" + t, async: !1});
		executeScriptInTabWithCallback(e, r.responseText, n)
	}
}
function broadcastMessageToAllTabs(e) {
	getAllTabs(function (t) {
		$.each(t, function (t, n) {
			sendMessageToTab(n, e)
		})
	})
}
function injectScript(e) {
	var t = "(" + e + ")();", n = document.createElement("script");
	n.textContent = t, (document.head || document.documentElement).appendChild(n), n.parentNode.removeChild(n)
}
function openTabWithURL(e) {
	if (isChrome())chrome.tabs.create({url: e}); else if (isSafari()) {
		var t = safari.application.activeBrowserWindow.openTab();
		t.url = e
	}
}
function stringFromBool(e) {
	return e === !1 ? "false" : "true"
}
function boolFromString(e) {
	return typeof e == "string" ? e === "false" ? !1 : !0 : e
}
function getSetting(e) {
	return settingContainerForKey(e)[e]
}
function setSetting(e, t) {
	var n = settingContainerForKey(e);
	!t && n == localStorage ? localStorage.removeItem(e) : n[e] = t
}
function settingContainerForKey(e) {
	if (isSafari()) {
		var t;
		return e === "twitter" || e === "hackernews" || e === "reddit" || e === "yahoo" || e === "keyboard-shortcut-add" || e === "linkedin" || e === "keyboard-shortcut" ? t = safari.extension.settings : e == "username" || e == "password" ? t = safari.extension.secureSettings : t = localStorage, t
	}
	return localStorage
}
function addMessageListener(e) {
	if (isChrome())window.chrome.extension.onMessage ? chrome.extension.onMessage.addListener(e) : chrome.extension.onRequest.addListener(e); else if (isSafari()) {
		var t;
		safari.self && safari.self.addEventListener ? t = safari.self : safari.application && safari.application.addEventListener && (t = safari.application), t && t.addEventListener("message", function (t) {
			t.tab = t.target;
			var n;
			if (t.message.__cbId) {
				var r = t.tab, i = t.message.__cbId;
				n = function (e) {
					r && r.page && r.page.dispatchMessage && r.page.dispatchMessage("__performCb", {cbId: i, data: e})
				}, t.__cbId = undefined
			}
			e(t.message, t, n)
		}, !1)
	}
}
function sendMessageToTab(e, t) {
	isChrome() ? chrome.tabs.sendMessage(e.id, t) : isSafari() && e.page.dispatchMessage("message", t)
}
function sendMessage(e, t) {
	t || (t = function (e) {
	}), isChrome() ? chrome.extension.sendMessage ? chrome.extension.sendMessage(e, t) : chrome.extension.sendRequest(e, t) : isSafari() && (t && (e.__cbId = Callbacker.addCb(t)), safari.self.tab.dispatchMessage("message", e))
};
