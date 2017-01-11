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
  if (value == null) {
    return nullValue
  } else {
    return value
  }
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

Utils.getSuffix = function(str1, str2) {
  str1 = String(str1)
  str2 = String(str2)
  var i = 0
  while (i <= str1.length && i <= str2.length && str1.substring(0, i) == str2.substring(0, i)) {
    i++
  }
  var digitRegExp = /^\d+$/
  var separatorRegExp = /[\s-_]+/
  var suffix = str1.substr(i - 1).replace(/^[\s-_]+/, "").trim()
  if (i > 1 && !digitRegExp.test(suffix) && !separatorRegExp.test(suffix)) {
    //log("str1: " + str1 + ", str2:" + str2 + ", suffix:" + suffix)
    return suffix
  } else {
    //log("str1: " + str1 + ", str2:" + str2 + ", suffix:" + suffix + " - rejected")
    return null
  }
}
