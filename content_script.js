
var observer,observing;
var plusMinusMultiple=1;


function injectJS(src,textContent,callback) {
	var script=document.createElement('script');
	if(textContent) {
		script.textContent=textContent;
		document.getElementsByTagName('head')[0].appendChild(script);
		script.parentNode.removeChild(script);
		if(callback) callback();
	} else {
		script.onload=function() {
			if(callback) callback();
		};
		script.src=src;
		document.getElementsByTagName('head')[0].appendChild(script);
	}
	
}

function init() {
	
	injectJS(chrome.extension.getURL("inception.js"),null,function() {
		console.log("inception ready!");
	});
	
	chrome.runtime.onMessage.addListener(function(request,sender,sendResponse) {
		console.log(sender.tab?"from a content script:"+sender.tab.url:"from the extension");
		
		//send them to inception
		var evt=document.createEvent("CustomEvent");
		var data={
				orders:request.orders,
				rootUrl:request.rootUrl,
				side:request.side
		}
		evt.initCustomEvent("inceptionEvent",true,true,JSON.stringify(data));
		document.dispatchEvent(evt);
	});
	
//	//initialize storage for insert plusminus multiple, default to 1
//	chrome.storage.local.get({plusMinusMultiple:1},function(items) {
//		plusMinusMultiple=items.plusMinusMultiple;
////		plusMinusMultiple=1;
//		setTimeout(function() {
//			//check for plus/minus buttons
//			var btn,i,btns=document.querySelectorAll(".btn-linkneg");
//
//			for(i=0;i<btns.length;i++) {
//				btn=btns[i];
//				btn.dataset.value=parseFloat((btn.dataset.value*plusMinusMultiple).toFixed(5));
//				btn.innerHTML=""+btn.dataset.value+"<b></b>";
//			}
//			
//			btns=document.querySelectorAll(".btn-linkpos");
//
//			for(i=0;i<btns.length;i++) {
//				btn=btns[i];
//				btn.dataset.value=parseFloat((btn.dataset.value*plusMinusMultiple).toFixed(5));
//				btn.innerHTML=""+btn.dataset.value+"<b></b>";
//			}
//		},500);
//	});
//	
//	//listen for compose windows being added to th epage
//	if(!observer || !observing) observeButtons();
//	
//	if(typeof browser!=="undefined") {
//		browser.storage.onChanged.addListener(function(changes,namespace) {
//			
//			for(key in changes) {
//				var storageChange=changes[key];
//				if(key=="plusMinusMultiple") {
//					plusMinusMultiple=storageChange.newValue;
//				}
//			}
//		});
//	} else {
//		chrome.storage.onChanged.addListener(function(changes,namespace) {
//			
//			for(key in changes) {
//				var storageChange=changes[key];
//				if(key=="plusMinusMultiple") {
//					plusMinusMultiple=storageChange.newValue;
//				}
//			}
//		});
//	}
}

function getXMLHttp() {
	try {
		return XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest());
	}
	catch(evt){
		return new XMLHttpRequest();
	}
}

//function observeButtons() {
//	//create an observer instance to listen for compose windows being added to the window
//	if(!observer) {
//		observer=new MutationObserver(function(mutations) {
//			//iterate through all recent mutations
//			for(var i=0,len=mutations.length;i<len;i++) {
//				var mutation=mutations[i];
//				
//				//check if it was a childList addedNode mutation
//				if(mutation.type=="attributes") {
//					var target=mutation.target;
//
//					if(target.classList.contains("btn-linkneg")||target.classList.contains("btn-linkpos")) {
//						//check if value was changed by deribit or by this observer
//						var txt=target.innerHTML;
//						if(txt.indexOf("<b>")==-1) {
//							//update new value and last value
//							target.dataset.value=parseFloat((target.dataset.value*plusMinusMultiple).toFixed(5));
//							target.innerHTML=""+target.dataset.value+"<b></b>";
//						}
//					}
//				}
//			}
//		});
//	}
//	//start observing
//	observer.observe(document.body,{"attributes":true,"subtree":true,"attributeFilter":["data-value"]});
//	observing=true;
//}


init();