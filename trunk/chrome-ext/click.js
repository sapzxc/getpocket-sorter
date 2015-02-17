var createdTabId=null;

// logging process
var logStr = '';
var elProcess = null;
var log = function(s)
{
	console.log(s);
	logStr += "[*] "+s+"\n";
	if(elProcess)
	{
		elProcess.innerHTML = logStr;
	}
}

// get document onload
window.onload=function()
{
	elProcess = document.getElementById('elprocess');
}

// handle page loaded
chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){
	//exit on non created tab or non mine tab
console.log(createdTabId, tabId);
	if(createdTabId===null || tabId!=createdTabId){return;}

	if(changeInfo.status=='complete')
	{
		log('Injecting...');

		var s = chrome.extension.getURL("getpocket.js");
		console.log(s);
		chrome.tabs.executeScript(null, {code:
				"var script=document.createElement(\"script\");"+
				"script.src=\'"+s+"\';"+
				"document.documentElement.appendChild(script);"});
	}
});

// get created tab id
chrome.tabs.create({
	url: 'http://getpocket.com/'
},function(tabInfo){
	createdTabId=tabInfo.id;
	log('Wating for load...');
});
