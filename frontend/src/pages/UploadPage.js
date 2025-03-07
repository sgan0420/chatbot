import BotSettingsForm from "../components/BotSettingForm";
import UploadCard from "../components/UploadCard";

const uploadOptions = {
  basic: [
    { title: "PDF files", description: "Upload PDF files containing texts." },
    {
      title: "Q&As",
      description: "Provide frequently asked questions and answers.",
    },
    {
      title: "URLs",
      description: "Answers based on the content of the webpage.",
    },
  ],
  advanced: [
    { title: "CSV files", description: "Upload CSV files containing texts." },
    {
      title: "Oracle",
      description: "Provide frequently asked questions and answers.",
    },
    {
      title: "JSONL",
      description: "Answers based on the content of the webpage.",
    },
    { title: "RAW files", description: "Upload raw files containing texts." },
    {
      title: "XML files",
      description: "Provide frequently asked questions and answers.",
    },
    {
      title: "Text files",
      description: "Answers based on the content of the webpage.",
    },
  ],
};

function UploadPage() {
  return (
    <div className="container">
      {/* Bot Settings Form */}
      <BotSettingsForm />

      {/* Upload Section */}
      <div className="bot-settings-form">
        <h2 className="text-xl font-semibold mb-4">Upload Your Data</h2>

        {/* Basic Upload Options */}
        <h3 className="text-lg font-medium mb-2">Basic</h3>
        <div className="grid-2">
          {uploadOptions.basic.map((option, index) => (
            <UploadCard
              key={index}
              title={option.title}
              description={option.description}
            />
          ))}
        </div>

        {/* Advanced Upload Options */}
        <h3 className="text-lg font-medium mb-2">Advanced</h3>
        <div className="grid-2">
          {uploadOptions.advanced.map((option, index) => (
            <UploadCard
              key={index}
              title={option.title}
              description={option.description}
              advanced
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
