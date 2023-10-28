"use strict";
window.stopalladsChromeOption = true;
window.thisEr = true;
var xsP;
var ysP;
var wsP;
var hsP;
var scrollToCrop = false;
var hideFixedElements = false;
var fixedElements = [];
var tik = null;
var endCapture = function() {
	window.clearTimeout(tik);
	tik = null;
	window.stopalladsChromeOption = false;
	window.thisEr = false;
	document.documentElement.style.overflow = "auto";
	enableFixedPosition(true);
};
var meta_description = $("meta[name='description']").attr("content");
if(meta_description == undefined){
	meta_description = $("meta[name='Description']").attr("content");
}

if (!window.hasScreenCapturePage) {
	window.hasScreenCapturePage = true;
	chrome.extension.onRequest.addListener(function(request, sender, callback) {
		if (request.msg == 'scrollPage') {
			scrollToCrop = request.scrollToCrop;
			hideFixedElements = request.hideFixedElements;

			if (scrollToCrop === true) {
				xsP = request.xs;
				ysP = request.ys;

				wsP = request.ws;
				hsP = request.hs;
				//alert(xsP+'=='+ysP+'=='+ wsP+'=='+ hsP);
			}
			getPositions(callback);
		}

	});
}

function enableFixedPosition(enableFlag) {
	if (!hideFixedElements)
		return;

	if (enableFlag) {
		for (var i = 0, l = fixedElements.length; i < l; ++i) {
			fixedElements[i].style.position = "fixed";
		}
		fixedElements = [];
	} else {
		var nodeIterator = document.createNodeIterator(document.documentElement, NodeFilter.SHOW_ELEMENT, null, false);
		var currentNode;
		while ( currentNode = nodeIterator.nextNode()) {
			var nodeComputedStyle = document.defaultView.getComputedStyle(currentNode, "");
			// Skip nodes which don't have computeStyle or are invisible.
			if (!nodeComputedStyle)
				return;
			var nodePosition = nodeComputedStyle.getPropertyValue("position");
			if (nodePosition == "fixed") {
				fixedElements.push(currentNode);
				currentNode.style.position = "absolute";
			}
		}
	}
}

function getPositions(cb) {
	//document.body.scrollTop = 0;

	document.documentElement.style.overflowX = "hidden";
	if (!scrollToCrop)
		document.documentElement.style.overflowY = "hidden";

	var body = document.body, html = document.documentElement, fullWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth), fullHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight), windowWidth = window.innerWidth, windowHeight = window.innerHeight, arrangements = [], scrollPad = 200, xs = xsP, ys = ysP, hs = hsP, ws = wsP, ymax = hs + ys - windowHeight, xmax = ws + xs - windowWidth, yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0), xDelta = windowWidth, yPos = fullHeight - yDelta, xPos, numArrangements;

	enableFixedPosition(false);
	
	// During zooming, there can be weird off-by-1 types of things...
    if (fullWidth <= xDelta + 1) {
        fullWidth = xDelta;
    }
    
	if (scrollToCrop == true) {
		yPos = ymax;
		// alert(yPos);
		if(yPos > 20000){ // max height to be captured
			yPos = ymax;
			fullWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
		}
		while (yPos > ys - yDelta) {
			xPos = xs;
			while (xPos < xmax + xDelta) {
				arrangements.push([xPos, yPos]);
				xPos += xDelta;
			}
			yPos -= yDelta;
		}

	} else {
		if(fullHeight > 20000){ // max height to be captured
			yPos = 20000;
			fullHeight = yPos;
		}
		
		while (yPos > -yDelta) {
			xPos = 0;
			while (xPos < fullWidth) {
				arrangements.push([xPos, yPos]);
				xPos += xDelta;
			}
			yPos -= yDelta;
		}
	}

	numArrangements = arrangements.length;

	(function scrollTo() {
		if (!arrangements.length) {

			endCapture();
			if (scrollToCrop == true) {
				
				if(arrangements.length == 0){ //FIX for initial small area capture
					var data = {
						msg : 'capturePage',
						x : window.scrollX,
						y : window.scrollY,
						width : windowWidth,
						height : windowHeight,
						complete : (numArrangements - arrangements.length) / numArrangements,
						totalWidth : fullWidth,
						totalHeight : fullHeight,
						devicePixelRatio : window.devicePixelRatio || 1,
						meta_description : meta_description
					};
					//alert(data.x+' - '+data.y+' - '+data.width+' - '+data.height+' - '+data.totalWidth+' - '+data.totalHeight+' -// '+xs+' -// '+ys+' -// '+ws+' -// '+hs);
					chrome.extension.sendRequest(data, function(response) {
						chrome.extension.sendRequest({
							msg : 'openPage',
							'x' : xs,
							'y' : ys,
							'w' : ws,
							'h' : hs,
							devicePixelRatio : window.devicePixelRatio || 1,
						meta_description : meta_description
						}, function(response) {
						});
					});
				}else{
					chrome.extension.sendRequest({
						msg : 'openPage',
						'x' : xs,
						'y' : ys,
						'w' : ws,
						'h' : hs,
						devicePixelRatio : window.devicePixelRatio || 1,
						meta_description : meta_description
					}, function(response) {
					});
				}
				//return cb && cb();
			} else {
				window.scrollTo(0, 0);

				chrome.extension.sendRequest({
					msg : 'openPage',
					meta_description : meta_description
				}, function(response) {
				});
				return cb && cb();
			}

		}

		var next = arrangements.shift(), x = next[0], y = next[1];
		
		window.scrollTo(x, y);

		var data = {
			msg : 'capturePage',
			x : window.scrollX,
			y : window.scrollY,
			width : windowWidth,
			height : windowHeight,
			complete : (numArrangements - arrangements.length) / numArrangements,
			totalWidth : fullWidth,
			totalHeight : fullHeight,
			devicePixelRatio : window.devicePixelRatio || 1,
			meta_description : meta_description
		};
		//alert('test123');
		return ( tik = window.setTimeout(function() { 
			//alert(data.x+' - '+data.y+' - '+data.width+' - '+data.height+' - '+data.totalWidth+' - '+data.totalHeight);
			chrome.extension.sendRequest(data, function(response) {
				if (tik && typeof (response) != 'undefined') {
					scrollTo();
				}
			});
		}, 200));
	})();
}
