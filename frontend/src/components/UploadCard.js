import { useState } from "react";

function UploadCard({ title, description, advanced = false }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file.name);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md text-center">
      <h4 className="text-md font-semibold">{title}</h4>
      <p className="text-sm text-gray-600 mb-3">{description}</p>

      {advanced && (
        <p className="text-blue-500 text-sm cursor-pointer mb-2">
          View pricing
        </p>
      )}

      <label className="w-full block">
        <input type="file" className="hidden" onChange={handleFileChange} />
        <button className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition">
          Upload
        </button>
      </label>

      {selectedFile && (
        <p className="text-sm text-green-600 mt-2">Selected: {selectedFile}</p>
      )}
    </div>
  );
}

export default UploadCard;
