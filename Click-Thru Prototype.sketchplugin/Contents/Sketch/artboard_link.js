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

var isAssociatedArtboard = function(artboard, artboards) {
	return artboards.some(function(itArtboard){
		var suffix = Utils.getSuffix(artboard.name(), itArtboard.name())
		if (suffix != null && suffix.length > 0) {
			return true
		}
	})
}

// includeNone: optional, default: true
var getArtboardNamesInPage = function(page, includeNone) {
	if (includeNone == null) {
		includeNone = true
	}
	// sort artboards by name
	var artboards = page.artboards().sort(function(a, b) {
		if (a.name() < b.name()) {
			return -1
		} else if (a.name() > b.name()) {
			return 1
		} else {
			return 0
		}
	})
	var artboardNames = new Array()
	if (includeNone) {
		artboardNames.push("None")
	}
	artboards.forEach(function(artboard){
		if (!isAssociatedArtboard(artboard, artboards)) {
			artboardNames.push(artboard.name())
		}
	})
	return artboardNames
}

var getArtboardNamesInAllPages = function(document) {
	var artboardNames = ["None"]
	document.pages().forEach(function(page){
		if (!Utils.isSymbolsPage(page)) {
			artboardNames.push.apply(artboardNames, getArtboardNamesInPage(page, false))
		}
	})
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