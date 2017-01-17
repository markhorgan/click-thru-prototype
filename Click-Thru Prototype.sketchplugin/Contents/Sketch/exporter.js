@import "constants.js"
@import "utils.js"

var Exporter = function(outputPath, page, context) {
  this.page = page
  this.pagePath = outputPath + "/" + Utils.toFilename(this.page.name())
  this.context = context
  this.retinaImages = Utils.valueForKeyOnDocument(Constants.RETINA_IMAGES, context, 1) == 1
}

Exporter.prototype.hasMobileMenu = function(){
  return this.artboardSets.some(function(artboardSet){
    return artboardSet.some(function(artboardData){
      return artboardData.mobileMenuLayer != null
    })
  })
}

Exporter.prototype.generateCSSFile = function() {
  var fileManager = NSFileManager.defaultManager()
  var path = this.pagePath + "/" + Constants.CSS_DIRECTORY
  if (!fileManager.fileExistsAtPath(path)) {
    fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(path, false, null, null)
  }

  var css = 'body { margin: 0 }\n' +
    '.artboard-container { position: relative; margin: 0 auto; display: none }\n' +
    '.artboard-image { position: relative; z-index: 0; }\n' +
    '.hotspot { position: absolute; z-index: 1; display: block; padding: ' + Constants.HOTSPOT_PADDING + 'px; }\n' +
    '.hotspot.is-visible { border: 1px dotted #ccc; background-color: rgba(0, 0, 0, 0.1); animation: fadeOut 2.5s forwards }\n' +
    '@keyframes fadeOut {\n' +
    Utils.tab(1) + '0% { opacity: 0 }\n' +
    Utils.tab(1) + '45% { opacity: 1 }\n' +
    Utils.tab(1) + '55% { opacity: 1 }\n' +
    Utils.tab(1) + '100% { opacity: 0 }\n' +
    '}\n'

  if (this.hasMobileMenu()) {
    css += '.mobile-menu-container { position: absolute; z-index: 2; display: none }\n' +
      '.mobile-menu-image { position: position; z-index: 0; }\n' +
      '.mobile-menu-container .hotspot { z-index: 3 }\n'
  }

  Utils.writeToFile(css, path + "/main.css")
}

Exporter.prototype.generateJSFile = function(){
  var fileManager = NSFileManager.defaultManager()
  var jsPath = this.pagePath + "/" + Constants.JS_DIRECTORY
  var filename = "main.js"
  var targetPath = jsPath + filename
  var error = MOPointer.alloc().init()
  if (!fileManager.fileExistsAtPath(jsPath)) {
    if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(jsPath, false, null, error)) {
      log(error.value().localizedDescription())
    }
  }
  error = MOPointer.alloc().init()
  if (fileManager.fileExistsAtPath(targetPath)) {
    if (!fileManager.removeItemAtPath_error(targetPath, error)) {
      log(error.value().localizedDescription())
    }
  }
  var sourcePath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent(filename).path()
  error = MOPointer.alloc().init()
  if (!fileManager.copyItemAtPath_toPath_error(sourcePath, targetPath, error)) {
    log(error.value().localizedDescription())
  }
}

// returns the main artboard name for an artboard name
Exporter.prototype.getArtboardName = function(artboardName) {
  var retArtboardName = artboardName
  this.artboardSets.some(function(artboardSet){
    return artboardSet.some(function(artboardData){
      if (artboardName == String(artboardData.artboard.name())) {
        retArtboardName = artboardSet[0].artboard.name()
        return true
      }
    })
  })
  return retArtboardName
}

Exporter.prototype.getAbsoluteRect = function(layer, parentAbsoluteRect, indent) {
  var x, y, returnRect
  if (layer.isKindOfClass(MSArtboardGroup)) {
    if (parentAbsoluteRect != null) {
      // symbol artboard
      returnRect = parentAbsoluteRect
    } else {
      // root artboard
      returnRect = NSMakeRect(0, 0, layer.absoluteRect().width(), layer.absoluteRect().height())
    }
  } else if (parentAbsoluteRect != null) {
    switch (layer.resizingType()) {
      case ResizingType.STRETCH:
        var parentLayer = layer.parentForInsertingLayers()
        var horzScale = parentAbsoluteRect.size.width / parentLayer.frame().width()
        var vertScale = parentAbsoluteRect.size.height / parentLayer.frame().height()
        x = parentAbsoluteRect.origin.x + (layer.frame().x() * horzScale)
        y = parentAbsoluteRect.origin.y + (layer.frame().y() * vertScale)
        var width = layer.frame().width() * horzScale
        var height = layer.frame().height() * vertScale
        returnRect = NSMakeRect(x, y, width, height)
        if (Constants.LAYER_LOGGING) {
          log(Utils.tab(indent, 1) + layer.name() + ": " + layer.class() + "," + layer.isKindOfClass(MSArtboardGroup) + "," + layer.resizingType() + ",scale:" + horzScale + "," + vertScale + ",(" + Math.round(returnRect.origin.x) + "," + Math.round(returnRect.origin.y) + "," + Math.round(returnRect.size.width) + "," + Math.round(returnRect.size.height) + ")")
        }
        return returnRect

      case ResizingType.PIN_TO_CORNER:
        var parentLayer = layer.parentForInsertingLayers()
        var leftDistance =  layer.frame().x()
        var rightDistance = parentLayer.frame().width() - (layer.frame().x() + layer.frame().width())
        x = leftDistance < rightDistance ? parentAbsoluteRect.origin.x + leftDistance : (parentAbsoluteRect.origin.x +
          parentAbsoluteRect.size.width) - rightDistance - layer.frame().width()
        var topDistance = layer.frame().y()
        var bottomDistance = parentLayer.frame().height() - (layer.frame().y() + layer.frame().height())
        y = topDistance < bottomDistance ? parentAbsoluteRect.origin.y + topDistance : (parentAbsoluteRect.origin.y +
          parentAbsoluteRect.size.height) - bottomDistance - layer.frame().height()
        returnRect = NSMakeRect(x, y, layer.frame().width(), layer.frame().height())
        break

      case ResizingType.RESIZE_OBJECT:
        var parentLayer = layer.parentForInsertingLayers()
        var rightDistance = parentLayer.frame().width() - (layer.frame().x() + layer.frame().width())
        var bottomDistance = parentLayer.frame().height() - (layer.frame().y() + layer.frame().height())
        returnRect = NSMakeRect(parentAbsoluteRect.origin.x + layer.frame().x(),  parentAbsoluteRect.origin.y + layer.frame().y(),
          parentAbsoluteRect.size.width - layer.frame().x() - rightDistance, parentAbsoluteRect.size.height - layer.frame().y() - bottomDistance)
        break

      case ResizingType.FLOAT_IN_PLACE:
        var parentLayer = layer.parentForInsertingLayers()

        var unscaledLeftoverHorzSpace = parentLayer.frame().width() - layer.frame().width()
        var leftSpaceFraction = layer.frame().x() / unscaledLeftoverHorzSpace
        var rightSpaceFraction = (parentLayer.frame().width() - (layer.frame().x() + layer.frame().width())) / unscaledLeftoverHorzSpace
        var leftoverHorzSpace = parentAbsoluteRect.size.width - layer.frame().width()
        x = (((leftSpaceFraction * leftoverHorzSpace) + (parentAbsoluteRect.size.width - (rightSpaceFraction * leftoverHorzSpace))) / 2) + parentAbsoluteRect.origin.x - (layer.frame().width() / 2)

        var unscaledLeftoverVertSpace = parentLayer.frame().height() - layer.frame().height()
        var topSpaceFraction = layer.frame().y() / unscaledLeftoverVertSpace
        var bottomSpaceFraction = (parentLayer.frame().height() - (layer.frame().y() + layer.frame().height())) / unscaledLeftoverVertSpace
        var leftoverVertSpace = parentAbsoluteRect.size.height - layer.frame().height()
        y = (((topSpaceFraction * leftoverVertSpace) + (parentAbsoluteRect.size.height - (bottomSpaceFraction * leftoverVertSpace))) / 2) +  parentAbsoluteRect.origin.y - (layer.frame().height() / 2)
        returnRect = NSMakeRect(x, y, layer.frame().width(), layer.frame().height())
        break
    }
  } else {
    // mobile menu layer
    returnRect = NSMakeRect(layer.absoluteRect().rulerX(), layer.absoluteRect().rulerY(), layer.absoluteRect().width(), layer.absoluteRect().height())
  }
  if (Constants.LAYER_LOGGING) {
    log(Utils.tab(indent, 1) + layer.name() + ": " + layer.class() + "," + layer.isKindOfClass(MSArtboardGroup) + "," + layer.resizingType() + ",(" + Math.round(returnRect.origin.x) + "," + Math.round(returnRect.origin.y) + "," + Math.round(returnRect.size.width) + "," + Math.round(returnRect.size.height) + ")")
  }
  return returnRect
}

Exporter.prototype.getHotspots = function(layer, excludeMobileMenu, offset, artboardData, parentAbsoluteRect, indent) {
  var command = this.context.command
  var isMobileMenu = command.valueForKey_onLayer_forPluginIdentifier(Constants.IS_MOBILE_MENU, layer, this.context.plugin.identifier())
  if ((!layer.isVisible() && !isMobileMenu) || (excludeMobileMenu && isMobileMenu)) {
    return
  }
  if (indent == null) {
    indent = 0
  }

  var absoluteRect = this.getAbsoluteRect(layer, parentAbsoluteRect, indent)

  var hotspots = new Array()
  if (layer.isKindOfClass(MSSymbolInstance)) {
    // symbol instance
    var childHotspots = this.getHotspots(layer.symbolMaster(), excludeMobileMenu, offset, artboardData, absoluteRect, indent + 1)
    if (childHotspots != null) {
      Array.prototype.push.apply(hotspots, childHotspots)
    }
  } else if (layer.isKindOfClass(MSLayerGroup)) {
    // layer group
    layer.layers().forEach(function(childLayer){
      var childHotspots = this.getHotspots(childLayer, excludeMobileMenu, offset, artboardData, absoluteRect, indent + 1)
      if (childHotspots != null) {
        Array.prototype.push.apply(hotspots, childHotspots)
      }
    }, this)
  }

  var x = Math.round(absoluteRect.origin.x - Constants.HOTSPOT_PADDING)
  var y = Math.round(absoluteRect.origin.y - Constants.HOTSPOT_PADDING)
  // offset is used by the mobile menu
  if (offset != null) {
    x += offset.x
    y += offset.y
  }
  var width = Math.round(absoluteRect.size.width)
  var height = Math.round(absoluteRect.size.height)

  var artboardName = command.valueForKey_onLayer_forPluginIdentifier(Constants.ARTBOARD_LINK, layer, this.context.plugin.identifier())
  if (artboardName != null && artboardName != "") {
    // artboard link
    hotspots.push({href:Utils.toFilename(this.getArtboardName(artboardName))+".html", x:x, y:y, width:width, height:height})
  } else {
    // external link
    var externalLink = command.valueForKey_onLayer_forPluginIdentifier(Constants.EXTERNAL_LINK, layer, this.context.plugin.identifier())
    if (externalLink != null && externalLink != "") {
      var openLinkInNewWindow = command.valueForKey_onLayer_forPluginIdentifier(Constants.OPEN_LINK_IN_NEW_WINDOW, layer, this.context.plugin.identifier())
      var regExp = new RegExp("^http(s?):\/\/")
      if (!regExp.test(externalLink.toLowerCase())) {
        externalLink = "http://" + externalLink
      }
      var target = openLinkInNewWindow ? "_blank" : null
      hotspots.push({href:externalLink, target:target, x: x, y: y, width: width, height: height})
    } else {
      var dialogType = command.valueForKey_onLayer_forPluginIdentifier(Constants.DIALOG_TYPE, layer, this.context.plugin.identifier())
      if (dialogType != null) {
        // JavaScript dialog
        var dialogText = command.valueForKey_onLayer_forPluginIdentifier(Constants.DIALOG_TEXT, layer, this.context.plugin.identifier())
        dialogText = dialogText.replace(new RegExp("'", "g"), "\\'").replace(new RegExp('"', "g"), "")
        hotspots.push({href: "javascript:" + dialogType + "('" + dialogText + "')", x: x, y: y, width: width, height: height})
      } else {
        var isMobileMenuButton = command.valueForKey_onLayer_forPluginIdentifier(Constants.IS_MOBILE_MENU_BUTTON, layer, this.context.plugin.identifier())
        if (isMobileMenuButton) {
          // mobile menu button
          hotspots.push({href: "javascript:toggle(this)", x: x, y: y, width: width, height: height})
        }
      }
    }
  }
  return hotspots
}

Exporter.prototype.buildHotspotHTML = function(hotspot) {
  var style = "left:" + hotspot.x + "px; top:" + hotspot.y + "px; width:" + hotspot.width + "px; height:" + hotspot.height + "px"
  var html = '<a href="' + hotspot.href + '" class="hotspot" style="' + style + '"'
  if (hotspot.target != null) {
    html += ' target="' + hotspot.target + '"'
  }
  html += '></a>\n'
  return html
}

Exporter.prototype.buildHotspots = function(layer, artboardData, indent) {
  var html = ''
  var isMobileMenuLayer = !layer.isKindOfClass(MSArtboardGroup)
  var offset = isMobileMenuLayer ? {x: -layer.absoluteRect().rulerX(), y: -layer.absoluteRect().rulerY()} : null
  var hotspots = this.getHotspots(layer, !isMobileMenuLayer, offset, artboardData)
  if (hotspots != null) {
    hotspots.forEach(function (hotspot) {
      html += Utils.tab(indent) + this.buildHotspotHTML(hotspot)
    }, this)
  }
  return html
}

Exporter.prototype.buildEmbeddedCSS = function(artboardSet) {
  var html = '<style>\n'

  artboardSet.forEach(function(artboardData, index) {
    // artboard container
    html += '#' + this.getCSSName(artboardData, "artboard-container") + ' { width: ' + artboardData.artboard.frame().width() + 'px'
    if (index == 0) {
      html += '; display: block'
    }
    html += ' }\n'

    if (artboardData.mobileMenuLayer != null) {
      // mobile menu
      // container
      var mobileMenuLayer = artboardData.mobileMenuLayer
      var left = mobileMenuLayer.absoluteRect().rulerX() + (Math.floor((mobileMenuLayer.frame().width() - mobileMenuLayer.absoluteInfluenceRect().size.width) / 2))
      var top = mobileMenuLayer.absoluteRect().rulerY() + (Math.floor((mobileMenuLayer.frame().height() - mobileMenuLayer.absoluteInfluenceRect().size.height) / 2))
      html += '#' + this.getCSSName(artboardData, "mobile-menu-container") + ' { left:' + left + 'px; top:' + top + 'px }\n'
      // image
      var width = mobileMenuLayer.absoluteInfluenceRect().size.width
      var height = mobileMenuLayer.absoluteInfluenceRect().size.height
      html += '#' + this.getCSSName(artboardData, "mobile-menu-image") + ' { width: ' + width + 'px; height: ' + height + 'px; background: url("' + Constants.IMAGES_DIRECTORY + this.getMobileMenuImageName(artboardData.artboard, 1) + '") no-repeat; }\n'
    }

    // artboard image
    var width = artboardData.artboard.frame().width()
    var height = artboardData.artboard.frame().height()
    html += '#' + this.getCSSName(artboardData, "artboard-image") + ' { width: ' + width + 'px; height: ' + height + 'px; background: url("' + Constants.IMAGES_DIRECTORY + this.getArtboardImageName(artboardData.artboard, 1) + '") no-repeat; }\n'

    // background color
    if (index == 0) {
      if (artboardData.artboard.hasBackgroundColor()) {
        var backgroundColor = Utils.colorToHex(artboardData.artboard.backgroundColor())
        html += 'body { background-color: ' + backgroundColor + ' }\n'
      }
    }
  }, this)

  // retina media query
  if (this.retinaImages) {
    html += '@media (-webkit-min-device-pixel-ratio: 2), (min--moz-device-pixel-ratio: 2), (-o-min-device-pixel-ratio: 2/1), (min-resolution: 192dpi), (min-resolution: 2dppx) {\n'
    artboardSet.forEach(function (artboardData) {
      if (artboardData.mobileMenuLayer != null) {
        // mobile menu image
        var mobileMenuLayer = artboardData.mobileMenuLayer
        var width = mobileMenuLayer.absoluteInfluenceRect().size.width
        var height = mobileMenuLayer.absoluteInfluenceRect().size.height
        html += Utils.tab(1) + '#' + this.getCSSName(artboardData, "mobile-menu-image") + ' { background-image: url("' + Constants.IMAGES_DIRECTORY + this.getMobileMenuImageName(artboardData.artboard, 2) + '"); background-size: ' + width + 'px ' + height + 'px; }\n'
      }

      // artboard image
      var width = artboardData.artboard.frame().width()
      var height = artboardData.artboard.frame().height()
      html += Utils.tab(1) + '#' + this.getCSSName(artboardData, "artboard-image") + ' { background-image: url("' + Constants.IMAGES_DIRECTORY + this.getArtboardImageName(artboardData.artboard, 2) + '"); background-size: ' + width + 'px ' + height + 'px; }\n'
    }, this)
    html += '}\n'
  }

  // responsive media queries
  artboardSet.forEach(function(artboardData, index){
    if (index > 0) {
      var previousArtboardData = artboardSet[index - 1]
      html += '@media screen and (max-width: ' + (previousArtboardData.artboard.frame().width() - 1) + 'px) {\n'
      // hide other artboards
      html += '  '
      artboardSet.forEach(function(otherArtboardData, i) {
        if (otherArtboardData != artboardData) {
          if (i > 0) {
            html += ', '
          }
          html += '#' + this.getCSSName(otherArtboardData, "artboard-container")
        }
      }, this)
      html += ' { display: none }\n'
      // show artboard
      html += '  #' + this.getCSSName(artboardData, "artboard-container") + ' { display: block }\n'
      if (artboardData.artboard.hasBackgroundColor()) {
        var backgroundColor = Utils.colorToHex(artboardData.artboard.backgroundColor())
        html += '  body { background-color: ' + backgroundColor + ' }\n'
      }
      html += '}\n'
    }
  }, this)

  html += '</style>\n'
  return html
}

Exporter.prototype.getArtboardImageName = function(artboard, scale) {
  var suffix = scale == 2 ? "@2x" : ""
  return Utils.toFilename(artboard.name(), false) + suffix + ".png"
}

Exporter.prototype.getMobileMenuImageName = function(artboard, scale) {
  var suffix = scale == 2 ? "@2x" : ""
  return Utils.toFilename(artboard.name(), false) + "_mobile_menu" + suffix + ".png"
}

Exporter.prototype.getCSSName = function(artboardData, suffix) {
  return artboardData.suffix != null ? artboardData.suffix + "-" + suffix : "main-" + suffix
}

// nestedHTML: optional
Exporter.prototype.buildArtboardHTML = function(artboardData, nestedHTML) {
  var artboard = artboardData.artboard
  var width = artboard.frame().width()
  var height = artboard.frame().height()
  var html = Utils.tab(1) + '<div id="' + this.getCSSName(artboardData, "artboard-container") + '" class="artboard-container">\n' +
    Utils.tab(2) + '<div id="' + this.getCSSName(artboardData, "artboard-image") + '" class="artboard-image"></div>\n' +
    this.buildHotspots(artboard, artboardData, 2)
  if (nestedHTML != null) {
    html += nestedHTML
  }
  html += Utils.tab(1) + '</div>\n'
  return html
}

Exporter.prototype.buildMobileMenuHTML = function(artboardData, indent) {
  var mobileMenuLayer = artboardData.mobileMenuLayer
  if (mobileMenuLayer == null) {
    return null
  }
  return  Utils.tab(indent) + '<div id="' + this.getCSSName(artboardData, "mobile-menu-container") + '" class="mobile-menu-container">\n' +
    Utils.tab(indent + 1) + '<div id="' + this.getCSSName(artboardData, "mobile-menu-image")  + '" class="mobile-menu-image"></div>\n' +
    this.buildHotspots(mobileMenuLayer, artboardData, indent + 1) +
    Utils.tab(indent) + '</div>\n'
}

Exporter.prototype.hasMobileMenuLayer = function(artboardSet) {
  return artboardSet.some(function(artboardData){
    return artboardData.mobileMenuLayer != null
  })
}

Exporter.prototype.generateHTMLFile = function(artboardSet) {
  var mainArtboard = artboardSet[0].artboard
  var html = '<!DOCTYPE html>\n<head>\n' +
    '<title>'+mainArtboard.name()+'</title>\n' +
    '<meta name="viewport" content="width=device-width, minimum-scale=1.0, maximum-scale=1.0" />\n' +
    '<link href="css/main.css" rel="stylesheet" type="text/css"/>\n'
  html += this.buildEmbeddedCSS(artboardSet) +
    '<script src="js/main.js" type="text/javascript"></script>\n' +
    '</head>\n<body>\n<main>\n'
  artboardSet.forEach(function(artboardData) {
    var mobileMenuHTML = null
    if (artboardData.mobileMenuLayer != null) {
      mobileMenuHTML = this.buildMobileMenuHTML(artboardData, 2)
    }
    html += this.buildArtboardHTML(artboardData, mobileMenuHTML)
  }, this)
  html += '</main>\n</body>\n</html>\n'

  var filename = Utils.toFilename(mainArtboard.name()) + ".html"
  var filePath = this.pagePath + "/" + filename
  Utils.writeToFile(html, filePath)
}

Exporter.prototype.findLayer = function(key, layer) {
  var isMobileMenu = !!(this.context.command.valueForKey_onLayer_forPluginIdentifier(key, layer, this.context.plugin.identifier()))
  if (isMobileMenu) {
    return layer
  }

  var targetLayer = null
  if (layer.isKindOfClass(MSLayerGroup)) {
    layer.layers().some(function(childLayer){
      targetLayer = this.findLayer(key, childLayer)
      if (targetLayer != null) {
        return true
      }
    }, this)
  }

  return targetLayer
}

Exporter.prototype.exportImage = function(layer, scale, imagePath) {
  var slice
  if (layer.isKindOfClass(MSArtboardGroup)) {
    slice = MSExportRequest.exportRequestsFromExportableLayer(layer).firstObject()
  } else {
    slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(layer, layer.absoluteInfluenceRect(), false).firstObject()
  }
  slice.scale = scale
  slice.saveForWeb = true
  slice.format = "png"
  this.context.document.saveArtboardOrSlice_toFile(slice, imagePath)
}

Exporter.prototype.exportImages = function(artboardSet) {
  var doc = this.context.document
  var imagesPath = this.pagePath + "/" + Constants.IMAGES_DIRECTORY
  artboardSet.forEach(function(artboardData){
    var mobileMenuLayer = artboardData.mobileMenuLayer
    var mobileMenuLayerIsVisible = mobileMenuLayer != null && mobileMenuLayer.isVisible()
    if (mobileMenuLayerIsVisible) {
      mobileMenuLayer.setIsVisible(false)
    }

    this.exportImage(artboardData.artboard, 1, imagesPath + this.getArtboardImageName(artboardData.artboard, 1))
    if (this.retinaImages) {
      this.exportImage(artboardData.artboard, 2, imagesPath + this.getArtboardImageName(artboardData.artboard, 2))
    }

    if (mobileMenuLayer != null) {
      mobileMenuLayer.setIsVisible(true)
      this.exportImage(mobileMenuLayer, 1, imagesPath + this.getMobileMenuImageName(artboardData.artboard, 1))
      if (this.retinaImages) {
        this.exportImage(mobileMenuLayer, 2, imagesPath + this.getMobileMenuImageName(artboardData.artboard, 2))
      }
      if (!mobileMenuLayerIsVisible) {
        mobileMenuLayer.setIsVisible(false)
      }
    }
  }, this)
}

Exporter.prototype.getArtboardSet = function(artboard, artboardSets) {
  for (var i = 0; i < artboardSets.length; i++) {
    var artboardSet = artboardSets[i]
    var suffix = Utils.getSuffix(artboard.name(), artboardSet[0].artboard.name())
    if (suffix != null) {
      if (suffix.length == 0) {
        suffix = null
      }
      return [artboardSet, suffix]
    }
  }
  return [null, null]
}

Exporter.prototype.getArtboardSets = function(){
  var artboardSets = new Array()

  // sort by name
  var artboards = this.page.artboards().sort(function(a, b) {
    if (a.name() < b.name()) {
      return -1
    } else if (a.name() > b.name()) {
      return 1
    } else {
      return 0
    }
  })

  // group into artboard sets
  artboards.forEach(function(artboard){
    var retVals = this.getArtboardSet(artboard, artboardSets), artboardSet = retVals[0], suffix = retVals[1]
    if (artboardSet == null) {
      artboardSet = new Array()
      artboardSets.push(artboardSet)
    }
    artboardSet.push({artboard: artboard, suffix: suffix, mobileMenuLayer: this.findLayer(Constants.IS_MOBILE_MENU, artboard)})
  }, this)

  // sort by width
  for (var i = 0; i < artboardSets.length; i++) {
    artboardSets[i] = artboardSets[i].sort(function(a, b){
      if (a.artboard.frame().width() < b.artboard.frame().width()) {
        return 1
      } else if (a.artboard.frame().width() > b.artboard.frame().width()) {
        return -1
      } else {
        return 0
      }
    })
  }

  /*artboardSets.forEach(function(artboardSet){
    artboardSet.forEach(function(artboardData){
      log("artboard: " + artboardData.artboard.name() + ", suffix:" + artboardData.suffix)
    })
  })*/

  return artboardSets
}

Exporter.prototype.exportArtboards = function () {
  var fileManager = NSFileManager.defaultManager()

  // delete and create directory
  if (fileManager.fileExistsAtPath(this.pagePath)) {
    fileManager.removeItemAtPath_error(this.pagePath, null)
  }
  fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(this.pagePath, false, null, null)

  this.artboardSets = this.getArtboardSets()

  this.generateCSSFile()
  this.generateJSFile()

  this.artboardSets.forEach(function(artboardSet) {
    this.exportImages(artboardSet)
    this.generateHTMLFile(artboardSet)
  }, this)
}