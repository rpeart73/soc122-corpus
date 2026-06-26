/* deck-docx.js : build a minimal, Word-openable .docx from note blocks.
   Client-side only (no backend). Validated to open in LibreOffice and Word.
   Block styles: "title" | "h" (section heading) | "q" (prompt/question) | "body".
   Returns a JSZip instance; caller does .generateAsync({type:"blob", mimeType:...}). */
(function (global) {
  function xmlEsc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function para(text, o) {
    o = o || {};
    var rpr = "";
    if (o.bold || o.size) {
      rpr = "<w:rPr>" + (o.bold ? "<w:b/>" : "") +
            (o.size ? ('<w:sz w:val="' + o.size + '"/>') : "") + "</w:rPr>";
    }
    var ppr = o.before ? ('<w:pPr><w:spacing w:before="' + o.before + '"/></w:pPr>') : "";
    return "<w:p>" + ppr + "<w:r>" + rpr +
           '<w:t xml:space="preserve">' + xmlEsc(text) + "</w:t></w:r></w:p>";
  }
  function build(blocks) {
    var body = blocks.map(function (b) {
      if (b.style === "title") return para(b.text, { bold: true, size: 36, before: 40 });
      if (b.style === "h") return para(b.text, { bold: true, size: 28, before: 240 });
      if (b.style === "q") return para(b.text, { bold: true, before: 160 });
      return para(b.text || "", {});
    }).join("");
    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:body>" + body + "<w:sectPr/></w:body></w:document>";
    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      "</Types>";
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>";
    var zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.folder("_rels").file(".rels", rels);
    zip.folder("word").file("document.xml", documentXml);
    return zip;
  }
  global.deckDocx = { build: build };
})(window);
