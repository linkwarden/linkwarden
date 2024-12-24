import { MigrationFormat, MigrationRequest } from "@/types/global";
import { toast } from "react-hot-toast";
import JSZip from "jszip";

const processOmnivoreZipFile = async (zip: JSZip): Promise<string> => {
  const metadataFiles = Object.keys(zip.files).filter((filePath) => {
    const file = zip.files[filePath];
    return filePath.startsWith("metadata_") && !file.dir;
  });

  const allMetadataArrays = await Promise.all(
    metadataFiles.map(async (filePath) => {
      const fileContent = await zip.files[filePath].async("string");
      return JSON.parse(fileContent) || [];
    })
  );

  const flattenedData = allMetadataArrays.flat();

  return JSON.stringify(flattenedData);
};

const importBookmarks = async (
  e: React.ChangeEvent<HTMLInputElement>,
  format: MigrationFormat
) => {
  const file: File | null = e.target.files && e.target.files[0];

  if (file) {
    const reader = new FileReader();

    if (format === MigrationFormat.omnivore) reader.readAsArrayBuffer(file);
    else reader.readAsText(file, "UTF-8");

    reader.onload = async function (e) {
      const load = toast.loading("Importing...");

      let request = e.target?.result as any;

      if (format === MigrationFormat.omnivore) {
        try {
          const zip = await JSZip.loadAsync(request);
          request = await processOmnivoreZipFile(zip);
        } catch (zipError) {
          console.error("Failed to parse zip file:", zipError);
          toast.dismiss(load);
          toast.error("Failed to parse the zip file. Please try again.");
          return;
        }
      }

      const body: MigrationRequest = {
        format,
        data: request,
      };

      try {
        const response = await fetch("/api/v1/migration", {
          method: "POST",
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.dismiss(load);

          toast.error(
            errorData.response ||
              "Failed to import bookmarks. Please try again."
          );
          return;
        }

        await response.json();
        toast.dismiss(load);
        toast.success("Imported the Bookmarks! Reloading the page...");

        setTimeout(() => {
          location.reload();
        }, 2000);
      } catch (error) {
        console.error("Request failed", error);
        toast.dismiss(load);
        toast.error(
          "An error occurred while importing bookmarks. Please check the logs for more info."
        );
      }
    };

    reader.onerror = function (e) {
      console.log("Error reading file:", e);
      toast.error(
        "Failed to read the file. Please make sure the file is correct and try again."
      );
    };
  }
};

export default importBookmarks;
