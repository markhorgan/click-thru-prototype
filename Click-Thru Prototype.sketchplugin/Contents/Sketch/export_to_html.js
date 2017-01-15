@import "utils.js"
@import "exporter.js"
@import "ui.js"

var onRun = function(context) {
  var doc = context.document

  if (doc.currentPage().artboards().count() == 0) {
    UI.displayDialog("There are no artboards to export.")
    return
  }

  var fileURL = Utils.saveFileDialog()
  if (fileURL == null) {
    return
  }

  var exporter = new Exporter(fileURL.path(), doc.currentPage(), context)
  exporter.exportArtboards()
}