$(function(){
  $(".hotspot").css("opacity", 1);
  window.setTimeout(function(){
    $(".hotspot").animate({opacity: 0}, 500);
  }, 1500);
});
