/*!
 * Acknowledgment: 
 * Screenshot Plugin Source derived and modified from voila-web-screenshot
 */
$(document).ready(function() {
    var e = "Unknown OS"; - 1 != navigator.appVersion.indexOf("Win") && (e = "Windows"), -1 != navigator.appVersion.indexOf("Mac") && (e = "MacOS"), "Windows" == e && ($("#save-to-stopallads").remove(), $(".theme-btn").css({
        width: "96%"
    }), $(".save-btn .icon").css({
        margin: "0px 0px 0px 50px"
    }), $("#iframe").attr("src", "")), $("#iframe").on("load", function() {
        $("#loader").hide()
    })
    $(".content").mCustomScrollbar({
        theme:"minimal"
    })
}), $(function() {
    function e() {
        $("#editcanva").width(l.width()).height(l.height()), r = $("#editcanva").canvasPaint(), r.loadBackgroundImage(i, function() {
            $("#loadingDiv").hide();
            var e = document.getElementById("canvasfon");
            $("#image_dimensions").text(e.width + " x " + e.height);
            var a = document.getElementById("canvasbg"),
                o = document.createElement("canvas");
            o.width = e.width, o.height = e.height;
            var r = o.getContext("2d");
            r.drawImage(e, 0, 0), r.drawImage(a, 0, 0);
            var i = (new Date).getTime() + "screenshot.",
                s = localStorage.format || "png";
            i += s, c = o.toDataURL("image/" + s, localStorage.imageQuality / 100); {
                var d = chrome.extension.getBackgroundPage().screenshot;
                d.path + i
            }
            d.createBlob(c, i, function(e) {
                var a = (e / 1e3).toFixed(2);
                1e3 > a ? a = a.toString().replace(",", ".").replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, "$&,") + " KB" : (a = (a / 1024).toFixed(2), a = a.toString().replace(",", ".").replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, "$&,") + " MB"), $("#image_size").text(a)
            });
            var m = d.getFileName(g, !0),
                h = m.split(".png");
            $("#image_name_text").val(h[0]), $("#filename_ext").text("." + s), $("#image_url").val(localStorage.url);
            var u = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
                v = new Date,
                w = v.getDate(),
                p = v.getMonth(),
                f = v.getFullYear();
            $("#image_date").text(u[p] + " " + w + " " + f + ", " + n()), l.height() >= 800 && $("#imageedit").css({
                position: "relative"
            })
        }), a(), $("#canvasbg, #canvascurrent").hide(), window.devicePixelRatio >= 2 && $("#editcanva").css({
            zoom: "50%"
        })
    }
	function bs64(src, callback, outputFormat) 
	{
	  var img = new Image();
	  img.crossOrigin = 'Anonymous';
	  img.onload = function() {
		var canvas = document.createElement('CANVAS');
		var ctx = canvas.getContext('2d');
		var dataURL;
		canvas.height = this.height;
		canvas.width = this.width;
		ctx.drawImage(this, 0, 0);
		dataURL = canvas.toDataURL(outputFormat);
		callback(dataURL);
	  };
	  img.src = src;
	  if (img.complete || img.complete === undefined) {
		img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
		img.src = src;
	  }
	}
    function a() {
        $("#save-img"), $("#background");
        $("#save-image").click(function() {
            var e = document.getElementById("canvasfon"),
                a = document.getElementById("canvasbg"),
                t = document.createElement("canvas");
            t.width = e.width, t.height = e.height;
            var n = t.getContext("2d");
            n.drawImage(e, 0, 0), n.drawImage(a, 0, 0);
            var o = $("#imgfordownload"),
                r = (new Date).getTime() + "screenshot.",
                i = localStorage.format || "png";
            r += i, c = t.toDataURL("image/" + i, localStorage.imageQuality / 100);
            var g = chrome.extension.getBackgroundPage().screenshot,
                l = g.path + r;
            g.createBlob(c, r, function() {
                o.attr("href", l);
                var e = chrome.extension.getBackgroundPage().screenshot;
                e.download({
                    url: $("#imgfordownload").attr("href"),
                    pageinfo: $("#image_name_text").val() + $("#filename_ext").text()
                })
            })
        }),$("#sendReport").click(function() {
			var srcurl=$('#imageedit').attr('src');
			var email=$('#email').val();
			var comment=$('#comments').val();
			var url=$('#image_url').val();
            var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
            if(!pattern.test(email))
            {
              email = "";
            }
			var msg="";
			if(email=="" || comment=="")
				msg+="* fileds are missing or Invalid.\n";
			if(msg=="")
			{
				$('#report').html('');
				bs64(srcurl, function(base64Img) 
				{
					var additionalParams = {	  
					  headers: {						
						enckey:""
					  }
					};
					//console.log(base64Img);
					var data={"url":url,"image":base64Img,"email":email,"comments":comment};
					var apigClient = apigClientFactory.newClient({
					  apiKey: 'u6kb9MVNZa1AUQGJ0KYNc4QeoiT4Ksnp8SZImWfL'
					});	
					apigClient.reportPost('', JSON.stringify(data), additionalParams)
					.then(function(result)
					{
//						if(parseInt(result.status)==200)
//						{				
//							//document.write(result.data);							
//							console.log(result.data);
//							$('#report').html('<p style="color:green;">'+result.data+'</p>');
//						}	
                        chrome.tabs.getCurrent(function(tab) {
                            chrome.tabs.remove(tab.id, function() { });
                        }); 
					}).catch( function(result)
					{
						
						//document.write(JSON.stringify(result));
						console.log(result);
						//$('#report').html('<p style="color:red;">'+result+'</p>');
                        chrome.tabs.getCurrent(function(tab) {
                            chrome.tabs.remove(tab.id, function() { });
                        }); 
					});                                       
				});
			}
			else
			{
				$('#report').html('<p style="color:red;font-size: 14px;margin: 0;text-align: left;">'+msg+'</p>');
			}
		}),$('#close_tab').click(function(){
			chrome.tabs.getCurrent(function(tab) {
				chrome.tabs.remove(tab.id, function() { });
			});
		}), $("#save-to-stopallads").click(function() {
            $("#iframe").css({
                "margin-bottom": "178px"
            });
            var e = document.getElementById("canvasfon"),
                a = document.getElementById("canvasbg"),
                t = document.createElement("canvas");
            t.width = e.width, t.height = e.height;
            var n = t.getContext("2d");
            n.drawImage(e, 0, 0), n.drawImage(a, 0, 0);
            var o = ($("#imgfordownload"), (new Date).getTime() + "screenshot."),
                r = localStorage.format || "png";
            o += r, c = t.toDataURL("image/" + r, localStorage.imageQuality / 100), console.log(c);
            var i = chrome.extension.getBackgroundPage().screenshot,
                l = i.getFileName(g, !0);
            l = $("#image_name_text").val() + $("#filename_ext").text();
           
        })
    }

    function t(e) {
        var e = $.trim(e),
            a = e.split("/"),
            t = a[0] + "//" + a[2];
        return t
    }

    function n() {
        var e = new Date,
            a = e.getHours(),
            t = e.getMinutes(),
            n = a >= 12 ? " pm" : " am";
        a %= 12, a = a ? a : 12, t = 10 > t ? "0" + t : t;
        var o = a + ":" + t + n;
        return o
    }

    function o() {
       
    } {
        var r, i = localStorage.imgdata,
            g = (localStorage.screenname, JSON.parse(localStorage.pageinfo || "{}")),
            c = null,
            l = $("#imageedit");
        ! function() {
            var e = window.location.href.match(/\?(\w+)$/);
            return e && e[1] || ""
        }()
    }
    1 == o() ? ($("#iframe").show(), $("#bannerNoConnection").hide()) : 0 == o() && ($("#iframe, #loader").hide(), $("#bannerNoConnection").show()), l.load(function() {
        e()
    }), l.attr("src", i)
});