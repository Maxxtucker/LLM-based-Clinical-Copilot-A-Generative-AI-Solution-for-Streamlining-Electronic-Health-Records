import { useState } from "react";

export default function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [bucket, setBucket] = useState("week");
  const [previewUrl, setPreviewUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    // send the prompt to backend → backend decides which pipeline to use
    const res = await fetch("http://localhost:5050/api/ai/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const { planId } = await res.json();

    // build the preview URL depending on the plan
    const url =
      planId === "cohortsVitals"
        ? `/reports/preview?mode=cohort&bucket=${bucket}`
        : `/reports/preview?bucket=${bucket}`;

    setPreviewUrl(url);
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Generate a Clinical Report</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ width: "100%", marginBottom: 10 }}
          placeholder="e.g. Show weekly heart rate trends for diabetic patients"
        />
        <div>
          <label>Time bucket: </label>
          <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
            <option value="week">week</option>
            <option value="month">month</option>
            <option value="day">day</option>
          </select>
        </div>
        <button type="submit" style={{ marginTop: 10 }}>
          Generate Preview
        </button>
      </form>

      {previewUrl && (
        <>
          <h3 style={{ marginTop: 20 }}>Preview</h3>
          <iframe
            title="report-preview"
            src={previewUrl}
            style={{ width: "100%", height: 600, border: "1px solid #ccc" }}
          />
          <p>
            <a href={previewUrl.replace("/preview", "/preview.pdf")} target="_blank" rel="noreferrer">
              Export PDF
            </a>
          </p>
        </>
      )}
    </div>
  );
}
