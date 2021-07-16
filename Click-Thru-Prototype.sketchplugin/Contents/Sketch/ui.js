class UI {

  static buildLabel(text, fontSize, frame) {
    const label = NSTextField.alloc().initWithFrame(frame);
    label.setStringValue(text);
    label.setFont(NSFont.boldSystemFontOfSize(fontSize));
    label.setBezeled(false);
    label.setDrawsBackground(false);
    label.setEditable(false);
    label.setSelectable(false);
    return label;
  }

  static buildHint(text, fontSize, frame) {
    const label = NSTextField.alloc().initWithFrame(frame);
    label.setStringValue(text);
    label.setFont(NSFont.systemFontOfSize(fontSize));
    label.setBezeled(false);
    label.setDrawsBackground(false);
    label.setEditable(false);
    label.setSelectable(false);
    return label;
  }

  static buildTextField(text, frame, placeholder = null) {
    const textField = NSTextField.alloc().initWithFrame(frame);
    textField.setEditable(true);
    textField.setBordered(true);
    textField.setStringValue(text);
    if (placeholder != null) {
      textField.setPlaceholderString(placeholder);
    }
    return textField;
  }

  static buildCheckbox(text, checked, frame) {
    checked = (checked == false) ? NSOffState : NSOnState;
    const checkbox = NSButton.alloc().initWithFrame(frame);
    checkbox.setButtonType(NSSwitchButton);
    checkbox.setBezelStyle(0);
    checkbox.setTitle(text);
    checkbox.setState(checked);
    return checkbox;
  }

  static buildRadioButtons(labels, selectedIndex, frame, isHorizontal = true) {
    if (isHorizontal == null) {
      isHorizontal = true;
    }
    const buttonCell = NSButtonCell.new();
    buttonCell.setButtonType(NSRadioButton);
    let numRows, numCols;
    if (isHorizontal) {
      numRows = 1;
      numCols = labels.length;
    } else {
      numRows = labels.length;
      numCols = 1;
    }
    const matrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(frame, NSRadioModeMatrix, buttonCell, numRows, numCols);
    matrix.setAutorecalculatesCellSize(true);
    const cells = matrix.cells();
    for (let i = 0; i < labels.length; i++) {
      cells[i].setTitle(labels[i]);
    }
    if (selectedIndex != null) {
      if (isHorizontal) {
        matrix.selectCellAtRow_column(0, selectedIndex);
      } else {
        matrix.selectCellAtRow_column(selectedIndex, 0);
      }
    }
    return matrix;
  }

  static buildComboBox(frame, values, selectedIndex = null) {
    const comboBox = NSComboBox.alloc().initWithFrame(frame);
    comboBox.addItemsWithObjectValues(values);
    if (selectedIndex != null) {
      comboBox.selectItemAtIndex(selectedIndex);
    }
    return comboBox;
  }

  static displayDialog(text, title = "Notice") {
    NSApplication.sharedApplication().displayDialog_withTitle(text, title);
  }

  static saveFileDialog() {
    const openPanel = NSOpenPanel.openPanel();
    openPanel.setTitle("Chooce a location...");
    openPanel.setPrompt("Export");
    openPanel.setCanChooseDirectories(true);
    openPanel.setCanChooseFiles(false);
    openPanel.setAllowsMultipleSelection(false);
    openPanel.setShowsHiddenFiles(false);
    openPanel.setExtensionHidden(false);
    const buttonPressed = openPanel.runModal();
    if (buttonPressed == NSFileHandlingPanelOKButton) {
      return openPanel.URL();
    }
    return null;
  }
}
