// Export-Helfer: DOM-Element -> PNG / JPG / PDF. Keine Abhängigkeiten, keine ES-Module.
// Das Element wird mitsamt CSS, Schriften und Bildern als SVG (foreignObject) eingebettet
// und auf ein Canvas in Zielauflösung gezeichnet. Das braucht http(s) (GitHub Pages oder
// lokaler Server): per file:// darf der Browser Dateien nicht laden/auslesen.
(function(){
  const MM_PER_INCH = 25.4;
  const BACKSLASH = String.fromCharCode(92);

  function blobToDataUri(blob){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  async function fetchOk(url){
    const r = await fetch(url);
    if(!r.ok) throw new Error("HTTP " + r.status + ": " + url);
    return r;
  }

  async function toDataUri(url){
    return blobToDataUri(await (await fetchOk(url)).blob());
  }

  function resolveUrl(href, base){
    return new URL(href.split(BACKSLASH).join("/"), base).href;
  }

  // SVG-Dateien können Bilder verlinken (z. B. CorelDRAW-Export): diese einbetten.
  async function svgToDataUri(url){
    let text = await (await fetchOk(url)).text();
    const re = /(?:xlink:href|href)="([^"#][^"]*)"/g;
    const refs = [...new Set([...text.matchAll(re)].map(m => m[1]).filter(h => !h.startsWith("data:")))];
    for(const href of refs){
      const data = await toDataUri(resolveUrl(href, url));
      text = text.split('"' + href + '"').join('"' + data + '"');
    }
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text);
  }

  // Alle Seiten-Styles einsammeln; Schriften als Data-URI einbetten.
  async function collectCss(){
    const parts = [];
    for(const sheet of document.styleSheets){
      let rules;
      try{ rules = sheet.cssRules; }catch(err){ continue; }
      const base = sheet.href || location.href;
      for(const rule of rules){
        let css = rule.cssText;
        if(rule.type === CSSRule.FONT_FACE_RULE){
          for(const m of [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]){
            if(m[1].startsWith("data:")) continue;
            css = css.split(m[0]).join('url("' + await toDataUri(resolveUrl(m[1], base)) + '")');
          }
        }
        parts.push(css);
      }
    }
    return parts.join("\n");
  }

  async function buildSvgSource(el, w, h){
    const clone = el.cloneNode(true);
    clone.classList.remove("show-guides");
    clone.style.transform = "none";

    for(const img of clone.querySelectorAll("img")){
      img.setAttribute("src", await toDataUri(img.src));
    }
    for(const obj of clone.querySelectorAll("object")){
      const img = document.createElement("img");
      img.className = obj.className;
      img.setAttribute("alt", obj.getAttribute("aria-label") || "");
      img.setAttribute("src", await svgToDataUri(new URL(obj.getAttribute("data"), location.href).href));
      obj.replaceWith(img);
    }

    const css = await collectCss();
    const xhtml = new XMLSerializer().serializeToString(clone);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
      '<style><![CDATA[' + css + ']]></style>' +
      '<foreignObject x="0" y="0" width="' + w + '" height="' + h + '">' + xhtml + '</foreignObject>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function loadImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Die Fläche konnte nicht gerendert werden."));
      img.src = src;
    });
  }

  // opts: { widthMm, heightMm, dpi }
  async function renderToCanvas(el, opts){
    const dpi = opts.dpi || 300;
    const cssW = opts.widthMm * 96 / MM_PER_INCH;
    const cssH = opts.heightMm * 96 / MM_PER_INCH;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(opts.widthMm / MM_PER_INCH * dpi);
    canvas.height = Math.round(opts.heightMm / MM_PER_INCH * dpi);

    await document.fonts.ready;
    const src = await buildSvgSource(el, cssW, cssH);
    await loadImage(src); // Aufwärmen: eingebettete Schriften/Bilder initialisieren
    const img = await loadImage(src);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function canvasToBlob(canvas, type, quality){
    return new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("Export fehlgeschlagen.")), type, quality);
    });
  }

  // Einseitiges PDF in exakter Größe (mm), das ein JPEG vollflächig enthält.
  async function pdfFromJpeg(jpegBlob, pxW, pxH, mmW, mmH){
    const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());
    const enc = new TextEncoder();
    const ptW = (mmW / MM_PER_INCH * 72).toFixed(2);
    const ptH = (mmH / MM_PER_INCH * 72).toFixed(2);

    const chunks = [];
    const offsets = [];
    let length = 0;
    const push = d => {
      const b = typeof d === "string" ? enc.encode(d) : d;
      chunks.push(b);
      length += b.length;
    };
    const obj = (n, body) => {
      offsets[n] = length;
      push(n + " 0 obj\n");
      body();
      push("\nendobj\n");
    };

    push("%PDF-1.4\n");
    push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
    obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
    obj(2, () => push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
    obj(3, () => push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + ptW + " " + ptH + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"));
    obj(4, () => {
      push("<< /Type /XObject /Subtype /Image /Width " + pxW + " /Height " + pxH +
           " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpeg.length + " >>\nstream\n");
      push(jpeg);
      push("\nendstream");
    });
    const content = "q " + ptW + " 0 0 " + ptH + " 0 0 cm /Im0 Do Q";
    obj(5, () => push("<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream"));

    const xrefPos = length;
    let xref = "xref\n0 6\n0000000000 65535 f \n";
    for(let n = 1; n <= 5; n++) xref += String(offsets[n]).padStart(10, "0") + " 00000 n \n";
    push(xref + "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xrefPos + "\n%%EOF\n");

    return new Blob(chunks, { type: "application/pdf" });
  }

  function download(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  window.OkzExport = { renderToCanvas, canvasToBlob, pdfFromJpeg, download };
})();
