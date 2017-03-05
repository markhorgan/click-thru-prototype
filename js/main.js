var getCookie = function(key, defaultValue){
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i]
    if (cookie != null) {
      var parts = cookie.trim().split("=");
      if (parts[0] == key) {
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
  if (numTimesPageLoaded < 1) {
    var elements = document.getElementsByClassName("hotspot");
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      element.className += " is-visible";
      element.addEventListener("animationend", function(event){
        event.target.className = "hotspot";
      });
    }
    setCookie(pageName, numTimesPageLoaded + 1)
  }
}

window.toggle = function(id) {
  var element = document.getElementById(id)
  element.style.display = (element.style.display == 'none' || element.style.display == '') ? 'block' : 'none';
}