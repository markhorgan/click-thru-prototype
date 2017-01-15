@import "ui.js"
@import "utils.js"
@import "constants.js"

var buildAlertWindow = function(retinaImages) {
  var alertWindow = COSAlertWindow.new()
  alertWindow.addButtonWithTitle("OK")
  alertWindow.addButtonWithTitle("Cancel")
  alertWindow.setMessageText("Export Retina Images")
  alertWindow.setInformativeText("Determines whether 2x images are exported along with 1x images. The images will look sharper on high pixel density screens but will take longer to download.")

  var accessoryView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 20))
  var exportRetinaImagesCheckbox = UI.buildCheckbox("Export retina images", retinaImages, NSMakeRect(0, 0, 300, 20))
  accessoryView.addSubview(exportRetinaImagesCheckbox)
  alertWindow.addAccessoryView(accessoryView)

  return [alertWindow, exportRetinaImagesCheckbox]
}

var onRun = function(context) {
  var retinaImages = Utils.valueForKeyOnDocument(Constants.RETINA_IMAGES, context, 1) == 1
  var retVals = buildAlertWindow(retinaImages), alertWindow = retVals[0], exportRetinaImagesCheckbox = retVals[1]
  var response = alertWindow.runModal()
  if (response == 1000) {
    Utils.setValueOnDocument(exportRetinaImagesCheckbox.state() == 1, Constants.RETINA_IMAGES, context)
  }
}