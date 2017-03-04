@import "constants.js"
@import "utils.js"
@import "ui.js"

var buildAlertWindow = function(artboardNames, selectedIndex) {
	var alertWindow = COSAlertWindow.new()
	alertWindow.addButtonWithTitle("Add")
	alertWindow.addButtonWithTitle("Remove")
	alertWindow.addButtonWithTitle("Cancel")
	alertWindow.setMessageText("Link to Artboard")
	alertWindow.setInformativeText("Opens the following artboard when you click on the selected layers.")

	var accessoryView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 46))
	var artboardLabel = UI.buildLabel("Artboard", 12, NSMakeRect(0, 26, 300, 20))
	accessoryView.addSubview(artboardLabel)
	var artboardComboBox = UI.buildComboBox(NSMakeRect(0, 0, 300, 30), artboardNames, selectedIndex)
	accessoryView.addSubview(artboardComboBox)
	alertWindow.addAccessoryView(accessoryView)

	return [alertWindow, artboardComboBox]
}

var getBaseName = function(artboard, artboards, artboardNames) {
	for (var i = 0; i < artboards.length; i++) {
		var itArtboard = artboards[i]
    var retVals = Utils.getArtboardNameParts(artboard.name(), itArtboard.name()), baseName = retVals[0]
		if (baseName != null && artboardNames.includes(baseName)) {
			return baseName
		}
	}


}

// includeNone: optional, default: true
var getArtboardNamesInPage = function(page, includeNone) {
	if (includeNone == null) {
		includeNone = true
	}
	var artboards = page.artboards()
	var artboardNames = new Array()
  artboards.forEach(function(artboard) {
		var retVals = Utils.getArtboardNameParts(artboard, artboards)
		if (retVals != null) {
			// part of a set
			var baseName = retVals[0]
			if (!artboardNames.includes(baseName)) {
				artboardNames.push(baseName)
    	}
		} else {
			// not part of a set
  		artboardNames.push(artboard.name())
  	}
	})
	artboardNames.sort()
  if (includeNone) {
    artboardNames.unshift("None")
  }
	return artboardNames
}

var getArtboardNamesInAllPages = function(document) {
	var artboardNames = new Array()
	document.pages().forEach(function(page){
		if (!Utils.isSymbolsPage(page)) {
			artboardNames.push.apply(artboardNames, getArtboardNamesInPage(page, false))
		}
	})
	artboardNames.sort()
	artboardNames.unshift("None")
	return artboardNames
}

var getArtboardIndex = function(artboardName, artboardNames) {
	if (artboardName != null) {
		for (var i = 0; i < artboardNames.length; i++) {
			if (artboardNames[i] == artboardName) {
				return i
			}
		}
	}
	return 0
}

var onRun = function(context) {
	var doc = context.document
	var selection = context.selection

	if (selection.length == 0) {
		UI.displayDialog("Select a one or more layers.")
		return
	}

	var artboardNames
	if (selection[0].parentArtboard().isKindOfClass(MSSymbolMaster)) {
		// selection in a symbol
		artboardNames = getArtboardNamesInAllPages(doc)
	} else {
		// selection in an artboard
		artboardNames = getArtboardNamesInPage(doc.currentPage())
	}
	var currentArtboardName = String(Utils.valueForKeyOnLayers(Constants.ARTBOARD_LINK, selection, context, ""))
	var artboardIndex = getArtboardIndex(currentArtboardName, artboardNames)
	var retVals = buildAlertWindow(artboardNames, artboardIndex), alertWindow = retVals[0], artboardComboBox = retVals[1]
	var response = alertWindow.runModal()
	switch (response) {
		case 1000:
			// add
			var index = artboardComboBox.indexOfSelectedItem()
			var artboardName = index == 0 ? null : artboardNames[index]
			Utils.setValueOnLayers(artboardName, Constants.ARTBOARD_LINK, selection, context)
			break

		case 1001:
			// remove
			Utils.setValueOnLayers(null, Constants.ARTBOARD_LINK, selection, context)
			break
	}
}