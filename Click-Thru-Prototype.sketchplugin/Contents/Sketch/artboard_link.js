@import "constants.js";
@import "utils.js";
@import "ui.js";

var buildAlertWindow = function(artboardNames, selectedIndex) {
	const alertWindow = COSAlertWindow.new();
	alertWindow.addButtonWithTitle(selectedIndex === 0 ? "Add" : "Update");
	if (selectedIndex !== 0) {
    alertWindow.addButtonWithTitle("Remove");
  }
	alertWindow.addButtonWithTitle("Cancel");
	alertWindow.setMessageText("Link to Artboard");
	alertWindow.setInformativeText("Opens the following artboard when you click on the selected layers.");

	const accessoryView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 46));
	const artboardLabel = UI.buildLabel("Artboard", 12, NSMakeRect(0, 26, 300, 20));
	accessoryView.addSubview(artboardLabel);
	const artboardComboBox = UI.buildComboBox(NSMakeRect(0, 0, 300, 30), artboardNames, selectedIndex);
	accessoryView.addSubview(artboardComboBox);
	alertWindow.addAccessoryView(accessoryView);

	return [alertWindow, artboardComboBox];
};

var getArtboardNamesInPage = function(page, context, includeNone = true) {
	const artboardNames = [];
	const artboardGroups = Utils.getArtboardGroups(page.artboards(), context);
	artboardGroups.forEach(function (artboardGroup) {
		artboardNames.push(artboardGroup[0].baseName);
	});
	artboardNames.sort();
  if (includeNone) {
    artboardNames.unshift("None");
  }
	return artboardNames;
};

var getArtboardNamesInAllPages = function(document, context) {
	const artboardNames = [];
	document.pages().forEach(function(page){
		if (!Utils.isSymbolsPage(page)) {
			artboardNames.push.apply(artboardNames, getArtboardNamesInPage(page, context, false));
		}
	});
	artboardNames.sort();
	artboardNames.unshift("None");
	return artboardNames;
};

var getArtboardIndex = function(artboardName, artboardNames) {
	if (artboardName != null) {
		for (let i = 0; i < artboardNames.length; i++) {
			if (artboardNames[i] == artboardName) {
				return i;
			}
		}
	}
	return 0;
};

var onRun = function(context) {
	const doc = context.document;
	const selection = context.selection;

	if (selection.length === 0) {
		UI.displayDialog("Select a one or more layers.");
		return;
	}

	let artboardNames;
	if (selection[0].parentArtboard().isKindOfClass(MSSymbolMaster)) {
		// selection in a symbol
		artboardNames = getArtboardNamesInAllPages(doc);
	} else {
		// selection in an artboard
		artboardNames = getArtboardNamesInPage(doc.currentPage(), context);
	}
	const currentArtboardName = String(Utils.valueForKeyOnLayers(Constants.ARTBOARD_LINK, selection, context, ""));
	const artboardIndex = getArtboardIndex(currentArtboardName, artboardNames);
	const retVals = buildAlertWindow(artboardNames, artboardIndex), alertWindow = retVals[0], artboardComboBox = retVals[1];
	const response = alertWindow.runModal();
	switch (response) {
		case 1000: {
      // add
      const index = artboardComboBox.indexOfSelectedItem();
      const artboardName = index === 0 ? null : artboardNames[index];
      Utils.setValueOnLayers(artboardName, Constants.ARTBOARD_LINK, selection, context);
      break;
    }

		case 1001:
			// remove
			Utils.setValueOnLayers(null, Constants.ARTBOARD_LINK, selection, context);
			break;
	}
};

