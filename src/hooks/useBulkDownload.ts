import { useState, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const useDownloadAndZip = () => {
  const [loading, setLoading] = useState(false);

  const downloadAndZip = useCallback(
    async (urls: any[], zipFilename = "files.zip") => {
      setLoading(true);
      const zip = new JSZip();

      try {
        const fetchPromises = urls.map(async (url) => {
          const response = await fetch(url);
          console.log(`Fetching ${url} - Status: ${response.status}`);
          if (!response.ok) throw new Error(`Failed to fetch ${url}`);

          const contentType = response.headers.get("Content-Type");
          console.log(`Content Type: ${contentType}`);
          if (!contentType || !contentType.includes("application/pdf")) {
            throw new Error(`Expected PDF but got ${contentType}`);
          }

          const blob = await response.blob();
          // const filename = `file_${index + 1}.pdf`;
          const filename = url.split("?")[0];
          console.log(filename);
          zip.file(filename, blob);
        });

        await Promise.all(fetchPromises);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, zipFilename);
      } catch (error) {
        console.error("Error downloading and zipping files:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { downloadAndZip, loading };
};

export default useDownloadAndZip;
