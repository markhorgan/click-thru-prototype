const UI = {}

UI.buildLabel = function(text, fontSize, frame) {
  const label = NSTextField.alloc().initWithFrame(frame)
  label.setStringValue(text)
  label.setFont(NSFont.boldSystemFontOfSize(fontSize))
  label.setBezeled(false)
  label.setDrawsBackground(false)
  label.setEditable(false)
  label.setSelectable(false)
  return label
}

// placeholder: optional
UI.buildTextField = function(text, frame, placeholder) {
  const textField = NSTextField.alloc().initWithFrame(frame)
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
  const checkbox = NSButton.alloc().initWithFrame(frame)
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
  const buttonCell = NSButtonCell.new()
  buttonCell.setButtonType(NSRadioButton)
  if (isHorizontal) {
    const numRows = 1
    const numCols = labels.length
  } else {
    const numRows = labels.length
    const numCols = 1
  }
  const matrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(frame, NSRadioModeMatrix, buttonCell, numRows, numCols)
  matrix.setAutorecalculatesCellSize(true)
  const cells = matrix.cells()
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
  const comboBox = NSComboBox.alloc().initWithFrame(frame)
  comboBox.addItemsWithObjectValues(values)
  if (selectedIndex != null) {
    comboBox.selectItemAtIndex(selectedIndex)
  }  
  return comboBox
}