export default async function exportRequest() {
  const data = await fetch("/api/data");

  fetch("/api/data")
    .then((response) => {
      if (response.ok) {
        // Create a temporary link and click it to trigger the download
        const link = document.createElement("a");
        link.href = "/api/data";
        link.download = "data";
        link.click();
      } else {
        console.error("Failed to download file");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  const response = await data.json();

  console.log(response);
}
