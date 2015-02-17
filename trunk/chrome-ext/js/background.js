(function () {
	chrome.browserAction.onClicked.addListener(function (e, t) {
		chrome.tabs.executeScript(e.id, {file: 'js/getpocket.js'});
	})
})();
