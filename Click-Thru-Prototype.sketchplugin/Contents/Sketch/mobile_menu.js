@import "ui.js";
@import "constants.js";
@import "utils.js";

var buildAlertWindow = function(title, informationText, isSet) {
  const alertWindow = COSAlertWindow.new();
  alertWindow.addButtonWithTitle("Set");
  if (isSet) {
    alertWindow.addButtonWithTitle("Remove");
  }
  alertWindow.addButtonWithTitle("Cancel");
  alertWindow.setMessageText(title);
  alertWindow.setInformativeText(informationText);
  return alertWindow;
};

var setBooleanValueOnLayers = function(key, title, informationText, context) {
  const selection = context.selection;

  if (selection.length == 0) {
    UI.displayDialog("Select a one or more layers.");
    return;
  }

  let isSet = Utils.valueForKeyOnLayers(key, selection, context) != null;
  const alertWindow = buildAlertWindow(title, informationText, isSet);
  const response = alertWindow.runModal();
  switch (response) {
    case 1000:
      Utils.setValueOnLayers(true, key, selection, context, true, true);
      break;

    case 1001:
      Utils.setValueOnLayers(null, key, selection, context);
      break;
  }
};

var mobileMenu = function(context) {
  setBooleanValueOnLayers(Constants.IS_MOBILE_MENU, "Mobile Menu", "The mobile menu that is shown when the mobile menu button is clicked.", context);
};

var mobileMenuButton = function(context) {
  setBooleanValueOnLayers(Constants.IS_MOBILE_MENU_BUTTON, "Mobile Menu Button", "The button that shows the mobile menu.", context);
};

