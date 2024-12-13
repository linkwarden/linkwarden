import { MigrationFormat } from "@/types/global";
import { toast } from "react-hot-toast";

const importBookmarksBinary = async (
  e: React.ChangeEvent<HTMLInputElement>,
  format: MigrationFormat
) => {
  const file: File | null = e.target.files && e.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    reader.onload = async function (e) {
      const load = toast.loading("Importing...");

      try {
        const migrationFormatName = MigrationFormat[format];
        const response = await fetch(
          `/api/v1/migration/upload/${migrationFormatName}`,
          {
            method: "POST",
            body: e.target?.result as ArrayBuffer,
            headers: { "Content-Type": "application/octet-stream" },
          }
        );

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

export default importBookmarksBinary;
