function init_tutorial() {
    $("#selection_arrow").show().animate({
        left: "+=30"
    }, 300, function() {
        
    })
}
var bg = chrome.extension.getBackgroundPage(),
    bgScreencapture = bg.screenshot,
    option_icon_state = !1;
$(document).ready(function() {
    if ($("#entire").click(function() {
            localStorage.firstuse = !1, bgScreencapture.destroyscrollSelected(), bgScreencapture.destroydomcapture(), bgScreencapture.captureEntire(), window.close()
        }), $("#visible").click(function() {
            localStorage.firstuse = !1, bgScreencapture.captureVisible(), window.close()
        }), $("#scroll").click(function() {
            localStorage.firstuse = !1, bgScreencapture.destroydomcapture(), bgScreencapture.scrollSelected(), window.close()
        }), $("#domcapture").click(function() {
            localStorage.firstuse = !1, bgScreencapture.destroyscrollSelected(), bgScreencapture.domcapture(), window.close()
        }), $("#ok_button").click(function() {
            window.close()
        }), $("#close").click(function() {
            localStorage.firstuse = !1, $(this).hide(), $(".arrows, .tutorial_text").fadeOut(200, function() {
                $(".arrows, .tutorial_text").remove(), $("body").animate({
                    height: "148px"
                }, 100, function() {
                    $("body").animate({
                        width: "245px"
                    }, 100)
                }), $("#outer-wrapper").css({
                    "padding-bottom": "0",
                    "border-bottom": "0"
                }), $(".options_wrapper, .about_stopallads_wrapper").show()
            })
        }), "true" === localStorage.firstuse ? ($(".options_wrapper, .about_stopallads_wrapper").hide(), $("body").css({
            width: "245px",
            height: "auto"
        }), /* $("#outer-wrapper").css({
            "padding-bottom": "28px",
            "border-left": "1px solid #ccc",
            "border-bottom": "1px solid #ccc",
            "box-shadow": "-1px 1px 6px #ccc"
        }), */ setTimeout(function() {
            init_tutorial()
        }, 100)) : ($("#tutorial").hide(), $("#outer-wrapper").css({
            "padding-bottom": "0px",
            border: "none",
            "box-shadow": "none"
        }), $(".options_wrapper, .about_stopallads_wrapper").show(), $("body").css({
            width: "245px",
            height: "auto",
            background: "#fff"
        })), $("#options_icon").click(function() {
            option_icon_state === !1 ? (option_icon_state = !0, $("#options_icon").addClass("active")) : (option_icon_state = !1, $("#options_icon").removeClass("active")), $("#extension_option").slideToggle(200)
        }), "true" === localStorage.flashSound) {
        var o = !0;
        $("#sound-text").text("Turn Off Capture Sound")
    } else {
        var o = !1;
        $("#sound-text").text("Turn On Capture Sound")
    }
    var t = {
        show_labels: !1,
        checked: o
    };
    $("input#togglesound").switchButton(t), $(".switch-button-background, .switch-button-button").on("click", function() {
        $("input#togglesound").is(":checked") ? (localStorage.flashSound = !0, $("#sound-text").text("Turn Off Capture Sound")) : (localStorage.flashSound = !1, $("#sound-text").text("Turn On Capture Sound"))
    }), $("#scroll").hover(function() {
        $("#scroll img").attr("src", "skin/selection_hover.gif")
    }, function() {
        $("#scroll img").attr("src", "skin/selection.png")
    }), $("#entire").hover(function() {
        $("#entire img").attr("src", "skin/fullpage_hover.gif")
    }, function() {
        $("#entire img").attr("src", "skin/fullpage.png")
    }), $("#domcapture").hover(function() {
        $("#domcapture img").attr("src", "skin/dom_hover.gif")
    }, function() {
        $("#domcapture img").attr("src", "skin/dom.png")
    })
});