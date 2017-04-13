var UI = {}

UI.buildLabel = function(text, fontSize, frame) {
  var label = NSTextField.alloc().initWithFrame(frame)
  label.setStringValue(text)
  label.setFont(NSFont.boldSystemFontOfSize(fontSize))
  label.setBezeled(false)
  label.setDrawsBackground(false)
  label.setEditable(false)
  label.setSelectable(false)
  return label
}

UI.buildHint = function(text, fontSize, frame) {
  var label = NSTextField.alloc().initWithFrame(frame)
  label.setStringValue(text)
  label.setFont(NSFont.systemFontOfSize(fontSize))
  label.setBezeled(false)
  label.setDrawsBackground(false)
  label.setEditable(false)
  label.setSelectable(false)
  return label
}

// placeholder: optional
UI.buildTextField = function(text, frame, placeholder) {
  var textField = NSTextField.alloc().initWithFrame(frame)
  textField.setEditable(true)
  textField.setBordered(true)
  textField.setStringValue(text)
  if (placeholder != null) {
    textField.setPlaceholderString(placeholder)
  }
  return textField
}

UI.buildCheckbox = function(text, checked, frame) {
  checked = (checked == false) ? NSOffState : NSOnState
  var checkbox = NSButton.alloc().initWithFrame(frame)
  checkbox.setButtonType(NSSwitchButton)
  checkbox.setBezelStyle(0)
  checkbox.setTitle(text)
  checkbox.setState(checked)
  return checkbox
}

// horizontal: optional, default: true
UI.buildRadioButtons = function(labels, selectedIndex, frame, isHorizontal) {
  if (isHorizontal == null) {
    isHorizontal = true
  }
  var buttonCell = NSButtonCell.new()
  buttonCell.setButtonType(NSRadioButton)
  if (isHorizontal) {
    var numRows = 1
    var numCols = labels.length
  } else {
    var numRows = labels.length
    var numCols = 1
  }
  var matrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(frame, NSRadioModeMatrix, buttonCell, numRows, numCols)
  matrix.setAutorecalculatesCellSize(true)
  var cells = matrix.cells()
  for (var i = 0; i < labels.length; i++) {
    cells[i].setTitle(labels[i])
  }
  if (selectedIndex != null) {
    if (isHorizontal)   {
      matrix.selectCellAtRow_column(0, selectedIndex)
    } else {
      matrix.selectCellAtRow_column(selectedIndex, 0)
    }
  }
  return matrix
}

// selectedIndex: optional
UI.buildComboBox = function(frame, values, selectedIndex) {
  var comboBox = NSComboBox.alloc().initWithFrame(frame)
  comboBox.addItemsWithObjectValues(values)
  if (selectedIndex != null) {
    comboBox.selectItemAtIndex(selectedIndex)
  }  
  return comboBox
}

// title: optional, default: "Notice"
UI.displayDialog = function(text, title) {
  if (title == null) {
    title = "Notice"
  }
  NSApplication.sharedApplication().displayDialog_withTitle(text, title)
}

UI.saveFileDialog = function() {
  var openPanel = NSOpenPanel.openPanel()
  openPanel.setTitle("Chooce a location...")
  openPanel.setPrompt("Export")
  openPanel.setCanChooseDirectories(true)
  openPanel.setCanChooseFiles(false)
  openPanel.setAllowsMultipleSelection(false)
  openPanel.setShowsHiddenFiles(false)
  openPanel.setExtensionHidden(false)
  var buttonPressed = openPanel.runModal()
  if (buttonPressed == NSFileHandlingPanelOKButton) {
    return openPanel.URL()
  }
  return null
}