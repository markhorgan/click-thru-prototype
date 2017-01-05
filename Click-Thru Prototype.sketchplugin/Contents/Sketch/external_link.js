@import "constants.js"
@import "utils.js"
@import "ui.js"

const buildAlertWindow = function(link, openLinkInNewWindow) {
  const alertWindow = COSAlertWindow.new()
  alertWindow.addButtonWithTitle("Add")
  alertWindow.addButtonWithTitle("Remove")
  alertWindow.addButtonWithTitle("Cancel")
  alertWindow.setMessageText("External Link")
  alertWindow.setInformativeText("Open the following URL when you click on the selected layers.")
  
  const accessoryView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 64))
  const linkLabel = UI.buildLabel("URL", 12, NSMakeRect(0, 44, 300, 20))
  accessoryView.addSubview(linkLabel)
  const linkTextField = UI.buildTextField(link, NSMakeRect(0, 24, 300, 20))
  accessoryView.addSubview(linkTextField)
  const openLinkInNewWindowCheckbox = UI.buildCheckbox("Open link in new window", openLinkInNewWindow, NSMakeRect(0, 0, 300, 20))
  accessoryView.addSubview(openLinkInNewWindowCheckbox)
  alertWindow.addAccessoryView(accessoryView)

  return [alertWindow, [linkTextField, openLinkInNewWindowCheckbox]]
}

const onRun = function(context) {
  const doc = context.document
  const selection = context.selection
  
  if (selection.length == 0) {
    doc.showMessage("Select a one or more layers")
    return
  }
  
  const link = Utils.valueForKeyOnLayers(Constants.EXTERNAL_LINK, selection, context, "")
  const openLinkNewWindow = Utils.valueForKeyOnLayers(Constants.OPEN_LINK_IN_NEW_WINDOW, selection, context, false)
  const retVals = buildAlertWindow(link, openLinkNewWindow), alertWindow = retVals[0], inputControls = retVals[1]
  const response = alertWindow.runModal()
  if (response != 1002) {
    const link = inputControls[0].stringValue()
    if (link == "" || response == 1001) {
      // remove
      Utils.setValueOnLayers(null, Constants.EXTERNAL_LINK, selection, context)
    } else {
      // add
      Utils.setValueOnLayers(link, Constants.EXTERNAL_LINK, selection, context)
      Utils.setValueOnLayers(inputControls[1].state(), Constants.OPEN_LINK_IN_NEW_WINDOW, selection, context, false)
    }
  }
}