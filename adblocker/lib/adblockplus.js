/*
 * This file is part of StopAll Ads <http://www.stopallads.com/>,
 * Copyright (C) 2016 Tweaking Technologies
 *
 * StopAll Ads is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * StopAll Ads is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with StopAll Ads.  If not, see <http://www.gnu.org/licenses/>.
 */

//

require.scopes["events"] = (function()
{
  "use strict";
  var exports = {};
  exports.EventEmitter = function()
  {
    this._listeners = Object.create(null);
  };
  exports.EventEmitter.prototype = {
    on: function(name, listener)
    {
      if (name in this._listeners)
      {
        this._listeners[name].push(listener);
      }
      else
      {
        this._listeners[name] = [listener];
      }
    },
    off: function(name, listener)
    {
      var listeners = this._listeners[name];
      if (listeners)
      {
        var idx = listeners.indexOf(listener);
        if (idx != -1)
        {
          listeners.splice(idx, 1);
        }
      }
    },
    once: function(name)
    {
      return new Promise(function(resolve)
      {
        var listener = function()
        {
          this.off(name, listener);
          resolve();
        }.bind(this);
        this.on(name, listener);
      }.bind(this));
    },
    listeners: function(name)
    {
      var listeners = this._listeners[name];
      return listeners ? listeners.slice() : [];
    },
    emit: function(name)
    {
      var args = [];
      for (var i = 1; i < arguments.length; i++)
      {
        args.push(arguments[i]);
      }
      var listeners = this.listeners(name);
      for (var _loopIndex0 = 0; _loopIndex0 < listeners.length; ++_loopIndex0)
      {
        var listener = listeners[_loopIndex0];
        listener.apply(null, args);
      }
    }
  };
  return exports;
})();
require.scopes["prefs"] = (function()
{
  var exports = {};
  var EventEmitter = require("events").EventEmitter;
  var keyPrefix = "pref:";
  var eventEmitter = new EventEmitter();
  var overrides = Object.create(null);
  var defaults = Object.create(null);
  defaults.enabled = true;
  defaults.currentVersion = "";
  defaults.data_directory = "";
  defaults.patternsbackups = 5;
  defaults.patternsbackupinterval = 24;
  defaults.savestats = false;
  defaults.privateBrowsing = false;
  defaults.subscriptions_fallbackerrors = 5;
  defaults.subscriptions_fallbackurl = "http://www.stopallads.com/getSubscription?version=%VERSION%&url=%SUBSCRIPTION%&downloadURL=%URL%&error=%ERROR%&channelStatus=%CHANNELSTATUS%&responseStatus=%RESPONSESTATUS%";
  defaults.subscriptions_autoupdate = true;
  defaults.subscriptions_easyprivacy = "http://cdn.systweak.com/stopallads/subscriptions/easyprivacy_easylist.txt";
  defaults.subscriptions_easylistadware = "http://cdn.systweak.com/stopallads/subscriptions/adwarefilters.txt";
  defaults.subscriptions_exceptionsurl = "http://cdn.systweak.com/stopallads/subscriptions/exceptionrules.txt";
  defaults.subscriptions_antiadblockurl = "http://cdn.systweak.com/stopallads/subscriptions/antiadblockfilters.txt";
  defaults.StopAllAdsKillerScriptsurl = "http://cdn.systweak.com/stopallads/subscriptions/StopAllAdsKillerScripts.txt";
  defaults.StopAllAdsEasyList_Malwareurl = "http://cdn.systweak.com/stopallads/StopAllAds%20Custom%20Script/easylist_malwarelist.txt";
  defaults.documentation_link = "http://www.stopallads.com/redirect?link=%LINK%&lang=%LANG%";
  defaults.notificationdata = {};
  defaults.notificationurl = "http://cdn.systweak.com/stopallads/subscriptions/notification.json";
  defaults.blocked_total = 0;
  defaults.show_statsinicon = true;
  defaults.show_statsinpopup = true;
  defaults.shouldShowBlockElementMenu = true;
  defaults.hidePlaceholders = true;
  defaults.notifications_showui = false;
  defaults.notifications_ignoredcategories = [];
  defaults.show_devtools_panel = true;
  defaults.suppress_first_run_page = false;
  defaults.additional_subscriptions = [];
  defaults.safariContentBlocker = false;
  var Prefs = exports.Prefs = {
    on: function(preference, callback)
    {
      eventEmitter.on(preference, callback);
    },
    off: function(preference, callback)
    {
      eventEmitter.off(preference, callback);
    },
    untilLoaded: null
  };

  function keyToPref(key)
  {
    if (key.indexOf(keyPrefix) != 0)
    {
      return null;
    }
    return key.substr(keyPrefix.length);
  }

  function prefToKey(pref)
  {
    return keyPrefix + pref;
  }

  function addPreference(pref)
  {
    Object.defineProperty(Prefs, pref,
    {
      get: function()
      {
        return (pref in overrides ? overrides : defaults)[pref];
      },
      set: function(value)
      {
        var defaultValue = defaults[pref];
        if (typeof value != typeof defaultValue)
        {
          throw new Error("Attempt to change preference type");
        }
        if (value == defaultValue)
        {
          delete overrides[pref];
          ext.storage.remove(prefToKey(pref));
        }
        else
        {
          overrides[pref] = value;
          ext.storage.set(prefToKey(pref), value);
        }
      },
      enumerable: true
    });
  }

  function init()
  {
    var prefs = Object.keys(defaults);
    prefs.forEach(addPreference);
    var localLoaded = new Promise(function(resolve)
    {
      ext.storage.get(prefs.map(prefToKey), function(items)
      {
        for (var key in items)
        {
          overrides[keyToPref(key)] = items[key];
        }
        resolve();
      });
    });
    var managedLoaded = new Promise(function(resolve)
    {
      if (require("info").platform == "chromium" && "managed" in chrome.storage)
      {
        chrome.storage.managed.get(null, function(items)
        {
          chrome.runtime.lastError;
          for (var key in items)
          {
            defaults[key] = items[key];
          }
          resolve();
        });
      }
      else
      {
        resolve();
      }
    });

    function onLoaded()
    {
      ext.storage.onChanged.addListener(function(changes)
      {
        for (var key in changes)
        {
          var pref = keyToPref(key);
          if (pref && pref in defaults)
          {
            var change = changes[key];
            if ("newValue" in change && change.newValue != defaults[pref])
            {
              overrides[pref] = change.newValue;
            }
            else
            {
              delete overrides[pref];
            }
            eventEmitter.emit(pref);
          }
        }
      });
    }
    Prefs.untilLoaded = Promise.all([localLoaded, managedLoaded]).then(onLoaded);
  }
  init();
  return exports;
})();
require.scopes["utils"] = (function()
{
  var exports = {};
  var Utils = exports.Utils = {
    systemPrincipal: null,
    getString: function(id)
    {
      if (typeof ext !== "undefined" && "i18n" in ext)
      {
        return ext.i18n.getMessage("global_" + id);
      }
      else
      {
        return id;
      }
    },
    runAsync: function(callback)
    {
      if (document.readyState == "loading")
      {
        var onDOMContentLoaded = function()
        {
          document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
          callback();
        };
        document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
      }
      else
      {
        setTimeout(callback, 0);
      }
    },
    get appLocale()
    {
      var locale = ext.i18n.getMessage("@@ui_locale").replace(/_/g, "-");
      Object.defineProperty(this, "appLocale",
      {
        value: locale,
        enumerable: true
      });
      return this.appLocale;
    },
    generateChecksum: function(lines)
    {
      return null;
    },
    checkLocalePrefixMatch: function(prefixes)
    {
      if (!prefixes)
      {
        return null;
      }
      var list = prefixes.split(",");
      for (var i = 0; i < list.length; i++)
      {
        if ((new RegExp("^" + list[i] + "\\b")).test(this.appLocale))
        {
          return list[i];
        }
      }
      return null;
    },
    chooseFilterSubscription: function(subscriptions)
    {
      var selectedItem = null;
      var selectedPrefix = null;
      var matchCount = 0;
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        if (!selectedItem)
        {
          selectedItem = subscription;
        }
        var prefix = require("utils").Utils.checkLocalePrefixMatch(subscription.getAttribute("prefixes"));
        if (prefix)
        {
          if (!selectedPrefix || selectedPrefix.length < prefix.length)
          {
            selectedItem = subscription;
            selectedPrefix = prefix;
            matchCount = 1;
          }
          else if (selectedPrefix && selectedPrefix.length == prefix.length)
          {
            matchCount++;
            if (Math.random() * matchCount < 1)
            {
              selectedItem = subscription;
              selectedPrefix = prefix;
            }
          }
        }
      }
      return selectedItem;
    },
    getDocLink: function(linkID)
    {
      var Prefs = require("prefs").Prefs;
      var docLink = Prefs.documentation_link;
      return docLink.replace(/%LINK%/g, linkID).replace(/%LANG%/g, Utils.appLocale);
    },
    yield: function()
    {}
  };
  return exports;
})();
require.scopes["io"] = (function()
{
  var exports = {};
  var keyPrefix = "file:";

  function fileToKey(file)
  {
    return keyPrefix + (file instanceof FakeFile ? file.path : file.spec);
  }

  function loadFile(file, successCallback, errorCallback)
  {
    var key = fileToKey(file);
    ext.storage.get([key], function(items)
    {
      var entry = items[key];
      if (entry)
      {
        successCallback(entry);
      }
      else
      {
        errorCallback(new Error("File doesn't exist"));
      }
    });
  }

  function saveFile(file, data, callback)
  {
    ext.storage.set(fileToKey(file),
    {
      content: data,
      lastModified: Date.now()
    }, callback);
  }
  exports.IO = {
    resolveFilePath: function(path)
    {
      return new FakeFile(path);
    },
    readFromFile: function(file, listener, callback)
    {
      function onLoaded(entry)
      {
        for (var _loopIndex1 = 0; _loopIndex1 < entry.content.length; ++_loopIndex1)
        {
          var line = entry.content[_loopIndex1];
          listener.process(line);
        }
        listener.process(null);
        callback(null);
      }
      loadFile(file, onLoaded, callback);
    },
    writeToFile: function(file, data, callback)
    {
      saveFile(file, data, callback);
    },
    copyFile: function(fromFile, toFile, callback)
    {
      function onLoaded(entry)
      {
        saveFile(toFile, entry.content, callback);
      }
      loadFile(fromFile, onLoaded, callback);
    },
    renameFile: function(fromFile, newName, callback)
    {
      function onLoaded()
      {
        ext.storage.remove(fileToKey(fromFile), function()
        {
          ext.storage.set(keyPrefix + newName, entry, callback);
        });
      }
      loadFile(fromFile, onLoaded, callback);
    },
    removeFile: function(file, callback)
    {
      ext.storage.remove(fileToKey(file), callback);
    },
    statFile: function(file, callback)
    {
      function onLoaded(entry)
      {
        callback(null,
        {
          exists: true,
          lastModified: entry.lastModified
        });
      }
      loadFile(file, onLoaded, callback);
    }
  };
  return exports;
})();
require.scopes["downloader"] = (function()
{
  var exports = {};
  var Utils = require("utils").Utils;
  var MILLIS_IN_SECOND = exports.MILLIS_IN_SECOND = 1000;
  var MILLIS_IN_MINUTE = exports.MILLIS_IN_MINUTE = 60 * MILLIS_IN_SECOND;
  var MILLIS_IN_HOUR = exports.MILLIS_IN_HOUR = 60 * MILLIS_IN_MINUTE;
  var MILLIS_IN_DAY = exports.MILLIS_IN_DAY = 24 * MILLIS_IN_HOUR;
  var Downloader = exports.Downloader = function Downloader(dataSource, initialDelay, checkInterval)
  {
    this.dataSource = dataSource;
    this._timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this._timer.initWithCallback(function()
    {
      this._timer.delay = checkInterval;
      this._doCheck();
    }.bind(this), initialDelay, Ci.nsITimer.TYPE_REPEATING_SLACK);
    this._downloading = Object.create(null);
  };
  Downloader.prototype = {
    _timer: null,
    _downloading: null,
    dataSource: null,
    maxAbsenceInterval: 1 * MILLIS_IN_DAY,
    minRetryInterval: 1 * MILLIS_IN_DAY,
    maxExpirationInterval: 14 * MILLIS_IN_DAY,
    maxRedirects: 5,
    onExpirationChange: null,
    onDownloadStarted: null,
    onDownloadSuccess: null,
    onDownloadError: null,
    _doCheck: function()
    {
      var now = Date.now();
      for (var _loopIndex2 = 0; _loopIndex2 < this.dataSource().length; ++_loopIndex2)
      {
        var downloadable = this.dataSource()[_loopIndex2];
        if (downloadable.lastCheck && now - downloadable.lastCheck > this.maxAbsenceInterval)
        {
          downloadable.softExpiration += now - downloadable.lastCheck;
        }
        downloadable.lastCheck = now;
        if (downloadable.hardExpiration - now > this.maxExpirationInterval)
        {
          downloadable.hardExpiration = now + this.maxExpirationInterval;
        }
        if (downloadable.softExpiration - now > this.maxExpirationInterval)
        {
          downloadable.softExpiration = now + this.maxExpirationInterval;
        }
        if (this.onExpirationChange)
        {
          this.onExpirationChange(downloadable);
        }
        if (downloadable.softExpiration > now && downloadable.hardExpiration > now)
        {
          continue;
        }
        if (downloadable.lastError && now - downloadable.lastError < this.minRetryInterval)
        {
          continue;
        }
        this._download(downloadable, 0);
      }
    },
    cancel: function()
    {
      this._timer.cancel();
    },
    isDownloading: function(url)
    {
      return url in this._downloading;
    },
    download: function(downloadable)
    {
      Utils.runAsync(this._download.bind(this, downloadable, 0));
    },
    getDownloadUrl: function(downloadable)
    {
      var _tempVar3 = require("info");
      var addonName = _tempVar3.addonName;
      var addonVersion = _tempVar3.addonVersion;
      var application = _tempVar3.application;
      var applicationVersion = _tempVar3.applicationVersion;
      var platform = _tempVar3.platform;
      var platformVersion = _tempVar3.platformVersion;
      var url = downloadable.redirectURL || downloadable.url;
      if (url.indexOf("?") >= 0)
      {
        url += "&";
      }
      else
      {
        url += "?";
      }
      var downloadCount = downloadable.downloadCount;
      if (downloadCount > 4)
      {
        downloadCount = "4+";
      }
      url += "addonName=" + encodeURIComponent(addonName) + "&addonVersion=" + encodeURIComponent(addonVersion) + "&application=" + encodeURIComponent(application) + "&applicationVersion=" + encodeURIComponent(applicationVersion) + "&platform=" + encodeURIComponent(platform) + "&platformVersion=" + encodeURIComponent(platformVersion) + "&lastVersion=" + encodeURIComponent(downloadable.lastVersion) + "&downloadCount=" + encodeURIComponent(downloadCount);
      return url;
    },
    _download: function(downloadable, redirects)
    {
      if (this.isDownloading(downloadable.url))
      {
        return;
      }
      var downloadUrl = this.getDownloadUrl(downloadable);
      var request = null;
      var errorCallback = function errorCallback(error)
      {
        var channelStatus = -1;
        try
        {
          channelStatus = request.channel.status;
        }
        catch (e)
        {}
        var responseStatus = request.status;
        Cu.reportError("StopAll Ads: Downloading URL " + downloadable.url + " failed (" + error + ")\n" + "Download address: " + downloadUrl + "\n" + "Channel status: " + channelStatus + "\n" + "Server response: " + responseStatus);
        if (this.onDownloadError)
        {
          var redirectCallback = null;
          if (redirects <= this.maxRedirects)
          {
            redirectCallback = function redirectCallback(url)
            {
              downloadable.redirectURL = url;
              this._download(downloadable, redirects + 1);
            }.bind(this);
          }
          this.onDownloadError(downloadable, downloadUrl, error, channelStatus, responseStatus, redirectCallback);
        }
      }.bind(this);
      try
      {
        request = new XMLHttpRequest();
        request.mozBackgroundRequest = true;
        request.open("GET", downloadUrl);
      }
      catch (e)
      {
        errorCallback("synchronize_invalid_url");
        return;
      }
      try
      {
        request.overrideMimeType("text/plain");
        request.channel.loadFlags = request.channel.loadFlags | request.channel.INHIBIT_CACHING | request.channel.VALIDATE_ALWAYS;
        if (request.channel instanceof Ci.nsIHttpChannel)
        {
          request.channel.redirectionLimit = this.maxRedirects;
        }
      }
      catch (e)
      {
        Cu.reportError(e);
      }
      request.addEventListener("error", function(event)
      {
        if (onShutdown.done)
        {
          return;
        }
        delete this._downloading[downloadable.url];
        errorCallback("synchronize_connection_error");
      }.bind(this), false);
      request.addEventListener("load", function(event)
      {
        if (onShutdown.done)
        {
          return;
        }
        delete this._downloading[downloadable.url];
        if (request.status && request.status != 200)
        {
          errorCallback("synchronize_connection_error");
          return;
        }
        downloadable.downloadCount++;
        this.onDownloadSuccess(downloadable, request.responseText, errorCallback, function redirectCallback(url)
        {
          if (redirects >= this.maxRedirects)
          {
            errorCallback("synchronize_connection_error");
          }
          else
          {
            downloadable.redirectURL = url;
            this._download(downloadable, redirects + 1);
          }
        }.bind(this));
      }.bind(this), false);
      request.send(null);
      this._downloading[downloadable.url] = true;
      if (this.onDownloadStarted)
      {
        this.onDownloadStarted(downloadable);
      }
    },
    processExpirationInterval: function(interval)
    {
      interval = Math.min(Math.max(interval, 0), this.maxExpirationInterval);
      var soft = Math.round(interval * (Math.random() * 0.4 + 0.8));
      var hard = interval * 2;
      var now = Date.now();
      return [now + soft, now + hard];
    }
  };
  var Downloadable = exports.Downloadable = function Downloadable(url)
  {
    this.url = url;
  };
  Downloadable.prototype = {
    url: null,
    redirectURL: null,
    lastError: 0,
    lastCheck: 0,
    lastVersion: 0,
    softExpiration: 0,
    hardExpiration: 0,
    downloadCount: 0
  };
  return exports;
})();
require.scopes["filterNotifier"] = (function()
{
  var exports = {};
  var EventEmitter = require("events").EventEmitter;
  var CATCH_ALL = "__all";
  exports.FilterNotifier = {
    __proto__: new EventEmitter(),
    addListener: function(listener)
    {
      var listeners = this._listeners[CATCH_ALL];
      if (!listeners || listeners.indexOf(listener) == -1)
      {
        this.on(CATCH_ALL, listener);
      }
    },
    removeListener: function(listener)
    {
      this.off(CATCH_ALL, listener);
    },
    triggerListeners: function(action, item, param1, param2, param3)
    {
      this.emit(action, item, param1, param2, param3);
      this.emit(CATCH_ALL, action, item, param1, param2, param3);
    }
  };
  return exports;
})();
require.scopes["filterClasses"] = (function()
{
  var exports = {};
  var FilterNotifier = require("filterNotifier").FilterNotifier;

  function Filter(text)
  {
    this.text = text;
    this.subscriptions = [];
  }
  exports.Filter = Filter;
  Filter.prototype = {
    text: null,
    subscriptions: null,
    get type()
    {
      throw new Error("Please define filter type in the subclass");
    },
    serialize: function(buffer)
    {
      buffer.push("[Filter]");
      buffer.push("text=" + this.text);
    },
    toString: function()
    {
      return this.text;
    }
  };
  Filter.knownFilters = Object.create(null);
  Filter.elemhideRegExp = /^([^\/\*\|\@"!]*?)#(\@)?(?:([\w\-]+|\*)((?:\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\))*)|#([^{}]+))$/;
  Filter.regexpRegExp = /^(@@)?\/.*\/(?:\$~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*)?$/;
  Filter.optionsRegExp = /\$(~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*)$/;
  Filter.csspropertyRegExp = /\[\-abp\-properties=(["'])([^"']+)\1\]/;
  Filter.fromText = function(text)
  {
    if (text in Filter.knownFilters)
    {
      return Filter.knownFilters[text];
    }
    var ret;
    var match = text.indexOf("#") >= 0 ? Filter.elemhideRegExp.exec(text) : null;
    if (match)
    {
      ret = ElemHideBase.fromText(text, match[1], !!match[2], match[3], match[4], match[5]);
    }
    else if (text[0] == "!")
    {
      ret = new CommentFilter(text);
    }
    else
    {
      ret = RegExpFilter.fromText(text);
    }
    Filter.knownFilters[ret.text] = ret;
    return ret;
  };
  Filter.fromObject = function(obj)
  {
    var ret = Filter.fromText(obj.text);
    if (ret instanceof ActiveFilter)
    {
      if ("disabled" in obj)
      {
        ret._disabled = obj.disabled == "true";
      }
      if ("hitCount" in obj)
      {
        ret._hitCount = parseInt(obj.hitCount) || 0;
      }
      if ("lastHit" in obj)
      {
        ret._lastHit = parseInt(obj.lastHit) || 0;
      }
    }
    return ret;
  };
  Filter.normalize = function(text)
  {
    if (!text)
    {
      return text;
    }
    text = text.replace(/[^\S ]/g, "");
    if (/^\s*!/.test(text))
    {
      return text.trim();
    }
    else if (Filter.elemhideRegExp.test(text))
    {
      var _tempVar4 = /^(.*?)(#\@?#?)(.*)$/.exec(text);
      var domain = _tempVar4[1];
      var separator = _tempVar4[2];
      var selector = _tempVar4[3];
      return domain.replace(/\s/g, "") + separator + selector.trim();
    }
    else
    {
      return text.replace(/\s/g, "");
    }
  };
  Filter.toRegExp = function(text)
  {
    return text.replace(/\*+/g, "*").replace(/\^\|$/, "^").replace(/\W/g, "\\$&").replace(/\\\*/g, ".*").replace(/\\\^/g, "(?:[\\x00-\\x24\\x26-\\x2C\\x2F\\x3A-\\x40\\x5B-\\x5E\\x60\\x7B-\\x7F]|$)").replace(/^\\\|\\\|/, "^[\\w\\-]+:\\/+(?!\\/)(?:[^\\/]+\\.)?").replace(/^\\\|/, "^").replace(/\\\|$/, "$").replace(/^(\.\*)/, "").replace(/(\.\*)$/, "");
  };

  function InvalidFilter(text, reason)
  {
    Filter.call(this, text);
    this.reason = reason;
  }
  exports.InvalidFilter = InvalidFilter;
  InvalidFilter.prototype = {
    __proto__: Filter.prototype,
    type: "invalid",
    reason: null,
    serialize: function(buffer)
    {}
  };

  function CommentFilter(text)
  {
    Filter.call(this, text);
  }
  exports.CommentFilter = CommentFilter;
  CommentFilter.prototype = {
    __proto__: Filter.prototype,
    type: "comment",
    serialize: function(buffer)
    {}
  };

  function ActiveFilter(text, domains)
  {
    Filter.call(this, text);
    this.domainSource = domains;
  }
  exports.ActiveFilter = ActiveFilter;
  ActiveFilter.prototype = {
    __proto__: Filter.prototype,
    _disabled: false,
    _hitCount: 0,
    _lastHit: 0,
    get disabled()
    {
      return this._disabled;
    },
    set disabled(value)
    {
      if (value != this._disabled)
      {
        var oldValue = this._disabled;
        this._disabled = value;
        FilterNotifier.triggerListeners("filter.disabled", this, value, oldValue);
      }
      return this._disabled;
    },
    get hitCount()
    {
      return this._hitCount;
    },
    set hitCount(value)
    {
      if (value != this._hitCount)
      {
        var oldValue = this._hitCount;
        this._hitCount = value;
        FilterNotifier.triggerListeners("filter.hitCount", this, value, oldValue);
      }
      return this._hitCount;
    },
    get lastHit()
    {
      return this._lastHit;
    },
    set lastHit(value)
    {
      if (value != this._lastHit)
      {
        var oldValue = this._lastHit;
        this._lastHit = value;
        FilterNotifier.triggerListeners("filter.lastHit", this, value, oldValue);
      }
      return this._lastHit;
    },
    domainSource: null,
    domainSeparator: null,
    ignoreTrailingDot: true,
    domainSourceIsUpperCase: false,
    get domains()
    {
      var prop = Object.getOwnPropertyDescriptor(this, "domains");
      if (prop)
      {
        return prop.value;
      }
      var domains = null;
      if (this.domainSource)
      {
        var source = this.domainSource;
        if (!this.domainSourceIsUpperCase)
        {
          source = source.toUpperCase();
        }
        var list = source.split(this.domainSeparator);
        if (list.length == 1 && list[0][0] != "~")
        {
          domains = Object.create(null);
          domains[""] = false;
          if (this.ignoreTrailingDot)
          {
            list[0] = list[0].replace(/\.+$/, "");
          }
          domains[list[0]] = true;
        }
        else
        {
          var hasIncludes = false;
          for (var i = 0; i < list.length; i++)
          {
            var domain = list[i];
            if (this.ignoreTrailingDot)
            {
              domain = domain.replace(/\.+$/, "");
            }
            if (domain == "")
            {
              continue;
            }
            var include;
            if (domain[0] == "~")
            {
              include = false;
              domain = domain.substr(1);
            }
            else
            {
              include = true;
              hasIncludes = true;
            }
            if (!domains)
            {
              domains = Object.create(null);
            }
            domains[domain] = include;
          }
          domains[""] = !hasIncludes;
        }
        this.domainSource = null;
      }
      Object.defineProperty(this, "domains",
      {
        value: domains,
        enumerable: true
      });
      return this.domains;
    },
    sitekeys: null,
    isActiveOnDomain: function(docDomain, sitekey)
    {
      if (this.sitekeys && (!sitekey || this.sitekeys.indexOf(sitekey.toUpperCase()) < 0))
      {
        return false;
      }
      if (!this.domains)
      {
        return true;
      }
      if (!docDomain)
      {
        return this.domains[""];
      }
      if (this.ignoreTrailingDot)
      {
        docDomain = docDomain.replace(/\.+$/, "");
      }
      docDomain = docDomain.toUpperCase();
      while (true)
      {
        if (docDomain in this.domains)
        {
          return this.domains[docDomain];
        }
        var nextDot = docDomain.indexOf(".");
        if (nextDot < 0)
        {
          break;
        }
        docDomain = docDomain.substr(nextDot + 1);
      }
      return this.domains[""];
    },
    isActiveOnlyOnDomain: function(docDomain)
    {
      if (!docDomain || !this.domains || this.domains[""])
      {
        return false;
      }
      if (this.ignoreTrailingDot)
      {
        docDomain = docDomain.replace(/\.+$/, "");
      }
      docDomain = docDomain.toUpperCase();
      for (var domain in this.domains)
      {
        if (this.domains[domain] && domain != docDomain && (domain.length <= docDomain.length || domain.indexOf("." + docDomain) != domain.length - docDomain.length - 1))
        {
          return false;
        }
      }
      return true;
    },
    isGeneric: function()
    {
      return !(this.sitekeys && this.sitekeys.length) && (!this.domains || this.domains[""]);
    },
    serialize: function(buffer)
    {
      if (this._disabled || this._hitCount || this._lastHit)
      {
        Filter.prototype.serialize.call(this, buffer);
        if (this._disabled)
        {
          buffer.push("disabled=true");
        }
        if (this._hitCount)
        {
          buffer.push("hitCount=" + this._hitCount);
        }
        if (this._lastHit)
        {
          buffer.push("lastHit=" + this._lastHit);
        }
      }
    }
  };

  function RegExpFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys)
  {
    ActiveFilter.call(this, text, domains, sitekeys);
    if (contentType != null)
    {
      this.contentType = contentType;
    }
    if (matchCase)
    {
      this.matchCase = matchCase;
    }
    if (thirdParty != null)
    {
      this.thirdParty = thirdParty;
    }
    if (sitekeys != null)
    {
      this.sitekeySource = sitekeys;
    }
    if (regexpSource.length >= 2 && regexpSource[0] == "/" && regexpSource[regexpSource.length - 1] == "/")
    {
      var regexp = new RegExp(regexpSource.substr(1, regexpSource.length - 2), this.matchCase ? "" : "i");
      Object.defineProperty(this, "regexp",
      {
        value: regexp
      });
    }
    else
    {
      this.regexpSource = regexpSource;
    }
  }
  exports.RegExpFilter = RegExpFilter;
  RegExpFilter.prototype = {
    __proto__: ActiveFilter.prototype,
    domainSourceIsUpperCase: true,
    length: 1,
    domainSeparator: "|",
    regexpSource: null,
    get regexp()
    {
      var prop = Object.getOwnPropertyDescriptor(this, "regexp");
      if (prop)
      {
        return prop.value;
      }
      var source = Filter.toRegExp(this.regexpSource);
      var regexp = new RegExp(source, this.matchCase ? "" : "i");
      Object.defineProperty(this, "regexp",
      {
        value: regexp
      });
      return regexp;
    },
    contentType: 2147483647,
    matchCase: false,
    thirdParty: null,
    sitekeySource: null,
    get sitekeys()
    {
      var prop = Object.getOwnPropertyDescriptor(this, "sitekeys");
      if (prop)
      {
        return prop.value;
      }
      var sitekeys = null;
      if (this.sitekeySource)
      {
        sitekeys = this.sitekeySource.split("|");
        this.sitekeySource = null;
      }
      Object.defineProperty(this, "sitekeys",
      {
        value: sitekeys,
        enumerable: true
      });
      return this.sitekeys;
    },
    matches: function(location, typeMask, docDomain, thirdParty, sitekey)
    {
      if (this.contentType & typeMask && (this.thirdParty == null || this.thirdParty == thirdParty) && this.isActiveOnDomain(docDomain, sitekey) && this.regexp.test(location))
      {
        return true;
      }
      return false;
    }
  };
  Object.defineProperty(RegExpFilter.prototype, "0",
  {
    get: function()
    {
      return this;
    }
  });
  RegExpFilter.fromText = function(text)
  {
    var blocking = true;
    var origText = text;
    if (text.indexOf("@@") == 0)
    {
      blocking = false;
      text = text.substr(2);
    }
    var contentType = null;
    var matchCase = null;
    var domains = null;
    var sitekeys = null;
    var thirdParty = null;
    var collapse = null;
    var options;
    var match = text.indexOf("$") >= 0 ? Filter.optionsRegExp.exec(text) : null;
    if (match)
    {
      options = match[1].toUpperCase().split(",");
      text = match.input.substr(0, match.index);
      for (var _loopIndex5 = 0; _loopIndex5 < options.length; ++_loopIndex5)
      {
        var option = options[_loopIndex5];
        var value = null;
        var separatorIndex = option.indexOf("=");
        if (separatorIndex >= 0)
        {
          value = option.substr(separatorIndex + 1);
          option = option.substr(0, separatorIndex);
        }
        option = option.replace(/-/, "_");
        if (option in RegExpFilter.typeMap)
        {
          if (contentType == null)
          {
            contentType = 0;
          }
          contentType |= RegExpFilter.typeMap[option];
        }
        else if (option[0] == "~" && option.substr(1) in RegExpFilter.typeMap)
        {
          if (contentType == null)
          {
            contentType = RegExpFilter.prototype.contentType;
          }
          contentType &= ~RegExpFilter.typeMap[option.substr(1)];
        }
        else if (option == "MATCH_CASE")
        {
          matchCase = true;
        }
        else if (option == "~MATCH_CASE")
        {
          matchCase = false;
        }
        else if (option == "DOMAIN" && typeof value != "undefined")
        {
          domains = value;
        }
        else if (option == "THIRD_PARTY")
        {
          thirdParty = true;
        }
        else if (option == "~THIRD_PARTY")
        {
          thirdParty = false;
        }
        else if (option == "COLLAPSE")
        {
          collapse = true;
        }
        else if (option == "~COLLAPSE")
        {
          collapse = false;
        }
        else if (option == "SITEKEY" && typeof value != "undefined")
        {
          sitekeys = value;
        }
        else
        {
          return new InvalidFilter(origText, "filter_unknown_option");
        }
      }
    }
    try
    {
      if (blocking)
      {
        return new BlockingFilter(origText, text, contentType, matchCase, domains, thirdParty, sitekeys, collapse);
      }
      else
      {
        return new WhitelistFilter(origText, text, contentType, matchCase, domains, thirdParty, sitekeys);
      }
    }
    catch (e)
    {
      return new InvalidFilter(origText, "filter_invalid_regexp");
    }
  };
  RegExpFilter.typeMap = {
    OTHER: 1,
    SCRIPT: 2,
    IMAGE: 4,
    STYLESHEET: 8,
    OBJECT: 16,
    SUBDOCUMENT: 32,
    DOCUMENT: 64,
    XBL: 1,
    PING: 1024,
    XMLHTTPREQUEST: 2048,
    OBJECT_SUBREQUEST: 4096,
    DTD: 1,
    MEDIA: 16384,
    FONT: 32768,
    BACKGROUND: 4,
    POPUP: 268435456,
    GENERICBLOCK: 536870912,
    ELEMHIDE: 1073741824,
    GENERICHIDE: 2147483648
  };
  RegExpFilter.prototype.contentType &= ~ (RegExpFilter.typeMap.DOCUMENT | RegExpFilter.typeMap.ELEMHIDE | RegExpFilter.typeMap.POPUP | RegExpFilter.typeMap.GENERICHIDE | RegExpFilter.typeMap.GENERICBLOCK);

  function BlockingFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys, collapse)
  {
    RegExpFilter.call(this, text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys);
    this.collapse = collapse;
  }
  exports.BlockingFilter = BlockingFilter;
  BlockingFilter.prototype = {
    __proto__: RegExpFilter.prototype,
    type: "blocking",
    collapse: null
  };

  function WhitelistFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys)
  {
    RegExpFilter.call(this, text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys);
  }
  exports.WhitelistFilter = WhitelistFilter;
  WhitelistFilter.prototype = {
    __proto__: RegExpFilter.prototype,
    type: "whitelist"
  };

  function ElemHideBase(text, domains, selector)
  {
    ActiveFilter.call(this, text, domains || null);
    if (domains)
    {
      this.selectorDomain = domains.replace(/,~[^,]+/g, "").replace(/^~[^,]+,?/, "").toLowerCase();
    }
    this.selector = selector;
  }
  exports.ElemHideBase = ElemHideBase;
  ElemHideBase.prototype = {
    __proto__: ActiveFilter.prototype,
    domainSeparator: ",",
    ignoreTrailingDot: false,
    selectorDomain: null,
    selector: null
  };
  ElemHideBase.fromText = function(text, domain, isException, tagName, attrRules, selector)
  {
    if (!selector)
    {
      if (tagName == "*")
      {
        tagName = "";
      }
      var id = null;
      var additional = "";
      if (attrRules)
      {
        attrRules = attrRules.match(/\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\)/g);
        for (var _loopIndex6 = 0; _loopIndex6 < attrRules.length; ++_loopIndex6)
        {
          var rule = attrRules[_loopIndex6];
          rule = rule.substr(1, rule.length - 2);
          var separatorPos = rule.indexOf("=");
          if (separatorPos > 0)
          {
            rule = rule.replace(/=/, "=\"") + "\"";
            additional += "[" + rule + "]";
          }
          else
          {
            if (id)
            {
              return new InvalidFilter(text, "filter_elemhide_duplicate_id");
            }
            id = rule;
          }
        }
      }
      if (id)
      {
        selector = tagName + "." + id + additional + "," + tagName + "#" + id + additional;
      }
      else if (tagName || additional)
      {
        selector = tagName + additional;
      }
      else
      {
        return new InvalidFilter(text, "filter_elemhide_nocriteria");
      }
    }
    if (isException)
    {
      return new ElemHideException(text, domain, selector);
    }
    var match = Filter.csspropertyRegExp.exec(selector);
    if (match)
    {
      if (!/,[^~][^,.]*\.[^,]/.test("," + domain))
      {
        return new InvalidFilter(text, "filter_cssproperty_nodomain");
      }
      return new CSSPropertyFilter(text, domain, selector, match[2], selector.substr(0, match.index), selector.substr(match.index + match[0].length));
    }
    return new ElemHideFilter(text, domain, selector);
  };

  function ElemHideFilter(text, domains, selector)
  {
    ElemHideBase.call(this, text, domains, selector);
  }
  exports.ElemHideFilter = ElemHideFilter;
  ElemHideFilter.prototype = {
    __proto__: ElemHideBase.prototype,
    type: "elemhide"
  };

  function ElemHideException(text, domains, selector)
  {
    ElemHideBase.call(this, text, domains, selector);
  }
  exports.ElemHideException = ElemHideException;
  ElemHideException.prototype = {
    __proto__: ElemHideBase.prototype,
    type: "elemhideexception"
  };

  function CSSPropertyFilter(text, domains, selector, regexpSource, selectorPrefix, selectorSuffix)
  {
    ElemHideBase.call(this, text, domains, selector);
    this.regexpSource = regexpSource;
    this.selectorPrefix = selectorPrefix;
    this.selectorSuffix = selectorSuffix;
  }
  exports.CSSPropertyFilter = CSSPropertyFilter;
  CSSPropertyFilter.prototype = {
    __proto__: ElemHideBase.prototype,
    type: "cssproperty",
    regexpSource: null,
    selectorPrefix: null,
    selectorSuffix: null,
    get regexpString()
    {
      var prop = Object.getOwnPropertyDescriptor(this, "regexpString");
      if (prop)
      {
        return prop.value;
      }
      var regexp = Filter.toRegExp(this.regexpSource);
      Object.defineProperty(this, "regexpString",
      {
        value: regexp
      });
      return regexp;
    }
  };
  return exports;
})();
require.scopes["subscriptionClasses"] = (function()
{
  var exports = {};
  var _tempVar7 = require("filterClasses");
  var ActiveFilter = _tempVar7.ActiveFilter;
  var BlockingFilter = _tempVar7.BlockingFilter;
  var WhitelistFilter = _tempVar7.WhitelistFilter;
  var ElemHideBase = _tempVar7.ElemHideBase;
  var FilterNotifier = require("filterNotifier").FilterNotifier;

  function Subscription(url, title)
  {
    this.url = url;
    this.filters = [];
    if (title)
    {
      this._title = title;
    }
    Subscription.knownSubscriptions[url] = this;
  }
  exports.Subscription = Subscription;
  Subscription.prototype = {
    url: null,
    filters: null,
    _title: null,
    _fixedTitle: false,
    _disabled: false,
    get title()
    {
      return this._title;
    },
    set title(value)
    {
      if (value != this._title)
      {
        var oldValue = this._title;
        this._title = value;
        FilterNotifier.triggerListeners("subscription.title", this, value, oldValue);
      }
      return this._title;
    },
    get fixedTitle()
    {
      return this._fixedTitle;
    },
    set fixedTitle(value)
    {
      if (value != this._fixedTitle)
      {
        var oldValue = this._fixedTitle;
        this._fixedTitle = value;
        FilterNotifier.triggerListeners("subscription.fixedTitle", this, value, oldValue);
      }
      return this._fixedTitle;
    },
    get disabled()
    {
      return this._disabled;
    },
    set disabled(value)
    {
      if (value != this._disabled)
      {
        var oldValue = this._disabled;
        this._disabled = value;
        FilterNotifier.triggerListeners("subscription.disabled", this, value, oldValue);
      }
      return this._disabled;
    },
    serialize: function(buffer)
    {
      buffer.push("[Subscription]");
      buffer.push("url=" + this.url);
      if (this._title)
      {
        buffer.push("title=" + this._title);
      }
      if (this._fixedTitle)
      {
        buffer.push("fixedTitle=true");
      }
      if (this._disabled)
      {
        buffer.push("disabled=true");
      }
    },
    serializeFilters: function(buffer)
    {
      for (var _loopIndex8 = 0; _loopIndex8 < this.filters.length; ++_loopIndex8)
      {
        var filter = this.filters[_loopIndex8];
        buffer.push(filter.text.replace(/\[/g, "\\["));
      }
    },
    toString: function()
    {
      var buffer = [];
      this.serialize(buffer);
      return buffer.join("\n");
    }
  };
  Subscription.knownSubscriptions = Object.create(null);
  Subscription.fromURL = function(url)
  {
    if (url in Subscription.knownSubscriptions)
    {
      return Subscription.knownSubscriptions[url];
    }
    if (url[0] != "~")
    {
      return new DownloadableSubscription(url, null);
    }
    else
    {
      return new SpecialSubscription(url);
    }
  };
  Subscription.fromObject = function(obj)
  {
    var result;
    if (obj.url[0] != "~")
    {
      result = new DownloadableSubscription(obj.url, obj.title);
      if ("downloadStatus" in obj)
      {
        result._downloadStatus = obj.downloadStatus;
      }
      if ("lastSuccess" in obj)
      {
        result.lastSuccess = parseInt(obj.lastSuccess, 10) || 0;
      }
      if ("lastCheck" in obj)
      {
        result._lastCheck = parseInt(obj.lastCheck, 10) || 0;
      }
      if ("expires" in obj)
      {
        result.expires = parseInt(obj.expires, 10) || 0;
      }
      if ("softExpiration" in obj)
      {
        result.softExpiration = parseInt(obj.softExpiration, 10) || 0;
      }
      if ("errors" in obj)
      {
        result._errors = parseInt(obj.errors, 10) || 0;
      }
      if ("version" in obj)
      {
        result.version = parseInt(obj.version, 10) || 0;
      }
      if ("requiredVersion" in obj)
      {
        result.requiredVersion = obj.requiredVersion;
      }
      if ("homepage" in obj)
      {
        result._homepage = obj.homepage;
      }
      if ("lastDownload" in obj)
      {
        result._lastDownload = parseInt(obj.lastDownload, 10) || 0;
      }
      if ("downloadCount" in obj)
      {
        result.downloadCount = parseInt(obj.downloadCount, 10) || 0;
      }
    }
    else
    {
      result = new SpecialSubscription(obj.url, obj.title);
      if ("defaults" in obj)
      {
        result.defaults = obj.defaults.split(" ");
      }
    }
    if ("fixedTitle" in obj)
    {
      result._fixedTitle = obj.fixedTitle == "true";
    }
    if ("disabled" in obj)
    {
      result._disabled = obj.disabled == "true";
    }
    return result;
  };

  function SpecialSubscription(url, title)
  {
    Subscription.call(this, url, title);
  }
  exports.SpecialSubscription = SpecialSubscription;
  SpecialSubscription.prototype = {
    __proto__: Subscription.prototype,
    defaults: null,
    isDefaultFor: function(filter)
    {
      if (this.defaults && this.defaults.length)
      {
        for (var _loopIndex9 = 0; _loopIndex9 < this.defaults.length; ++_loopIndex9)
        {
          var type = this.defaults[_loopIndex9];
          if (filter instanceof SpecialSubscription.defaultsMap[type])
          {
            return true;
          }
          if (!(filter instanceof ActiveFilter) && type == "blacklist")
          {
            return true;
          }
        }
      }
      return false;
    },
    serialize: function(buffer)
    {
      Subscription.prototype.serialize.call(this, buffer);
      if (this.defaults && this.defaults.length)
      {
        buffer.push("defaults=" + this.defaults.filter(function(type)
        {
          return type in SpecialSubscription.defaultsMap;
        }).join(" "));
      }
      if (this._lastDownload)
      {
        buffer.push("lastDownload=" + this._lastDownload);
      }
    }
  };
  SpecialSubscription.defaultsMap = {
    __proto__: null,
    "whitelist": WhitelistFilter,
    "blocking": BlockingFilter,
    "elemhide": ElemHideBase
  };
  SpecialSubscription.create = function(title)
  {
    var url;
    do {
      url = "~user~" + Math.round(Math.random() * 1000000);
    }
    while (url in Subscription.knownSubscriptions);
    return new SpecialSubscription(url, title);
  };
  SpecialSubscription.createForFilter = function(filter)
  {
    var subscription = SpecialSubscription.create();
    subscription.filters.push(filter);
    for (var type in SpecialSubscription.defaultsMap)
    {
      if (filter instanceof SpecialSubscription.defaultsMap[type])
      {
        subscription.defaults = [type];
      }
    }
    if (!subscription.defaults)
    {
      subscription.defaults = ["blocking"];
    }
    return subscription;
  };

  function RegularSubscription(url, title)
  {
    Subscription.call(this, url, title || url);
  }
  exports.RegularSubscription = RegularSubscription;
  RegularSubscription.prototype = {
    __proto__: Subscription.prototype,
    _homepage: null,
    _lastDownload: 0,
    get homepage()
    {
      return this._homepage;
    },
    set homepage(value)
    {
      if (value != this._homepage)
      {
        var oldValue = this._homepage;
        this._homepage = value;
        FilterNotifier.triggerListeners("subscription.homepage", this, value, oldValue);
      }
      return this._homepage;
    },
    get lastDownload()
    {
      return this._lastDownload;
    },
    set lastDownload(value)
    {
      if (value != this._lastDownload)
      {
        var oldValue = this._lastDownload;
        this._lastDownload = value;
        FilterNotifier.triggerListeners("subscription.lastDownload", this, value, oldValue);
      }
      return this._lastDownload;
    },
    serialize: function(buffer)
    {
      Subscription.prototype.serialize.call(this, buffer);
      if (this._homepage)
      {
        buffer.push("homepage=" + this._homepage);
      }
      if (this._lastDownload)
      {
        buffer.push("lastDownload=" + this._lastDownload);
      }
    }
  };

  function ExternalSubscription(url, title)
  {
    RegularSubscription.call(this, url, title);
  }
  exports.ExternalSubscription = ExternalSubscription;
  ExternalSubscription.prototype = {
    __proto__: RegularSubscription.prototype,
    serialize: function(buffer)
    {
      throw new Error("Unexpected call, external subscriptions should not be serialized");
    }
  };

  function DownloadableSubscription(url, title)
  {
    RegularSubscription.call(this, url, title);
  }
  exports.DownloadableSubscription = DownloadableSubscription;
  DownloadableSubscription.prototype = {
    __proto__: RegularSubscription.prototype,
    _downloadStatus: null,
    _lastCheck: 0,
    _errors: 0,
    get downloadStatus()
    {
      return this._downloadStatus;
    },
    set downloadStatus(value)
    {
      var oldValue = this._downloadStatus;
      this._downloadStatus = value;
      FilterNotifier.triggerListeners("subscription.downloadStatus", this, value, oldValue);
      return this._downloadStatus;
    },
    lastSuccess: 0,
    get lastCheck()
    {
      return this._lastCheck;
    },
    set lastCheck(value)
    {
      if (value != this._lastCheck)
      {
        var oldValue = this._lastCheck;
        this._lastCheck = value;
        FilterNotifier.triggerListeners("subscription.lastCheck", this, value, oldValue);
      }
      return this._lastCheck;
    },
    expires: 0,
    softExpiration: 0,
    get errors()
    {
      return this._errors;
    },
    set errors(value)
    {
      if (value != this._errors)
      {
        var oldValue = this._errors;
        this._errors = value;
        FilterNotifier.triggerListeners("subscription.errors", this, value, oldValue);
      }
      return this._errors;
    },
    version: 0,
    requiredVersion: null,
    downloadCount: 0,
    serialize: function(buffer)
    {
      RegularSubscription.prototype.serialize.call(this, buffer);
      if (this.downloadStatus)
      {
        buffer.push("downloadStatus=" + this.downloadStatus);
      }
      if (this.lastSuccess)
      {
        buffer.push("lastSuccess=" + this.lastSuccess);
      }
      if (this.lastCheck)
      {
        buffer.push("lastCheck=" + this.lastCheck);
      }
      if (this.expires)
      {
        buffer.push("expires=" + this.expires);
      }
      if (this.softExpiration)
      {
        buffer.push("softExpiration=" + this.softExpiration);
      }
      if (this.errors)
      {
        buffer.push("errors=" + this.errors);
      }
      if (this.version)
      {
        buffer.push("version=" + this.version);
      }
      if (this.requiredVersion)
      {
        buffer.push("requiredVersion=" + this.requiredVersion);
      }
      if (this.downloadCount)
      {
        buffer.push("downloadCount=" + this.downloadCount);
      }
    }
  };
  return exports;
})();
require.scopes["filterStorage"] = (function()
{
  var exports = {};
  var IO = require("io").IO;
  var Prefs = require("prefs").Prefs;
  var _tempVar10 = require("filterClasses");
  var Filter = _tempVar10.Filter;
  var ActiveFilter = _tempVar10.ActiveFilter;
  var _tempVar11 = require("subscriptionClasses");
  var Subscription = _tempVar11.Subscription;
  var SpecialSubscription = _tempVar11.SpecialSubscription;
  var ExternalSubscription = _tempVar11.ExternalSubscription;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Utils = require("utils").Utils;
  var formatVersion = 4;
  var FilterStorage = exports.FilterStorage = {
    get formatVersion()
    {
      return formatVersion;
    },
    get sourceFile()
    {
      var file = null;
      if (Prefs.patternsfile)
      {
        file = IO.resolveFilePath(Prefs.patternsfile);
      }
      if (!file)
      {
        file = IO.resolveFilePath(Prefs.data_directory);
        if (file)
        {
          file.append("patterns.ini");
        }
      }
      if (!file)
      {
        try
        {
          file = IO.resolveFilePath(Services.prefs.getDefaultBranch("extensions.stopallads.").getCharPref("data_directory"));
          if (file)
          {
            file.append("patterns.ini");
          }
        }
        catch (e)
        {}
      }
      if (!file)
      {
        Cu.reportError("StopAll Ads: Failed to resolve filter file location from extensions.stopallads.patternsfile preference");
      }
      Object.defineProperty(this, "sourceFile",
      {
        value: file,
        configurable: true
      });
      return file;
    },
    firstRun: false,
    fileProperties: Object.create(null),
    subscriptions: [],
    knownSubscriptions: Object.create(null),
    getGroupForFilter: function(filter)
    {
      var generalSubscription = null;
      for (var _loopIndex12 = 0; _loopIndex12 < FilterStorage.subscriptions.length; ++_loopIndex12)
      {
        var subscription = FilterStorage.subscriptions[_loopIndex12];
        if (subscription instanceof SpecialSubscription && !subscription.disabled)
        {
          if (subscription.isDefaultFor(filter))
          {
            return subscription;
          }
          if (!generalSubscription && (!subscription.defaults || !subscription.defaults.length))
          {
            generalSubscription = subscription;
          }
        }
      }
      return generalSubscription;
    },
    addSubscription: function(subscription, silent)
    {
      if (subscription.url in FilterStorage.knownSubscriptions)
      {
        return;
      }
      FilterStorage.subscriptions.push(subscription);
      FilterStorage.knownSubscriptions[subscription.url] = subscription;
      addSubscriptionFilters(subscription);
      if (!silent)
      {
        FilterNotifier.triggerListeners("subscription.added", subscription);
      }
    },
    removeSubscription: function(subscription, silent)
    {
      for (var i = 0; i < FilterStorage.subscriptions.length; i++)
      {
        if (FilterStorage.subscriptions[i].url == subscription.url)
        {
          removeSubscriptionFilters(subscription);
          FilterStorage.subscriptions.splice(i--, 1);
          delete FilterStorage.knownSubscriptions[subscription.url];
          if (!silent)
          {
            FilterNotifier.triggerListeners("subscription.removed", subscription);
          }
          return;
        }
      }
    },
    moveSubscription: function(subscription, insertBefore)
    {
      var currentPos = FilterStorage.subscriptions.indexOf(subscription);
      if (currentPos < 0)
      {
        return;
      }
      var newPos = insertBefore ? FilterStorage.subscriptions.indexOf(insertBefore) : -1;
      if (newPos < 0)
      {
        newPos = FilterStorage.subscriptions.length;
      }
      if (currentPos < newPos)
      {
        newPos--;
      }
      if (currentPos == newPos)
      {
        return;
      }
      FilterStorage.subscriptions.splice(currentPos, 1);
      FilterStorage.subscriptions.splice(newPos, 0, subscription);
      FilterNotifier.triggerListeners("subscription.moved", subscription);
    },
    updateSubscriptionFilters: function(subscription, filters)
    {
      removeSubscriptionFilters(subscription);
      subscription.oldFilters = subscription.filters;
      subscription.filters = filters;
      addSubscriptionFilters(subscription);
      FilterNotifier.triggerListeners("subscription.updated", subscription);
      delete subscription.oldFilters;
    },
    addFilter: function(filter, subscription, position, silent)
    {
      if (!subscription)
      {
        if (filter.subscriptions.some(function(s)
        {
          return s instanceof SpecialSubscription && !s.disabled;
        }))
        {
          return;
        }
        subscription = FilterStorage.getGroupForFilter(filter);
      }
      if (!subscription)
      {
        subscription = SpecialSubscription.createForFilter(filter);
        this.addSubscription(subscription);
        return;
      }
      if (typeof position == "undefined")
      {
        position = subscription.filters.length;
      }
      if (filter.subscriptions.indexOf(subscription) < 0)
      {
        filter.subscriptions.push(subscription);
      }
      subscription.filters.splice(position, 0, filter);
      if (!silent)
      {
        FilterNotifier.triggerListeners("filter.added", filter, subscription, position);
      }
    },
    removeFilter: function(filter, subscription, position)
    {
      var subscriptions = subscription ? [subscription] : filter.subscriptions.slice();
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        if (subscription instanceof SpecialSubscription)
        {
          var positions = [];
          if (typeof position == "undefined")
          {
            var index = -1;
            do {
              index = subscription.filters.indexOf(filter, index + 1);
              if (index >= 0)
              {
                positions.push(index);
              }
            }
            while (index >= 0);
          }
          else
          {
            positions.push(position);
          }
          for (var j = positions.length - 1; j >= 0; j--)
          {
            var position = positions[j];
            if (subscription.filters[position] == filter)
            {
              subscription.filters.splice(position, 1);
              if (subscription.filters.indexOf(filter) < 0)
              {
                var index = filter.subscriptions.indexOf(subscription);
                if (index >= 0)
                {
                  filter.subscriptions.splice(index, 1);
                }
              }
              FilterNotifier.triggerListeners("filter.removed", filter, subscription, position);
            }
          }
        }
      }
    },
    moveFilter: function(filter, subscription, oldPosition, newPosition)
    {
      if (!(subscription instanceof SpecialSubscription) || subscription.filters[oldPosition] != filter)
      {
        return;
      }
      newPosition = Math.min(Math.max(newPosition, 0), subscription.filters.length - 1);
      if (oldPosition == newPosition)
      {
        return;
      }
      subscription.filters.splice(oldPosition, 1);
      subscription.filters.splice(newPosition, 0, filter);
      FilterNotifier.triggerListeners("filter.moved", filter, subscription, oldPosition, newPosition);
    },
    increaseHitCount: function(filter)
    {
      if (!Prefs.savestats || !(filter instanceof ActiveFilter))
      {
        return;
      }
      filter.hitCount++;
      filter.lastHit = Date.now();
    },
    resetHitCounts: function(filters)
    {
      if (!filters)
      {
        filters = [];
        for (var text in Filter.knownFilters)
        {
          filters.push(Filter.knownFilters[text]);
        }
      }
      for (var _loopIndex13 = 0; _loopIndex13 < filters.length; ++_loopIndex13)
      {
        var filter = filters[_loopIndex13];
        filter.hitCount = 0;
        filter.lastHit = 0;
      }
    },
    _loading: false,
    loadFromDisk: function(sourceFile)
    {
      if (this._loading)
      {
        return;
      }
      this._loading = true;
      var readFile = function(sourceFile, backupIndex)
      {
        var parser = new INIParser();
        IO.readFromFile(sourceFile, parser, function(e)
        {
          if (!e && parser.subscriptions.length == 0)
          {
            e = new Error("No data in the file");
          }
          if (e)
          {
            Cu.reportError(e);
          }
          if (e && !explicitFile)
          {
            sourceFile = this.sourceFile;
            if (sourceFile)
            {
              var _tempVar14 = /^(.*)(\.\w+)$/.exec(sourceFile.leafName) || [null, sourceFile.leafName, ""];
              var part1 = _tempVar14[1];
              var part2 = _tempVar14[2];
              sourceFile = sourceFile.clone();
              sourceFile.leafName = part1 + "-backup" + ++backupIndex + part2;
              IO.statFile(sourceFile, function(e, statData)
              {
                if (!e && statData.exists)
                {
                  readFile(sourceFile, backupIndex);
                }
                else
                {
                  doneReading(parser);
                }
              });
              return;
            }
          }
          doneReading(parser);
        }.bind(this));
      }.bind(this);
      var doneReading = function(parser)
      {
        var specialMap = {
          "~il~": true,
          "~wl~": true,
          "~fl~": true,
          "~eh~": true
        };
        var knownSubscriptions = Object.create(null);
        for (var i = 0; i < parser.subscriptions.length; i++)
        {
          var subscription = parser.subscriptions[i];
          if (subscription instanceof SpecialSubscription && subscription.filters.length == 0 && subscription.url in specialMap)
          {
            parser.subscriptions.splice(i--, 1);
          }
          else
          {
            knownSubscriptions[subscription.url] = subscription;
          }
        }
        this.fileProperties = parser.fileProperties;
        this.subscriptions = parser.subscriptions;
        this.knownSubscriptions = knownSubscriptions;
        Filter.knownFilters = parser.knownFilters;
        Subscription.knownSubscriptions = parser.knownSubscriptions;
        if (parser.userFilters)
        {
          for (var i = 0; i < parser.userFilters.length; i++)
          {
            var filter = Filter.fromText(parser.userFilters[i]);
            this.addFilter(filter, null, undefined, true);
          }
        }
        this._loading = false;
        FilterNotifier.triggerListeners("load");
        if (sourceFile != this.sourceFile)
        {
          this.saveToDisk();
        }
      }.bind(this);
      var explicitFile;
      if (sourceFile)
      {
        explicitFile = true;
        readFile(sourceFile, 0);
      }
      else
      {
        explicitFile = false;
        sourceFile = FilterStorage.sourceFile;
        var callback = function(e, statData)
        {
          if (e || !statData.exists)
          {
            this.firstRun = true;
            this._loading = false;
            FilterNotifier.triggerListeners("load");
          }
          else
          {
            readFile(sourceFile, 0);
          }
        }.bind(this);
        if (sourceFile)
        {
          IO.statFile(sourceFile, callback);
        }
        else
        {
          callback(true);
        }
      }
    },
    _generateFilterData: function(subscriptions)
    {
      var _generatorResult15 = [];
      _generatorResult15.push("# StopAll Ads preferences");
      _generatorResult15.push("version=" + formatVersion);
      var saved = Object.create(null);
      var buf = [];
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        for (var j = 0; j < subscription.filters.length; j++)
        {
          var filter = subscription.filters[j];
          if (!(filter.text in saved))
          {
            filter.serialize(buf);
            saved[filter.text] = filter;
            for (var k = 0; k < buf.length; k++)
            {
              _generatorResult15.push(buf[k]);
            }
            buf.splice(0);
          }
        }
      }
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        _generatorResult15.push("");
        subscription.serialize(buf);
        if (subscription.filters.length)
        {
          buf.push("", "[Subscription filters]");
          subscription.serializeFilters(buf);
        }
        for (var k = 0; k < buf.length; k++)
        {
          _generatorResult15.push(buf[k]);
        }
        buf.splice(0);
      }
      return _generatorResult15;
    },
    _saving: false,
    _needsSave: false,
    saveToDisk: function(targetFile)
    {
      var explicitFile = true;
      if (!targetFile)
      {
        targetFile = FilterStorage.sourceFile;
        explicitFile = false;
      }
      if (!targetFile)
      {
        return;
      }
      if (!explicitFile && this._saving)
      {
        this._needsSave = true;
        return;
      }
      try
      {
        targetFile.parent.create(Ci.nsIFile.DIRECTORY_TYPE, FileUtils.PERMS_DIRECTORY);
      }
      catch (e)
      {}
      var writeFilters = function()
      {
        IO.writeToFile(targetFile, this._generateFilterData(subscriptions), function(e)
        {
          if (!explicitFile)
          {
            this._saving = false;
          }
          if (e)
          {
            Cu.reportError(e);
          }
          if (!explicitFile && this._needsSave)
          {
            this._needsSave = false;
            this.saveToDisk();
          }
          else
          {
            FilterNotifier.triggerListeners("save");
          }
        }.bind(this));
      }.bind(this);
      var checkBackupRequired = function(callbackNotRequired, callbackRequired)
      {
        if (explicitFile || Prefs.patternsbackups <= 0)
        {
          callbackNotRequired();
        }
        else
        {
          IO.statFile(targetFile, function(e, statData)
          {
            if (e || !statData.exists)
            {
              callbackNotRequired();
            }
            else
            {
              var _tempVar16 = /^(.*)(\.\w+)$/.exec(targetFile.leafName) || [null, targetFile.leafName, ""];
              var part1 = _tempVar16[1];
              var part2 = _tempVar16[2];
              var newestBackup = targetFile.clone();
              newestBackup.leafName = part1 + "-backup1" + part2;
              IO.statFile(newestBackup, function(e, statData)
              {
                if (!e && (!statData.exists || (Date.now() - statData.lastModified) / 3600000 >= Prefs.patternsbackupinterval))
                {
                  callbackRequired(part1, part2);
                }
                else
                {
                  callbackNotRequired();
                }
              });
            }
          });
        }
      }.bind(this);
      var removeLastBackup = function(part1, part2)
      {
        var file = targetFile.clone();
        file.leafName = part1 + "-backup" + Prefs.patternsbackups + part2;
        IO.removeFile(file, function(e)
        {
          return renameBackup(part1, part2, Prefs.patternsbackups - 1);
        });
      }.bind(this);
      var renameBackup = function(part1, part2, index)
      {
        if (index > 0)
        {
          var fromFile = targetFile.clone();
          fromFile.leafName = part1 + "-backup" + index + part2;
          var toName = part1 + "-backup" + (index + 1) + part2;
          IO.renameFile(fromFile, toName, function(e)
          {
            return renameBackup(part1, part2, index - 1);
          });
        }
        else
        {
          var toFile = targetFile.clone();
          toFile.leafName = part1 + "-backup" + (index + 1) + part2;
          IO.copyFile(targetFile, toFile, writeFilters);
        }
      }.bind(this);
      var subscriptions = this.subscriptions.filter(function(s)
      {
        return !(s instanceof ExternalSubscription);
      });
      if (!explicitFile)
      {
        this._saving = true;
      }
      checkBackupRequired(writeFilters, removeLastBackup);
    },
    getBackupFiles: function()
    {
      var result = [];
      var _tempVar17 = /^(.*)(\.\w+)$/.exec(FilterStorage.sourceFile.leafName) || [null, FilterStorage.sourceFile.leafName, ""];
      var part1 = _tempVar17[1];
      var part2 = _tempVar17[2];
      for (var i = 1;; i++)
      {
        var file = FilterStorage.sourceFile.clone();
        file.leafName = part1 + "-backup" + i + part2;
        if (file.exists())
        {
          result.push(file);
        }
        else
        {
          break;
        }
      }
      return result;
    }
  };

  function addSubscriptionFilters(subscription)
  {
    if (!(subscription.url in FilterStorage.knownSubscriptions))
    {
      return;
    }
    for (var _loopIndex18 = 0; _loopIndex18 < subscription.filters.length; ++_loopIndex18)
    {
      var filter = subscription.filters[_loopIndex18];
      filter.subscriptions.push(subscription);
    }
  }

  function removeSubscriptionFilters(subscription)
  {
    if (!(subscription.url in FilterStorage.knownSubscriptions))
    {
      return;
    }
    for (var _loopIndex19 = 0; _loopIndex19 < subscription.filters.length; ++_loopIndex19)
    {
      var filter = subscription.filters[_loopIndex19];
      var i = filter.subscriptions.indexOf(subscription);
      if (i >= 0)
      {
        filter.subscriptions.splice(i, 1);
      }
    }
  }

  function INIParser()
  {
    this.fileProperties = this.curObj = {};
    this.subscriptions = [];
    this.knownFilters = Object.create(null);
    this.knownSubscriptions = Object.create(null);
  }
  INIParser.prototype = {
    linesProcessed: 0,
    subscriptions: null,
    knownFilters: null,
    knownSubscriptions: null,
    wantObj: true,
    fileProperties: null,
    curObj: null,
    curSection: null,
    userFilters: null,
    process: function(val)
    {
      var origKnownFilters = Filter.knownFilters;
      Filter.knownFilters = this.knownFilters;
      var origKnownSubscriptions = Subscription.knownSubscriptions;
      Subscription.knownSubscriptions = this.knownSubscriptions;
      var match;
      try
      {
        if (this.wantObj === true && (match = /^(\w+)=(.*)$/.exec(val)))
        {
          this.curObj[match[1]] = match[2];
        }
        else if (val === null || (match = /^\s*\[(.+)\]\s*$/.exec(val)))
        {
          if (this.curObj)
          {
            switch (this.curSection)
            {
            case "filter":
            case "pattern":
              if ("text" in this.curObj)
              {
                Filter.fromObject(this.curObj);
              }
              break;
            case "subscription":
              var subscription = Subscription.fromObject(this.curObj);
              if (subscription)
              {
                this.subscriptions.push(subscription);
              }
              break;
            case "subscription filters":
            case "subscription patterns":
              if (this.subscriptions.length)
              {
                var subscription = this.subscriptions[this.subscriptions.length - 1];
                for (var _loopIndex20 = 0; _loopIndex20 < this.curObj.length; ++_loopIndex20)
                {
                  var text = this.curObj[_loopIndex20];
                  var filter = Filter.fromText(text);
                  subscription.filters.push(filter);
                  filter.subscriptions.push(subscription);
                }
              }
              break;
            case "user patterns":
              this.userFilters = this.curObj;
              break;
            }
          }
          if (val === null)
          {
            return;
          }
          this.curSection = match[1].toLowerCase();
          switch (this.curSection)
          {
          case "filter":
          case "pattern":
          case "subscription":
            this.wantObj = true;
            this.curObj = {};
            break;
          case "subscription filters":
          case "subscription patterns":
          case "user patterns":
            this.wantObj = false;
            this.curObj = [];
            break;
          default:
            this.wantObj = undefined;
            this.curObj = null;
          }
        }
        else if (this.wantObj === false && val)
        {
          this.curObj.push(val.replace(/\\\[/g, "["));
        }
      }
      finally
      {
        Filter.knownFilters = origKnownFilters;
        Subscription.knownSubscriptions = origKnownSubscriptions;
      }
      this.linesProcessed++;
      if (this.linesProcessed % 1000 == 0)
      {
        return Utils.yield();
      }
    }
  };
  return exports;
})();
require.scopes["elemHide"] = (function()
{
  var exports = {};
  var Utils = require("utils").Utils;
  var IO = require("io").IO;
  var Prefs = require("prefs").Prefs;
  var ElemHideException = require("filterClasses").ElemHideException;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var filterByKey = Object.create(null);
  var keyByFilter = Object.create(null);
  var knownExceptions = Object.create(null);
  var exceptions = Object.create(null);
  var styleURL = null;
  var ElemHide = exports.ElemHide = {
    isDirty: false,
    applied: false,
    init: function()
    {
      Prefs.addListener(function(name)
      {
        if (name == "enabled")
        {
          ElemHide.apply();
        }
      });
      onShutdown.add(function()
      {
        return ElemHide.unapply();
      });
      var styleFile = IO.resolveFilePath(Prefs.data_directory);
      styleFile.append("elemhide.css");
      styleURL = Services.io.newFileURI(styleFile).QueryInterface(Ci.nsIFileURL);
    },
    clear: function()
    {
      filterByKey = Object.create(null);
      keyByFilter = Object.create(null);
      knownExceptions = Object.create(null);
      exceptions = Object.create(null);
      ElemHide.isDirty = false;
      ElemHide.unapply();
    },
    add: function(filter)
    {
      if (filter instanceof ElemHideException)
      {
        if (filter.text in knownExceptions)
        {
          return;
        }
        var selector = filter.selector;
        if (!(selector in exceptions))
        {
          exceptions[selector] = [];
        }
        exceptions[selector].push(filter);
        knownExceptions[filter.text] = true;
      }
      else
      {
        if (filter.text in keyByFilter)
        {
          return;
        }
        var key;
        do {
          key = Math.random().toFixed(15).substr(5);
        }
        while (key in filterByKey);
        filterByKey[key] = filter;
        keyByFilter[filter.text] = key;
        ElemHide.isDirty = true;
      }
    },
    remove: function(filter)
    {
      if (filter instanceof ElemHideException)
      {
        if (!(filter.text in knownExceptions))
        {
          return;
        }
        var list = exceptions[filter.selector];
        var index = list.indexOf(filter);
        if (index >= 0)
        {
          list.splice(index, 1);
        }
        delete knownExceptions[filter.text];
      }
      else
      {
        if (!(filter.text in keyByFilter))
        {
          return;
        }
        var key = keyByFilter[filter.text];
        delete filterByKey[key];
        delete keyByFilter[filter.text];
        ElemHide.isDirty = true;
      }
    },
    getException: function(filter, docDomain)
    {
      if (!(filter.selector in exceptions))
      {
        return null;
      }
      var list = exceptions[filter.selector];
      for (var i = list.length - 1; i >= 0; i--)
      {
        if (list[i].isActiveOnDomain(docDomain))
        {
          return list[i];
        }
      }
      return null;
    },
    _applying: false,
    _needsApply: false,
    apply: function()
    {
      if (this._applying)
      {
        this._needsApply = true;
        return;
      }
      if (!ElemHide.isDirty || !Prefs.enabled)
      {
        if (Prefs.enabled && !ElemHide.applied)
        {
          try
          {
            Utils.styleService.loadAndRegisterSheet(styleURL, Ci.nsIStyleSheetService.USER_SHEET);
            ElemHide.applied = true;
          }
          catch (e)
          {
            Cu.reportError(e);
          }
        }
        else if (!Prefs.enabled && ElemHide.applied)
        {
          ElemHide.unapply();
        }
        return;
      }
      IO.writeToFile(styleURL.file, this._generateCSSContent(), function(e)
      {
        this._applying = false;
        var noFilters = e == Cr.NS_ERROR_NOT_AVAILABLE || e && e.result == Cr.NS_ERROR_NOT_AVAILABLE;
        if (noFilters)
        {
          e = null;
          IO.removeFile(styleURL.file, function(e)
          {});
        }
        else if (e)
        {
          Cu.reportError(e);
        }
        if (this._needsApply)
        {
          this._needsApply = false;
          this.apply();
        }
        else if (!e)
        {
          ElemHide.isDirty = false;
          ElemHide.unapply();
          if (!noFilters)
          {
            try
            {
              Utils.styleService.loadAndRegisterSheet(styleURL, Ci.nsIStyleSheetService.USER_SHEET);
              ElemHide.applied = true;
            }
            catch (e)
            {
              Cu.reportError(e);
            }
          }
          FilterNotifier.triggerListeners("elemhideupdate");
        }
      }.bind(this));
      this._applying = true;
    },
    _generateCSSContent: function()
    {
      var _generatorResult15 = [];
      var domains = Object.create(null);
      var hasFilters = false;
      for (var key in filterByKey)
      {
        var filter = filterByKey[key];
        var domain = filter.selectorDomain || "";
        var list;
        if (domain in domains)
        {
          list = domains[domain];
        }
        else
        {
          list = Object.create(null);
          domains[domain] = list;
        }
        list[filter.selector] = key;
        hasFilters = true;
      }
      if (!hasFilters)
      {
        throw Cr.NS_ERROR_NOT_AVAILABLE;
      }

      function escapeChar(match)
      {
        return "\\" + match.charCodeAt(0).toString(16) + " ";
      }
      var cssTemplate = "-moz-binding: url(about:saa-elemhidehit?%ID%#dummy) !important;";
      for (var domain in domains)
      {
        var rules = [];
        var list = domains[domain];
        if (domain)
        {
          _generatorResult15.push(("@-moz-document domain(\"" + domain.split(",").join("\"),domain(\"") + "\"){").replace(/[^\x01-\x7F]/g, escapeChar));
        }
        else
        {
          _generatorResult15.push("@-moz-document url-prefix(\"http://\"),url-prefix(\"https://\")," + "url-prefix(\"mailbox://\"),url-prefix(\"imap://\")," + "url-prefix(\"news://\"),url-prefix(\"snews://\"){");
        }
        for (var selector in list)
        {
          _generatorResult15.push(selector.replace(/[^\x01-\x7F]/g, escapeChar) + "{" + cssTemplate.replace("%ID%", list[selector]) + "}");
        }
        _generatorResult15.push("}");
      }
      return _generatorResult15;
    },
    unapply: function()
    {
      if (ElemHide.applied)
      {
        try
        {
          Utils.styleService.unregisterSheet(styleURL, Ci.nsIStyleSheetService.USER_SHEET);
        }
        catch (e)
        {
          Cu.reportError(e);
        }
        ElemHide.applied = false;
      }
    },
    get styleURL()
    {
      return ElemHide.applied ? styleURL.spec : null;
    },
    getFilterByKey: function(key)
    {
      return key in filterByKey ? filterByKey[key] : null;
    },
    getSelectorsForDomain: function(domain, specificOnly)
    {
      var result = [];
      var keys = Object.getOwnPropertyNames(filterByKey);
      for (var _loopIndex21 = 0; _loopIndex21 < keys.length; ++_loopIndex21)
      {
        var key = keys[_loopIndex21];
        var filter = filterByKey[key];
        if (specificOnly && (!filter.domains || filter.domains[""]))
        {
          continue;
        }
        if (filter.isActiveOnDomain(domain) && !this.getException(filter, domain))
        {
          result.push(filter.selector);
        }
      }
      return result;
    }
  };
  return exports;
})();
require.scopes["matcher"] = (function()
{
  var exports = {};
  var _tempVar22 = require("filterClasses");
  var Filter = _tempVar22.Filter;
  var RegExpFilter = _tempVar22.RegExpFilter;
  var WhitelistFilter = _tempVar22.WhitelistFilter;

  function Matcher()
  {
    this.clear();
  }
  exports.Matcher = Matcher;
  Matcher.prototype = {
    filterByKeyword: null,
    keywordByFilter: null,
    clear: function()
    {
      this.filterByKeyword = Object.create(null);
      this.keywordByFilter = Object.create(null);
    },
    add: function(filter)
    {
      if (filter.text in this.keywordByFilter)
      {
        return;
      }
      var keyword = this.findKeyword(filter);
      var oldEntry = this.filterByKeyword[keyword];
      if (typeof oldEntry == "undefined")
      {
        this.filterByKeyword[keyword] = filter;
      }
      else if (oldEntry.length == 1)
      {
        this.filterByKeyword[keyword] = [oldEntry, filter];
      }
      else
      {
        oldEntry.push(filter);
      }
      this.keywordByFilter[filter.text] = keyword;
    },
    remove: function(filter)
    {
      if (!(filter.text in this.keywordByFilter))
      {
        return;
      }
      var keyword = this.keywordByFilter[filter.text];
      var list = this.filterByKeyword[keyword];
      if (list.length <= 1)
      {
        delete this.filterByKeyword[keyword];
      }
      else
      {
        var index = list.indexOf(filter);
        if (index >= 0)
        {
          list.splice(index, 1);
          if (list.length == 1)
          {
            this.filterByKeyword[keyword] = list[0];
          }
        }
      }
      delete this.keywordByFilter[filter.text];
    },
    findKeyword: function(filter)
    {
      var result = "";
      var text = filter.text;
      if (Filter.regexpRegExp.test(text))
      {
        return result;
      }
      var match = Filter.optionsRegExp.exec(text);
      if (match)
      {
        text = match.input.substr(0, match.index);
      }
      if (text.substr(0, 2) == "@@")
      {
        text = text.substr(2);
      }
      var candidates = text.toLowerCase().match(/[^a-z0-9%*][a-z0-9%]{3,}(?=[^a-z0-9%*])/g);
      if (!candidates)
      {
        return result;
      }
      var hash = this.filterByKeyword;
      var resultCount = 16777215;
      var resultLength = 0;
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var candidate = candidates[i].substr(1);
        var count = candidate in hash ? hash[candidate].length : 0;
        if (count < resultCount || count == resultCount && candidate.length > resultLength)
        {
          result = candidate;
          resultCount = count;
          resultLength = candidate.length;
        }
      }
      return result;
    },
    hasFilter: function(filter)
    {
      return filter.text in this.keywordByFilter;
    },
    getKeywordForFilter: function(filter)
    {
      if (filter.text in this.keywordByFilter)
      {
        return this.keywordByFilter[filter.text];
      }
      else
      {
        return null;
      }
    },
    _checkEntryMatch: function(keyword, location, typeMask, docDomain, thirdParty, sitekey, specificOnly)
    {
      var list = this.filterByKeyword[keyword];
      for (var i = 0; i < list.length; i++)
      {
        var filter = list[i];
        if (specificOnly && filter.isGeneric() && !(filter instanceof WhitelistFilter))
        {
          continue;
        }
        if (filter.matches(location, typeMask, docDomain, thirdParty, sitekey))
        {
          return filter;
        }
      }
      return null;
    },
    matchesAny: function(location, typeMask, docDomain, thirdParty, sitekey, specificOnly)
    {
      var candidates = location.toLowerCase().match(/[a-z0-9%]{3,}/g);
      if (candidates === null)
      {
        candidates = [];
      }
      candidates.push("");
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var substr = candidates[i];
        if (substr in this.filterByKeyword)
        {
          var result = this._checkEntryMatch(substr, location, typeMask, docDomain, thirdParty, sitekey, specificOnly);
          if (result)
          {
            return result;
          }
        }
      }
      return null;
    }
  };

  function CombinedMatcher()
  {
    this.blacklist = new Matcher();
    this.whitelist = new Matcher();
    this.resultCache = Object.create(null);
  }
  exports.CombinedMatcher = CombinedMatcher;
  CombinedMatcher.maxCacheEntries = 1000;
  CombinedMatcher.prototype = {
    blacklist: null,
    whitelist: null,
    resultCache: null,
    cacheEntries: 0,
    clear: function()
    {
      this.blacklist.clear();
      this.whitelist.clear();
      this.resultCache = Object.create(null);
      this.cacheEntries = 0;
    },
    add: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        this.whitelist.add(filter);
      }
      else
      {
        this.blacklist.add(filter);
      }
      if (this.cacheEntries > 0)
      {
        this.resultCache = Object.create(null);
        this.cacheEntries = 0;
      }
    },
    remove: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        this.whitelist.remove(filter);
      }
      else
      {
        this.blacklist.remove(filter);
      }
      if (this.cacheEntries > 0)
      {
        this.resultCache = Object.create(null);
        this.cacheEntries = 0;
      }
    },
    findKeyword: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.findKeyword(filter);
      }
      else
      {
        return this.blacklist.findKeyword(filter);
      }
    },
    hasFilter: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.hasFilter(filter);
      }
      else
      {
        return this.blacklist.hasFilter(filter);
      }
    },
    getKeywordForFilter: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.getKeywordForFilter(filter);
      }
      else
      {
        return this.blacklist.getKeywordForFilter(filter);
      }
    },
    isSlowFilter: function(filter)
    {
      var matcher = filter instanceof WhitelistFilter ? this.whitelist : this.blacklist;
      if (matcher.hasFilter(filter))
      {
        return !matcher.getKeywordForFilter(filter);
      }
      else
      {
        return !matcher.findKeyword(filter);
      }
    },
    matchesAnyInternal: function(location, typeMask, docDomain, thirdParty, sitekey, specificOnly)
    {
      var candidates = location.toLowerCase().match(/[a-z0-9%]{3,}/g);
      if (candidates === null)
      {
        candidates = [];
      }
      candidates.push("");
      var blacklistHit = null;
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var substr = candidates[i];
        if (substr in this.whitelist.filterByKeyword)
        {
          var result = this.whitelist._checkEntryMatch(substr, location, typeMask, docDomain, thirdParty, sitekey);
          if (result)
          {
            return result;
          }
        }
        if (substr in this.blacklist.filterByKeyword && blacklistHit === null)
        {
          blacklistHit = this.blacklist._checkEntryMatch(substr, location, typeMask, docDomain, thirdParty, sitekey, specificOnly);
        }
      }
      return blacklistHit;
    },
    matchesAny: function(location, typeMask, docDomain, thirdParty, sitekey, specificOnly)
    {
      var key = location + " " + typeMask + " " + docDomain + " " + thirdParty + " " + sitekey + " " + specificOnly;
      if (key in this.resultCache)
      {
        return this.resultCache[key];
      }
      var result = this.matchesAnyInternal(location, typeMask, docDomain, thirdParty, sitekey, specificOnly);
      if (this.cacheEntries >= CombinedMatcher.maxCacheEntries)
      {
        this.resultCache = Object.create(null);
        this.cacheEntries = 0;
      }
      this.resultCache[key] = result;
      this.cacheEntries++;
      return result;
    }
  };
  var defaultMatcher = exports.defaultMatcher = new CombinedMatcher();
  return exports;
})();
require.scopes["cssRules"] = (function()
{
  var exports = {};
  var ElemHide = require("elemHide").ElemHide;
  var Filter = require("filterClasses").Filter;
  var filters = Object.create(null);
  var CSSRules = exports.CSSRules = {
    clear: function()
    {
      filters = Object.create(null);
    },
    add: function(filter)
    {
      filters[filter.text] = true;
    },
    remove: function(filter)
    {
      delete filters[filter.text];
    },
    getRulesForDomain: function(domain)
    {
      var result = [];
      var keys = Object.getOwnPropertyNames(filters);
      for (var _loopIndex23 = 0; _loopIndex23 < keys.length; ++_loopIndex23)
      {
        var key = keys[_loopIndex23];
        var filter = Filter.fromText(key);
        if (filter.isActiveOnDomain(domain) && !ElemHide.getException(filter, domain))
        {
          result.push(filter);
        }
      }
      return result;
    }
  };
  return exports;
})();
require.scopes["filterListener"] = (function()
{
  "use strict";
  var exports = {};
  var FilterStorage = require("filterStorage").FilterStorage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var ElemHide = require("elemHide").ElemHide;
  var CSSRules = require("cssRules").CSSRules;
  var defaultMatcher = require("matcher").defaultMatcher;
  var _tempVar24 = require("filterClasses");
  var ActiveFilter = _tempVar24.ActiveFilter;
  var RegExpFilter = _tempVar24.RegExpFilter;
  var ElemHideBase = _tempVar24.ElemHideBase;
  var CSSPropertyFilter = _tempVar24.CSSPropertyFilter;
  var Prefs = require("prefs").Prefs;
  var batchMode = false;
  var isDirty = 0;
  var FilterListener = {
    get batchMode()
    {
      return batchMode;
    },
    set batchMode(value)
    {
      batchMode = value;
      flushElemHide();
    },
    setDirty: function(factor)
    {
      if (factor == 0 && isDirty > 0)
      {
        isDirty = 1;
      }
      else
      {
        isDirty += factor;
      }
      if (isDirty >= 1)
      {
        isDirty = 0;
        FilterStorage.saveToDisk();
      }
    }
  };
  var HistoryPurgeObserver = {
    observe: function(subject, topic, data)
    {
      if (topic == "browser:purge-session-history" && Prefs.clearStatsOnHistoryPurge)
      {
        FilterStorage.resetHitCounts();
        FilterListener.setDirty(0);
        Prefs.recentReports = [];
      }
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIObserver])
  };

  function init()
  {
    FilterNotifier.on("filter.hitCount", onFilterHitCount);
    FilterNotifier.on("filter.lastHit", onFilterLastHit);
    FilterNotifier.on("filter.added", onFilterAdded);
    FilterNotifier.on("filter.removed", onFilterRemoved);
    FilterNotifier.on("filter.disabled", onFilterDisabled);
    FilterNotifier.on("filter.moved", onGenericChange);
    FilterNotifier.on("subscription.added", onSubscriptionAdded);
    FilterNotifier.on("subscription.removed", onSubscriptionRemoved);
    FilterNotifier.on("subscription.disabled", onSubscriptionDisabled);
    FilterNotifier.on("subscription.updated", onSubscriptionUpdated);
    FilterNotifier.on("subscription.moved", onGenericChange);
    FilterNotifier.on("subscription.title", onGenericChange);
    FilterNotifier.on("subscription.fixedTitle", onGenericChange);
    FilterNotifier.on("subscription.homepage", onGenericChange);
    FilterNotifier.on("subscription.downloadStatus", onGenericChange);
    FilterNotifier.on("subscription.lastCheck", onGenericChange);
    FilterNotifier.on("subscription.errors", onGenericChange);
    FilterNotifier.on("load", onLoad);
    FilterNotifier.on("save", onSave);
    if ("nsIStyleSheetService" in Ci)
    {
      ElemHide.init();
    }
    else
    {
      flushElemHide = function()
      {};
    }
    FilterStorage.loadFromDisk();
    Services.obs.addObserver(HistoryPurgeObserver, "browser:purge-session-history", true);
    onShutdown.add(function()
    {
      Services.obs.removeObserver(HistoryPurgeObserver, "browser:purge-session-history");
    });
  }
  init();

  function flushElemHide()
  {
    if (!batchMode && ElemHide.isDirty)
    {
      ElemHide.apply();
    }
  }

  function addFilter(filter)
  {
    if (!(filter instanceof ActiveFilter) || filter.disabled)
    {
      return;
    }
    var hasEnabled = false;
    for (var i = 0; i < filter.subscriptions.length; i++)
    {
      if (!filter.subscriptions[i].disabled)
      {
        hasEnabled = true;
      }
    }
    if (!hasEnabled)
    {
      return;
    }
    if (filter instanceof RegExpFilter)
    {
      defaultMatcher.add(filter);
    }
    else if (filter instanceof ElemHideBase)
    {
      if (filter instanceof CSSPropertyFilter)
      {
        CSSRules.add(filter);
      }
      else
      {
        ElemHide.add(filter);
      }
    }
  }

  function removeFilter(filter)
  {
    if (!(filter instanceof ActiveFilter))
    {
      return;
    }
    if (!filter.disabled)
    {
      var hasEnabled = false;
      for (var i = 0; i < filter.subscriptions.length; i++)
      {
        if (!filter.subscriptions[i].disabled)
        {
          hasEnabled = true;
        }
      }
      if (hasEnabled)
      {
        return;
      }
    }
    if (filter instanceof RegExpFilter)
    {
      defaultMatcher.remove(filter);
    }
    else if (filter instanceof ElemHideBase)
    {
      if (filter instanceof CSSPropertyFilter)
      {
        CSSRules.remove(filter);
      }
      else
      {
        ElemHide.remove(filter);
      }
    }
  }

  function onSubscriptionAdded(subscription)
  {
    FilterListener.setDirty(1);
    if (!subscription.disabled)
    {
      subscription.filters.forEach(addFilter);
      flushElemHide();
    }
  }

  function onSubscriptionRemoved(subscription)
  {
    FilterListener.setDirty(1);
    if (!subscription.disabled)
    {
      subscription.filters.forEach(removeFilter);
      flushElemHide();
    }
  }

  function onSubscriptionDisabled(subscription, newValue)
  {
    FilterListener.setDirty(1);
    if (subscription.url in FilterStorage.knownSubscriptions)
    {
      if (newValue == false)
      {
        subscription.filters.forEach(addFilter);
      }
      else
      {
        subscription.filters.forEach(removeFilter);
      }
      flushElemHide();
    }
  }

  function onSubscriptionUpdated(subscription)
  {
    FilterListener.setDirty(1);
    if (subscription.url in FilterStorage.knownSubscriptions && !subscription.disabled)
    {
      subscription.oldFilters.forEach(removeFilter);
      subscription.filters.forEach(addFilter);
      flushElemHide();
    }
  }

  function onFilterHitCount(filter, newValue)
  {
    if (newValue == 0)
    {
      FilterListener.setDirty(0);
    }
    else
    {
      FilterListener.setDirty(0.002);
    }
  }

  function onFilterLastHit()
  {
    FilterListener.setDirty(0.002);
  }

  function onFilterAdded(filter)
  {
    FilterListener.setDirty(1);
    if (!filter.disabled)
    {
      addFilter(filter);
      flushElemHide();
    }
  }

  function onFilterRemoved(filter)
  {
    FilterListener.setDirty(1);
    if (!filter.disabled)
    {
      removeFilter(filter);
      flushElemHide();
    }
  }

  function onFilterDisabled(filter, newValue)
  {
    FilterListener.setDirty(1);
    if (newValue == false)
    {
      addFilter(filter);
    }
    else
    {
      removeFilter(filter);
    }
    flushElemHide();
  }

  function onGenericChange()
  {
    FilterListener.setDirty(1);
  }

  function onLoad()
  {
    isDirty = 0;
    defaultMatcher.clear();
    ElemHide.clear();
    CSSRules.clear();
    for (var _loopIndex25 = 0; _loopIndex25 < FilterStorage.subscriptions.length; ++_loopIndex25)
    {
      var subscription = FilterStorage.subscriptions[_loopIndex25];
      if (!subscription.disabled)
      {
        subscription.filters.forEach(addFilter);
      }
    }
    flushElemHide();
  }

  function onSave()
  {
    isDirty = 0;
  }
  return exports;
})();
require.scopes["synchronizer"] = (function()
{
  var exports = {};
  var _tempVar26 = require("downloader");
  var Downloader = _tempVar26.Downloader;
  var Downloadable = _tempVar26.Downloadable;
  var MILLIS_IN_SECOND = _tempVar26.MILLIS_IN_SECOND;
  var MILLIS_IN_MINUTE = _tempVar26.MILLIS_IN_MINUTE;
  var MILLIS_IN_HOUR = _tempVar26.MILLIS_IN_HOUR;
  var MILLIS_IN_DAY = _tempVar26.MILLIS_IN_DAY;
  var _tempVar27 = require("filterClasses");
  var Filter = _tempVar27.Filter;
  var CommentFilter = _tempVar27.CommentFilter;
  var FilterStorage = require("filterStorage").FilterStorage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Prefs = require("prefs").Prefs;
  var _tempVar28 = require("subscriptionClasses");
  var Subscription = _tempVar28.Subscription;
  var DownloadableSubscription = _tempVar28.DownloadableSubscription;
  var Utils = require("utils").Utils;
  var INITIAL_DELAY = 1 * MILLIS_IN_MINUTE;
  var CHECK_INTERVAL = 1 * MILLIS_IN_HOUR;
  var DEFAULT_EXPIRATION_INTERVAL = 5 * MILLIS_IN_DAY;
  var downloader = null;
  var Synchronizer = exports.Synchronizer = {
    init: function()
    {
      downloader = new Downloader(this._getDownloadables.bind(this), INITIAL_DELAY, CHECK_INTERVAL);
      onShutdown.add(function()
      {
        downloader.cancel();
      });
      downloader.onExpirationChange = this._onExpirationChange.bind(this);
      downloader.onDownloadStarted = this._onDownloadStarted.bind(this);
      downloader.onDownloadSuccess = this._onDownloadSuccess.bind(this);
      downloader.onDownloadError = this._onDownloadError.bind(this);
    },
    isExecuting: function(url)
    {
      return downloader.isDownloading(url);
    },
    execute: function(subscription, manual)
    {
      downloader.download(this._getDownloadable(subscription, manual));
    },
    _getDownloadables: function()
    {
      var _generatorResult15 = [];
      if (!Prefs.subscriptions_autoupdate)
      {
        return;
      }
      for (var _loopIndex29 = 0; _loopIndex29 < FilterStorage.subscriptions.length; ++_loopIndex29)
      {
        var subscription = FilterStorage.subscriptions[_loopIndex29];
        if (subscription instanceof DownloadableSubscription)
        {
          _generatorResult15.push(this._getDownloadable(subscription, false));
        }
      }
      return _generatorResult15;
    },
    _getDownloadable: function(subscription, manual)
    {
      var result = new Downloadable(subscription.url);
      if (subscription.lastDownload != subscription.lastSuccess)
      {
        result.lastError = subscription.lastDownload * MILLIS_IN_SECOND;
      }
      result.lastCheck = subscription.lastCheck * MILLIS_IN_SECOND;
      result.lastVersion = subscription.version;
      result.softExpiration = subscription.softExpiration * MILLIS_IN_SECOND;
      result.hardExpiration = subscription.expires * MILLIS_IN_SECOND;
      result.manual = manual;
      result.downloadCount = subscription.downloadCount;
      return result;
    },
    _onExpirationChange: function(downloadable)
    {
      var subscription = Subscription.fromURL(downloadable.url);
      subscription.lastCheck = Math.round(downloadable.lastCheck / MILLIS_IN_SECOND);
      subscription.softExpiration = Math.round(downloadable.softExpiration / MILLIS_IN_SECOND);
      subscription.expires = Math.round(downloadable.hardExpiration / MILLIS_IN_SECOND);
    },
    _onDownloadStarted: function(downloadable)
    {
      var subscription = Subscription.fromURL(downloadable.url);
      FilterNotifier.triggerListeners("subscription.downloading", subscription);
    },
    _onDownloadSuccess: function(downloadable, responseText, errorCallback, redirectCallback)
    {
      var lines = responseText.split(/[\r\n]+/);
      var minVersion = "1.0";
      var remove = [];
      var params = {
        redirect: null,
        homepage: null,
        title: null,
        version: null,
        expires: null
      };
      for (var i = 0; i < lines.length; i++)
      {
        var match = /^\s*!\s*(\w+)\s*:\s*(.*)/.exec(lines[i]);
        if (match)
        {
          var keyword = match[1].toLowerCase();
          var value = match[2];
          if (keyword in params)
          {
            params[keyword] = value;
            remove.push(i);
          }
          else if (keyword == "checksum")
          {
            lines.splice(i--, 1);
            var checksum = Utils.generateChecksum(lines);
          }
        }
      }
      if (params.redirect)
      {
        return redirectCallback(params.redirect);
      }
      var subscription = Subscription.fromURL(downloadable.redirectURL || downloadable.url);
      if (downloadable.redirectURL && downloadable.redirectURL != downloadable.url)
      {
        var oldSubscription = Subscription.fromURL(downloadable.url);
        subscription.title = oldSubscription.title;
        subscription.disabled = oldSubscription.disabled;
        subscription.lastCheck = oldSubscription.lastCheck;
        var listed = oldSubscription.url in FilterStorage.knownSubscriptions;
        if (listed)
        {
          FilterStorage.removeSubscription(oldSubscription);
        }
        delete Subscription.knownSubscriptions[oldSubscription.url];
        if (listed)
        {
          FilterStorage.addSubscription(subscription);
        }
      }
      subscription.lastSuccess = subscription.lastDownload = Math.round(Date.now() / MILLIS_IN_SECOND);
      subscription.downloadStatus = "synchronize_ok";
      subscription.downloadCount = downloadable.downloadCount;
      subscription.errors = 0;
      for (var i = remove.length - 1; i >= 0; i--)
      {
        lines.splice(remove[i], 1);
      }
      if (params.homepage)
      {
        var url;
        try
        {
          url = new URL(params.homepage);
        }
        catch (e)
        {
          url = null;
        }
        if (url && (url.protocol == "http:" || url.protocol == "https:"))
        {
          subscription.homepage = url.href;
        }
      }
      if (params.title)
      {
        subscription.title = params.title;
        subscription.fixedTitle = true;
      }
      else
      {
        subscription.fixedTitle = false;
      }
      subscription.version = params.version ? parseInt(params.version, 10) : 0;
      var expirationInterval = DEFAULT_EXPIRATION_INTERVAL;
      if (params.expires)
      {
        var match = /^(\d+)\s*(h)?/.exec(params.expires);
        if (match)
        {
          var interval = parseInt(match[1], 10);
          if (match[2])
          {
            expirationInterval = interval * MILLIS_IN_HOUR;
          }
          else
          {
            expirationInterval = interval * MILLIS_IN_DAY;
          }
        }
      }
      var _tempVar30 = downloader.processExpirationInterval(expirationInterval);
      var softExpiration = _tempVar30[0];
      var hardExpiration = _tempVar30[1];
      subscription.softExpiration = Math.round(softExpiration / MILLIS_IN_SECOND);
      subscription.expires = Math.round(hardExpiration / MILLIS_IN_SECOND);
      if (minVersion)
      {
        subscription.requiredVersion = minVersion;
      }
      else
      {
        delete subscription.requiredVersion;
      }
      lines.shift();
      var filters = [];
      for (var _loopIndex31 = 0; _loopIndex31 < lines.length; ++_loopIndex31)
      {
        var line = lines[_loopIndex31];
        line = Filter.normalize(line);
        if (line)
        {
          filters.push(Filter.fromText(line));
        }
      }
      FilterStorage.updateSubscriptionFilters(subscription, filters);
      return undefined;
    },
    _onDownloadError: function(downloadable, downloadURL, error, channelStatus, responseStatus, redirectCallback)
    {
      var subscription = Subscription.fromURL(downloadable.url);
      subscription.lastDownload = Math.round(Date.now() / MILLIS_IN_SECOND);
      subscription.downloadStatus = error;
      if (!downloadable.manual)
      {
        subscription.errors++;
        if (redirectCallback && subscription.errors >= Prefs.subscriptions_fallbackerrors && /^https?:\/\//i.test(subscription.url))
        {
          subscription.errors = 0;
          var fallbackURL = Prefs.subscriptions_fallbackurl;
          var addonVersion = require("info").addonVersion;
          fallbackURL = fallbackURL.replace(/%VERSION%/g, encodeURIComponent(addonVersion));
          fallbackURL = fallbackURL.replace(/%SUBSCRIPTION%/g, encodeURIComponent(subscription.url));
          fallbackURL = fallbackURL.replace(/%URL%/g, encodeURIComponent(downloadURL));
          fallbackURL = fallbackURL.replace(/%ERROR%/g, encodeURIComponent(error));
          fallbackURL = fallbackURL.replace(/%CHANNELSTATUS%/g, encodeURIComponent(channelStatus));
          fallbackURL = fallbackURL.replace(/%RESPONSESTATUS%/g, encodeURIComponent(responseStatus));
          var request = new XMLHttpRequest();
          request.mozBackgroundRequest = true;
          request.open("GET", fallbackURL);
          request.overrideMimeType("text/plain");
          request.channel.loadFlags = request.channel.loadFlags | request.channel.INHIBIT_CACHING | request.channel.VALIDATE_ALWAYS;
          request.addEventListener("load", function(ev)
          {
            if (onShutdown.done)
            {
              return;
            }
            if (!(subscription.url in FilterStorage.knownSubscriptions))
            {
              return;
            }
            var match = /^(\d+)(?:\s+(\S+))?$/.exec(request.responseText);
            if (match && match[1] == "301" && match[2] && /^https?:\/\//i.test(match[2]))
            {
              redirectCallback(match[2]);
            }
            else if (match && match[1] == "410")
            {
              var data = "[Adblock]\n" + subscription.filters.map(function(f)
              {
                return f.text;
              }).join("\n");
              redirectCallback("data:text/plain," + encodeURIComponent(data));
            }
          }, false);
          request.send(null);
        }
      }
    }
  };
  Synchronizer.init();
  return exports;
})();
require.scopes["notification"] = (function()
{
  var exports = {};
  var Prefs = require("prefs").Prefs;
  var _tempVar32 = require("downloader");
  var Downloader = _tempVar32.Downloader;
  var Downloadable = _tempVar32.Downloadable;
  var MILLIS_IN_MINUTE = _tempVar32.MILLIS_IN_MINUTE;
  var MILLIS_IN_HOUR = _tempVar32.MILLIS_IN_HOUR;
  var MILLIS_IN_DAY = _tempVar32.MILLIS_IN_DAY;
  var Utils = require("utils").Utils;
  var _tempVar33 = require("matcher");
  var Matcher = _tempVar33.Matcher;
  var defaultMatcher = _tempVar33.defaultMatcher;
  var _tempVar34 = require("filterClasses");
  var Filter = _tempVar34.Filter;
  var RegExpFilter = _tempVar34.RegExpFilter;
  var WhitelistFilter = _tempVar34.WhitelistFilter;
  var INITIAL_DELAY = 1 * MILLIS_IN_MINUTE;
  var CHECK_INTERVAL = 1 * MILLIS_IN_HOUR;
  var EXPIRATION_INTERVAL = 1 * MILLIS_IN_DAY;
  var TYPE = {
    information: 0,
    question: 1,
    critical: 2
  };
  var showListeners = [];
  var questionListeners = {};

  function getNumericalSeverity(notification)
  {
    return notification.type in TYPE ? TYPE[notification.type] : TYPE.information;
  }

  function saveNotificationData()
  {
    Prefs.notificationdata = JSON.parse(JSON.stringify(Prefs.notificationdata));
  }

  function localize(translations, locale)
  {
    if (locale in translations)
    {
      return translations[locale];
    }
    var languagePart = locale.substring(0, locale.indexOf("-"));
    if (languagePart && languagePart in translations)
    {
      return translations[languagePart];
    }
    var defaultLocale = "en-US";
    return translations[defaultLocale];
  }
  var downloader = null;
  var localData = [];
  var Notification = exports.Notification = {
    init: function()
    {
      downloader = new Downloader(this._getDownloadables.bind(this), INITIAL_DELAY, CHECK_INTERVAL);
      downloader.onExpirationChange = this._onExpirationChange.bind(this);
      downloader.onDownloadSuccess = this._onDownloadSuccess.bind(this);
      downloader.onDownloadError = this._onDownloadError.bind(this);
      onShutdown.add(function()
      {
        return downloader.cancel();
      });
    },
    _getDownloadables: function()
    {
      var _generatorResult15 = [];
      var downloadable = new Downloadable(Prefs.notificationurl);
      if (typeof Prefs.notificationdata.lastError === "number")
      {
        downloadable.lastError = Prefs.notificationdata.lastError;
      }
      if (typeof Prefs.notificationdata.lastCheck === "number")
      {
        downloadable.lastCheck = Prefs.notificationdata.lastCheck;
      }
      if (typeof Prefs.notificationdata.data === "object" && "version" in Prefs.notificationdata.data)
      {
        downloadable.lastVersion = Prefs.notificationdata.data.version;
      }
      if (typeof Prefs.notificationdata.softExpiration === "number")
      {
        downloadable.softExpiration = Prefs.notificationdata.softExpiration;
      }
      if (typeof Prefs.notificationdata.hardExpiration === "number")
      {
        downloadable.hardExpiration = Prefs.notificationdata.hardExpiration;
      }
      if (typeof Prefs.notificationdata.downloadCount === "number")
      {
        downloadable.downloadCount = Prefs.notificationdata.downloadCount;
      }
      _generatorResult15.push(downloadable);
      return _generatorResult15;
    },
    _onExpirationChange: function(downloadable)
    {
      Prefs.notificationdata.lastCheck = downloadable.lastCheck;
      Prefs.notificationdata.softExpiration = downloadable.softExpiration;
      Prefs.notificationdata.hardExpiration = downloadable.hardExpiration;
      saveNotificationData();
    },
    _onDownloadSuccess: function(downloadable, responseText, errorCallback, redirectCallback)
    {
      try
      {
        var data = JSON.parse(responseText);
        for (var _loopIndex35 = 0; _loopIndex35 < data.notifications.length; ++_loopIndex35)
        {
          var notification = data.notifications[_loopIndex35];
          if ("severity" in notification)
          {
            if (!("type" in notification))
            {
              notification.type = notification.severity;
            }
            delete notification.severity;
          }
        }
        Prefs.notificationdata.data = data;
      }
      catch (e)
      {
        Cu.reportError(e);
        errorCallback("synchronize_invalid_data");
        return;
      }
      Prefs.notificationdata.lastError = 0;
      Prefs.notificationdata.downloadStatus = "synchronize_ok";
      var _tempVar36 = downloader.processExpirationInterval(EXPIRATION_INTERVAL);
      Prefs.notificationdata.softExpiration = _tempVar36[0];
      Prefs.notificationdata.hardExpiration = _tempVar36[1];
      Prefs.notificationdata.downloadCount = downloadable.downloadCount;
      saveNotificationData();
      Notification.showNext();
    },
    _onDownloadError: function(downloadable, downloadURL, error, channelStatus, responseStatus, redirectCallback)
    {
      Prefs.notificationdata.lastError = Date.now();
      Prefs.notificationdata.downloadStatus = error;
      saveNotificationData();
    },
    addShowListener: function(listener)
    {
      if (showListeners.indexOf(listener) == -1)
      {
        showListeners.push(listener);
      }
    },
    removeShowListener: function(listener)
    {
      var index = showListeners.indexOf(listener);
      if (index != -1)
      {
        showListeners.splice(index, 1);
      }
    },
    _getNextToShow: function(url)
    {
      function checkTarget(target, parameter, name, version)
      {
        var minVersionKey = parameter + "MinVersion";
        var maxVersionKey = parameter + "MaxVersion";
        return !(parameter in target && target[parameter] != name || minVersionKey in target && Services.vc.compare(version, target[minVersionKey]) < 0 || maxVersionKey in target && Services.vc.compare(version, target[maxVersionKey]) > 0);
      }
      var remoteData = [];
      if (typeof Prefs.notificationdata.data == "object" && Prefs.notificationdata.data.notifications instanceof Array)
      {
        remoteData = Prefs.notificationdata.data.notifications;
      }
      var notifications = localData.concat(remoteData);
      if (notifications.length === 0)
      {
        return null;
      }
      var _tempVar37 = require("info");
      var addonName = _tempVar37.addonName;
      var addonVersion = _tempVar37.addonVersion;
      var application = _tempVar37.application;
      var applicationVersion = _tempVar37.applicationVersion;
      var platform = _tempVar37.platform;
      var platformVersion = _tempVar37.platformVersion;
      var notificationToShow = null;
      for (var _loopIndex38 = 0; _loopIndex38 < notifications.length; ++_loopIndex38)
      {
        var notification = notifications[_loopIndex38];
        if (typeof notification.type === "undefined" || notification.type !== "critical")
        {
          var shown = Prefs.notificationdata.shown;
          if (shown instanceof Array && shown.indexOf(notification.id) != -1)
          {
            continue;
          }
          if (Prefs.notifications_ignoredcategories.indexOf("*") != -1)
          {
            continue;
          }
        }
        if (typeof url === "string" || notification.urlFilters instanceof Array)
        {
          if (Prefs.enabled && typeof url === "string" && notification.urlFilters instanceof Array)
          {
            var host;
            try
            {
              host = (new URL(url)).hostname;
            }
            catch (e)
            {
              host = "";
            }
            var exception = defaultMatcher.matchesAny(url, RegExpFilter.typeMap.DOCUMENT, host, false, null);
            if (exception instanceof WhitelistFilter)
            {
              continue;
            }
            var matcher = new Matcher();
            for (var _loopIndex39 = 0; _loopIndex39 < notification.urlFilters.length; ++_loopIndex39)
            {
              var urlFilter = notification.urlFilters[_loopIndex39];
              matcher.add(Filter.fromText(urlFilter));
            }
            if (!matcher.matchesAny(url, RegExpFilter.typeMap.DOCUMENT, host, false, null))
            {
              continue;
            }
          }
          else
          {
            continue;
          }
        }
        if (notification.targets instanceof Array)
        {
          var match = false;
          for (var _loopIndex40 = 0; _loopIndex40 < notification.targets.length; ++_loopIndex40)
          {
            var target = notification.targets[_loopIndex40];
            if (checkTarget(target, "extension", addonName, addonVersion) && checkTarget(target, "application", application, applicationVersion) && checkTarget(target, "platform", platform, platformVersion))
            {
              match = true;
              break;
            }
          }
          if (!match)
          {
            continue;
          }
        }
        if (!notificationToShow || getNumericalSeverity(notification) > getNumericalSeverity(notificationToShow))
        {
          notificationToShow = notification;
        }
      }
      return notificationToShow;
    },
    showNext: function(url)
    {
      var notification = Notification._getNextToShow(url);
      if (notification)
      {
        for (var _loopIndex41 = 0; _loopIndex41 < showListeners.length; ++_loopIndex41)
        {
          var showListener = showListeners[_loopIndex41];
          showListener(notification);
        }
      }
    },
    markAsShown: function(id)
    {
      var data = Prefs.notificationdata;
      if (!(data.shown instanceof Array))
      {
        data.shown = [];
      }
      if (data.shown.indexOf(id) != -1)
      {
        return;
      }
      data.shown.push(id);
      saveNotificationData();
    },
    getLocalizedTexts: function(notification, locale)
    {
      locale = locale || Utils.appLocale;
      var textKeys = ["title", "message"];
      var localizedTexts = [];
      for (var _loopIndex42 = 0; _loopIndex42 < textKeys.length; ++_loopIndex42)
      {
        var key = textKeys[_loopIndex42];
        if (key in notification)
        {
          if (typeof notification[key] == "string")
          {
            localizedTexts[key] = notification[key];
          }
          else
          {
            localizedTexts[key] = localize(notification[key], locale);
          }
        }
      }
      return localizedTexts;
    },
    addNotification: function(notification)
    {
      if (localData.indexOf(notification) == -1)
      {
        localData.push(notification);
      }
    },
    removeNotification: function(notification)
    {
      var index = localData.indexOf(notification);
      if (index > -1)
      {
        localData.splice(index, 1);
      }
    },
    addQuestionListener: function(id, listener)
    {
      if (!(id in questionListeners))
      {
        questionListeners[id] = [];
      }
      if (questionListeners[id].indexOf(listener) === -1)
      {
        questionListeners[id].push(listener);
      }
    },
    removeQuestionListener: function(id, listener)
    {
      if (!(id in questionListeners))
      {
        return;
      }
      var index = questionListeners[id].indexOf(listener);
      if (index > -1)
      {
        questionListeners[id].splice(index, 1);
      }
      if (questionListeners[id].length === 0)
      {
        delete questionListeners[id];
      }
    },
    triggerQuestionListeners: function(id, approved)
    {
      if (!(id in questionListeners))
      {
        return;
      }
      var listeners = questionListeners[id];
      for (var _loopIndex43 = 0; _loopIndex43 < listeners.length; ++_loopIndex43)
      {
        var listener = listeners[_loopIndex43];
        listener(approved);
      }
    },
    toggleIgnoreCategory: function(category, forceValue)
    {
      var categories = Prefs.notifications_ignoredcategories;
      var index = categories.indexOf(category);
      if (index == -1 && forceValue !== false)
      {
        categories.push(category);
        Prefs.notifications_showui = true;
      }
      else if (index != -1 && forceValue !== true)
      {
        categories.splice(index, 1);
      }
      Prefs.notifications_ignoredcategories = JSON.parse(JSON.stringify(categories));
    }
  };
  Notification.init();
  return exports;
})();
require.scopes["antiadblockInit"] = (function()
{
  var exports = {};
  var Utils = require("utils").Utils;
  var Prefs = require("prefs").Prefs;
  var ActiveFilter = require("filterClasses").ActiveFilter;
  var FilterStorage = require("filterStorage").FilterStorage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Subscription = require("subscriptionClasses").Subscription;
  var Notification = require("notification").Notification;
  exports.initAntiAdblockNotification = function initAntiAdblockNotification()
  {
    var notification = {
      id: "antiadblock",
      type: "question",
      title: Utils.getString("notification_antiadblock_title"),
      message: Utils.getString("notification_antiadblock_message"),
      urlFilters: []
    };

    function notificationListener(approved)
    {
      var subscription = Subscription.fromURL(Prefs.subscriptions_antiadblockurl);
      if (subscription.url in FilterStorage.knownSubscriptions)
      {
        subscription.disabled = !approved;
      }
    }

    function addAntiAdblockNotification(subscription)
    {
      var urlFilters = [];
      for (var _loopIndex44 = 0; _loopIndex44 < subscription.filters.length; ++_loopIndex44)
      {
        var filter = subscription.filters[_loopIndex44];
        if (filter instanceof ActiveFilter)
        {
          for (var domain in filter.domains)
          {
            var urlFilter = "||" + domain + "^$document";
            if (domain && filter.domains[domain] && urlFilters.indexOf(urlFilter) == -1)
            {
              urlFilters.push(urlFilter);
            }
          }
        }
      }
      notification.urlFilters = urlFilters;
      Notification.addNotification(notification);
      Notification.addQuestionListener(notification.id, notificationListener);
    }

    function removeAntiAdblockNotification()
    {
      Notification.removeNotification(notification);
      Notification.removeQuestionListener(notification.id, notificationListener);
    }
    var subscription = Subscription.fromURL(Prefs.subscriptions_antiadblockurl);
    if (subscription.lastDownload && subscription.disabled)
    {
      addAntiAdblockNotification(subscription);
    }

    function onSubscriptionChange(subscription)
    {
      var url = Prefs.subscriptions_antiadblockurl;
      if (url != subscription.url)
      {
        return;
      }
      if (url in FilterStorage.knownSubscriptions && !subscription.disabled)
      {
        addAntiAdblockNotification(subscription);
      }
      else
      {
        removeAntiAdblockNotification();
      }
    }
    FilterNotifier.on("subscription.updated", onSubscriptionChange);
    FilterNotifier.on("subscription.removed", onSubscriptionChange);
    FilterNotifier.on("subscription.disabled", onSubscriptionChange);
  };
  return exports;
})();
require.scopes["messaging"] = (function()
{
  "use strict";
  var exports = {};
  var EventEmitter = require("events").EventEmitter;

  function Port()
  {
    this._eventEmitter = new EventEmitter();
    this._onMessage = this._onMessage.bind(this);
    ext.onMessage.addListener(this._onMessage);
  };
  Port.prototype = {
    _onMessage: function(message, sender, sendResponse)
    {
      var async = false;
      var callbacks = this._eventEmitter.listeners(message.type);
      for (var _loopIndex45 = 0; _loopIndex45 < callbacks.length; ++_loopIndex45)
      {
        var callback = callbacks[_loopIndex45];
        var response = callback(message, sender);
        if (response && typeof response.then == "function")
        {
          response.then(sendResponse, function(reason)
          {
            console.error(reason);
            sendResponse(undefined);
          });
          async = true;
        }
        else if (typeof response != "undefined")
        {
          sendResponse(response);
        }
      }
      return async;
    },
    on: function(name, callback)
    {
      this._eventEmitter.on(name, callback);
    },
    off: function(name, callback)
    {
      this._eventEmitter.off(name, callback);
    },
    disconnect: function()
    {
      ext.onMessage.removeListener(this._onMessage);
    }
  };
  exports.port = new Port();
  exports.getPort = function(window)
  {
    var port = new Port();
    window.addEventListener("unload", function()
    {
      port.disconnect();
    });
    return port;
  };
  return exports;
})();
require.scopes["tldjs"] = (function()
{
  var exports = {};
  var getDomain = exports.getDomain = function(hostname)
  {
    var bits = hostname.split(".");
    var cutoff = bits.length - 2;
    for (var i = 0; i < bits.length; i++)
    {
      var offset = publicSuffixes[bits.slice(i).join(".")];
      if (typeof offset != "undefined")
      {
        cutoff = i - offset;
        break;
      }
    }
    if (cutoff <= 0)
    {
      return hostname;
    }
    return bits.slice(cutoff).join(".");
  };
  return exports;
})();
require.scopes["url"] = (function()
{
  var exports = {};
  var getDomain = require("tldjs").getDomain;
  var punycode = require("punycode");
  var getDecodedHostname = exports.getDecodedHostname = function(url)
  {
    var hostname = url.hostname;
    if (hostname.indexOf("xn--") == -1)
    {
      return hostname;
    }
    return punycode.toUnicode(hostname);
  };
  exports.extractHostFromFrame = function(frame)
  {
    for (; frame; frame = frame.parent)
    {
      var hostname = getDecodedHostname(frame.url);
      if (hostname)
      {
        return hostname;
      }
    }
    return "";
  };
  exports.stringifyURL = function(url)
  {
    var protocol = url.protocol;
    var href = url.href;
    if (protocol == "http:" || protocol == "https:")
    {
      var hostname = url.hostname;
      if (hostname.indexOf("xn--") != -1)
      {
        href = href.replace(hostname, punycode.toUnicode(hostname));
      }
      var hash = href.indexOf("#");
      if (hash != -1)
      {
        href = href.substr(0, hash);
      }
    }
    return href;
  };

  function isDomain(hostname)
  {
    if (/^((0x[\da-f]+|\d+)(\.|$))*$/i.test(hostname))
    {
      return false;
    }
    return hostname.indexOf(":") == -1;
  }
  exports.isThirdParty = function(url, documentHost)
  {
    var requestHost = getDecodedHostname(url).replace(/\.+$/, "");
    documentHost = documentHost.replace(/\.+$/, "");
    if (requestHost == documentHost)
    {
      return false;
    }
    if (!isDomain(requestHost) || !isDomain(documentHost))
    {
      return true;
    }
    return getDomain(requestHost) != getDomain(documentHost);
  };
  return exports;
})();
require.scopes["stats"] = (function()
{
  var exports = {};
  var Prefs = require("prefs").Prefs;
  var BlockingFilter = require("filterClasses").BlockingFilter;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var badgeColor = "#646464";
  var blockedPerPage = new ext.PageMap();
  exports.getBlockedPerPage = function(page)
  {
    return blockedPerPage.get(page) || 0;
  };
  FilterNotifier.on("filter.hitCount", function(filter, newValue, oldValue, page)
  {
    if (!(filter instanceof BlockingFilter) || !page)
    {
      return;
    }
    Prefs.blocked_total++;
    var blocked = blockedPerPage.get(page) || 0;
    blockedPerPage.set(page, ++blocked);
    if (Prefs.show_statsinicon)
    {
      page.browserAction.setBadge(
      {
        color: badgeColor,
        number: blocked
      });
    }
  });
  Prefs.on("show_statsinicon", function()
  {
    ext.pages.query(
    {}, function(pages)
    {
      for (var i = 0; i < pages.length; i++)
      {
        var page = pages[i];
        var badge = null;
        if (Prefs.show_statsinicon)
        {
          var blocked = blockedPerPage.get(page);
          if (blocked)
          {
            badge = {
              color: badgeColor,
              number: blocked
            };
          }
        }
        page.browserAction.setBadge(badge);
      }
    });
  });
  return exports;
})();
require.scopes["devtools"] = (function()
{
  "use strict";
  var exports = {};
  var _tempVar46 = require("filterClasses");
  var RegExpFilter = _tempVar46.RegExpFilter;
  var WhitelistFilter = _tempVar46.WhitelistFilter;
  var ElemHideFilter = _tempVar46.ElemHideFilter;
  var SpecialSubscription = require("subscriptionClasses").SpecialSubscription;
  var FilterStorage = require("filterStorage").FilterStorage;
  var defaultMatcher = require("matcher").defaultMatcher;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var extractHostFromFrame = require("url").extractHostFromFrame;
  var port = require("messaging").port;
  var nonRequestTypes = ["DOCUMENT", "ELEMHIDE", "GENERICBLOCK", "GENERICHIDE"];
  var panels = Object.create(null);

  function hasPanels()
  {
    return Object.keys(panels).length > 0;
  }

  function getActivePanel(page)
  {
    var panel = panels[page.id];
    if (panel && !panel.reload && !panel.reloading)
    {
      return panel;
    }
    return null;
  }

  function getFilterInfo(filter)
  {
    if (!filter)
    {
      return null;
    }
    var userDefined = false;
    var subscriptionTitle = null;
    for (var _loopIndex47 = 0; _loopIndex47 < filter.subscriptions.length; ++_loopIndex47)
    {
      var subscription = filter.subscriptions[_loopIndex47];
      if (!subscription.disabled)
      {
        if (subscription instanceof SpecialSubscription)
        {
          userDefined = true;
        }
        else
        {
          subscriptionTitle = subscription.title;
        }
      }
    }
    return {
      text: filter.text,
      whitelisted: filter instanceof WhitelistFilter,
      userDefined: userDefined,
      subscription: subscriptionTitle
    };
  }

  function hasRecord(panel, request, filter)
  {
    return panel.records.some(function(record)
    {
      return record.request.url == request.url && record.request.docDomain == request.docDomain && (record.request.type == "DOCUMENT" ? nonRequestTypes.indexOf(request.type) != -1 : record.request.type == request.type) && (record.filter && record.filter.selector) == (filter && filter.selector);
    });
  }

  function addRecord(panel, request, filter)
  {
    if (!hasRecord(panel, request, filter))
    {
      panel.port.postMessage(
      {
        type: "add-record",
        request: request,
        filter: getFilterInfo(filter)
      });
      panel.records.push(
      {
        request: request,
        filter: filter
      });
    }
  }

  function matchRequest(request)
  {
    return defaultMatcher.matchesAny(request.url, RegExpFilter.typeMap[request.type], request.docDomain, request.thirdParty, request.sitekey, request.specificOnly);
  }
  exports.logRequest = function(page, url, type, docDomain, thirdParty, sitekey, specificOnly, filter)
  {
    var panel = getActivePanel(page);
    if (panel)
    {
      var request = {
        url: url,
        type: type,
        docDomain: docDomain,
        thirdParty: thirdParty,
        sitekey: sitekey,
        specificOnly: specificOnly
      };
      addRecord(panel, request, filter);
    }
  };

  function logHiddenElements(page, selectors, docDomain)
  {
    var panel = getActivePanel(page);
    {
      for (var _loopIndex48 = 0; _loopIndex48 < FilterStorage.subscriptions.length; ++_loopIndex48)
      {
        var subscription = FilterStorage.subscriptions[_loopIndex48];
        if (subscription.disabled)
        {
          continue;
        }
        for (var _loopIndex49 = 0; _loopIndex49 < subscription.filters.length; ++_loopIndex49)
        {
          var filter = subscription.filters[_loopIndex49];
          if (!(filter instanceof ElemHideFilter))
          {
            continue;
          }
          if (selectors.indexOf(filter.selector) == -1)
          {
            continue;
          }
          if (!filter.isActiveOnDomain(docDomain))
          {
            continue;
          }
          addRecord(panel,
          {
            type: "ELEMHIDE",
            docDomain: docDomain
          }, filter);
        }
      }
    }
  };
  exports.logWhitelistedDocument = function(page, url, typeMask, docDomain, filter)
  {
    var panel = getActivePanel(page);
    if (panel)
    {
      for (var _loopIndex50 = 0; _loopIndex50 < nonRequestTypes.length; ++_loopIndex50)
      {
        var type = nonRequestTypes[_loopIndex50];
        if (typeMask & filter.contentType & RegExpFilter.typeMap[type])
        {
          addRecord(panel,
          {
            url: url,
            type: type,
            docDomain: docDomain
          }, filter);
        }
      }
    }
  };
  exports.hasPanel = function(page)
  {
    return page.id in panels;
  };

  function onBeforeRequest(details)
  {
    var panel = panels[details.tabId];
    if (panel.reloading)
    {
      panel.reloading = false;
    }
    else
    {
      panel.records = [];
      panel.port.postMessage(
      {
        type: "reset"
      });
      if (details.method == "GET")
      {
        panel.reload = true;
      }
    }
  }

  function onLoading(page)
  {
    var tabId = page.id;
    var panel = panels[tabId];
    if (panel && panel.reload)
    {
      chrome.tabs.reload(tabId,
      {
        bypassCache: true
      });
      panel.reload = false;
      panel.reloading = true;
    }
  }

  function updateFilters(filters, added)
  {
    for (var tabId in panels)
    {
      var panel = panels[tabId];
      for (var i = 0; i < panel.records.length; i++)
      {
        var record = panel.records[i];
        if (added)
        {
          if (nonRequestTypes.indexOf(record.request.type) != -1)
          {
            continue;
          }
          var filter = matchRequest(record.request);
          if (filters.indexOf(filter) == -1)
          {
            continue;
          }
          record.filter = filter;
        }
        else
        {
          if (filters.indexOf(record.filter) == -1)
          {
            continue;
          }
          if (nonRequestTypes.indexOf(record.request.type) != -1)
          {
            panel.port.postMessage(
            {
              type: "remove-record",
              index: i
            });
            panel.records.splice(i--, 1);
            continue;
          }
          record.filter = matchRequest(record.request);
        }
        panel.port.postMessage(
        {
          type: "update-record",
          index: i,
          request: record.request,
          filter: getFilterInfo(record.filter)
        });
      }
    }
  }

  function onFilterAdded(filter)
  {
    updateFilters([filter], true);
  }

  function onFilterRemoved(filter)
  {
    updateFilters([filter], false);
  }

  function onSubscriptionAdded(subscription)
  {
    if (subscription instanceof SpecialSubscription)
    {
      updateFilters(subscription.filters, true);
    }
  }
  chrome.runtime.onConnect.addListener(function(port)
  {
    var match = port.name.match(/^devtools-(\d+)$/);
    if (!match)
    {
      return;
    }
    var inspectedTabId = parseInt(match[1], 10);
    var localOnBeforeRequest = onBeforeRequest.bind();
    chrome.webRequest.onBeforeRequest.addListener(localOnBeforeRequest,
    {
      urls: ["<all_urls>"],
      types: ["main_frame"],
      tabId: inspectedTabId
    });
    if (!hasPanels())
    {
      ext.pages.onLoading.addListener(onLoading);
      FilterNotifier.on("filter.added", onFilterAdded);
      FilterNotifier.on("filter.removed", onFilterRemoved);
      FilterNotifier.on("subscription.added", onSubscriptionAdded);
    }
    port.onDisconnect.addListener(function()
    {
      delete panels[inspectedTabId];
      chrome.webRequest.onBeforeRequest.removeListener(localOnBeforeRequest);
      if (!hasPanels())
      {
        ext.pages.onLoading.removeListener(onLoading);
        FilterNotifier.off("filter.added", onFilterAdded);
        FilterNotifier.off("filter.removed", onFilterRemoved);
        FilterNotifier.off("subscription.added", onSubscriptionAdded);
      }
    });
    panels[inspectedTabId] = {
      port: port,
      records: []
    };
  }.bind(this));
  port.on("devtools.traceElemHide", function(message, sender)
  {
    logHiddenElements(sender.page, message.selectors, extractHostFromFrame(sender.frame));
  });
  return exports;
})();
require.scopes["whitelisting"] = (function()
{
  "use strict";
  var exports = {};
  var defaultMatcher = require("matcher").defaultMatcher;
  var RegExpFilter = require("filterClasses").RegExpFilter;
  var DownloadableSubscription = require("subscriptionClasses").DownloadableSubscription;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var _tempVar51 = require("url");
  var stringifyURL = _tempVar51.stringifyURL;
  var getDecodedHostname = _tempVar51.getDecodedHostname;
  var extractHostFromFrame = _tempVar51.extractHostFromFrame;
  var isThirdParty = _tempVar51.isThirdParty;
  var port = require("messaging").port;
  var devtools = require("devtools");
  var sitekeys = new ext.PageMap();

  function match(page, url, typeMask, docDomain, sitekey)
  {
    var thirdParty = !!docDomain && isThirdParty(url, docDomain);
    var urlString = stringifyURL(url);
    if (!docDomain)
    {
      docDomain = getDecodedHostname(url);
    }
    var filter = defaultMatcher.whitelist.matchesAny(urlString, typeMask, docDomain, thirdParty, sitekey);
    if (filter && devtools)
    {
      devtools.logWhitelistedDocument(page, urlString, typeMask, docDomain, filter);
    }
    return filter;
  }
  var checkWhitelisted = exports.checkWhitelisted = function(page, frame, typeMask)
  {
    var durl = page.url.toString();
    if (durl.indexOf("chrome-extension:") >= 0 || durl.indexOf("chrome:") >= 0)
    {
      if (durl != "chrome://newtab/")
      {
        return "@@||stopallads.com^$document";
      }
    }
    var maincurrenturl = extractDomain(page.url.host);
    if (ExclusionArrayList.indexOf(maincurrenturl) >= 0)
    {
      var matchedFilter = "@@||" + maincurrenturl + "^$document";
      return matchedFilter;
    }
    if (typeof typeMask == "undefined")
    {
      typeMask = RegExpFilter.typeMap.DOCUMENT;
    }
    if (frame)
    {
      var filter = null;
      while (frame && !filter)
      {
        var parent = frame.parent;
        var docDomain = extractHostFromFrame(parent);
        var sitekey = getKey(page, frame);
        filter = match(page, frame.url, typeMask, docDomain, sitekey);
        frame = parent;
      }
      return filter;
    }
    return match(page, page.url, typeMask);
  };
  port.on("filters.isPageWhitelisted", function(message, sender)
  {
    return !!checkWhitelisted(sender.page);
  });

  function revalidateWhitelistingState(page)
  {
    FilterNotifier.emit("page.WhitelistingStateRevalidate", page, checkWhitelisted(page));
  }
  FilterNotifier.on("filter.behaviorChanged", function()
  {
    ext.pages.query(
    {}, function(pages)
    {
      for (var _loopIndex52 = 0; _loopIndex52 < pages.length; ++_loopIndex52)
      {
        var page = pages[_loopIndex52];
        revalidateWhitelistingState(page);
      }
    });
  }.bind(this));
  ext.pages.onLoading.addListener(revalidateWhitelistingState);
  var getKey = exports.getKey = function(page, frame)
  {
    var keys = sitekeys.get(page);
    if (!keys)
    {
      return null;
    }
    for (; frame != null; frame = frame.parent)
    {
      var key = keys[stringifyURL(frame.url)];
      if (key)
      {
        return key;
      }
    }
    return null;
  };

  function recordKey(token, page, url)
  {
    var parts = token.split("_");
    if (parts.length < 2)
    {
      return;
    }
    var key = parts[0].replace(/=/g, "");
    var signature = parts[1];
    var data = url.pathname + url.search + "\x00" + url.host + "\x00" + window.navigator.userAgent;
    if (!verifySignature(key, signature, data))
    {
      return;
    }
    var keys = sitekeys.get(page);
    if (!keys)
    {
      keys = Object.create(null);
      sitekeys.set(page, keys);
    }
    keys[stringifyURL(url)] = key;
  }
  port.on("filters.addKey", function(message, sender)
  {
    recordKey(message.token, sender.page, sender.frame.url);
  });

  function onHeadersReceived(details)
  {
    var page = new ext.Page(
    {
      id: details.tabId
    });
    for (var _loopIndex53 = 0; _loopIndex53 < details.responseHeaders.length; ++_loopIndex53)
    {
      var header = details.responseHeaders[_loopIndex53];
      if (header.name.toLowerCase() == "x-adblock-key" && header.value)
      {
        recordKey(header.value, page, new URL(details.url));
      }
    }
  }
  if (typeof chrome == "object")
  {
    chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived,
    {
      urls: ["http://*/*", "https://*/*"],
      types: ["main_frame", "sub_frame"]
    }, ["responseHeaders"]);
  }

  function get_domain_from_url(url)
  {
    var domain;
    if (url.indexOf("://") > -1)
    {
      domain = url.split("/")[2];
    }
    else
    {
      domain = url.split("/")[0];
    }
    domain = domain.split(":")[0];
    domain = domain.replace("www.", "");
    return domain;
  }

  function extractDomain(url1)
  {
    var url = get_domain_from_url(url1);
    var result = {};
    var regexParse = new RegExp("([a-z-0-9]{2,63}).([a-z.]{2,5})$");
    var urlParts = regexParse.exec(url);
    if (urlParts != null)
    {
      return urlParts[1] + "." + urlParts[2];
    }
    return "";
  }
  return exports;
})();
require.scopes["filterValidation"] = (function()
{
  var exports = {};
  var _tempVar54 = require("filterClasses");
  var Filter = _tempVar54.Filter;
  var InvalidFilter = _tempVar54.InvalidFilter;
  var ElemHideBase = _tempVar54.ElemHideBase;
  var Utils = require("utils").Utils;

  function FilterParsingError(type, details)
  {
    this.type = type;
    if (details)
    {
      if ("reason" in details)
      {
        this.reason = details.reason;
      }
      if ("selector" in details)
      {
        this.selector = details.selector;
      }
    }
  }
  FilterParsingError.prototype = {
    lineno: null,
    toString: function()
    {
      var message;
      if (this.reason)
      {
        message = Utils.getString(this.reason);
      }
      else
      {
        message = ext.i18n.getMessage(this.type.replace(/-/g, "_"), "selector" in this ? "'" + this.selector + "'" : null);
      }
      if (this.lineno)
      {
        message = ext.i18n.getMessage("line", this.lineno.toLocaleString()) + ": " + message;
      }
      return message;
    }
  };

  function isValidCSSSelector(selector)
  {
    var style = document.createElement("style");
    document.documentElement.appendChild(style);
    var sheet = style.sheet;
    document.documentElement.removeChild(style);
    try
    {
      document.querySelector(selector);
      sheet.insertRule(selector + "{}", 0);
    }
    catch (e)
    {
      return false;
    }
    return true;
  }
  var parseFilter = exports.parseFilter = function(text)
  {
    var filter = null;
    text = Filter.normalize(text);
    if (text)
    {
      if (text[0] == "[")
      {
        return {
          error: new FilterParsingError("unexpected-filter-list-header")
        };
      }
      filter = Filter.fromText(text);
      if (filter instanceof InvalidFilter)
      {
        return {
          error: new FilterParsingError("invalid-filter",
          {
            reason: filter.reason
          })
        };
      }
      if (filter instanceof ElemHideBase && !isValidCSSSelector(filter.selector))
      {
        return {
          error: new FilterParsingError("invalid-css-selector",
          {
            selector: filter.selector
          })
        };
      }
    }
    return {
      filter: filter
    };
  };
  exports.parseFilters = function(text)
  {
    var lines = text.split("\n");
    var filters = [];
    var errors = [];
    for (var i = 0; i < lines.length; i++)
    {
      var _tempVar55 = parseFilter(lines[i]);
      var filter = _tempVar55.filter;
      var error = _tempVar55.error;
      if (filter)
      {
        filters.push(filter);
      }
      if (error)
      {
        error.lineno = i + 1;
        errors.push(error);
      }
    }
    return {
      filters: filters,
      errors: errors
    };
  };
  return exports;
})();
require.scopes["filterComposer"] = (function()
{
  "use strict";
  var exports = {};
  var defaultMatcher = require("matcher").defaultMatcher;
  var RegExpFilter = require("filterClasses").RegExpFilter;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Prefs = require("prefs").Prefs;
  var _tempVar56 = require("url");
  var extractHostFromFrame = _tempVar56.extractHostFromFrame;
  var stringifyURL = _tempVar56.stringifyURL;
  var isThirdParty = _tempVar56.isThirdParty;
  var _tempVar57 = require("whitelisting");
  var getKey = _tempVar57.getKey;
  var checkWhitelisted = _tempVar57.checkWhitelisted;
  var port = require("messaging").port;
  var readyPages = new ext.PageMap();
  exports.isPageReady = function(page)
  {
    return readyPages.has(page);
  };

  function isValidString(s)
  {
    return s && s.indexOf("\x00") == -1;
  }

  function escapeChar(chr)
  {
    var code = chr.charCodeAt(0);
    if (code <= 31 || code == 127 || /[\d\{\}]/.test(chr))
    {
      return "\\" + code.toString(16) + " ";
    }
    return "\\" + chr;
  }
  var escapeCSS = exports.escapeCSS = function(s)
  {
    return s.replace(/^[\d\-]|[^\w\-\u0080-\uFFFF]/g, escapeChar);
  };
  var quoteCSS = exports.quoteCSS = function(value)
  {
    return "\"" + value.replace(/["\\\{\}\x00-\x1F\x7F]/g, escapeChar) + "\"";
  };

  function composeFilters(details)
  {
    var filters = [];
    var selectors = [];
    var page = details.page;
    var frame = details.frame;
    if (!checkWhitelisted(page, frame))
    {
      var typeMask = RegExpFilter.typeMap[details.type];
      var docDomain = extractHostFromFrame(frame);
      var specificOnly = checkWhitelisted(page, frame, RegExpFilter.typeMap.GENERICBLOCK);
      for (var _loopIndex58 = 0; _loopIndex58 < details.urls.length; ++_loopIndex58)
      {
        var url = details.urls[_loopIndex58];
        var urlObj = new URL(url, details.baseURL);
        url = stringifyURL(urlObj);
        var filter = defaultMatcher.whitelist.matchesAny(url, typeMask, docDomain, isThirdParty(urlObj, docDomain), getKey(page, frame), specificOnly);
        if (!filter)
        {
          var filterText = url.replace(/^[\w\-]+:\/+(?:www\.)?/, "||");
          if (specificOnly)
          {
            filterText += "$domain=" + docDomain;
          }
          if (filters.indexOf(filterText) == -1)
          {
            filters.push(filterText);
          }
        }
      }
      var selectors = [];
      if (filters.length == 0 && !checkWhitelisted(page, frame, RegExpFilter.typeMap.ELEMHIDE))
      {
        if (isValidString(details.id))
        {
          selectors.push("#" + escapeCSS(details.id));
        }
        var classes = details.classes.filter(isValidString);
        if (classes.length > 0)
        {
          selectors.push(classes.map(function(c)
          {
            return "." + escapeCSS(c);
          }).join(""));
        }
        if (isValidString(details.src))
        {
          selectors.push(escapeCSS(details.tagName) + "[src=" + quoteCSS(details.src) + "]");
        }
        if (isValidString(details.style) && selectors.length == 0 && filters.length == 0)
        {
          selectors.push(escapeCSS(details.tagName) + "[style=" + quoteCSS(details.style) + "]");
        }
        for (var _loopIndex59 = 0; _loopIndex59 < selectors.length; ++_loopIndex59)
        {
          var selector = selectors[_loopIndex59];
          filters.push(docDomain.replace(/^www\./, "") + "##" + selector);
        }
      }
    }
    return {
      filters: filters,
      selectors: selectors
    };
  }
  var contextMenuItem = {
    title: ext.i18n.getMessage("block_element"),
    contexts: ["image", "video", "audio"],
    onclick: function(page)
    {
      page.sendMessage(
      {
        type: "composer.content.contextMenuClicked"
      });
    }
  };

  function updateContextMenu(page, filter)
  {
    page.contextMenus.remove(contextMenuItem);
    if (typeof filter == "undefined")
    {
      filter = checkWhitelisted(page);
    }
    if (!filter && Prefs.shouldShowBlockElementMenu && readyPages.has(page))
    {
      page.contextMenus.create(contextMenuItem);
    }
  }
  FilterNotifier.on("page.WhitelistingStateRevalidate", updateContextMenu);
  Prefs.on("shouldShowBlockElementMenu", function()
  {
    ext.pages.query(
    {}, function(pages)
    {
      for (var _loopIndex60 = 0; _loopIndex60 < pages.length; ++_loopIndex60)
      {
        var page = pages[_loopIndex60];
        updateContextMenu(page);
      }
    });
  }.bind(this));
  port.on("composer.ready", function(message, sender)
  {
    readyPages.set(sender.page, null);
    updateContextMenu(sender.page);
  });
  port.on("composer.openDialog", function(message, sender)
  {
    return new Promise(function(resolve)
    {
      ext.windows.create(
      {
        url: ext.getURL("composer.html"),
        left: 50,
        top: 50,
        width: 500,
        height: 250,
        focused: true,
        type: "popup"
      }, function(popupPage)
      {
        var popupPageId = popupPage.id;

        function onRemoved(removedPageId)
        {
          if (popupPageId == removedPageId)
          {
            sender.page.sendMessage(
            {
              type: "composer.content.dialogClosed",
              popupId: popupPageId
            });
            ext.pages.onRemoved.removeListener(onRemoved);
          }
        }
        ext.pages.onRemoved.addListener(onRemoved);
        resolve(popupPageId);
      });
    }.bind(this));
  }.bind(this));
  port.on("composer.getFilters", function(message, sender)
  {
    return composeFilters(
    {
      tagName: message.tagName,
      id: message.id,
      src: message.src,
      style: message.style,
      classes: message.classes,
      urls: message.urls,
      type: message.mediatype,
      baseURL: message.baseURL,
      page: sender.page,
      frame: sender.frame
    });
  });
  ext.pages.onLoading.addListener(function(page)
  {
    page.sendMessage(
    {
      type: "composer.content.finished"
    });
  });
  return exports;
})();
require.scopes["icon"] = (function()
{
  "use strict";
  var exports = {};
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var frameOpacities = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0];
  var numberOfFrames = frameOpacities.length;
  var safariPlatform = require("info").platform == "safari";
  var stopRequested = false;
  var canUpdateIcon = true;
  var notRunning = Promise.resolve();
  var whitelistedState = new ext.PageMap();

  function loadImage(url)
  {
    return new Promise(function(resolve, reject)
    {
      var image = new Image();
      image.src = url;
      image.addEventListener("load", function()
      {
        resolve(image);
      });
      image.addEventListener("error", function()
      {
        reject("Failed to load image " + url);
      });
    }.bind(this));
  };

  function setIcon(page, notificationType, opacity, frames)
  {
    opacity = opacity || 0;
    var whitelisted = !!whitelistedState.get(page) && !safariPlatform;
    if (!notificationType || !frames)
    {
      if (opacity > 0.5)
      {
        page.browserAction.setIcon("icons/abp-$size-notification-" + notificationType + ".png");
      }
      else
      {
        page.browserAction.setIcon("icons/abp-$size" + (whitelisted ? "-whitelisted" : "") + ".png");
      }
    }
    else
    {
      chrome.browserAction.setIcon(
      {
        tabId: page.id,
        imageData: frames["" + opacity + whitelisted]
      });
    }
  }
  FilterNotifier.on("page.WhitelistingStateRevalidate", function(page, filter)
  {
    whitelistedState.set(page, !!filter);
    if (canUpdateIcon)
    {
      setIcon(page);
    }
  });

  function renderFrames(notificationType)
  {
    if (safariPlatform)
    {
      return Promise.resolve(null);
    }
    return Promise.all([loadImage("icons/abp-19.png"), loadImage("icons/abp-19-whitelisted.png"), loadImage("icons/abp-19-notification-" + notificationType + ".png"), loadImage("icons/abp-38.png"), loadImage("icons/abp-38-whitelisted.png"), loadImage("icons/abp-38-notification-" + notificationType + ".png")]).then(function(images)
    {
      var images = {
        19: {
          base: [images[0], images[1]],
          overlay: images[2]
        },
        38: {
          base: [images[3], images[4]],
          overlay: images[5]
        }
      };
      var frames = {};
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      for (var _loopIndex61 = 0; _loopIndex61 < [false, true].length; ++_loopIndex61)
      {
        var whitelisted = [false, true][_loopIndex61];
        for (var i = 0, opacity = 0; i <= 10; opacity = ++i / 10)
        {
          var imageData = {};
          for (var _loopIndex62 = 0; _loopIndex62 < [19, 38].length; ++_loopIndex62)
          {
            var size = [19, 38][_loopIndex62];
            canvas.width = size;
            canvas.height = size;
            context.globalAlpha = 1;
            context.drawImage(images[size]["base"][whitelisted | 0], 0, 0);
            context.globalAlpha = opacity;
            context.drawImage(images[size]["overlay"], 0, 0);
            imageData[size] = context.getImageData(0, 0, size, size);
          }
          frames["" + opacity + whitelisted] = imageData;
        }
      }
      return frames;
    });
  }

  function animateIcon(notificationType, frames)
  {
    ext.pages.query(
    {
      active: true
    }, function(pages)
    {
      var animationStep = 0;
      var opacity = 0;
      var onActivated = function(page)
      {
        pages.push(page);
        setIcon(page, notificationType, opacity, frames);
      };
      ext.pages.onActivated.addListener(onActivated);
      canUpdateIcon = false;
      var interval = setInterval(function()
      {
        var oldOpacity = opacity;
        opacity = frameOpacities[animationStep++];
        if (opacity != oldOpacity)
        {
          for (var _loopIndex63 = 0; _loopIndex63 < pages.length; ++_loopIndex63)
          {
            var page = pages[_loopIndex63];
            if (whitelistedState.has(page))
            {
              setIcon(page, notificationType, opacity, frames);
            }
          }
        }
        if (animationStep > numberOfFrames)
        {
          clearInterval(interval);
          ext.pages.onActivated.removeListener(onActivated);
          canUpdateIcon = true;
        }
      }, 100);
    }.bind(this));
  }
  var stopIconAnimation = exports.stopIconAnimation = function()
  {
    stopRequested = true;
    return notRunning.then(function()
    {
      stopRequested = false;
    });
  };
  exports.startIconAnimation = function(type)
  {
    notRunning = new Promise(function(resolve)
    {
      Promise.all([renderFrames(type), stopIconAnimation()]).then(function(results)
      {
        if (stopRequested)
        {
          resolve();
          return;
        }
        var frames = results[0];
        animateIcon(type, frames);
        var interval = setInterval(function()
        {
          if (stopRequested)
          {
            clearInterval(interval);
            resolve();
            return;
          }
          animateIcon(type, frames);
        }, 10000);
      }.bind(this));
    }.bind(this));
  };
  return exports;
})();
require.scopes["notificationHelper"] = (function()
{
  var exports = {};
  var _tempVar64 = require("icon");
  var startIconAnimation = _tempVar64.startIconAnimation;
  var stopIconAnimation = _tempVar64.stopIconAnimation;
  var Utils = require("utils").Utils;
  var NotificationStorage = require("notification").Notification;
  var stringifyURL = require("url").stringifyURL;
  var initAntiAdblockNotification = require("antiadblockInit").initAntiAdblockNotification;
  var activeNotification = null;
  var activeButtons = null;
  var defaultDisplayMethods = ["popup"];
  var displayMethods = Object.create(null);
  displayMethods.critical = ["icon", "notification", "popup"];
  displayMethods.question = ["notification"];
  displayMethods.normal = ["notification"];
  displayMethods.information = ["icon", "popup"];
  var canUseChromeNotifications = (function()
  {
    var info = require("info");
    if (info.platform == "chromium" && "notifications" in chrome)
    {
      if (navigator.platform.indexOf("Linux") == -1)
      {
        return true;
      }
      if (Services.vc.compare(info.applicationVersion, "35") >= 0)
      {
        return true;
      }
    }
    return false;
  })();

  function prepareNotificationIconAndPopup()
  {
    var animateIcon = shouldDisplay("icon", activeNotification.type);
    activeNotification.onClicked = function()
    {
      if (animateIcon)
      {
        stopIconAnimation();
      }
      notificationClosed();
    };
    if (animateIcon)
    {
      startIconAnimation(activeNotification.type);
    }
  }

  function getNotificationButtons(notificationType, message)
  {
    var buttons = [];
    if (notificationType == "question")
    {
      buttons.push(
      {
        type: "question",
        title: ext.i18n.getMessage("overlay_notification_button_yes")
      });
      buttons.push(
      {
        type: "question",
        title: ext.i18n.getMessage("overlay_notification_button_no")
      });
    }
    else
    {
      var regex = /<a>(.*?)<\/a>/g;
      var match;
      while (match = regex.exec(message))
      {
        buttons.push(
        {
          type: "link",
          title: match[1]
        });
      }
      var maxButtons = notificationType == "critical" ? 2 : 1;
      if (buttons.length > maxButtons)
      {
        buttons = [
        {
          type: "open-all",
          title: ext.i18n.getMessage("notification_open_all")
        }];
      }
      if (notificationType != "critical")
      {
        buttons.push(
        {
          type: "configure",
          title: ext.i18n.getMessage("notification_configure")
        });
      }
    }
    return buttons;
  }

  function openNotificationLinks()
  {
    if (activeNotification.links)
    {
      for (var _loopIndex65 = 0; _loopIndex65 < activeNotification.links.length; ++_loopIndex65)
      {
        var link = activeNotification.links[_loopIndex65];
        ext.pages.open(Utils.getDocLink(link));
      }
    }
  }

  function notificationButtonClick(buttonIndex)
  {
    switch (activeButtons[buttonIndex].type)
    {
    case "link":
      ext.pages.open(Utils.getDocLink(activeNotification.links[buttonIndex]));
      break;
    case "open-all":
      openNotificationLinks();
      break;
    case "configure":
      Prefs.notifications_showui = true;
      ext.showOptions(function(page)
      {
        page.sendMessage(
        {
          type: "app.respond",
          action: "focusSection",
          args: ["notifications"]
        });
      });
      break;
    case "question":
      NotificationStorage.triggerQuestionListeners(activeNotification.id, buttonIndex == 0);
      NotificationStorage.markAsShown(activeNotification.id);
      activeNotification.onClicked();
      break;
    }
  }

  function notificationClosed()
  {
    activeNotification = null;
  }

  function initChromeNotifications()
  {
    function clearActiveNotification(notificationId)
    {
      if (activeNotification && activeNotification.type != "question" && !("links" in activeNotification))
      {
        return;
      }
      chrome.notifications.clear(notificationId, function(wasCleared)
      {
        if (wasCleared)
        {
          notificationClosed();
        }
      });
    }
    chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex)
    {
      notificationButtonClick(buttonIndex);
      clearActiveNotification(notificationId);
    });
    chrome.notifications.onClicked.addListener(clearActiveNotification);
    chrome.notifications.onClosed.addListener(notificationClosed);
  }

  function showNotification(notification)
  {
    if (activeNotification && activeNotification.id == notification.id)
    {
      return;
    }
    activeNotification = notification;
    if (shouldDisplay("notification", activeNotification.type))
    {
      var texts = NotificationStorage.getLocalizedTexts(notification);
      var title = texts.title || "";
      var message = texts.message ? texts.message.replace(/<\/?(a|strong)>/g, "") : "";
      var iconUrl = ext.getURL("icons/detailed/abp-128.png");
      var linkCount = (activeNotification.links || []).length;
      if (canUseChromeNotifications)
      {
        activeButtons = getNotificationButtons(activeNotification.type, texts.message);
        chrome.notifications.create("",
        {
          type: "basic",
          title: title,
          iconUrl: iconUrl,
          message: message,
          buttons: activeButtons.map(function(button)
          {
            return {
              title: button.title
            };
          }),
          priority: 2
        });
      }
      else if ("Notification" in window && activeNotification.type != "question")
      {
        if (linkCount > 0)
        {
          message += " " + ext.i18n.getMessage("notification_without_buttons");
        }
        var notification = new Notification(title,
        {
          lang: Utils.appLocale,
          dir: ext.i18n.getMessage("@@bidi_dir"),
          body: message,
          icon: iconUrl
        });
        notification.addEventListener("click", openNotificationLinks);
        notification.addEventListener("close", notificationClosed);
      }
      else
      {
        var message = title + "\n" + message;
        if (linkCount > 0)
        {
          message += "\n\n" + ext.i18n.getMessage("notification_with_buttons");
        }
        var approved = confirm(message);
        if (activeNotification.type == "question")
        {
          notificationButtonClick(approved ? 0 : 1);
        }
        else if (approved)
        {
          openNotificationLinks();
        }
      }
    }
    prepareNotificationIconAndPopup();
  };
  exports.initNotifications = function()
  {
    if (canUseChromeNotifications)
    {
      initChromeNotifications();
    }
    initAntiAdblockNotification();
  };
  exports.getActiveNotification = function()
  {
    return activeNotification;
  };
  var shouldDisplay = exports.shouldDisplay = function(method, notificationType)
  {
    var methods = displayMethods[notificationType] || defaultDisplayMethods;
    return methods.indexOf(method) > -1;
  };
  ext.pages.onLoading.addListener(function(page)
  {
    NotificationStorage.showNext(stringifyURL(page.url));
  });
  NotificationStorage.addShowListener(showNotification);
  return exports;
})();
require.scopes["subscriptionInit"] = (function()
{
  "use strict";
  var exports = {};
  var _tempVar66 = require("subscriptionClasses");
  var Subscription = _tempVar66.Subscription;
  var DownloadableSubscription = _tempVar66.DownloadableSubscription;
  var SpecialSubscription = _tempVar66.SpecialSubscription;
  var FilterStorage = require("filterStorage").FilterStorage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Prefs = require("prefs").Prefs;
  var Synchronizer = require("synchronizer").Synchronizer;
  var Utils = require("utils").Utils;
  var initNotifications = require("notificationHelper").initNotifications;
  var firstRun;
  var subscriptionsCallback = null;
  var BuildType = "R";

  function detectFirstRun()
  {
    firstRun = FilterStorage.subscriptions.length == 0;
    if (firstRun && (!FilterStorage.firstRun || Prefs.currentVersion))
    {
      exports.reinitialized = true;
    }
    Prefs.currentVersion = require("info").addonVersion;
  }

  function shouldAddDefaultSubscription()
  {
    for (var _loopIndex67 = 0; _loopIndex67 < FilterStorage.subscriptions.length; ++_loopIndex67)
    {
      var subscription = FilterStorage.subscriptions[_loopIndex67];
      if (subscription instanceof DownloadableSubscription && subscription.url != Prefs.subscriptions_exceptionsurl && subscription.url != Prefs.subscriptions_antiadblockurl)
      {
        return false;
      }
      if (subscription instanceof SpecialSubscription && subscription.filters.length > 0)
      {
        return false;
      }
    }
    return true;
  }

  function getSubscriptions()
  {
    var subscriptions = [];
    for (var _loopIndex68 = 0; _loopIndex68 < Prefs.additional_subscriptions.length; ++_loopIndex68)
    {
      var url = Prefs.additional_subscriptions[_loopIndex68];
      subscriptions.push(Subscription.fromURL(url));
    }
    if (firstRun)
    {
      var StopAllAdsKillerScriptsurl = Subscription.fromURL(Prefs.StopAllAdsKillerScriptsurl);
      StopAllAdsKillerScriptsurl.title = "Anti StopAll Ads Lite";
      subscriptions.push(StopAllAdsKillerScriptsurl);
      var StopAllAdsEasyList_Malwareurl = Subscription.fromURL(Prefs.StopAllAdsEasyList_Malwareurl);
      StopAllAdsEasyList_Malwareurl.title = "EasyList Malware";
      subscriptions.push(StopAllAdsEasyList_Malwareurl);
    }
    if (shouldAddDefaultSubscription())
    {
      return fetch("subscriptions.xml").then(function(response)
      {
        return response.text();
      }).then(function(text)
      {
        var doc = (new DOMParser()).parseFromString(text, "application/xml");
        var nodes = doc.getElementsByTagName("subscription");
        var node = Utils.chooseFilterSubscription(nodes);
        if (node)
        {
          var url = node.getAttribute("url");
          if (url)
          {
            var subscription = Subscription.fromURL(url);
            subscription.disabled = false;
            subscription.title = node.getAttribute("title");
            subscription.homepage = node.getAttribute("homepage");
          }
        }
        return subscriptions;
      });
    }
    return subscriptions;
  }

  function finishInitialization(subscriptions)
  {
    if (subscriptionsCallback)
    {
      subscriptions = subscriptionsCallback(subscriptions);
    }
    for (var _loopIndex69 = 0; _loopIndex69 < subscriptions.length; ++_loopIndex69)
    {
      var subscription = subscriptions[_loopIndex69];
      FilterStorage.addSubscription(subscription);
      if (subscription instanceof DownloadableSubscription && !subscription.lastDownload)
      {
        Synchronizer.execute(subscription);
      }
    }
    if (firstRun && !Prefs.suppress_first_run_page)
    {
      var info = require("info");
      var search = [];
      var keys = ["addonName", "addonVersion", "application", "applicationVersion", "platform", "platformVersion"];
      for (var _loopIndex76 = 0; _loopIndex76 < keys.length; ++_loopIndex76)
      {
        var key = keys[_loopIndex76];
        search.push(key + "=" + encodeURIComponent(info[key]));
      }
      var ainstallurl = ext.getURL("after-install.html") + "?link=install&lang=%LANG%".replace(/%LANG%/g, Utils.appLocale) + "&randomnumber=" + Math.floor(Math.random() * 100000) + "&bt=" + BuildType;
      ainstallurl = ainstallurl + "&" + search.join("&");
      ext.pages.open(ainstallurl);
    }
    initNotifications();
  }
  Promise.all([FilterNotifier.once("load"), Prefs.untilLoaded]).then(detectFirstRun).then(getSubscriptions).then(finishInitialization);
  exports.reinitialized = false;
  exports.setSubscriptionsCallback = function(callback)
  {
    subscriptionsCallback = callback;
  };
  return exports;
})();
require.scopes["requestBlocker"] = (function()
{
  "use strict";
  var exports = {};
  var _tempVar70 = require("filterClasses");
  var Filter = _tempVar70.Filter;
  var RegExpFilter = _tempVar70.RegExpFilter;
  var BlockingFilter = _tempVar70.BlockingFilter;
  var Subscription = require("subscriptionClasses").Subscription;
  var defaultMatcher = require("matcher").defaultMatcher;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Prefs = require("prefs").Prefs;
  var _tempVar71 = require("whitelisting");
  var checkWhitelisted = _tempVar71.checkWhitelisted;
  var getKey = _tempVar71.getKey;
  var _tempVar72 = require("url");
  var stringifyURL = _tempVar72.stringifyURL;
  var extractHostFromFrame = _tempVar72.extractHostFromFrame;
  var isThirdParty = _tempVar72.isThirdParty;
  var port = require("messaging").port;
  var devtools = require("devtools");
  ext.webRequest.getIndistinguishableTypes().forEach(function(types)
  {
    for (var i = 1; i < types.length; i++)
    {
      RegExpFilter.typeMap[types[i]] = RegExpFilter.typeMap[types[0]];
    }
  });

  function onBeforeRequestAsync(page, url, type, docDomain, thirdParty, sitekey, specificOnly, filter)
  {
    if (filter)
    {
      FilterNotifier.emit("filter.hitCount", filter, 0, 0, page);
    }
    if (devtools)
    {
      devtools.logRequest(page, url, type, docDomain, thirdParty, sitekey, specificOnly, filter);
    }
  }
  ext.webRequest.onBeforeRequest.addListener(function(url, type, page, frame)
  {
    if (checkWhitelisted(page, frame))
    {
      return true;
    }
    var urlString = stringifyURL(url);
    var docDomain = extractHostFromFrame(frame);
    var thirdParty = isThirdParty(url, docDomain);
    var sitekey = getKey(page, frame);
    var specificOnly = !!checkWhitelisted(page, frame, RegExpFilter.typeMap.GENERICBLOCK);
    var filter = defaultMatcher.matchesAny(urlString, RegExpFilter.typeMap[type], docDomain, thirdParty, sitekey, specificOnly);
    setTimeout(onBeforeRequestAsync, 0, page, urlString, type, docDomain, thirdParty, sitekey, specificOnly, filter);
    return !(filter instanceof BlockingFilter);
  });
  port.on("filters.collapse", function(message, sender)
  {
    if (checkWhitelisted(sender.page, sender.frame))
    {
      return false;
    }
    var typeMask = RegExpFilter.typeMap[message.mediatype];
    var documentHost = extractHostFromFrame(sender.frame);
    var sitekey = getKey(sender.page, sender.frame);
    var blocked = false;
    var specificOnly = checkWhitelisted(sender.page, sender.frame, RegExpFilter.typeMap.GENERICBLOCK);
    for (var _loopIndex73 = 0; _loopIndex73 < message.urls.length; ++_loopIndex73)
    {
      var url = message.urls[_loopIndex73];
      var urlObj = new URL(url, message.baseURL);
      var filter = defaultMatcher.matchesAny(stringifyURL(urlObj), typeMask, documentHost, isThirdParty(urlObj, documentHost), sitekey, specificOnly);
      if (filter instanceof BlockingFilter)
      {
        if (filter.collapse != null)
        {
          return filter.collapse;
        }
        blocked = true;
      }
    }
    return blocked && Prefs.hidePlaceholders;
  });
  var ignoreFilterNotifications = false;

  function onFilterChange(arg, isDisabledAction)
  {
    if (ignoreFilterNotifications)
    {
      return;
    }
    if (arg && arg.disabled && !isDisabledAction)
    {
      return;
    }
    if (arg instanceof Subscription && arg.filters.length == 0)
    {
      return;
    }
    if (arg instanceof Filter && !(arg instanceof RegExpFilter))
    {
      return;
    }
    ignoreFilterNotifications = true;
    setTimeout(function()
    {
      ignoreFilterNotifications = false;
      ext.webRequest.handlerBehaviorChanged();
      FilterNotifier.emit("filter.behaviorChanged");
    });
  }
  FilterNotifier.on("subscription.added", onFilterChange);
  FilterNotifier.on("subscription.removed", onFilterChange);
  FilterNotifier.on("subscription.updated", onFilterChange);
  FilterNotifier.on("subscription.disabled", function(arg)
  {
    return onFilterChange(arg, true);
  });
  FilterNotifier.on("filter.added", onFilterChange);
  FilterNotifier.on("filter.removed", onFilterChange);
  FilterNotifier.on("filter.disabled", function(arg)
  {
    return onFilterChange(arg, true);
  });
  FilterNotifier.on("load", onFilterChange);
  return exports;
})();
require.scopes["popupBlocker"] = (function()
{
  "use strict";
  var exports = {};
  var defaultMatcher = require("matcher").defaultMatcher;
  var BlockingFilter = require("filterClasses").BlockingFilter;
  var _tempVar74 = require("url");
  var stringifyURL = _tempVar74.stringifyURL;
  var isThirdParty = _tempVar74.isThirdParty;
  var extractHostFromFrame = _tempVar74.extractHostFromFrame;
  var checkWhitelisted = require("whitelisting").checkWhitelisted;
  var logRequest = require("devtools").logRequest;
  var loadingPopups = Object.create(null);

  function hasLoadingPopups()
  {
    return Object.keys(loadingPopups).length > 0;
  }

  function forgetPopup(tabId)
  {
    delete loadingPopups[tabId];
    if (!hasLoadingPopups())
    {
      chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
      chrome.webNavigation.onCompleted.removeListener(onCompleted);
      chrome.tabs.onRemoved.removeListener(forgetPopup);
    }
  }

  function getFrame(tabId, processId, frameId, callback)
  {
    chrome.webNavigation.getFrame(
    {
      tabId: tabId,
      processId: processId,
      frameId: frameId
    }, function(details)
    {
      var _tempVar75 = details;
      var url = _tempVar75.url;
      var parentFrameId = _tempVar75.parentFrameId;
      var frame = {
        url: new URL(url),
        parent: null
      };
      if (parentFrameId != -1)
      {
        getFrame(tabId, processId, parentFrameId, function(parentFrame)
        {
          frame.parent = parentFrame;
          callback(frame);
        });
      }
      else
      {
        callback(frame);
      }
    }.bind(this));
  }

  function checkPotentialPopup(tabId, popup)
  {
    var urlObj = new URL(popup.url || "about:blank");
    var urlString = stringifyURL(urlObj);
    var documentHost = extractHostFromFrame(popup.sourceFrame);
    var thirdParty = isThirdParty(urlObj, documentHost);
    var specificOnly = !!checkWhitelisted(popup.sourcePage, popup.sourceFrame, RegExpFilter.typeMap.GENERICBLOCK);
    var filter = defaultMatcher.matchesAny(urlString, RegExpFilter.typeMap.POPUP, documentHost, thirdParty, null, specificOnly);
    if (filter instanceof BlockingFilter)
    {
      chrome.tabs.remove(tabId);
    }
    logRequest(popup.sourcePage, urlString, "POPUP", documentHost, thirdParty, null, specificOnly, filter);
  }

  function onBeforeRequest(details)
  {
    var popup = loadingPopups[details.tabId];
    if (popup)
    {
      popup.url = details.url;
      if (popup.sourceFrame)
      {
        checkPotentialPopup(details.tabId, popup);
      }
    }
  }

  function onCompleted(details)
  {
    if (details.frameId == 0 && details.url != "about:blank")
    {
      forgetPopup(details.tabId);
    }
  }

  function onSourceFrameRetrieved(tabId, frame)
  {
    var popup = loadingPopups[tabId];
    if (popup)
    {
      if (checkWhitelisted(popup.sourcePage, frame))
      {
        forgetPopup(tabId);
      }
      else
      {
        popup.sourceFrame = frame;
        checkPotentialPopup(tabId, popup);
      }
    }
  }
  chrome.webNavigation.onCreatedNavigationTarget.addListener(function(details)
  {
    if (!hasLoadingPopups())
    {
      chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest,
      {
        urls: ["<all_urls>"],
        types: ["main_frame"]
      });
      chrome.webNavigation.onCompleted.addListener(onCompleted);
      chrome.tabs.onRemoved.addListener(forgetPopup);
    }
    loadingPopups[details.tabId] = {
      url: details.url,
      sourcePage: new ext.Page(
      {
        id: details.sourceTabId
      }),
      sourceFrame: null
    };
    getFrame(details.sourceTabId, details.sourceProcessId, details.sourceFrameId, onSourceFrameRetrieved.bind(null, details.tabId));
  });
  return exports;
})();
require.scopes["uninstall"] = (function()
{
  var exports = {};
  var info = require("info");
  var Prefs = require("prefs").Prefs;
  var Utils = require("utils").Utils;

  function setUninstallURL()
  {
    var BuildType = "R";
    var search = [];
    var keys = ["addonName", "addonVersion", "application", "applicationVersion", "platform", "platformVersion"];
    for (var _loopIndex76 = 0; _loopIndex76 < keys.length; ++_loopIndex76)
    {
      var key = keys[_loopIndex76];
      search.push(key + "=" + encodeURIComponent(info[key]));
    }
    var downlCount = Prefs.notificationdata.downloadCount || 0;
    if (downlCount > 4)
    {
      if (downlCount < 8)
      {
        downlCount = "5-7";
      }
      else if (downlCount < 30)
      {
        downlCount = "8-29";
      }
      else if (downlCount < 90)
      {
        downlCount = "30-89";
      }
      else if (downlCount < 180)
      {
        downlCount = "90-179";
      }
      else
      {
        downlCount = "180+";
      }
    }
    search.push("notificationDownloadCount=" + encodeURIComponent(downlCount));
    chrome.runtime.setUninstallURL(Utils.getDocLink("uninstalled") + "&randomnumber=" + Math.floor(Math.random() * 100000) + "&bt=" + BuildType + "&" + search.join("&"));
  }
  if ("setUninstallURL" in chrome.runtime)
  {
    Prefs.untilLoaded.then(setUninstallURL);
    Prefs.on("notificationdata", setUninstallURL);
  }
  return exports;
})();
require.scopes["punycode"] = (function()
{
  var exports = {};;
  (function()
  {
    var punycode, maxInt = 2147483647,
      base = 36,
      tMin = 1,
      tMax = 26,
      skew = 38,
      damp = 700,
      initialBias = 72,
      initialN = 128,
      delimiter = "-",
      regexPunycode = /^xn--/,
      regexNonASCII = /[^ -~]/,
      regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g,
      errors = {
        "overflow": "Overflow: input needs wider integers to process",
        "not-basic": "Illegal input >= 0x80 (not a basic code point)",
        "invalid-input": "Invalid input"
      }, baseMinusTMin = base - tMin,
      floor = Math.floor,
      stringFromCharCode = String.fromCharCode,
      key;

    function error(type)
    {
      throw RangeError(errors[type]);
    }

    function map(array, fn)
    {
      var length = array.length;
      while (length--)
      {
        array[length] = fn(array[length]);
      }
      return array;
    }

    function mapDomain(string, fn)
    {
      return map(string.split(regexSeparators), fn).join(".");
    }

    function ucs2decode(string)
    {
      var output = [],
        counter = 0,
        length = string.length,
        value, extra;
      while (counter < length)
      {
        value = string.charCodeAt(counter++);
        if (value >= 55296 && value <= 56319 && counter < length)
        {
          extra = string.charCodeAt(counter++);
          if ((extra & 64512) == 56320)
          {
            output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
          }
          else
          {
            output.push(value);
            counter--;
          }
        }
        else
        {
          output.push(value);
        }
      }
      return output;
    }

    function ucs2encode(array)
    {
      return map(array, function(value)
      {
        var output = "";
        if (value > 65535)
        {
          value -= 65536;
          output += stringFromCharCode(value >>> 10 & 1023 | 55296);
          value = 56320 | value & 1023;
        }
        output += stringFromCharCode(value);
        return output;
      }).join("");
    }

    function basicToDigit(codePoint)
    {
      if (codePoint - 48 < 10)
      {
        return codePoint - 22;
      }
      if (codePoint - 65 < 26)
      {
        return codePoint - 65;
      }
      if (codePoint - 97 < 26)
      {
        return codePoint - 97;
      }
      return base;
    }

    function digitToBasic(digit, flag)
    {
      return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    }

    function adapt(delta, numPoints, firstTime)
    {
      var k = 0;
      delta = firstTime ? floor(delta / damp) : delta >> 1;
      delta += floor(delta / numPoints);
      for (; delta > baseMinusTMin * tMax >> 1; k += base)
      {
        delta = floor(delta / baseMinusTMin);
      }
      return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
    }

    function decode(input)
    {
      var output = [],
        inputLength = input.length,
        out, i = 0,
        n = initialN,
        bias = initialBias,
        basic, j, index, oldi, w, k, digit, t, length, baseMinusT;
      basic = input.lastIndexOf(delimiter);
      if (basic < 0)
      {
        basic = 0;
      }
      for (j = 0; j < basic; ++j)
      {
        if (input.charCodeAt(j) >= 128)
        {
          error("not-basic");
        }
        output.push(input.charCodeAt(j));
      }
      for (index = basic > 0 ? basic + 1 : 0; index < inputLength;)
      {
        for ((oldi = i, w = 1, k = base);; k += base)
        {
          if (index >= inputLength)
          {
            error("invalid-input");
          }
          digit = basicToDigit(input.charCodeAt(index++));
          if (digit >= base || digit > floor((maxInt - i) / w))
          {
            error("overflow");
          }
          i += digit * w;
          t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (digit < t)
          {
            break;
          }
          baseMinusT = base - t;
          if (w > floor(maxInt / baseMinusT))
          {
            error("overflow");
          }
          w *= baseMinusT;
        }
        out = output.length + 1;
        bias = adapt(i - oldi, out, oldi == 0);
        if (floor(i / out) > maxInt - n)
        {
          error("overflow");
        }
        n += floor(i / out);
        i %= out;
        output.splice(i++, 0, n);
      }
      return ucs2encode(output);
    }

    function encode(input)
    {
      var n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [],
        inputLength, handledCPCountPlusOne, baseMinusT, qMinusT;
      input = ucs2decode(input);
      inputLength = input.length;
      n = initialN;
      delta = 0;
      bias = initialBias;
      for (j = 0; j < inputLength; ++j)
      {
        currentValue = input[j];
        if (currentValue < 128)
        {
          output.push(stringFromCharCode(currentValue));
        }
      }
      handledCPCount = basicLength = output.length;
      if (basicLength)
      {
        output.push(delimiter);
      }
      while (handledCPCount < inputLength)
      {
        for ((m = maxInt, j = 0); j < inputLength; ++j)
        {
          currentValue = input[j];
          if (currentValue >= n && currentValue < m)
          {
            m = currentValue;
          }
        }
        handledCPCountPlusOne = handledCPCount + 1;
        if (m - n > floor((maxInt - delta) / handledCPCountPlusOne))
        {
          error("overflow");
        }
        delta += (m - n) * handledCPCountPlusOne;
        n = m;
        for (j = 0; j < inputLength; ++j)
        {
          currentValue = input[j];
          if (currentValue < n && ++delta > maxInt)
          {
            error("overflow");
          }
          if (currentValue == n)
          {
            for ((q = delta, k = base);; k += base)
            {
              t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
              if (q < t)
              {
                break;
              }
              qMinusT = q - t;
              baseMinusT = base - t;
              output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
              q = floor(qMinusT / baseMinusT);
            }
            output.push(stringFromCharCode(digitToBasic(q, 0)));
            bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
            delta = 0;
            ++handledCPCount;
          }
        }++delta;
        ++n;
      }
      return output.join("");
    }

    function toUnicode(domain)
    {
      return mapDomain(domain, function(string)
      {
        return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
      });
    }

    function toASCII(domain)
    {
      return mapDomain(domain, function(string)
      {
        return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
      });
    }
    exports = {
      "version": "1.2.3",
      "ucs2": {
        "decode": ucs2decode,
        "encode": ucs2encode
      },
      "decode": decode,
      "encode": encode,
      "toASCII": toASCII,
      "toUnicode": toUnicode
    };
  })();
  return exports;
})();
