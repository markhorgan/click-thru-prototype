@import "constants.js"
@import "utils.js"
@import "ui.js"

var buildAlertWindow = function(typeIndex, text) {
  var alertWindow = COSAlertWindow.new()
  alertWindow.addButtonWithTitle("Add")
  alertWindow.addButtonWithTitle("Remove")
  alertWindow.addButtonWithTitle("Cancel")
  alertWindow.setMessageText("JavaScript Dialog")
  alertWindow.setInformativeText("Shows a JavaScript dialog when you click on the selected layers.")

  var dialogTypeView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 42))
  var dialogTypeLabel = UI.buildLabel("Dialog Type", 12, NSMakeRect(0, 22, 300, 20))
  dialogTypeView.addSubview(dialogTypeLabel)
  var radioButtons = UI.buildRadioButtons(["Alert", "Confirm"], typeIndex, NSMakeRect(0, 0, 300, 20))
  dialogTypeView.addSubview(radioButtons)
  alertWindow.addAccessoryView(dialogTypeView)

  var textView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 47))
  var textLabel = UI.buildLabel("Dialog Text", 12, NSMakeRect(0, 22, 300, 20))
  textView.addSubview(textLabel)
  var textField = UI.buildTextField(text, NSMakeRect(0, 0, 300, 20))
  textView.addSubview(textField)
  alertWindow.addAccessoryView(textView)

  return [alertWindow, [radioButtons, textField]]
}

var onRun = function(context) {
  var doc = context.document
  var selection = context.selection

  if (selection.length == 0) {
    doc.showMessage("Select a one or more layers")
    return
  }

  var dialogText = String(Utils.valueForKeyOnLayers(Constants.DIALOG_TEXT, selection, context, ""))
  var dialogType = String(Utils.valueForKeyOnLayers(Constants.DIALOG_TYPE, selection, context))

  var dialogTypeIndex = 0
  if (dialogText != "") {
    switch (dialogType) {
      case Constants.DIALOG_TYPE_ALERT:
        dialogTypeIndex = 0
        break

      case Constants.DIALOG_TYPE_CONFIRM:
        dialogTypeIndex = 1
        break
    }
  }
  var retVals = buildAlertWindow(dialogTypeIndex, dialogText), alertWindow = retVals[0], inputControls = retVals[1]
  var response = alertWindow.runModal()
  if (response != 1002) {
    var dialogText = inputControls[1].stringValue()
    if (dialogText == "" || response == 1001) {
      // remove
      Utils.setValueOnLayers(null, Constants.DIALOG_TYPE, selection, context)
      Utils.setValueOnLayers(null, Constants.DIALOG_TEXT, selection, context, false)
    } else {
      // add
      switch (inputControls[0].selectedColumn()) {
        case 0:
          dialogType = Constants.DIALOG_TYPE_ALERT
          break

        case 1:
          dialogType = Constants.DIALOG_TYPE_CONFIRM
          break
      }
      Utils.setValueOnLayers(dialogType, Constants.DIALOG_TYPE, selection, context)
      Utils.setValueOnLayers(inputControls[1].stringValue(), Constants.DIALOG_TEXT, selection, context, false)
    }
  }
}