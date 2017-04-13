var Constants = {
  ARTBOARD_LINK: "artboardLink",
  EXTERNAL_LINK: "externalLink",
  OPEN_LINK_IN_NEW_WINDOW: "openLinkInNewWindow",
  IS_MOBILE_MENU_BUTTON: "isMobileMenuButton",
  IS_MOBILE_MENU: "isMobileMenu",
  DIALOG_TYPE: "dialogType",
  DIALOG_TEXT: "dialogText",
  DIALOG_TYPE_ALERT: "alert",
  DIALOG_TYPE_CONFIRM: "confirm",
  RETINA_IMAGES: "retinaImages",
  RESPONSIVE_ARTBOARDS: "responsiveArtboards",
  TAB_SIZE: 2,
  HOTSPOT_PADDING: 0,
  LAYER_LOGGING: false,
  OUTPUT_DIRECTORY: "prototype",
  IMAGES_DIRECTORY: "images/",
  CSS_DIRECTORY: "css/",
  JS_DIRECTORY: "js/"
}

Constants.KEYS = [Constants.ARTBOARD_LINK, Constants.EXTERNAL_LINK, Constants.OPEN_LINK_IN_NEW_WINDOW,
  Constants.IS_MOBILE_MENU_BUTTON, Constants.IS_MOBILE_MENU, Constants.DIALOG_TYPE, Constants.DIALOG_TEXT]

var ResizingType = {
  STRETCH: 0,
  PIN_TO_CORNER: 1,
  RESIZE_OBJECT: 2,
  FLOAT_IN_PLACE: 3
}