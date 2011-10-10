$(function() {

  var $form = $("form.search-form");
  var $input = $form.find("input").focus();
  var $results = $(".search-results");
  var $resultTpl = $("#search-result-template");
  var $greetings = $(".greetings");
  var xhr;

  if (query = getParameterByName("q")) {
    $input.val(query);
    search(query);
  } else if (query = $input.val()) {
    search(query);
  }

  $input.bind("keyup", function() {
    if ($input.val() == "") {
        $greetings.show();
        $results.hide();
    } else {
      if (xhr) xhr.abort();
      xhr = search($input.val());
    }
  });

  function search(query) {
    return $.ajax({
      url: $form.attr("data-url"),
      data: { q: query },
      dataType: "jsonp",
      success: function(data) {
        if (data.error) {
          var html = "<pre>"+nl2br(data.error)+"</pre>"
        } else {
          var html = renderResults(data.results);
        }
        $greetings.hide();
        $results.show().html(html);
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
      html += "<div class=\"search-result\">" + $resultTpl.clone()
        .find(".parent-class").text(e.parent.name).end()
        .find(".parent-params").text(e.parent.typeParams).end()
        .find(".name").text(e.name).end()
        .find(".type-params").text(e.typeParams).end()
        .find(".params").text(e.valueParams).end()
        .find(".return").text(e.resultType).end()
        .html() + "</div>";
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
