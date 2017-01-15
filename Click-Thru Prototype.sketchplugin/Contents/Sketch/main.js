var getCookie = function(key, defaultValue){
  console.log(document.cookie);
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i]
    if (cookie != null) {
      var parts = cookie.split("=");
      if (parts[0].trim() == key) {
        return parts[1];
      }
    }
  }
  return defaultValue;
}

var setCookie = function(key, value) {
  document.cookie = key + "=" + value;
}

var getPageName = function() {
  var pathName = window.location.pathname;
  return pathName.substring(pathName.lastIndexOf('/') + 1, pathName.lastIndexOf('.'));
}

window.onload = function() {
  var pageName = getPageName();
  var numTimesPageLoaded = parseInt(getCookie(pageName, 0));
  if (numTimesPageLoaded < 2) {
    var elements = document.getElementsByClassName("hotspot");
    for (var i = 0; i < elements.length; i++) {
      elements[i].className += " is-visible";
    }
    setCookie(pageName, numTimesPageLoaded + 1)
  }
}