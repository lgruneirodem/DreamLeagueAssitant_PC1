/*
* This file is part of StopAll Ads <http://www.stopallads.com/>,
* Copyright (C) 2016 Tweaking Techonologies

* StopAll Ads is a fork of the Adblock Plus extension for 
* blocking advertisements on the web. 
* This fork will provide the same features as Adblock Plus

* StopAll Ads is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with StopAll Ads.  If not, see <http://www.gnu.org/licenses/>.


#Originally Contributed by:
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2016 Eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>. 
 */

(function()
{
  var backgroundPage = ext.backgroundPage.getWindow();
  var require = backgroundPage.require;
  var getBlockedPerPage = require("stats").getBlockedPerPage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Prefs = require("prefs").Prefs;
  
  var currentPage;
  var shareURL = "http://www.stopallads.com/";
  
  var messageMark = {};
  var shareLinks = "";
  
  function createShareLink(network, blockedCount)
  {
    /*var url = shareLinks[network][0];
    var params = shareLinks[network][1];
    
    var querystring = [];
    for (var key in params)
    {
      var value = params[key];
      if (value == messageMark)
        value = i18n.getMessage("stats_share_message", blockedCount);
      querystring.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }*/
    return "";
  }
  
  function onLoad()
  {
    if(document.getElementById("share-box")){
		document.getElementById("share-box").addEventListener("click", share, false);
	}
    var showIconNumber = document.getElementById("show-iconnumber");
    showIconNumber.setAttribute("aria-checked", Prefs.show_statsinicon);
    showIconNumber.addEventListener("click", toggleIconNumber, false);
    document.querySelector("label[for='show-iconnumber']").addEventListener("click", toggleIconNumber, false);
    
    // Update stats
    ext.pages.query({active: true, lastFocusedWindow: true}, function(pages)
    {
      currentPage = pages[0];
      updateStats();

      FilterNotifier.on("filter.hitCount", updateStats);
	  if(document.getElementById("stats-container"))
			document.getElementById("stats-container").removeAttribute("hidden");
    });
  }
  
  function onUnload()
  {
    FilterNotifier.off("filter.hitCount", updateStats);
  }
  
  function isEmptyObjectArr(obj){
    var boolRes=isEmptyObject(obj);
    if(!boolRes){
		if(obj.length===undefined){
			return true;
		}
		else
			return (obj.length==1)?((obj[0]!=null)?false:true):((obj.length<=0)?true:false);
    }
    return boolRes;
}

function isEmptyObject(obj) 
{
    var name;
    for (name in obj) {
        return false;
    }
    
    return true;
}

  function updateStats()
  {
    var statsPage = document.getElementById("stats-page");
	var page_counter=document.getElementById("page-counter");
    var blockedPage = getBlockedPerPage(currentPage).toLocaleString();
	var blockPageC=0;
	//if(isEmptyObjectArr([blockedPage])){
		blockPageC=parseInt([blockedPage][0]);
	//}
	statsPage.innerHTML="<strong>"+blockPageC+"</strong>";
	if(blockPageC>99)
		page_counter.innerHTML="<span>99+</span>";
	else
		page_counter.innerHTML="<span>"+blockPageC+"</span>";
    //i18n.setElementText(statsPage, "stats_label_page", [blockedPage]);
    
    var statsTotal = document.getElementById("stats-total");
    var blockedTotal = Prefs.blocked_total.toLocaleString();
//	var blockTotalC=0;
//	//if(isEmptyObjectArr([blockedTotal])){
//		blockTotalC=parseInt([blockedTotal][0]);
//	//}
//      if(blockPageC > blockTotalC){blockTotalC = blockTotalC + blockPageC;}
//	statsTotal.innerHTML="<strong>"+blockTotalC+"</strong>";
//    //i18n.setElementText(statsTotal, "stats_label_total", [blockedTotal]);
      
    var blockTotalC=0;	
    var blockedTotalOrig=Prefs.blocked_total;
    blockTotalC=parseInt(blockedTotalOrig);
    if(blockPageC > blockTotalC){blockTotalC = blockTotalC + blockPageC;}
    statsTotal.innerHTML="<strong>"+blockTotalC.toLocaleString('en-US')+"</strong>";
	
  }
  
  function share(ev)
  {
    // Easter Egg
    var blocked = Prefs.blocked_total;
    if (blocked <= 9000 || blocked >= 10000)
      blocked = blocked.toLocaleString();
    else
      blocked = i18n.getMessage("stats_over", (9000).toLocaleString());
    
    ext.pages.open(createShareLink(ev.target.dataset.social, blocked));
  }
  
  function toggleIconNumber()
  {
    Prefs.show_statsinicon = !Prefs.show_statsinicon;
    document.getElementById("show-iconnumber").setAttribute("aria-checked", Prefs.show_statsinicon);
	if(Prefs.show_statsinicon){
		//skin/cancle-icon.png
		//skin/right-icon.png
		if(document.getElementById("show-iconnumber")){
			$("#show-iconnumber img").attr("src","skin/right-icon.png");
		}
	}
	else{
		if(document.getElementById("show-iconnumber")){
			$("#show-iconnumber img").attr("src","skin/cancle-icon.png");
		}
	}
	
  }
  
  document.addEventListener("DOMContentLoaded", onLoad, false);
  window.addEventListener("unload", onUnload, false);
})();
