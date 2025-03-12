import { useState } from "react";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";

function UploadForm() {
  const [datasetName, setDatasetName] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!datasetName || !file) {
      setMessage("Please provide a dataset name and select a file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("datasetName", datasetName);
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setMessage(`File uploaded! File ID: ${response.data.fileId}`);
    } catch (error) {
      setMessage("Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Dataset Name"
        value={datasetName}
        onChange={(e) => setDatasetName(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="file"
        accept=".jsonl"
        onChange={handleFileChange}
        className="border p-2 rounded"
      />

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {loading ? <LoadingSpinner /> : "Upload"}
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </form>
  );
}

export default UploadForm;
