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

var RegExpFilter = require("filterClasses").RegExpFilter;
var ElemHide = require("elemHide").ElemHide;
var checkWhitelisted = require("whitelisting").checkWhitelisted;
var extractHostFromFrame = require("url").extractHostFromFrame;
var port = require("messaging").port;
var devtools = require("devtools");

port.on("get-selectors", function(msg, sender)
{
  var selectors;
  var trace = devtools && devtools.hasPanel(sender.page);

  if (!checkWhitelisted(sender.page, sender.frame,
                        RegExpFilter.typeMap.DOCUMENT |
                        RegExpFilter.typeMap.ELEMHIDE))
    selectors = ElemHide.getSelectorsForDomain(
      extractHostFromFrame(sender.frame),
      checkWhitelisted(sender.page, sender.frame,
                       RegExpFilter.typeMap.GENERICHIDE)
    );
  else
    selectors = [];

  return {selectors: selectors, trace: trace};
});

port.on("forward", function(msg, sender)
{
  var targetPage;
  if (msg.targetPageId)
    targetPage = ext.getPage(msg.targetPageId);
  else
    targetPage = sender.page;

  if (targetPage)
  {
    msg.payload.sender = sender.page.id;
    if (msg.expectsResponse)
      return new Promise(targetPage.sendMessage.bind(targetPage, msg.payload));
    targetPage.sendMessage(msg.payload);
  }
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
    //if(details.reason == "install"){
    //}else 
    if(details.reason == "update"){
        var BuildType="R";
        var thisVersion = chrome.runtime.getManifest().version;
        var defLocale=chrome.runtime.getManifest().default_locale;
        defLocale = defLocale.replace("_","-")
        var preVersion = details.previousVersion;
        //var nPreV = preVersion.replace(/\./gi,"");
        //var nCurV = thisVersion.replace(/\./gi,"");
        var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
          
        //if(nCurV > nPreV){
        var info=new Array();
        info["addonName"]="stopallads";
        info["addonVersion"]=thisVersion;
	info["application"]="chrome";
	info["applicationVersion"]=chromeVersion;
        info["platform"]="chromium";
      	info["platformVersion"]=chromeVersion;
      			
      	var search=new Array();
      	var keys = ["addonName", "addonVersion", "application", "applicationVersion", "platform", "platformVersion"];
    	  for (var key of keys)
          	search.push(key + "=" + encodeURIComponent(info[key]));	

        var gUrl="https://uiid37pzb5.execute-api.us-east-1.amazonaws.com/prod";
        function getAPIUrl(){
          return gUrl;
        }
        var updateUrl=getAPIUrl()+"/trackupdate"+"?link=update&lang=%LANG%".replace(/%LANG%/g, defLocale)+"&randomnumber="+(Math.floor(Math.random()*100000))+"&bt="+BuildType+"&"+ search.join("&"); 
        $.get(updateUrl,function( data ) {
        });
          
    //} 
    }
});
