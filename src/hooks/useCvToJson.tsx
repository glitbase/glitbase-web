import { useState } from "react";
import Papa from "papaparse";

const useCsvToJson = () => {
  const [jsonData, setJsonData] = useState([]);
  const [error, setError] = useState<string | null>(null);

  const handleCsvUpload = (file: File) => {
    if (!file) {
      setError("No file selected");
      return;
    }
    if (file.type !== "text/csv") {
      setError("Please upload a valid CSV file");
      return;
    }

    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        setJsonData(results.data);
      },
      error: (err: any) => {
        setError(err.message || "Error parsing CSV");
      },
    });
  };

  return { jsonData, error, handleCsvUpload };
};

export default useCsvToJson;
