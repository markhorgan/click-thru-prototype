@import "ui.js"
@import "constants.js"
@import "utils.js"

const buildAlertWindow = function(title, informationText, isOn) {
  const alertWindow = COSAlertWindow.new()
  alertWindow.addButtonWithTitle("Add")
  alertWindow.addButtonWithTitle("Remove")
  alertWindow.addButtonWithTitle("Cancel")
  alertWindow.setMessageText(title)
  alertWindow.setInformativeText(informationText)
  return alertWindow
}

const setBooleanValueOnLayers = function(key, title, informationText, context) {
  const doc = context.document
  const selection = context.selection

  if (selection.length == 0) {
    doc.showMessage("Select a one or more layers")
    return
  }

  var isOn = Utils.valueForKeyOnLayers(key, selection, context, 1)
  isOn = isOn == 1
  const alertWindow = buildAlertWindow(title, informationText, isOn)
  const response = alertWindow.runModal()
  switch (response) {
    case 1000:
      Utils.setValueOnLayers(true, key, selection, context, true, true)
      break

    case 1001:
      Utils.setValueOnLayers(null, key, selection, context)
      break
  }
}

const mobileMenu = function(context) {
  setBooleanValueOnLayers(Constants.IS_MOBILE_MENU, "Mobile Menu", "The mobile menu that is shown when the mobile menu button is clicked.", context)
}

const mobileMenuButton = function(context) {
  setBooleanValueOnLayers(Constants.IS_MOBILE_MENU_BUTTON, "Mobile Menu Button", "The button that shows the mobile menu.", context)
}

