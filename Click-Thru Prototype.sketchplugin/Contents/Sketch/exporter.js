@import "constants.js"
@import "utils.js"

var Exporter = function(selectedPath, page, context) {
  this._outputPath = this.createOutputPath(selectedPath)
  this.page = page
  this.context = context
  this.retinaImages = Utils.valueForKeyOnDocument(Constants.RETINA_IMAGES, context, 1) == 1
}

Exporter.prototype.hasMobileMenu = function(){
  return this.artboardGroups.some(function(artboardGroup){
    return artboardGroup.some(function(artboardData){
      return artboardData.mobileMenuLayer != null
    })
  })
}

Exporter.prototype.generateCSSFile = function() {
  var fileManager = NSFileManager.defaultManager()
  var path = this._outputPath + "/" + Constants.CSS_DIRECTORY
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
  var jsPath = this._outputPath + "/" + Constants.JS_DIRECTORY
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
    hotspots.push({href:Utils.toFilename(artboardName)+".html", x:x, y:y, width:width, height:height})
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
          var idName = this.getCSSName(artboardData, "mobile-menu-container")
          hotspots.push({href: "javascript:toggle('" + idName + "')", x: x, y: y, width: width, height: height})
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

  var filename = Utils.toFilename(artboardSet[0].baseName) + ".html"
  var filePath = this._outputPath + "/" + filename
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
  slice.saveForWeb = false
  slice.format = "png"
  this.context.document.saveArtboardOrSlice_toFile(slice, imagePath)
}

Exporter.prototype.exportImages = function(artboardSet) {
  var error
  var imagesPath = this._outputPath + "/" + Constants.IMAGES_DIRECTORY
  var fileManager = NSFileManager.defaultManager()

  if (!fileManager.fileExistsAtPath(imagesPath)) {
    error = MOPointer.alloc().init()
    if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(imagesPath, false, null, error)) {
      log(error.value().localizedDescription())
    }
  } else {
    Utils.removeFilesWithExtension(imagesPath, "png")
  }

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

Exporter.prototype.getArtboardGroups = function(){
  var artboardGroups = Utils.getArtboardGroups(this.page.artboards(), this.context)

  artboardGroups.forEach(function (artboardGroup) {
    // set mobile menu sLayer
    artboardGroup.forEach(function (artboardData) {
      artboardData.mobileMenuLayer = this.findLayer(Constants.IS_MOBILE_MENU, artboardData.artboard)
    }, this)

    if (Utils.hasResponsiveArtboards(this.context)) {
      // sort artboards within a set by width
      artboardGroup.sort(function (a, b) {
        if (a.artboard.frame().width() < b.artboard.frame().width()) {
          return 1
        } else if (a.artboard.frame().width() > b.artboard.frame().width()) {
          return -1
        } else {
          return 0
        }
      })
    }
  }, this)
  return artboardGroups
}

Exporter.prototype.exportArtboards = function () {
  this.artboardGroups = this.getArtboardGroups()

  this.generateCSSFile()
  this.generateJSFile()

  this.artboardGroups.forEach(function(artboardGroup) {
    this.exportImages(artboardGroup)
    this.generateHTMLFile(artboardGroup)
  }, this)
}

Exporter.prototype.createOutputPath = function(selectedPath) {
  var error
  var fileManager = NSFileManager.defaultManager()
  var outputPath = selectedPath + "/" + Constants.OUTPUT_DIRECTORY
  if (!fileManager.fileExistsAtPath(outputPath)) {
    error = MOPointer.alloc().init()
    if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(outputPath, false, null, error)) {
      log(error.value().localizedDescription())
    }
  } else {
    Utils.removeFilesWithExtension(outputPath, "html")
  }
  return outputPath
}