@import "ui.js";
@import "utils.js";
@import "constants.js";

var buildAlertWindow = function(responsiveArtboards, retinaImages) {
  const alertWindow = COSAlertWindow.new();
  alertWindow.addButtonWithTitle("OK");
  alertWindow.addButtonWithTitle("Cancel");
  alertWindow.setMessageText("Settings");

  const accessoryView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 140));
  const responsiveArtboardsCheckbox = UI.buildCheckbox("Responsive artboards", responsiveArtboards, NSMakeRect(0, 120, 300, 20));
  accessoryView.addSubview(responsiveArtboardsCheckbox);
  accessoryView.addSubview(UI.buildHint("Determines whether artboards will be exported to the same page if their names starts with the same text.", 12, NSMakeRect(0, 60, 300, 60)));
  const exportRetinaImagesCheckbox = UI.buildCheckbox("Export retina images", retinaImages, NSMakeRect(0, 40, 300, 20));
  accessoryView.addSubview(exportRetinaImagesCheckbox);
  accessoryView.addSubview(UI.buildHint("Determines whether 2x images are exported along with 1x images.", 12, NSMakeRect(0, 0, 300, 40)));

  alertWindow.addAccessoryView(accessoryView);

  return [alertWindow, responsiveArtboardsCheckbox, exportRetinaImagesCheckbox];
};

var onRun = function(context) {
  const responsiveArtboards = Utils.valueForKeyOnDocument(Constants.RESPONSIVE_ARTBOARDS, context, 1) == 1;
  const retinaImages = Utils.valueForKeyOnDocument(Constants.RETINA_IMAGES, context, 1) == 1;
  const retVals = buildAlertWindow(responsiveArtboards, retinaImages), alertWindow = retVals[0], responsiveArtboardsCheckbox = retVals[1], exportRetinaImagesCheckbox = retVals[2];
  const response = alertWindow.runModal();
  if (response == 1000) {
    Utils.setValueOnDocument(responsiveArtboardsCheckbox.state() == 1, Constants.RESPONSIVE_ARTBOARDS, context);
    Utils.setValueOnDocument(exportRetinaImagesCheckbox.state() == 1, Constants.RETINA_IMAGES, context);
  }
};

