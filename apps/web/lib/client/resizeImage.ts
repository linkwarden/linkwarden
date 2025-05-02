import Resizer from "react-image-file-resizer";

export const resizeImage = (file: File): Promise<Blob> =>
  new Promise<Blob>((resolve) => {
    Resizer.imageFileResizer(
      file,
      150, // target width
      150, // target height
      "JPEG", // output format
      100, // quality
      0, // rotation
      (uri) => {
        resolve(uri as Blob);
      },
      "blob" // output type
    );
  });
