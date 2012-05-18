function parseQueryFromUrl() {
  var queryParamName = 'q'
    , search = window.location.search.substr(1)
    , parts = search.split('&');
  for (var i = 0; i < parts.length; i++) {
    var keyvaluepair = parts[i].split('=');
    if (decodeURIComponent(keyvaluepair[0]) === queryParamName) {
      return decodeURIComponent(keyvaluepair[1].replace(/\+/g, ' '));
    }
  }
  return '';
}

google.load('search', '1', {language : 'en'});

google.setOnLoadCallback(function() {
  var customSearchControl = new google.search.CustomSearchControl(
    '010241032241406631661:WMX2654048');
  customSearchControl.setResultSetSize(
    google.search.Search.LARGE_RESULTSET);
  var options = new google.search.DrawOptions();
  options.setAutoComplete(true);
  options.enableSearchResultsOnly();
  customSearchControl.draw('cse', options);
  var queryFromUrl = parseQueryFromUrl();
  if (queryFromUrl) customSearchControl.execute(queryFromUrl);
}, true);