@import "constants.js"

var Utils = {}

Utils.writeToFile = function (str, filePath) {
  objcStr = [NSString stringWithFormat:@"%@", str]
  objcFilePath = [NSString stringWithFormat:@"%@", filePath]
  return objcStr.writeToFile_atomically_encoding_error(objcFilePath, true, NSUTF8StringEncoding, null)
}

Utils.colorToHex = function (color) {
  var red = Math.round(color.red() * 255)
  var green = Math.round(color.green() * 255)
  var blue = Math.round(color.blue() * 255)
  return "#" + ("0" + red.toString(16)).slice(-2) + ("0" + green.toString(16)).slice(-2) + ("0" + blue.toString(16)).slice(-2)
}

Utils.saveFileDialog = function() {
  var openPanel = NSOpenPanel.openPanel()
  openPanel.setTitle("Chooce a location...")
  openPanel.setPrompt("Export")
  openPanel.setCanChooseDirectories(true)
  openPanel.setCanCreateDirectories(true)
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

// dasherize: optional, default: true
Utils.toFilename = function(name, dasherize) {
  if (dasherize == null) {
    dasherize = true
  }
  var dividerCharacter = dasherize ? "-" : "_"
  return name.replace(/[\/]/g, "").replace(/[\s_-]+/g, dividerCharacter).toLowerCase()
}

// nullValue: optional, default: null
Utils.valueForKeyOnLayers = function(key, selection, context, nullValue) {
  var value, lastValue = null
  selection.some(function(layer) {
    value = context.command.valueForKey_onLayer_forPluginIdentifier(key, layer, context.plugin.identifier())
    if (lastValue != null && (value + "") != (lastValue + "")) {
      value = null
      return true
    }
    lastValue = value
  })
  return value == null ? nullValue : value
}

// nullValue: optional, default: null
Utils.valueForKeyOnDocument = function(key, context, nullValue) {
  var value = context.command.valueForKey_onDocument_forPluginIdentifier(key, context.document.documentData(), context.plugin.identifier())
  return value == null ? nullValue : value
}

var _deleteFromArtboard = function(layer, ignoreLayer, key, context) {
  if (layer != ignoreLayer) {
    context.command.setValue_forKey_onLayer_forPluginIdentifier(null, key, layer, context.plugin.identifier())
  }
  if (layer.class() == "MSLayerGroup") {
    layer.layers().forEach(function(childLayer){
      _deleteFromArtboard(childLayer, ignoreLayer, key, context)
    })
  }
}

// exclusiveOnLayer: optional, default: true - deletes other values on the layer
// exclusiveOnArtboard: optional, default: false - deletes same value on other layers in the artboard
Utils.setValueOnLayers = function(value, key, selection, context, exclusiveOnLayer, exclusiveOnArtboard) {
  if (exclusiveOnLayer == null) {
    exclusiveOnLayer = true
  }
  if (exclusiveOnArtboard == null) {
    exclusiveOnArtboard = false
  }
  var command = context.command
  selection.forEach(function(layer){
    command.setValue_forKey_onLayer_forPluginIdentifier(value, key, layer, context.plugin.identifier())

    if (exclusiveOnLayer) {
      Constants.KEYS.forEach(function(itKey) {
        if (itKey != key) {
          command.setValue_forKey_onLayer_forPluginIdentifier(null, itKey, layer, context.plugin.identifier())
        }
      })
    }
  })
  if (exclusiveOnArtboard) {
    selection.forEach(function(layer) {
      layer.parentArtboard().layers().forEach(function(tLayer){
        _deleteFromArtboard(tLayer, layer, key, context)
      })
    })
  }
}

Utils.setValueOnDocument = function(value, key, context) {
  context.command.setValue_forKey_onDocument_forPluginIdentifier(value, key, context.document.documentData(), context.plugin.identifier())
}

// str: optional, default: " "
Utils.repeatStr = function(count, str) {
  if (str == null) {
    str = " "
  }
  var retStr = ""
  for (var i = 0; i < count; i++) {
    retStr += str
  }
  return retStr
}

Utils.tab = function(count, tabSize) {
  if (tabSize == null) {
    tabSize = Constants.TAB_SIZE
  }
  return Utils.repeatStr(count * tabSize)
}

Utils.getArtboardSets = function(artboards) {
  var artboardSets = new Array()
  var artboardSetsByBaseName = new Object()

  artboards.forEach(function(artboard){
    var retVals, suffix = null, baseName

    for (var i = 0; i < artboards.length; i++) {
      var otherArtboard = artboards[i]
      retVals = Utils.getArtboardNameParts(artboard, otherArtboard)
      if (retVals != null) {
        break
      }
    }

    if (retVals != null) {
      // part of a set
      baseName = retVals[0]
      suffix = retVals[1]
      if (suffix.length == 0) {
        suffix = null
      }
      artboardSet = artboardSetsByBaseName[baseName]
      if (artboardSet == null) {
        artboardSet = new Array()
        artboardSets.push(artboardSet)
        artboardSetsByBaseName[baseName] = artboardSet
      }
    } else {
      // not part of a set
      baseName = artboard.name()
      artboardSet = new Array()
      artboardSets.push(artboardSet)
    }
    artboardSet.push({artboard: artboard, baseName: baseName, suffix: suffix})
  })
  return artboardSets
}

Utils.getArtboardNameParts = function(artboard1, artboard2) {
  if (artboard1.frame().width() == artboard2.frame().width()) {
    return
  }
  var name1 = String(artboard1.name())
  var name2 = String(artboard2.name())
  if (name1 == name2) {
    return
  }
  var i = 0
  // find where they diverge
  while (i <= name1.length && i <= name2.length && name1.substring(0, i) == name2.substring(0, i)) {
    i++
  }
  if (i > 0) {
    i--
  }
  if (i < name1.length && i < name2.length) {
    // go back to the separator
    var seperatorRegex = /[\s-_]/
    while (i > 1 && seperatorRegex.test(name1.substr(i - 1, 1))) {
      i--
    }
  }
  var baseName = name1.substr(0, i)
  var suffix = name1.substr(i)
  if (i > 0 && (suffix.length == 0 || /^[\s-_]+.[^\s-_]+/.test(suffix))) {
    //log("name1: " + name1 + ", name2: " + name2 + ", baseName:" + baseName + ":, suffix:" + suffix.replace(/^[\s-_]+/, "").trim() + ":")
    return [baseName, suffix.replace(/^[\s-_]+/, "").trim()]
  } /* else {
    log("name1: " + name1 + ", name2: " + name2 + ", baseName:" + baseName + ":, suffix:" + suffix + ": - rejected")
  } */
}

Utils.isSymbolsPage = function(page) {
  return page.artboards()[0].isKindOfClass(MSSymbolMaster)
}
