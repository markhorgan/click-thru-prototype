@import "utils.js"
@import "exporter.js"

const onRun = function(context) {
  const doc = context.document

  if (doc.currentPage().artboards().count() == 0) {
    doc.showMessage("There are no artboards to export")
    return
  }

  const fileURL = Utils.saveFileDialog()
  if (fileURL == null) {
    return
  }

  const exporter = new Exporter(fileURL.path(), doc.currentPage(), context)
  exporter.exportArtboards()
}