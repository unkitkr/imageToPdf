import { generatePdf } from "../app";

describe("PDF builder", () => {
  it("Should generate a pdf for me", () => {
    const pdfGenerator = new generatePdf({
      outLocation: "./hello.pdf",
    });
    pdfGenerator.generatePDF([
      "/Volumes/Development/Personal-Code/qolor/assets/404.png",
    ]);
  });
});
