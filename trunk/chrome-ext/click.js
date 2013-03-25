var s = chrome.extension.getURL("getpocket.js");
console.log(s);
chrome.tabs.executeScript(null, {code:
		"var script=document.createElement(\"script\");"+
		"script.src=\'"+s+"\';"+
		"document.documentElement.appendChild(script);"});
