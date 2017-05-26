@import "utils.js"
@import "exporter.js"
@import "ui.js"

var onRun = function(context) {
  var doc = context.document

  if (doc.currentPage().artboards().count() == 0) {
    UI.displayDialog("There are no artboards to export.")
    return
  }

  if (Utils.isSymbolsPage(doc.currentPage())) {
    UI.displayDialog("You can't export the Symbols page. Please select another page to export.")
    return
  }

  var fileURL = UI.saveFileDialog()
  if (fileURL == null) {
    return
  }

  var exporter = new Exporter(fileURL.path(), doc.currentPage(), context)
  exporter.exportArtboards()
}