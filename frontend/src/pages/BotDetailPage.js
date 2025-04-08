import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listDocuments,
  deleteDocument,
  getChatbot,
  processDocument,
} from "../services/apiService";

const BotDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);

  useEffect(() => {
    const fetchBotAndDocuments = async () => {
      try {
        setLoading(true);
        const botResponse = await getChatbot(id);
        setBot(botResponse);
        const docsResponse = await listDocuments(id);
        setDocuments(docsResponse.documents || []);
        setError(null);
      } catch (err) {
        console.error("Error loading bot details:", err);
        setError("Failed to load bot details and documents.");
      } finally {
        setLoading(false);
      }
    };

    fetchBotAndDocuments();
  }, [id]);

  const handleSelectDoc = (docId) => {
    setSelectedDocs((prevSelected) =>
      prevSelected.includes(docId)
        ? prevSelected.filter((id) => id !== docId)
        : [...prevSelected, docId],
    );
  };

  const handleBatchDelete = async () => {
    if (selectedDocs.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDocs.length} document(s)?`,
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        selectedDocs.map((docId) =>
          deleteDocument({
            chatbot_id: id,
            document_id: docId,
          }),
        ),
      );
      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => !selectedDocs.includes(doc.id)),
      );
      setSelectedDocs([]);
    } catch (err) {
      console.error("Error deleting selected documents:", err);
      alert("Failed to delete selected documents. Please try again.");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (confirmDelete !== documentId) {
      setConfirmDelete(documentId);
      return;
    }
    try {
      await deleteDocument({
        chatbot_id: id,
        document_id: documentId,
      });
      setDocuments(documents.filter((doc) => doc.id !== documentId));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to delete document. Please try again.");
    }
  };

  const handleProcessDocuments = async () => {
    try {
      await processDocument(id);
      alert("Documents processed successfully.");
    } catch (err) {
      console.error("Error processing documents:", err);
      alert("Failed to process documents. Please try again.");
    }
  };

  const getDocumentsByType = () => {
    const groupedDocs = {};
    documents.forEach((doc) => {
      if (doc.file_type !== "faiss" && doc.file_type !== "pkl") {
        const fileType = doc.file_type || "Other";
        if (!groupedDocs[fileType]) {
          groupedDocs[fileType] = [];
        }
        groupedDocs[fileType].push(doc);
      }
    });
    return groupedDocs;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  if (error)
    return (
      <div className="text-center py-10 text-lg text-red-500 bg-red-50 rounded-lg p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {error}
      </div>
    );
  if (!bot)
    return (
      <div className="text-center py-10 text-lg text-red-500 bg-red-50 rounded-lg p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Bot not found.
      </div>
    );

  const groupedDocuments = getDocumentsByType();

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* Bot header */}
      <div className="mb-8 bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl shadow-sm">
        <button
          onClick={() => navigate("/bots")}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Bots
        </button>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-col gap-4">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">
              {bot.name}
            </h1>
            <p className="text-gray-600 text-base">{bot.description}</p>
          </div>
          <div className="flex ml-auto gap-3">
            {/* Edit Button */}
            <button
              onClick={() => navigate(`/create-bot?edit=true&id=${id}`)}
              className="group flex items-center justify-center bg-gradient-to-r from-gray-800 to-black text-white h-10 w-10 hover:w-24 rounded-lg hover:shadow-md transition-all ease-in-out duration-300 overflow-hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="ml-0 group-hover:ml-2 whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs transition-all duration-300 ease-in-out overflow-hidden text-sm">
                Edit
              </span>
            </button>

            {/* Embed Button */}
            <button
              onClick={() => navigate(`/embed/${id}`)}
              className="group flex items-center justify-center bg-gradient-to-r from-gray-800 to-black text-white h-10 w-10 hover:w-24 rounded-lg hover:shadow-md transition-all ease-in-out duration-300 overflow-hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 18l6-6-6-6M8 6l-6 6 6 6"
                />
              </svg>
              <span className="ml-0 group-hover:ml-2 whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs transition-all duration-300 ease-in-out overflow-hidden text-sm">
                Embed
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Documents section */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Bot Documents</h2>
          <button
            onClick={() => navigate(`/create-bot?edit=true&id=${id}#upload`)}
            className="bg-gradient-to-r from-gray-800 to-black text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload
          </button>
        </div>

        {/* If no documents */}
        {documents.length === 0 ? (
          <div className="text-center py-16 text-gray-600 bg-gray-50 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No documents have been uploaded to this bot yet.</p>
            <button
              onClick={() => navigate(`/create-bot?edit=true&id=${id}#upload`)}
              className="mt-6 bg-gradient-to-r from-gray-800 to-black text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2 justify-center mx-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload
            </button>
          </div>
        ) : (
          <div>
            {Object.entries(groupedDocuments).map(([fileType, docs]) => (
              <div key={fileType} className="mb-8">
                <h3 className="border-b border-gray-200 pb-2 text-gray-700 mb-4 font-semibold">
                  {fileType}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex justify-between items-center py-4 px-5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative inline-block">
                          <input
                            type="checkbox"
                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition-colors duration-200 ease-in-out cursor-pointer"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={() => handleSelectDoc(doc.id)}
                          />
                          <svg
                            className="absolute w-5 h-5 pointer-events-none top-0 left-0 text-white fill-current hidden peer-checked:block"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <div className="font-medium mb-1 text-gray-800">
                            {doc.file_name || "Untitled Document"}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {new Date(
                              doc.created_at || doc.uploaded_at,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Batch delete button */}
            {selectedDocs.length > 0 && (
              <div className="my-4 fixed bottom-6 right-6 z-10">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-5 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
                  onClick={handleBatchDelete}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete ({selectedDocs.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-center items-center mb-8">
        <button
          className="bg-gradient-to-r from-gray-800 to-black text-white font-medium py-3 px-6 rounded-lg mt-8 hover:shadow-md transition-all duration-200 flex items-center gap-2"
          onClick={handleProcessDocuments}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Process Documents
        </button>
      </div>
    </div>
  );
};

export default BotDetailPage;
