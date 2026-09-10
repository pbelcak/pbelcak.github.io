(function () {
  "use strict";

  const button = document.getElementById("print-sheet");
  const sheet = document.querySelector(".sheet");
  const a4Width = Math.round((210 / 25.4) * 96);
  const a4Height = Math.round((297 / 25.4) * 96);

  if (!button || !sheet) return;

  function writePrintPage(printWindow) {
    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atomizing Intelligence</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      * { box-sizing: border-box; }
      html, body { height: 297mm; margin: 0; width: 210mm; }
      body { overflow: hidden; }
      img { display: block; height: 297mm; width: 210mm; }
      @media screen {
        body { align-items: flex-start; background: #dfe4e7; display: flex; justify-content: center; }
        img { box-shadow: 0 18px 60px rgba(28, 42, 53, .16); }
      }
      @media print {
        html, body { background: white; }
        img { break-after: avoid; break-inside: avoid; }
      }
    </style>
  </head>
  <body><img id="a4-page" alt="Atomizing Intelligence technology brief"></body>
</html>`);
    printWindow.document.close();
  }

  function nextPaint() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  async function printSheet() {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(
      "<!doctype html><title>Preparing A4…</title><p style='font:16px sans-serif;padding:24px'>Preparing high-resolution A4…</p>",
    );

    const originalLabel = button.textContent;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Preparing A4…";

    try {
      if (document.fonts) await document.fonts.ready;
      if (!window.htmlToImage || typeof window.htmlToImage.toBlob !== "function") {
        throw new Error("The page capture library did not load.");
      }

      document.documentElement.classList.add("capture-render");
      await nextPaint();

      let blob;
      try {
        blob = await window.htmlToImage.toBlob(sheet, {
          backgroundColor: "#fbfcfd",
          cacheBust: true,
          canvasHeight: a4Height,
          canvasWidth: a4Width,
          height: a4Height,
          pixelRatio: 3,
          skipAutoScale: true,
          skipFonts: true,
          width: a4Width,
        });
      } finally {
        document.documentElement.classList.remove("capture-render");
      }

      if (!blob) throw new Error("Could not create the printable image.");
      const imageUrl = URL.createObjectURL(blob);

      writePrintPage(printWindow);
      const image = printWindow.document.getElementById("a4-page");
      image.src = imageUrl;

      if (typeof image.decode === "function") await image.decode();
      else await new Promise((resolve) => image.addEventListener("load", resolve, { once: true }));

      printWindow.addEventListener(
        "afterprint",
        () => {
          URL.revokeObjectURL(imageUrl);
          printWindow.close();
        },
        { once: true },
      );

      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("Could not prepare the screenshot-based A4 printout.", error);
      printWindow.close();
      window.print();
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.textContent = originalLabel;
    }
  }

  button.addEventListener("click", printSheet);
})();
