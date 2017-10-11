@import "constants.js";
@import "utils.js";
@import "resizing_constraint.js";
@import "resizing_type.js";

class Exporter {

  constructor(selectedPath, page, context) {
    this.prepareOutputFolder(selectedPath);
    this.page = page;
    this.context = context;
    this.retinaImages = Utils.valueForKeyOnDocument(Constants.RETINA_IMAGES, context, 1) === 1;
  }

  hasMobileMenu() {
    return this.artboardGroups.some(function (artboardGroup) {
      return artboardGroup.some(function (artboardData) {
        return artboardData.mobileMenuLayer != null;
      });
    });
  }

  generateCSSFile() {
    const fileManager = NSFileManager.defaultManager();
    const path = this._outputPath + "/" + Constants.CSS_DIRECTORY;
    if (!fileManager.fileExistsAtPath(path)) {
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(path, false, null, null);
    }

    let css = 'body { margin: 0 }\n' +
        '.artboard-container { position: relative; margin: 0 auto; display: none }\n' +
        '.artboard-image { position: relative; z-index: 0; }\n' +
        '.hotspot { position: absolute; z-index: 1; display: block; padding: ' + Constants.HOTSPOT_PADDING + 'px; }\n' +
        '.hotspot.is-visible { border: 1px dotted #ccc; background-color: rgba(0, 0, 0, 0.1); animation: fadeOut 2.5s forwards }\n' +
        '@keyframes fadeOut {\n' +
        Utils.tab(1) + '0% { opacity: 0 }\n' +
        Utils.tab(1) + '45% { opacity: 1 }\n' +
        Utils.tab(1) + '55% { opacity: 1 }\n' +
        Utils.tab(1) + '100% { opacity: 0 }\n' +
        '}\n';

    if (this.hasMobileMenu()) {
      css += '.mobile-menu-container { position: absolute; z-index: 2; display: none }\n' +
          '.mobile-menu-image { position: position; z-index: 0; }\n' +
          '.mobile-menu-container .hotspot { z-index: 3 }\n';
    }

    Utils.writeToFile(css, path + "/main.css");
  }

  generateJSFile() {
    const fileManager = NSFileManager.defaultManager();
    const jsPath = this._outputPath + "/" + Constants.JS_DIRECTORY;
    const filename = "main.js";
    const targetPath = jsPath + filename;
    let error = MOPointer.alloc().init();
    if (!fileManager.fileExistsAtPath(jsPath)) {
      if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(jsPath, false, null, error)) {
        log(error.value().localizedDescription());
      }
    }
    error = MOPointer.alloc().init();
    if (fileManager.fileExistsAtPath(targetPath)) {
      if (!fileManager.removeItemAtPath_error(targetPath, error)) {
        log(error.value().localizedDescription());
      }
    }
    const sourcePath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("Resources").URLByAppendingPathComponent(filename).path();
    error = MOPointer.alloc().init();
    if (!fileManager.copyItemAtPath_toPath_error(sourcePath, targetPath, error)) {
      log(error.value().localizedDescription());
    }
  }

  getAbsoluteRect(layer, parentAbsoluteRect, indent) {
    let x, y, returnRect;
    if (layer.isKindOfClass(MSArtboardGroup)) {
      if (parentAbsoluteRect != null) {
        // symbol artboard
        returnRect = parentAbsoluteRect;
      } else {
        // root artboard
        returnRect = NSMakeRect(0, 0, layer.absoluteRect().width(), layer.absoluteRect().height());
      }
    } else if (parentAbsoluteRect != null) {
      const parentLayer = layer.parentForInsertingLayers();
      if (layer.resizingConstraint !== undefined) {
        // Sketch >= 44
        returnRect = NSMakeRect(parentAbsoluteRect.origin.x + layer.frame().x(), parentAbsoluteRect.origin.y + layer.frame().y(), layer.frame().width(), layer.frame().height());
        if (parentLayer.frame().width() !== parentAbsoluteRect.size.width && parentLayer.frame().height() !== parentAbsoluteRect.size.height) {
          const resizingConstraint = 63 ^ layer.resizingConstraint();
          const frame = layer.frame();
          const parentFrame = parentLayer.frame();

          if ((resizingConstraint & ResizingConstraint.LEFT) === ResizingConstraint.LEFT) {
            if ((resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT) {
              const rightDistance = parentFrame.width() - frame.x() - frame.width();
              const width = parentAbsoluteRect.size.width - frame.x() - rightDistance;
              returnRect.size.width = width < 1 ? 1 : width;
            } else if ((resizingConstraint & ResizingConstraint.WIDTH) !== ResizingConstraint.WIDTH) {
              returnRect.size.width = (frame.width() / (parentFrame.width() - frame.x())) * (parentAbsoluteRect.size.width - frame.x());
            }
          } else if ((resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT) {
            if ((resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH) {
              returnRect.origin.x = parentAbsoluteRect.origin.x + (parentAbsoluteRect.size.width - (parentFrame.width() - (frame.x() + frame.width())) - frame.width());
            } else {
              const rightDistance = parentFrame.width() - frame.x() - frame.width();
              returnRect.size.width = (frame.width() / (parentFrame.width() - rightDistance)) * (parentAbsoluteRect.size.width - rightDistance);
              returnRect.origin.x = parentAbsoluteRect.origin.x + (parentAbsoluteRect.size.width - (parentFrame.width() - (frame.x() + frame.width())) - returnRect.size.width);
            }
          } else {
            if ((resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH) {
              returnRect.origin.x = parentAbsoluteRect.origin.x + ((((frame.x() + frame.width() / 2.0) / parentFrame.width()) * parentAbsoluteRect.size.width) - (frame.width() / 2.0));
            } else {
              returnRect.origin.x = parentAbsoluteRect.origin.x + ((frame.x() / parentFrame.width()) * parentAbsoluteRect.size.width);
              returnRect.size.width = (frame.width() / parentFrame.width()) * parentAbsoluteRect.size.width;
            }
          }

          if ((resizingConstraint & ResizingConstraint.TOP) === ResizingConstraint.TOP) {
            if ((resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM) {
              const bottomDistance = parentAbsoluteRect.size.height - frame.y() - frame.height();
              const height = parentAbsoluteRect.size.height - frame.y() - bottomDistance;
              returnRect.size.height = height < 1 ? 1 : height;
            } else if ((resizingConstraint & ResizingConstraint.HEIGHT) !== ResizingConstraint.HEIGHT) {
              returnRect.size.height = (frame.height() / (parentFrame.height() - frame.y())) * (parentAbsoluteRect.height() - frame.y());
            }
          } else if ((resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM) {
            if ((resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT) {
              returnRect.origin.y = parentAbsoluteRect.origin.y + (parentAbsoluteRect.size.height - (parentFrame.height() - (frame.y() + frame.height())) - frame.height());
            } else {
              const bottomDistance = parentAbsoluteRect.size.height - frame.y() - frame.height();
              returnRect.size.height = (frame.height() / (parentFrame.height() - bottomDistance)) * (parentAbsoluteRect.size.height - bottomDistance);
              returnRect.origin.y = parentAbsoluteRect.origin.y + (parentAbsoluteRect.size.height - (parentFrame.height() - (frame.y() + frame.height())) - returnRect.size.height);
            }
          } else {
            if ((resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT) {
              returnRect.origin.y = parentAbsoluteRect.origin.y + ((((frame.y() + frame.height() / 2.0) / parentFrame.height()) * parentAbsoluteRect.size.height) - (frame.height() / 2.0));
            } else {
              returnRect.origin.y = parentAbsoluteRect.origin.y + ((frame.y() / parentFrame.height()) * parentAbsoluteRect.size.height);
              returnRect.size.height = (frame.height() / parentFrame.height()) * parentAbsoluteRect.size.height;
            }
          }
        }
      } else if (layer.resizingType !== undefined) {
        // Sketch < 44
        let horzScale, vertScale, width, height, leftDistance, rightDistance, topDistance, bottomDistance, unscaledLeftoverHorzSpace, unscaledLeftoverVertSpace;
        let leftSpaceFraction, rightSpaceFraction, topSpaceFraction, bottomSpaceFraction, leftoverHorzSpace, leftoverVertSpace;
        switch (layer.resizingType()) {
          case ResizingType.STRETCH:
            horzScale = parentAbsoluteRect.size.width / parentLayer.frame().width();
            vertScale = parentAbsoluteRect.size.height / parentLayer.frame().height();
            x = parentAbsoluteRect.origin.x + (layer.frame().x() * horzScale);
            y = parentAbsoluteRect.origin.y + (layer.frame().y() * vertScale);
            width = layer.frame().width() * horzScale;
            height = layer.frame().height() * vertScale;
            returnRect = NSMakeRect(x, y, width, height);
            return returnRect;

          case ResizingType.PIN_TO_CORNER:
            leftDistance = layer.frame().x();
            rightDistance = parentLayer.frame().width() - (layer.frame().x() + layer.frame().width());
            x = leftDistance < rightDistance ? parentAbsoluteRect.origin.x + leftDistance : (parentAbsoluteRect.origin.x +
                parentAbsoluteRect.size.width) - rightDistance - layer.frame().width();
            topDistance = layer.frame().y();
            bottomDistance = parentLayer.frame().height() - (layer.frame().y() + layer.frame().height());
            y = topDistance < bottomDistance ? parentAbsoluteRect.origin.y + topDistance : (parentAbsoluteRect.origin.y +
                parentAbsoluteRect.size.height) - bottomDistance - layer.frame().height();
            returnRect = NSMakeRect(x, y, layer.frame().width(), layer.frame().height());
            break;

          case ResizingType.RESIZE_OBJECT:
            rightDistance = parentLayer.frame().width() - (layer.frame().x() + layer.frame().width());
            bottomDistance = parentLayer.frame().height() - (layer.frame().y() + layer.frame().height());
            returnRect = NSMakeRect(parentAbsoluteRect.origin.x + layer.frame().x(), parentAbsoluteRect.origin.y + layer.frame().y(),
                parentAbsoluteRect.size.width - layer.frame().x() - rightDistance, parentAbsoluteRect.size.height - layer.frame().y() - bottomDistance);
            break;

          case ResizingType.FLOAT_IN_PLACE:
            unscaledLeftoverHorzSpace = parentLayer.frame().width() - layer.frame().width();
            leftSpaceFraction = layer.frame().x() / unscaledLeftoverHorzSpace;
            rightSpaceFraction = (parentLayer.frame().width() - (layer.frame().x() + layer.frame().width())) / unscaledLeftoverHorzSpace;
            leftoverHorzSpace = parentAbsoluteRect.size.width - layer.frame().width();
            x = (((leftSpaceFraction * leftoverHorzSpace) + (parentAbsoluteRect.size.width - (rightSpaceFraction * leftoverHorzSpace))) / 2) + parentAbsoluteRect.origin.x - (layer.frame().width() / 2);

            unscaledLeftoverVertSpace = parentLayer.frame().height() - layer.frame().height();
            topSpaceFraction = layer.frame().y() / unscaledLeftoverVertSpace;
            bottomSpaceFraction = (parentLayer.frame().height() - (layer.frame().y() + layer.frame().height())) / unscaledLeftoverVertSpace;
            leftoverVertSpace = parentAbsoluteRect.size.height - layer.frame().height();
            y = (((topSpaceFraction * leftoverVertSpace) + (parentAbsoluteRect.size.height - (bottomSpaceFraction * leftoverVertSpace))) / 2) + parentAbsoluteRect.origin.y - (layer.frame().height() / 2);
            returnRect = NSMakeRect(x, y, layer.frame().width(), layer.frame().height());
            break;
        }
      }
    } else {
      // mobile menu layer
      returnRect = NSMakeRect(layer.absoluteRect().rulerX(), layer.absoluteRect().rulerY(), layer.absoluteRect().width(), layer.absoluteRect().height());
    }
    if (Constants.LAYER_LOGGING) {
      log(Utils.tab(indent, 1) + layer.name() + ": " + layer.class() + "," + layer.isKindOfClass(MSArtboardGroup) + "," + layer.resizingType() + ",(" + Math.round(returnRect.origin.x) + "," + Math.round(returnRect.origin.y) + "," + Math.round(returnRect.size.width) + "," + Math.round(returnRect.size.height) + ")");
    }
    return returnRect;
  }

  getHotspots(layer, excludeMobileMenu, offset, artboardData, parentAbsoluteRect, indent) {
    const command = this.context.command;
    const isMobileMenu = command.valueForKey_onLayer_forPluginIdentifier(Constants.IS_MOBILE_MENU, layer, this.context.plugin.identifier());
    if ((!layer.isVisible() && !isMobileMenu) || (excludeMobileMenu && isMobileMenu)) {
      return;
    }
    if (indent == null) {
      indent = 0;
    }

    const absoluteRect = this.getAbsoluteRect(layer, parentAbsoluteRect, indent);

    const hotspots = [];
    if (layer.isKindOfClass(MSSymbolInstance)) {
      // symbol instance
      const childHotspots = this.getHotspots(layer.symbolMaster(), excludeMobileMenu, offset, artboardData, absoluteRect, indent + 1);
      if (childHotspots != null) {
        Array.prototype.push.apply(hotspots, childHotspots);
      }
    } else if (layer.isKindOfClass(MSLayerGroup)) {
      // layer group
      layer.layers().forEach(function (childLayer) {
        const childHotspots = this.getHotspots(childLayer, excludeMobileMenu, offset, artboardData, absoluteRect, indent + 1);
        if (childHotspots != null) {
          Array.prototype.push.apply(hotspots, childHotspots);
        }
      }, this);
    }

    let x = Math.round(absoluteRect.origin.x - Constants.HOTSPOT_PADDING);
    let y = Math.round(absoluteRect.origin.y - Constants.HOTSPOT_PADDING);
    // offset is used by the mobile menu
    if (offset != null) {
      x += offset.x;
      y += offset.y;
    }
    const width = Math.round(absoluteRect.size.width);
    const height = Math.round(absoluteRect.size.height);

    const artboardName = command.valueForKey_onLayer_forPluginIdentifier(Constants.ARTBOARD_LINK, layer, this.context.plugin.identifier());
    if (artboardName != null && artboardName != "") {
      // artboard link
      hotspots.push({href: Utils.toFilename(artboardName) + ".html", x: x, y: y, width: width, height: height});
    } else {
      // external link
      let externalLink = command.valueForKey_onLayer_forPluginIdentifier(Constants.EXTERNAL_LINK, layer, this.context.plugin.identifier());
      if (externalLink != null && externalLink != "") {
        const openLinkInNewWindow = command.valueForKey_onLayer_forPluginIdentifier(Constants.OPEN_LINK_IN_NEW_WINDOW, layer, this.context.plugin.identifier());
        const regExp = new RegExp("^http(s?)://");
        if (!regExp.test(externalLink.toLowerCase())) {
          externalLink = "http://" + externalLink;
        }
        const target = openLinkInNewWindow ? "_blank" : null;
        hotspots.push({href: externalLink, target: target, x: x, y: y, width: width, height: height});
      } else {
        const dialogType = command.valueForKey_onLayer_forPluginIdentifier(Constants.DIALOG_TYPE, layer, this.context.plugin.identifier());
        if (dialogType != null) {
          // JavaScript dialog
          let dialogText = command.valueForKey_onLayer_forPluginIdentifier(Constants.DIALOG_TEXT, layer, this.context.plugin.identifier());
          dialogText = dialogText.replace(new RegExp("'", "g"), "\\'").replace(new RegExp('"', "g"), "");
          hotspots.push({
            href: "javascript:" + dialogType + "('" + dialogText + "')",
            x: x,
            y: y,
            width: width,
            height: height
          });
        } else {
          const isMobileMenuButton = command.valueForKey_onLayer_forPluginIdentifier(Constants.IS_MOBILE_MENU_BUTTON, layer, this.context.plugin.identifier());
          if (isMobileMenuButton) {
            // mobile menu button
            const idName = this.getCSSName(artboardData, "mobile-menu-container");
            hotspots.push({href: "javascript:toggle('" + idName + "')", x: x, y: y, width: width, height: height});
          }
        }
      }
    }
    return hotspots;
  }

  buildHotspotHTML(hotspot) {
    const style = "left:" + hotspot.x + "px; top:" + hotspot.y + "px; width:" + hotspot.width + "px; height:" + hotspot.height + "px";
    let html = '<a href="' + hotspot.href + '" class="hotspot" style="' + style + '"';
    if (hotspot.target != null) {
      html += ' target="' + hotspot.target + '"';
    }
    html += '></a>\n';
    return html;
  }

  buildHotspots(layer, artboardData, indent) {
    let html = '';
    const isMobileMenuLayer = !layer.isKindOfClass(MSArtboardGroup);
    const offset = isMobileMenuLayer ? {x: -layer.absoluteRect().rulerX(), y: -layer.absoluteRect().rulerY()} : null;
    const hotspots = this.getHotspots(layer, !isMobileMenuLayer, offset, artboardData);
    if (hotspots != null) {
      hotspots.forEach(function (hotspot) {
        html += Utils.tab(indent) + this.buildHotspotHTML(hotspot);
      }, this);
    }
    return html;
  }

  buildEmbeddedCSS(artboardSet) {
    let html = '<style>\n';

    artboardSet.forEach(function (artboardData, index) {
      // artboard container
      html += '#' + this.getCSSName(artboardData, "artboard-container") + ' { width: ' + artboardData.artboard.frame().width() + 'px';
      if (index == 0) {
        html += '; display: block';
      }
      html += ' }\n';

      if (artboardData.mobileMenuLayer != null) {
        // mobile menu
        // container
        const mobileMenuLayer = artboardData.mobileMenuLayer;
        const left = mobileMenuLayer.absoluteRect().rulerX() + (Math.floor((mobileMenuLayer.frame().width() - mobileMenuLayer.absoluteInfluenceRect().size.width) / 2));
        const top = mobileMenuLayer.absoluteRect().rulerY() + (Math.floor((mobileMenuLayer.frame().height() - mobileMenuLayer.absoluteInfluenceRect().size.height) / 2));
        html += '#' + this.getCSSName(artboardData, "mobile-menu-container") + ' { left:' + left + 'px; top:' + top + 'px }\n';
        // image
        const width = mobileMenuLayer.absoluteInfluenceRect().size.width;
        const height = mobileMenuLayer.absoluteInfluenceRect().size.height;
        html += '#' + this.getCSSName(artboardData, "mobile-menu-image") + ' { width: ' + width + 'px; height: ' + height + 'px; background: url("' + Constants.IMAGES_DIRECTORY + this.getMobileMenuImageName(artboardData.artboard, 1) + '") no-repeat; }\n';
      }

      // artboard image
      const width = artboardData.artboard.frame().width();
      const height = artboardData.artboard.frame().height();
      html += '#' + this.getCSSName(artboardData, "artboard-image") + ' { width: ' + width + 'px; height: ' + height + 'px; background: url("' + Constants.IMAGES_DIRECTORY + this.getArtboardImageName(artboardData.artboard, 1) + '") no-repeat; }\n';

      // background color
      if (index == 0) {
        if (artboardData.artboard.hasBackgroundColor()) {
          const backgroundColor = Utils.colorToHex(artboardData.artboard.backgroundColor());
          html += 'body { background-color: ' + backgroundColor + ' }\n';
        }
      }
    }, this);

    // retina media query
    if (this.retinaImages) {
      html += '@media (-webkit-min-device-pixel-ratio: 2), (min--moz-device-pixel-ratio: 2), (-o-min-device-pixel-ratio: 2/1), (min-resolution: 192dpi), (min-resolution: 2dppx) {\n';
      artboardSet.forEach(function (artboardData) {
        if (artboardData.mobileMenuLayer != null) {
          // mobile menu image
          const mobileMenuLayer = artboardData.mobileMenuLayer;
          const width = mobileMenuLayer.absoluteInfluenceRect().size.width;
          const height = mobileMenuLayer.absoluteInfluenceRect().size.height;
          html += Utils.tab(1) + '#' + this.getCSSName(artboardData, "mobile-menu-image") + ' { background-image: url("' + Constants.IMAGES_DIRECTORY + this.getMobileMenuImageName(artboardData.artboard, 2) + '"); background-size: ' + width + 'px ' + height + 'px; }\n';
        }

        // artboard image
        const width = artboardData.artboard.frame().width();
        const height = artboardData.artboard.frame().height();
        html += Utils.tab(1) + '#' + this.getCSSName(artboardData, "artboard-image") + ' { background-image: url("' + Constants.IMAGES_DIRECTORY + this.getArtboardImageName(artboardData.artboard, 2) + '"); background-size: ' + width + 'px ' + height + 'px; }\n';
      }, this);
      html += '}\n';
    }

    // responsive media queries
    artboardSet.forEach(function (artboardData, index) {
      if (index > 0) {
        const previousArtboardData = artboardSet[index - 1];
        html += '@media screen and (max-width: ' + (previousArtboardData.artboard.frame().width() - 1) + 'px) {\n';
        // hide other artboards
        html += '  ';
        artboardSet.forEach(function (otherArtboardData, i) {
          if (otherArtboardData != artboardData) {
            if (i > 0) {
              html += ', ';
            }
            html += '#' + this.getCSSName(otherArtboardData, "artboard-container");
          }
        }, this);
        html += ' { display: none }\n';
        // show artboard
        html += '  #' + this.getCSSName(artboardData, "artboard-container") + ' { display: block }\n';
        if (artboardData.artboard.hasBackgroundColor()) {
          const backgroundColor = Utils.colorToHex(artboardData.artboard.backgroundColor());
          html += '  body { background-color: ' + backgroundColor + ' }\n';
        }
        html += '}\n';
      }
    }, this);

    html += '</style>\n';
    return html;
  }

  getArtboardImageName(artboard, scale) {
    const suffix = scale == 2 ? "@2x" : "";
    return Utils.toFilename(artboard.name(), false) + suffix + ".png";
  }

  getMobileMenuImageName(artboard, scale) {
    const suffix = scale == 2 ? "@2x" : "";
    return Utils.toFilename(artboard.name(), false) + "_mobile_menu" + suffix + ".png";
  }

  getCSSName(artboardData, suffix) {
    return artboardData.suffix != null ? artboardData.suffix + "-" + suffix : "main-" + suffix;
  }

  // nestedHTML: optional
  buildArtboardHTML(artboardData, nestedHTML) {
    const artboard = artboardData.artboard;
    let html = Utils.tab(1) + '<div id="' + this.getCSSName(artboardData, "artboard-container") + '" class="artboard-container">\n' +
        Utils.tab(2) + '<div id="' + this.getCSSName(artboardData, "artboard-image") + '" class="artboard-image"></div>\n' +
        this.buildHotspots(artboard, artboardData, 2);
    if (nestedHTML != null) {
      html += nestedHTML;
    }
    html += Utils.tab(1) + '</div>\n';
    return html;
  }

  buildMobileMenuHTML(artboardData, indent) {
    const mobileMenuLayer = artboardData.mobileMenuLayer;
    if (mobileMenuLayer == null) {
      return null;
    }
    return Utils.tab(indent) + '<div id="' + this.getCSSName(artboardData, "mobile-menu-container") + '" class="mobile-menu-container">\n' +
        Utils.tab(indent + 1) + '<div id="' + this.getCSSName(artboardData, "mobile-menu-image") + '" class="mobile-menu-image"></div>\n' +
        this.buildHotspots(mobileMenuLayer, artboardData, indent + 1) +
        Utils.tab(indent) + '</div>\n';
  }

  hasMobileMenuLayer(artboardSet) {
    return artboardSet.some(function (artboardData) {
      return artboardData.mobileMenuLayer != null;
    });
  }

  generateHTMLFile(artboardSet) {
    const mainArtboard = artboardSet[0].artboard;
    let html = '<!DOCTYPE html>\n<html>\n<head>\n' +
        '<title>' + mainArtboard.name() + '</title>\n' +
        '<meta name="viewport" content="width=device-width, minimum-scale=1.0, maximum-scale=1.0" />\n' +
        '<link href="css/main.css" rel="stylesheet" type="text/css"/>\n';
    html += this.buildEmbeddedCSS(artboardSet) +
        '<script src="js/main.js" type="text/javascript"></script>\n' +
        '</head>\n<body>\n<main>\n';
    artboardSet.forEach(function (artboardData) {
      let mobileMenuHTML = null;
      if (artboardData.mobileMenuLayer != null) {
        mobileMenuHTML = this.buildMobileMenuHTML(artboardData, 2);
      }
      html += this.buildArtboardHTML(artboardData, mobileMenuHTML);
    }, this);
    html += '</main>\n</body>\n</html>\n';

    const filename = Utils.toFilename(artboardSet[0].baseName) + ".html";
    const filePath = this._outputPath + "/" + filename;
    Utils.writeToFile(html, filePath);
  }

  findLayer(key, layer) {
    const isMobileMenu = !!(this.context.command.valueForKey_onLayer_forPluginIdentifier(key, layer, this.context.plugin.identifier()));
    if (isMobileMenu) {
      return layer;
    }

    let targetLayer = null;
    if (layer.isKindOfClass(MSLayerGroup)) {
      layer.layers().some(function (childLayer) {
        targetLayer = this.findLayer(key, childLayer);
        if (targetLayer != null) {
          return true;
        }
      }, this);
    }

    return targetLayer;
  }

  exportImage(layer, scale, imagePath) {
    let slice;
    if (layer.isKindOfClass(MSArtboardGroup)) {
      slice = MSExportRequest.exportRequestsFromExportableLayer(layer).firstObject();
    } else {
      slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(layer, layer.absoluteInfluenceRect(), false).firstObject();
    }
    slice.scale = scale;
    slice.saveForWeb = false;
    slice.format = "png";
    this.context.document.saveArtboardOrSlice_toFile(slice, imagePath);
  }

  exportImages(artboardGroup) {
    artboardGroup.forEach(function (artboardData) {
      const mobileMenuLayer = artboardData.mobileMenuLayer;
      const mobileMenuLayerIsVisible = mobileMenuLayer != null && mobileMenuLayer.isVisible();
      if (mobileMenuLayerIsVisible) {
        mobileMenuLayer.setIsVisible(false);
      }

      this.exportImage(artboardData.artboard, 1, this._imagesPath + this.getArtboardImageName(artboardData.artboard, 1));
      if (this.retinaImages) {
        this.exportImage(artboardData.artboard, 2, this._imagesPath + this.getArtboardImageName(artboardData.artboard, 2));
      }

      if (mobileMenuLayer != null) {
        mobileMenuLayer.setIsVisible(true);
        this.exportImage(mobileMenuLayer, 1, this._imagesPath + this.getMobileMenuImageName(artboardData.artboard, 1));
        if (this.retinaImages) {
          this.exportImage(mobileMenuLayer, 2, this._imagesPath + this.getMobileMenuImageName(artboardData.artboard, 2));
        }
        if (!mobileMenuLayerIsVisible) {
          mobileMenuLayer.setIsVisible(false);
        }
      }
    }, this);
  }

  getArtboardGroups() {
    const artboardGroups = Utils.getArtboardGroups(this.page.artboards(), this.context);

    artboardGroups.forEach(function (artboardGroup) {
      // set mobile menu layer
      artboardGroup.forEach(function (artboardData) {
        artboardData.mobileMenuLayer = this.findLayer(Constants.IS_MOBILE_MENU, artboardData.artboard);
      }, this);

      if (Utils.hasResponsiveArtboards(this.context)) {
        // sort artboards within a set by width
        artboardGroup.sort(function (a, b) {
          if (a.artboard.frame().width() < b.artboard.frame().width()) {
            return 1;
          } else if (a.artboard.frame().width() > b.artboard.frame().width()) {
            return -1;
          } else {
            return 0;
          }
        });
      }
    }, this);
    return artboardGroups;
  }

  exportArtboards() {
    this.artboardGroups = this.getArtboardGroups();

    this.generateCSSFile();
    this.generateJSFile();

    this.artboardGroups.forEach(function (artboardGroup) {
      this.exportImages(artboardGroup);
      this.generateHTMLFile(artboardGroup);
    }, this);
  }

  prepareOutputFolder(selectedPath) {
    let error;
    const fileManager = NSFileManager.defaultManager();

    this._outputPath = selectedPath + "/" + Constants.OUTPUT_DIRECTORY;
    if (!fileManager.fileExistsAtPath(this._outputPath)) {
      error = MOPointer.alloc().init();
      if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(this._outputPath, false, null, error)) {
        log(error.value().localizedDescription());
      }
    } else {
      Utils.removeFilesWithExtension(this._outputPath, "html");
    }

    this._imagesPath = this._outputPath + "/" + Constants.IMAGES_DIRECTORY;
    if (!fileManager.fileExistsAtPath(this._imagesPath)) {
      error = MOPointer.alloc().init();
      if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(this._imagesPath, false, null, error)) {
        log(error.value().localizedDescription());
      }
    } else {
      Utils.removeFilesWithExtension(this._imagesPath, "png");
    }
  }
}