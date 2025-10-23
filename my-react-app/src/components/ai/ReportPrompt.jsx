import { useState } from "react";

export default function ReportPrompt() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState("");
  const [data, setData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setData(null);
    setPlanId("");

    try {
      const res = await fetch("http://localhost:5050/api/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await res.json();
      setPlanId(result.planId);
      setData(result.data);

      // Build the correct preview URL depending on plan
      let url = "http://localhost:5050/reports/preview";
      if (result.planId === "cohortsVitals") {
        url += "?mode=cohort";
      } else {
        url += "?bucket=week";
      }
      setPreviewUrl(url);
    } catch (err) {
      console.error("Error fetching report:", err);
      alert("Something went wrong generating the report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>🩺 Generate a Clinical Report</h2>
      <p>Enter an open-ended prompt (e.g. “show heart rate trends for male patients”).</p>

      <form onSubmit={handleSubmit}>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
          placeholder="Type your prompt here..."
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "10px",
            padding: "10px 16px",
            border: "none",
            background: "#007bff",
            color: "#fff",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </form>

      {planId && (
        <div style={{ marginTop: 20 }}>
          <h4>🧠 Plan selected:</h4>
          <code>{planId}</code>
        </div>
      )}

      {previewUrl && (
        <div style={{ marginTop: 30 }}>
          <h3>Report Preview</h3>
          <iframe
            title="Report Preview"
            src={previewUrl}
            style={{ width: "100%", height: "600px", border: "1px solid #ccc", borderRadius: "6px" }}
          ></iframe>
          <p>
            <a href={previewUrl.replace("/preview", "/preview.pdf")} target="_blank" rel="noreferrer">
              Download PDF version
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
