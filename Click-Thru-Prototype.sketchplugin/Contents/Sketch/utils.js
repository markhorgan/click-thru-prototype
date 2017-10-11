@import "constants.js";

class Utils {

  static writeToFile(str, filePath) {
    const objcStr = NSString.stringWithFormat("%@", str);
    return objcStr.writeToFile_atomically_encoding_error(filePath, true, NSUTF8StringEncoding, null);
  }

  static colorToHex(color) {
    const red = Math.round(color.red() * 255);
    const green = Math.round(color.green() * 255);
    const blue = Math.round(color.blue() * 255);
    return "#" + ("0" + red.toString(16)).slice(-2) + ("0" + green.toString(16)).slice(-2) + ("0" + blue.toString(16)).slice(-2);
  }

  static toFilename(name, dasherize = true) {
    if (dasherize == null) {
      dasherize = true;
    }
    const dividerCharacter = dasherize ? "-" : "_";
    return name.replace(/[/]/g, "").replace(/[\s_-]+/g, dividerCharacter).toLowerCase();
  }

  static valueForKeyOnLayers(key, selection, context, nullValue = null) {
    let value, lastValue = null;
    selection.some(function (layer) {
      value = context.command.valueForKey_onLayer_forPluginIdentifier(key, layer, context.plugin.identifier());
      if (lastValue != null && (value + "") != (lastValue + "")) {
        value = null;
        return true;
      }
      lastValue = value;
    });
    return value == null ? nullValue : value;
  }

  static valueForKeyOnDocument(key, context, nullValue = null) {
    const value = context.command.valueForKey_onDocument_forPluginIdentifier(key, context.document.documentData(), context.plugin.identifier());
    return value == null ? nullValue : value;
  }

  // exclusiveOnLayer: deletes other values on the layer
  // exclusiveOnArtboard: deletes same value on other layers in the artboard
  static setValueOnLayers(value, key, selection, context, exclusiveOnLayer = true, exclusiveOnArtboard = false) {
    if (exclusiveOnLayer == null) {
      exclusiveOnLayer = true;
    }
    if (exclusiveOnArtboard == null) {
      exclusiveOnArtboard = false;
    }
    const command = context.command;
    selection.forEach(function (layer) {
      command.setValue_forKey_onLayer_forPluginIdentifier(value, key, layer, context.plugin.identifier());

      if (exclusiveOnLayer) {
        Constants.KEYS.forEach(function (itKey) {
          if (itKey != key) {
            command.setValue_forKey_onLayer_forPluginIdentifier(null, itKey, layer, context.plugin.identifier());
          }
        });
      }
    });
    if (exclusiveOnArtboard) {
      selection.forEach(function (layer) {
        layer.parentArtboard().layers().forEach(function (tLayer) {
          Utils._deleteFromArtboard(tLayer, layer, key, context);
        });
      });
    }
  }

  static setValueOnDocument(value, key, context) {
    context.command.setValue_forKey_onDocument_forPluginIdentifier(value, key, context.document.documentData(), context.plugin.identifier());
  }

  static hasResponsiveArtboards(context) {
    return Utils.valueForKeyOnDocument(Constants.RESPONSIVE_ARTBOARDS, context, 1) == 1;
  }

  static repeatStr(count, str = " ") {
    if (str == null) {
      str = " ";
    }
    let retStr = "";
    for (let i = 0; i < count; i++) {
      retStr += str;
    }
    return retStr;
  }

  static tab(count, tabSize) {
    if (tabSize == null) {
      tabSize = Constants.TAB_SIZE;
    }
    return Utils.repeatStr(count * tabSize);
  }

  static getArtboardGroups(artboards, context) {
    const artboardGroups = [];
    if (Utils.hasResponsiveArtboards(context)) {
      const artboardGroupsByBaseName = {};

      artboards.forEach(function (artboard) {
        let retVals, suffix = null, baseName, artboardGroup;

        for (let i = 0; i < artboards.length; i++) {
          const otherArtboard = artboards[i];
          retVals = Utils.getArtboardNameParts(artboard, otherArtboard);
          if (retVals != null) {
            break;
          }
        }

        if (retVals != null) {
          // part of a set
          baseName = retVals[0];
          suffix = retVals[1];
          if (suffix.length == 0) {
            suffix = null;
          }
          artboardGroup = artboardGroupsByBaseName[baseName];
          if (artboardGroup == null) {
            artboardGroup = [];
            artboardGroups.push(artboardGroup);
            artboardGroupsByBaseName[baseName] = artboardGroup;
          }
        } else {
          // not part of a set
          baseName = artboard.name();
          artboardGroup = [];
          artboardGroups.push(artboardGroup);
        }
        artboardGroup.push({artboard: artboard, baseName: baseName, suffix: suffix});
      });
    } else {
      artboards.forEach(function (artboard) {
        artboardGroups.push([{artboard: artboard, baseName: artboard.name()}]);
      });
    }
    return artboardGroups;
  }

  static getArtboardNameParts(artboard1, artboard2) {
    if (artboard1.frame().width() == artboard2.frame().width()) {
      return;
    }
    const name1 = String(artboard1.name());
    const name2 = String(artboard2.name());
    if (name1 == name2) {
      return;
    }
    let i = 0;
    // find where they diverge
    while (i <= name1.length && i <= name2.length && name1.substring(0, i) == name2.substring(0, i)) {
      i++;
    }
    if (i > 0) {
      i--;
    }
    if (i < name1.length && i < name2.length) {
      // go back to the separator
      const seperatorRegex = /[\s-_]/;
      while (i > 1 && seperatorRegex.test(name1.substr(i - 1, 1))) {
        i--;
      }
    }
    const baseName = name1.substr(0, i);
    const suffix = name1.substr(i);
    if (i > 0 && (suffix.length == 0 || /^[\s-_]+.[^\s-_]+/.test(suffix))) {
      //log("name1: " + name1 + ", name2: " + name2 + ", baseName:" + baseName + ":, suffix:" + suffix.replace(/^[\s-_]+/, "").trim() + ":")
      return [baseName, suffix.replace(/^[\s-_]+/, "").trim()];
    }
    /* else {
         log("name1: " + name1 + ", name2: " + name2 + ", baseName:" + baseName + ":, suffix:" + suffix + ": - rejected")
       } */
  }

  static isSymbolsPage(page) {
    return page.artboards()[0].isKindOfClass(MSSymbolMaster);
  }

  static removeFilesWithExtension(path, extension) {
    const error = MOPointer.alloc().init();
    const fileManager = NSFileManager.defaultManager();
    const files = fileManager.contentsOfDirectoryAtPath_error(path, null);
    files.forEach(function (file) {
      if (file.pathExtension() == extension) {
        if (!fileManager.removeItemAtPath_error(path + "/" + file, error)) {
          log(error.value().localizedDescription());
        }
      }
    });
  }

  static _deleteFromArtboard(layer, ignoreLayer, key, context) {
    if (layer != ignoreLayer) {
      context.command.setValue_forKey_onLayer_forPluginIdentifier(null, key, layer, context.plugin.identifier());
    }
    if (layer.class() == "MSLayerGroup") {
      layer.layers().forEach(function (childLayer) {
        Utils._deleteFromArtboard(childLayer, ignoreLayer, key, context);
      });
    }
  }
}

