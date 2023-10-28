function getTimeStamp() {
    var e, t, o, a, n, r, s = new Date;
    return e = s.getFullYear(), t = s.getMonth() + 1, o = s.getDate(), a = s.getHours(), n = s.getMinutes(), r = s.getSeconds(), 10 > t && (t = "0" + t), 10 > o && (o = "0" + o), 10 > a && (a = "0" + a), 10 > n && (n = "0" + n), 10 > r && (r = "0" + r), e + "-" + t + "-" + o + " " + a + "-" + n + "-" + r
}
var screenshot = {
    path: "filesystem:chrome-extension://" + chrome.i18n.getMessage("@@extension_id") + "/temporary/",
    generated: !1,
    newwholepage: !0,
    imgData: null,
    dimensions: [],
    domcaptureFullScreen: !1,
    openPage: function(e) {
        chrome.tabs.create({
            url: e
        }, function() {})
    },
    captureEntire: function() {
        function e(e) {
            screenshot.newwholepage = !0, a = {}, 1 == scrollToCrop ? chrome.tabs.sendRequest(e.id, {
                msg: "scrollPage",
                scrollToCrop: !0,
                xs: xs,
                ys: ys,
                ws: ws,
                hs: hs
            }, function() {}) : chrome.tabs.sendRequest(e.id, {
                msg: "scrollPage",
                scrollToCrop: !1,
                hideFixedElements: "true" === localStorage.hideFixedElements
            }, function() {})
        }

        function t(e, t, o) {
            var n = e.devicePixelRatio || 1;
            localStorage.metaDescription = e.meta_description;
            var r = null;
            screenshot.newwholepage && (screenshot.newwholepage = !1, r || (r = document.createElement("canvas")), r.width = Math.round(e.totalWidth * n), r.height = Math.round(e.totalHeight * n), a.canvas = r, a.ctx = r.getContext("2d")), chrome.tabs.captureVisibleTab(null, {
                format: "png",
                quality: 100
            }, function(t) {
                if (t) {
                    var r = new Image;
                    r.onload = function() {
                        a.ctx.drawImage(r, Math.round(e.x * n), Math.round(e.y * n), Math.round(e.width * n), Math.round(e.height * n)), o(!0)
                    }, r.src = t
                }
            })
        }

        function o(e) {
            var t = e.devicePixelRatio || 1;
            localStorage.metaDescription = e.meta_description;
            var o = a.canvas.toDataURL();
            if (1 == screenshot.domcaptureFullScreen) return screenshot.domcaptureFullScreen = !1, screenshot.domElementCapture(o), !1;
            var n, r = "screencapture.png";
            if (1 == scrollToCrop) {
                var s = null;
                scrollToCrop = !1, localStorage.imgdata = "", s || (s = document.createElement("canvas"), document.body.appendChild(s));
                var c = new Image;
                c.onload = function() {
                    s.width = Math.round(e.w * t), s.height = Math.round(e.h * t);
                    var o = s.getContext("2d");
                    o.drawImage(c, Math.round(e.x * t), Math.round(e.y * t), Math.round(e.w * t), Math.round(e.h * t), 0, 0, Math.round(e.w * t), Math.round(e.h * t));
                    var a = s.toDataURL("image/png");
                    r = Date.now() + "screencapture." + localStorage.format, screenshot.createBlob(a, r, function() {
                        localStorage.imgdata = screenshot.path + r, screenshot.createEditPage("edit")
                    })
                }, c.src = o
            }
            screenshot.createBlob(o, r, function() {
                localStorage.imgdata = screenshot.path + r, 1 == saveScroll ? saveScroll = !1 : screenshot.createEditPage(n)
            })
        }
        var a = {};
        screenshot.generated || (screenshot.generated = !0, chrome.extension.onRequest.addListener(function(e, a, n) {
            var r = {
                capturePage: t,
                openPage: o
            }[e.msg];
            r && r(e, a, n)
        })), chrome.tabs.getSelected(null, function(t) {
            chrome.tabs.executeScript(null, {
                file: "ext/jquery.js"
            }, function() {
                chrome.tabs.executeScript(t.id, {
                    file: "ext/page.js"
                }, function() {
                    e(t)
                })
            })
        })
    },
    setScreenName: function(e) {
        localStorage.screenname = "screenshot-by-stopallads", chrome.tabs.getSelected(null, function(t) {
            var o = {
                url: t.url,
                title: t.title,
                time: getTimeStamp()
            };
            localStorage.pageinfo = JSON.stringify(o), localStorage.screenname = screenshot.getFileName(o), "function" == typeof e && e(o)
        })
    },
    captureVisible: function() {
        chrome.tabs.captureVisibleTab(null, {
            format: "png",
            quality: 100
        }, function(e) {
            localStorage.imgdata = e, screenshot.createEditPage()
        })
    },
    captureWindow: function() {},
    captureScreenCallback: function(e) {
        screenshot.createBlob("data:image/bmp;base64," + e, "screencapture.png", function() {
            localStorage.imgdata = screenshot.path + "screencapture.png", screenshot.createEditPage()
        })
    },
    createBlob: function(e, t, o) {
        function a() {
            o && o(u.size)
        }

        function n() {
            console.log("Error!")
        }
        screenshot.imgData = e;
        for (var r = atob(e.split(",")[1]), s = e.split(",")[0].split(":")[1].split(";")[0], c = new ArrayBuffer(r.length), l = new Uint8Array(c), i = 0; i < r.length; i++) l[i] = r.charCodeAt(i);
        var u = new Blob([c], {
            type: s
        });
        window.webkitRequestFileSystem(TEMPORARY, 1048576, function(e) {
            e.root.getFile(t, {
                create: !0
            }, function(e) {
                e.createWriter(function(e) {
                    e.onwriteend = a, e.write(u)
                }, n)
            }, n)
        }, n)
    },
    createEditPage: function(e) {
        var t = e || localStorage.enableEdit;
        switch (t) {
            case "save":
                screenshot.setScreenName(function(e) {
                    screenshot.convertBase64To(localStorage.imgdata, function(t) {
                        screenshot.download({
                            url: t,
                            pageinfo: e
                        })
                    })
                });
                break;
            case "edit":
            default:
                screenshot.setScreenName(), chrome.tabs.create({
                    url: "edit.html" + ("edit" == t ? "" : "?" + t)
                }, function() {})
        }
    },
    init: function() {},
    convertBase64To: function(e, t) {
        if ("png" == localStorage.format) t(e);
        else {
            var o = new Image;
            o.onload = function() {
                var e = document.createElement("canvas");
                e.width = o.width, e.height = o.height;
                var a = e.getContext("2d");
                a.drawImage(o, 0, 0, o.width, o.height);
                var n = (a.getImageData(0, 0, o.width, o.height), e.toDataURL("image/" + localStorage.format, localStorage.imageQuality / 100));
                t(n)
            }, o.src = localStorage.imgdata
        }
    },
    download: function(e) {
        /Linux/.test(window.navigator.platform) && /Chrome\/35/.test(window.navigator.userAgent) && (localStorage.enableSaveAs = "false"), console.log(e.url), chrome.downloads.download({
            url: e.url,
            filename: screenshot.getFileName(e.pageinfo, !0)
        }, function() {})
    },
    getFileName: function(e, t) {
        localStorage.url = e.url, localStorage.pageTitle = e.title;
        var o = localStorage.fileNamePattern;
        if ("object" != typeof e) return e;
        try {
            o = o.replace(/{url}/, e.url || "").replace(/{title}/, e.title || "").replace(/{domain}/, e.url.match(/^[^/]+\/\/([^/]+)/)[1] || "").replace(/{date}/, e.time.split(" ")[0] || "").replace(/{time}/, screenshot.formatAMPM() || "")
        } catch (a) {
            console.log(o)
        }
        return o.replace(/[\*\|\\\:\"\<\>\?\/]+/gi, " ") + (t ? "." + localStorage.format : "")
    },
    formatAMPM: function() {
        var e = new Date,
            t = e.getHours(),
            o = e.getMinutes(),
            a = e.getSeconds(),
            n = t >= 12 ? "_pm" : "_am";
        t %= 12, t = t ? t : 12, o = 10 > o ? "0" + o : o;
        var r = t + "-" + o + "-" + a + n;
        return r
    },
    scrollSelected: function() {
        chrome.tabs.getSelected(null, function(e) {
            chrome.tabs.insertCSS(null, {
                file: "skin/jquery.Jcrop.css"
            }), chrome.tabs.insertCSS(null, {
                file: "skin/stylecrop.css"
            }), chrome.tabs.executeScript(null, {
                file: "ext/jquery.js"
            }, function() {
                chrome.tabs.executeScript(null, {
                    file: "ext/jquery.Jcrop.js"
                }, function() {
                    chrome.tabs.executeScript(null, {
                        file: "ext/scrolltoCrop.js"
                    }, function() {
                        chrome.tabs.sendRequest(e.id, {
                            type: "setOptions",
                            flashSound: localStorage.flashSound
                        }, function() {})
                    })
                })
            })
        })
    },
    destroyscrollSelected: function() {
        chrome.tabs.getSelected(null, function(e) {
            chrome.tabs.insertCSS(null, {
                file: "skin/jquery.Jcrop.css"
            }), chrome.tabs.insertCSS(null, {
                file: "skin/stylecrop.css"
            }), chrome.tabs.executeScript(null, {
                file: "ext/jquery.js"
            }, function() {
                chrome.tabs.executeScript(null, {
                    file: "ext/jquery.Jcrop.js"
                }, function() {
                    chrome.tabs.executeScript(null, {
                        file: "ext/scrolltoCrop.js"
                    }, function() {
                        chrome.tabs.sendRequest(e.id, {
                            type: "destroy_selected",
                            flashSound: localStorage.flashSound
                        }, function() {})
                    })
                })
            })
        })
    },
    domcapture: function() {
        chrome.tabs.getSelected(null, function(e) {
            chrome.tabs.executeScript(null, {
                file: "ext/jquery.js"
            }, function() {
                chrome.tabs.executeScript(null, {
                    file: "ext/contentscript.js"
                }, function() {
                    chrome.tabs.sendRequest(e.id, {
                        type: "start",
                        flashSound: localStorage.flashSound
                    }, function() {})
                })
            })
        })
    },
    destroydomcapture: function() {
        chrome.tabs.getSelected(null, function(e) {
            chrome.tabs.executeScript(null, {
                file: "ext/jquery.js"
            }, function() {
                chrome.tabs.executeScript(null, {
                    file: "ext/contentscript.js"
                }, function() {
                    chrome.tabs.sendRequest(e.id, {
                        type: "destroy",
                        flashSound: localStorage.flashSound
                    }, function() {})
                })
            })
        })
    },
    domElementCapture: function(e) {
        var t = window.devicePixelRatio,
            o = null;
        o || (o = document.createElement("canvas"), document.body.appendChild(o));
        var a = new Image;
        a.onload = function() {
            o.width = Math.round(screenshot.dimensions.width * t), o.height = Math.round(screenshot.dimensions.height * t);
            var e = o.getContext("2d");
            e.drawImage(a, Math.round(screenshot.dimensions.left * t), Math.round(screenshot.dimensions.top * t), Math.round(screenshot.dimensions.width * t), Math.round(screenshot.dimensions.height * t), 0, 0, Math.round(screenshot.dimensions.width * t), Math.round(screenshot.dimensions.height * t));
            var n = o.toDataURL("image/png");
            name = Date.now() + "screencapture." + localStorage.format, screenshot.createBlob(n, name, function() {
                localStorage.imgdata = screenshot.path + name, screenshot.createEditPage("edit")
            })
        }, a.src = e
    },
    testValidURLs: function(e) {
        var t, o;
        for (o = noMatches.length - 1; o >= 0; o--)
            if (noMatches[o].test(e)) return !1;
        for (o = matches.length - 1; o >= 0; o--)
            if (t = new RegExp("^" + matches[o].replace(/\*/g, ".*") + "$"), t.test(e)) return !0;
        return !1
    }
};
chrome.tabs.onUpdated.addListener(function(e, t, o) {
    chrome.browserAction.setPopup(screenshot.testValidURLs(o.url) ? {
        tabId: o.id,
        popup: "popup.html"
    } : {
        tabId: o.id,
        popup: "popup.html"
    })
}), chrome.runtime.onInstalled.addListener(function() {}), chrome.extension.onMessage.addListener(function(e, t, o) 
{
    if ("openpage" === e.msg) screenshot.openPage(e.url);
    else if ("getformat" === e.msg) o({
        format: localStorage.format,
        quality: localStorage.imageQuality
    });
    else if ("saveCropPosition" === e.msg) localStorage.cropPosition = JSON.stringify(e.position);
    else if ("getCropPosition" === e.msg) o("true" === localStorage.saveCropPosition && JSON.parse(localStorage.cropPosition));
    else if ("saveCropScrollPosition" === e.msg) localStorage.cropScrollPosition = JSON.stringify(e.position);
    else if ("getCropScrollPosition" === e.msg) o("true" === localStorage.saveCropPosition && JSON.parse(localStorage.cropScrollPosition));
    else if ("getfilename" === e.msg) e.pageinfo.time = getTimeStamp(), o(screenshot.getFileName(e.pageinfo, !1));
    else if ("up" == e.type) {
        scrollToCrop = !0, saveScroll = !0, xs = e.dimensions.left, ys = e.dimensions.top, ws = e.dimensions.width, hs = e.dimensions.height; {
            screenshot.captureEntire()
        }
    }
});
var xs, ys, ws, hs, scrollToCrop = !1,
    saveScroll = !1,
    pathImg, stopalladsScroll = !1,
    thisCrop, matches = ["http://*/*", "https://*/*", "ftp://*/*", "file://*/*"],
    noMatches = [/^https?:\/\/chrome.google.com\/.*$/];
chrome.extension.onRequest.addListener(function(e) {
    "cap" == e.operation && (xs = e.xs, ys = e.ys, ws = e.ws, hs = e.hs), "stopalladsScroll" == e.operation && (stopalladsScroll = !0, scrollToCrop = !0, screenshot.captureEntire()), "saveScroll" == e.operation && (scrollToCrop = !0, saveScroll = !0, screenshot.captureEntire()), "Crop" == e.operation && (thisCrop = e.parameter)
}), localStorage.flashSound = localStorage.flashSound || !1, localStorage.firstuse = localStorage.firstuse || !0, localStorage.format = localStorage.format || "png", localStorage.imageQuality = localStorage.imageQuality || "92", localStorage.hideFixedElements = localStorage.hideFixedElements || "false", localStorage.fileNamePattern = "StopAllAds_Capture {date}_{time}", localStorage.saveCropPosition = localStorage.saveCropPosition || "false", localStorage.cropPosition = localStorage.cropPosition || JSON.stringify({
    x: 50,
    y: 50,
    x2: 450,
    y2: 250,
    w: 400,
    h: 200
}), localStorage.cropScrollPosition = localStorage.cropScrollPosition || JSON.stringify({
    x: 50,
    y: 50,
    x2: 450,
    y2: 250,
    w: 400,
    h: 200
}), window.onload = function() {
    screenshot.init()
};