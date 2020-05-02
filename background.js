//if (localStorage['lastVersionUsed'] != '1') {
//localStorage['lastVersionUsed'] = '1';
//chrome.tabs.create({
//url: chrome.extension.getURL('options.html')
//});
//}

//root of browser commands, either "chrome" or "browser"
var root=null;
var windowId=null;
var parentWindowId=null;

function initRoot() {
	//get user agent string
	var userAgent=navigator.userAgent.toLowerCase();
	
    //get root based on user agent string
    if(userAgent.match(/safari/)||userAgent.match(/chrome/)) {
    	//is safari or chrome
    	root=chrome;
    	root.isChrome=true;
    } else if(userAgent.match(/firefox/)) {
    	//is firefox
    	root=browser;
    	root.isFirefox=true;
    } else if(userAgent.match(/trident/)||userAgent.match(/msie 10.0/)||userAgent.match(/edge/)) {
    	//is edge
    	root=browser;
    	root.isEdge=true;
    }
}

function windowOpened(win) {
	//get window id
	windowId=win.id;
}

function windowCheckError() {
	//check if there was an error opening the window
	if(root.runtime.lastError) {
		//something went wrong, so try opening window again
		windowId=null;
		createPanel();
	}
}

function createPopup() {
	//check if panel already opened
	if(windowId!==null) {
		//already opened, so just update existing window and set focus
		if(root.isFirefox) {
			//set focus firefox, check for error, open window if error
			root.windows.update(windowId,{focused:true}).then(windowCheckError);
		} else {
			//set focus other, check for error, open window if error
			root.windows.update(windowId,{focused:true},windowCheckError);
		}
		return;
	}
	
	//set window options
	var l=(window.screen.availWidth-770)/2;
	if(l<0) l=0;
	var windowOptions={
		url:chrome.extension.getURL("popup.html"),
		top:140,
		left:l,
		width:770,
		height:658,
		type:"popup"
	};
	
	//check if firefox compatible
	if(root.isFirefox) {
		//set focused, then open window
		root.windows.create(windowOptions).then(windowOpened);
	} else {
		//open window
		windowOptions.focused=true;
		root.windows.create(windowOptions,windowOpened);
	}
}

function listenWindow() {
	//listen for windows closed
	root.windows.onRemoved.addListener(function(id) {
		//check if popup window was closed
		if(id===windowId) {
			//remove windowId
			windowId=null;
		}
	});
	
	//check for extension button clicked to open popup window
	root.browserAction.onClicked.addListener((tab)=>{
//		//disable the active tab
//		root.browserAction.disable(tab.id);
		//requires the "tabs" or "activeTab" permission
		console.log(tab.url);
		//get current window of button press
		chrome.windows.getCurrent({windowTypes:["normal"]},(window)=>{
			//store parent window id (this window)
			parentWindowId=window.id
			//open popup window
			createPopup();
		});
		

	});
}

//initialize background page
function init() {
	//choose the root prefix for all commands
	initRoot();

	//listen for the popup window closed and extension button pushed
	listenWindow();
}

//run initialize background page
init();