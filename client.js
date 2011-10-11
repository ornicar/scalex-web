$(function() {

  var $form = $("form.search-form");
  var $input = $form.find("input");
  var $results = $(".search-results");
  var $resultTpl = $("#search-result-template");
  var $greetings = $(".greetings");
  var xhr;

  if (query = getParameterByName("q")) {
    $input.val(query);
    search(query);
    toggle("search")
  } else if (query = $input.val()) {
    search(query);
    toggle("search")
  } else {
    toggle("greetings");
  }

  $input.bind("keyup", function() {
    if (xhr) xhr.abort();
    if ($input.val() == "") {
      toggle("greetings")
    } else {
      toggle("search")
      xhr = search($input.val());
    }
  });

  function toggle(section) {
    if (section == "search") {
        $greetings.hide();
        $results.show();
    } else {
        $greetings.show();
        $results.hide();
    }
  }


  function search(query) {
    return $.ajax({
      url: $form.attr("data-url"),
      data: { q: query },
      dataType: "jsonp",
      success: function(data) {
        if (data.error) {
          var html = "<div class=\"error\">"+nl2br(data.error)+"</pre>"
        } else {
          var html = renderResults(data.results);
        }
        $results.html(html)
        toggle("search")
      }
    });
  }

  function nl2br(str) {
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br />' + '$2');
  }

  function renderResults(results) {
    if(results.length == 0) {
      return "<div class=\"no-results\">Nothing found.</div>";
    }
    var html = [], r;
    for (var i in results) {
      e = results[i];
      r = $resultTpl.clone()
        .find(".parent-class").text(e.parent.name).end()
        .find(".parent-params").text(e.parent.typeParams).end()
        .find(".name").text(e.name).end()
        .find(".type-params").text(e.typeParams).end()
        .find(".return").text(e.resultType).end()
        .find(".comment").html(e.comment.html ? e.comment.html : e.comment.text).end();
      if (e.valueParams) {
        r.find(".params").text(e.valueParams).end();
      } else {
        r.find(".params-sep").remove();
      }
      html += "<div class=\"search-result\">" + r.html() + "</div>";
    }
    return html;
  }

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if(results == null)
      return "";
    else
      return decodeURIComponent(results[1].replace(/\+/g, " "));
  }
});
