$(function() {

  var $form = $("form.search-form");
  var $input = $form.find("input");
  var $results = $(".results");
  var $resultTpl = $("#result-template");
  var $greetings = $(".greetings");
  var xhr;

  //$form.attr("data-url", "http://scalex:8080/");

  // put request query in the search input
  if (query = getParameterByName("q")) $input.val(query); 

  // instant search
  $input.bind("keyup", function() {
    if (xhr) xhr.abort();
    if (query = $input.val()) search(query); else toggle("greetings");
  });

  // first search: jump to url hash if possible
  if (query = $input.val()) {
    search(query, {
      callback: function() { 
        if (window.location.hash && ($fun = $(window.location.hash)).length) {
          activate($fun);
          $('html,body').animate({"scrollTop": $fun.offset().top}, 300);
        }
      }
    });
  } else toggle("greetings");

  // expand search results
  $results.delegate(".signature", "click", function() { activate($(this).closest(".result")); });

  // transform code examples to search links
  $greetings.find('code').each(function() { $(this).wrap('<a href="?q=' + $(this).text() + '">'); });

  // toggle between greetings and search results
  function toggle(s) { 
    $(window).unbind("smartscroll");
    $greetings.toggle(s != "search"); $results.toggle(s == "search"); 
  }

  function activate($fun) {
    $results.find(".active").not($fun).removeClass("active");
    $fun.toggleClass("active");
  }

  function search(query, options) {
    options = $.extend({page: 1, callback: function() {}, append: false}, options);
    $(".status").addClass("loading");
    toggle("search");
    xhr = $.ajax({
      url: $form.attr("data-url"),
        data: { q: query, callback: "scalex_jc" },
        dataType: "jsonp", jsonp: false, jsonpCallback: "scalex_jc",
        cache: true,
        success: function(data) {
          if (data.error) var html = "<div class=\"status error\">"+nl2br(data.error)+"</pre>"; 
          else {
            var html = renderResults(data.results); 
            if (options.page == 1) html = '<div class="status">' + data.nbResults + ' functions found</div>' + html;
          }
          if (options.append) $results.append(html);
          else $results.html(html);
          toggle("search");
          options.callback();
          if (options.page < data.nbPages) {
            var end = $results.find(".result:last").offset().top - $(window).height() - 200;
            $(window).smartscroll(function() {
              if ($(window).scrollTop() > end) {
                search(query, { page: options.page + 1, append: true });
              }
            });
          }
        }
    });
  }

  function changeUrlPage(page) {
    var url = location.href;
    if (url.indexOf(/page=/) != -1) return url.replace(/page=\d+/, "page=" + page);
    else return url + "&page=" + page;
  }

  function nl2br(str) {
    return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br />' + '$2');
  }

  function renderResults(results) {
    var html = "", i;
    for (i in results) html += renderResult(results[i]);
    return html;
  }

  function renderResult(e) {
    var r = $resultTpl.clone()
      .find(".parent-class").text(e.parent.name).end()
      .find(".parent-params").text(e.parent.typeParams).end()
      .find(".name").text(e.name).end()
      .find(".type-params").text(e.typeParams).end()
      .find(".return").text(e.resultType).end()
      .find(".package").text(e.package).end()
      .find(".qualified-name").text(e.parent.qualifiedName).end();
    if (e.package == "scala") {
      r.find(".scaladoc-link").text("View " + e.parent.qualifiedName + " on scala-lang API").attr("href", scaladocUrl(e)).show();
    } 
    if (e.valueParams) r.find(".params").text(e.valueParams); 
    else r.find(".params-sep").remove(); 
    if (c = e.comment) {
      if (c.short) r.find(".comment-short").html(c.short.html);
      if (c.body) r.find(".comment-body").html(c.body.html);
      if (c.typeParams) r.find(".comment-dl").append(dl(c.typeParams)).show();
      if (c.valueParams) r.find(".comment-dl").append(dl(c.valueParams)).show();
      if (c.result) r.find(".comment-dl").append("<dt>result</dt><dd>" + c.result.html + "</dd>").show();
      if (c.throws) r.find(".comment-throws").html(dl(c.throws));
    }
    var a = anchor(e);
    r.find(".signature").attr("href", "#" + a);
    return '<section id="' + a + '" class="result">'+r.html()+'</section>';
  }

  function anchor(fun) {
    var parts = [fun.parent.qualifiedName, fun.parent.typeParams, fun.name, fun.typeParams, fun.valueParams, fun.resultType]
    return $.trim(parts.join()).replace(/\W/g, "");
  }

  function dl(obj) {
    var html = "", k;
    for (k in obj) html += "<dt>" + k + "</dt>" + "<dd>" + obj[k].html + "</dd>"; 
    return html;
  }

  function scaladocUrl(fun) {
    return "http://www.scala-lang.org/api/current/"
      + fun.parent.qualifiedName.replace(/\./g, "/") 
      + ".html"
  }

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if(results == null) return "";
    else return decodeURIComponent(results[1].replace(/\+/g, " "));
  }

    /* 
    * smartscroll: debounced scroll event for jQuery *
    * https://github.com/lukeshumard/smartscroll
    * Based on smartresize by @louis_remi: https://github.com/lrbabe/jquery.smartresize.js *
    * Copyright 2011 Louis-Remi & Luke Shumard * Licensed under the MIT license. *
    */

    var event = $.event,
		scrollTimeout;

    event.special.smartscroll = {
        setup: function () {
            $(this).bind("scroll", event.special.smartscroll.handler);
        },
        teardown: function () {
          console.debug("tear down!");
            $(this).unbind("scroll", event.special.smartscroll.handler);
        },
        handler: function (event, execAsap) {
            // Save the context
            var context = this,
		      args = arguments;

            // set correct event type
            event.type = "smartscroll";

            if (scrollTimeout) { clearTimeout(scrollTimeout); }
            scrollTimeout = setTimeout(function () {
                jQuery.event.handle.apply(context, args);
            }, execAsap === "execAsap" ? 0 : 100);
        }
    };

    $.fn.smartscroll = function (fn) {
        return fn ? this.bind("smartscroll", fn) : this.trigger("smartscroll", ["execAsap"]);
    };
});

//analytics
if (/scalex\.org/.test(document.domain)) {
  var _gaq = _gaq || []; _gaq.push(['_setAccount', 'UA-7935029-5']); _gaq.push(['_trackPageview']);
  (function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript'; ga.async = true; ga.src = 'http://www.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
}
