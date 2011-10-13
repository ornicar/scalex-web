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
  }).trigger("keyup");

  // expand search results
  $results.delegate("div.result", "click", function() { $(this).toggleClass("active"); });

  // transform code examples to search links
  $greetings.find('code').each(function() { $(this).wrap('<a href="?q=' + $(this).text() + '">'); });

  // toggle between greetings and search results
  function toggle(s) { $greetings.toggle(s != "search"); $results.toggle(s == "search"); }

  function search(query) {
    toggle("search");
    xhr = $.ajax({
      url: $form.attr("data-url"),
        data: { q: query, callback: "scalex_jc" },
        dataType: "jsonp", jsonp: false, jsonpCallback: "scalex_jc",
        cache: true,
        success: function(data) {
          if (data.error) var html = "<div class=\"error\">"+nl2br(data.error)+"</pre>"; 
          else var html = renderResults(data.results); 
          $results.html(html)
      toggle("search");
        }
    });
  }

  function nl2br(str) {
    return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br />' + '$2');
  }

  function renderResults(results) {
    if(results.length == 0) { return "<div class=\"no-results\">Nothing found.</div>"; }
    var html = [];
    for (var i in results) html += "<div class=\"result\">" + renderResult(results[i]) + "</div>";
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
      r.find(".scaladoc-link").text(e.parent.qualifiedName.replace(/\./g, " . ")).attr("href", scaladocUrl(e)).show();
    } 
    if (e.valueParams) r.find(".params").text(e.valueParams); 
    else  r.find(".params-sep").remove(); 
    if (c = e.comment) {
      if (c.short) r.find(".comment-short").html(c.short.html);
      if (c.body) r.find(".comment-body").html(c.body.html);
      if (c.typeParams) r.find(".comment-dl").append(dl(c.typeParams)).show();
      if (c.valueParams) r.find(".comment-dl").append(dl(c.valueParams)).show();
      if (c.result) r.find(".comment-dl").append("<dt>result</dt><dd>" + c.result.html + "</dd>").show();
      if (c.throws) r.find(".comment-throws").html(dl(c.throws));
    }
    return r.html();
  }

  function dl(obj) {
    var html = "", k;
    for (k in obj) html += "<dt>" + k + "</dt>" + "<dd>" + obj[k].html + "</dd>"; 
    return html;
  }

  function scaladocUrl(fun) {
    return "http://www.scala-lang.org/api/current/scala/"
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
