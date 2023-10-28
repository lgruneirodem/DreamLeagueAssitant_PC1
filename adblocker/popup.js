/*
#* This file is part of StopAll Ads <http://www.stopallads.com/>,
#* Copyright (C) 2016 Tweaking Techonologies

#* StopAll Ads is a fork of the Adblock Plus version 2.7.3 extension for 
#* blocking advertisements on the web. 
#* This fork will provide the same features as Adblock Plus

#* StopAll Ads is distributed in the hope that it will be useful,
#* but WITHOUT ANY WARRANTY; without even the implied warranty of
#* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#* GNU General Public License for more details.
#*
#* You should have received a copy of the GNU General Public License
#* along with StopAll Ads.  If not, see <http://www.gnu.org/licenses/>.


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

var backgroundPage = ext.backgroundPage.getWindow();
var require = backgroundPage.require;

var Filter = require("filterClasses").Filter;
var FilterStorage = require("filterStorage").FilterStorage;
var Prefs = require("prefs").Prefs;
var checkWhitelisted = require("whitelisting").checkWhitelisted;
var getDecodedHostname = require("url").getDecodedHostname;

var page = null;

function isExtDisabled(_enable) {
    if (_enable) {
        if (document.getElementById("enabled-no")) {
            $("#enabled-yes").show();
        }
        if (document.getElementById("enabled-yes")) {
            $("#enabled-no").hide();
        }
    }
    else {
        if (document.body.classList.contains("disabled")) {
            if (document.getElementById("enabled-no")) {
                $("#enabled-no").show();
            }
            if (document.getElementById("enabled-yes")) {
                $("#enabled-yes").hide();
            }
        }
        else {
            if (document.getElementById("enabled-no")) {
                $("#enabled-yes").show();
            }
            if (document.getElementById("enabled-yes")) {
                $("#enabled-no").hide();
            }
        }
    }
}

function isExtBlockDisabled(_enable) {
    if (_enable) {
        if (document.getElementById("clickhide")) {
            $("#clickhide").show();
        }
        if (document.getElementById("clickhide-cancel")) {
            $("#clickhide-cancel").hide();
        }
    }
    else {
        if (document.body.classList.contains("clickhide-active")) {
            if (document.getElementById("clickhide-cancel")) {
                $("#clickhide-cancel").show();
            }
            if (document.getElementById("clickhide")) {
                $("#clickhide").hide();
            }
        }
        else {
            if (document.getElementById("clickhide")) {
                $("#clickhide").show();
            }
            if (document.getElementById("clickhide-cancel")) {
                $("#clickhide-cancel").hide();
            }
        }
    }
}

function onLoad() {
    isExtDisabled(true);
    isExtBlockDisabled(true);

    ext.pages.query({ active: true, lastFocusedWindow: true }, function (pages) {
        page = pages[0];

        // Mark page as 'local' or 'nohtml' to hide non-relevant elements
        if (!page || (page.url.protocol != "http:" &&
            page.url.protocol != "https:"))
            document.body.classList.add("local");
        else if (!require("filterComposer").isPageReady(page)) {
            document.body.classList.add("nohtml");
            require("messaging").getPort(window).on(
                "composer.ready", function (message, sender) {
                    if (sender.page.id == page.id)
                        document.body.classList.remove("nohtml");
                }
            );
        }

        // Ask content script whether clickhide is active. If so, show cancel button.
        // If that isn't the case, ask background.html whether it has cached filters. If so,
        // ask the user whether she wants those filters.
        // Otherwise, we are in default state.
        if (page) {
            if (checkWhitelisted(page)) {
                document.body.classList.add("disabled");
                isExtDisabled();
            }


            page.sendMessage({ type: "composer.content.getState" }, function (response) {
                if (response && response.active) {
                    document.body.classList.add("clickhide-active");
                    isExtBlockDisabled();
                }

            });
        }


        // For Safari, if the content blocking API is active we need to hide the
        // stats section. (The content blocking API doesn't provide a way for us to
        // offer those blocking statistics.)
        ext.backgroundPage.sendMessage({ type: "safari.contentBlockingActive" },
            function (contentBlockingActive) {
                if (contentBlockingActive)
                    document.body.classList.add("contentblocking-active");
            }
        );
    });

    document.getElementById("enabled").addEventListener("click", toggleEnabled, false);
    document.getElementById("clickhide").addEventListener("click", activateClickHide, false);
    document.getElementById("clickhide-cancel").addEventListener("click", cancelClickHide, false);
    document.getElementById("options").addEventListener("click", function () {
        ext.showOptions();
    }, false);

    // Set up collapsing of menu items
    var collapsers = document.getElementsByClassName("collapse");
    for (var i = 0; i < collapsers.length; i++) {
        var collapser = collapsers[i];
        collapser.addEventListener("click", toggleCollapse, false);
        if (!Prefs[collapser.dataset.option])
            document.getElementById(collapser.dataset.collapsable).classList.add("collapsed");
    }
}

function toggleEnabled() {
    var disabled = document.body.classList.toggle("disabled");
    if (disabled) {
        var host = getDecodedHostname(page.url).replace(/^www\./, "");
        var filter = Filter.fromText("@@||" + host + "^$document");
        if (filter.subscriptions.length && filter.disabled)
            filter.disabled = false;
        else {
            filter.disabled = false;
            FilterStorage.addFilter(filter);
        }
    }
    else {
        // Remove any exception rules applying to this URL
        var filter = checkWhitelisted(page);
        while (filter) {
            FilterStorage.removeFilter(filter);
            if (filter.subscriptions.length)
                filter.disabled = true;
            filter = checkWhitelisted(page);
        }
    }
    isExtDisabled();
}

function activateClickHide() {
    document.body.classList.add("clickhide-active");
    page.sendMessage({ type: "composer.content.startPickingElement" });

    // Close the popup after a few seconds, so user doesn't have to
    activateClickHide.timeout = window.setTimeout(ext.closePopup, 5000);
    isExtBlockDisabled();
}

function cancelClickHide() {
    if (activateClickHide.timeout) {
        window.clearTimeout(activateClickHide.timeout);
        activateClickHide.timeout = null;
    }
    document.body.classList.remove("clickhide-active");
    page.sendMessage({ type: "composer.content.finished" });
    isExtBlockDisabled();
}

function toggleCollapse(event) {
    var collapser = event.currentTarget;
    Prefs[collapser.dataset.option] = !Prefs[collapser.dataset.option];
    collapser.parentNode.classList.toggle("collapsed");
}

document.addEventListener("DOMContentLoaded", onLoad, false);

/*
JS Code to hide/unhide stats
*/
$(window).scroll(function () {
    if ($(this).scrollTop() > 1) {
        $('.header').addClass("fixed");
    }
    else {
        $('.header').removeClass("fixed");
    }
});
$(document).ready(function () {
    
    var isprivacyclicked = false;

    chrome.storage.sync.get("privacyclicked", function (obj) {
        isprivacyclicked = obj.privacyclicked == "1" ? true : false;

        if (isprivacyclicked) {
            $(".privacy-tools").hide();
            $(".privacy-tools-bottom").show();
        }
        else {
            $(".privacy-tools").show();
            $(".privacy-tools-bottom").hide();
        }
    })

    // Privacy Tools
    $(".privacy-tools,.privacy-tools-bottom").click(function () {
        chrome.storage.sync.set({ "privacyclicked": "1" }, function () {
        })
        $(".pop-up-content").hide();
        $(".pop-up-footer").hide();
        $(".privacy-tools").hide();
        $(".privacy-tools-detail").show();
    });

    $(".pyt-back-col").click(function () {
        $(".pop-up-content").show();
        $(".pop-up-footer").show();
        $(".privacy-tools").hide();
        $(".privacy-tools-bottom").show();
        $(".privacy-tools-detail").hide();
    });

    // End Privacy Tools


    $('#stats-container').click(function () {
        $("#stats").slideToggle();

    });
    $('#stats-report').click(function () {
        $("#outer-wrapper").slideToggle();

    });
    function b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    }
    chrome.tabs.getSelected(null, function (tab) {
        $('#SFdynamic').attr('href', 'http://www.stopallads.com/en/support?eurl=' + b64EncodeUnicode(tab.url));
    })
});
try {

    var wow = new WOW({ mobile: false }); wow.sync(); wow.init();
}
catch (err) { }

//jQuery to collapse the navbar on scroll