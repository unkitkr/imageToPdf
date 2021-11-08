import pdfGenerator from "pdfkit";
import imgSize from "image-size";
import { createWriteStream } from "fs";
import { imageTypes, IMargin } from "./types";
import path from "path";
import { readdir } from "fs";
import { promisify } from "util";

const readdirPromise = promisify(readdir);

export class generatePdf {
  protected margin: number;
  protected outputLocation: string;
  protected margins: IMargin;
  constructor({
    margin,
    outLocation,
    margins,
  }: {
    margin?: number;
    outLocation: string;
    margins?: IMargin;
  }) {
    this.margin = margin ? margin : 0;
    this.outputLocation = outLocation;
    this.margins = margins ? margins : { top: 0, bottom: 0, left: 0, right: 0 };
  }
  /**
   * generator() gets all the images from folder(s), pass additional parameter for selecting specific formats
   */
  private generator(images: string[]) {
    const docGenerator = new pdfGenerator({
      autoFirstPage: false,
    });
    images.forEach((img) => {
      const dimension = imgSize(img);

      if (this.margin) {
        docGenerator.addPage({
          margin: this.margin as number,
        });
        const imgHeight = dimension.height
          ? dimension.height >
            docGenerator.page.height - 2 * (this.margin as number)
            ? docGenerator.page.height - 2 * (this.margin as number)
            : dimension.height
          : 0;

        const imgWidth = dimension.width
          ? dimension.width >
            docGenerator.page.width - 2 * (this.margin as number)
            ? docGenerator.page.width - 2 * (this.margin as number)
            : dimension.width
          : 0;

        docGenerator.image(img, {
          fit: [imgWidth, imgHeight],
          valign: "center",
          align: "center",
        });
      } else {
        if (this.margins) {
          docGenerator.addPage({
            margins: this.margins,
          });
          const imgHeight = dimension.height
            ? dimension.height >
              docGenerator.page.height -
                2 * (this.margins.bottom + this.margins.top)
              ? docGenerator.page.height -
                2 * (this.margins.bottom + this.margins.top)
              : dimension.height
            : 0;

          const imgWidth = dimension.width
            ? dimension.width >
              docGenerator.page.width -
                2 * (this.margins.left + this.margins.right)
              ? docGenerator.page.width -
                2 * (this.margins.left + this.margins.right)
              : dimension.width
            : 0;

          docGenerator.image(img, {
            fit: [imgWidth, imgHeight],
            valign: "center",
            align: "center",
          });
        }
      }
    });
    docGenerator.pipe(createWriteStream(this.outputLocation));
    docGenerator.end();
  }
  /**
   * generatePDF() generates pdf from all the jpg/png files in specified folder(s) if
   * Array of location of images are provided or when a location as a string is passed it looks for all jpeg/png files
   * optional parameter impageTypes can passed to the constructor to specify the type of image it'll look for in a folder.
   */
  public generatePDF(
    location: string | string[],
    imageType: imageTypes[] = [".jpeg", ".png"]
  ) {
    const imageTyp = new Set(imageType);
    function checkIfImageLocation(loc: string): boolean {
      const ext = path.extname(loc);
      if (imageTyp.has(ext as any)) {
        return true;
      }
      return false;
    }
    async function getImageList(loc: string) {
      const files: string[] = await readdirPromise(loc).then((filesArray) => {
        return filesArray.filter((file) => checkIfImageLocation(file));
      });
      return files;
    }
    if (Array.isArray(location)) {
      const images = location.filter((loc) => checkIfImageLocation(loc));
      this.generator(images);
    } else {
      getImageList(location).then((files) => {
        let images = files
          .filter((img) => checkIfImageLocation(img))
          .map((img) => path.join(location, img));
        images ? this.generator(images) : new Error("No images in directory");
      });
    }
  }
}
