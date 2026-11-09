import { useState } from "react";
import * as XLSX from "xlsx";
import { useAppContext } from "../AppContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecipientUpload({ recipients, setRecipients }) {
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const { showToast } = useAppContext();

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMessage("");

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, {header:'A'});

        const extracted = rows.flatMap((row) => {
          const emailKey = Object.keys(row).find(
            (key) => key.trim().toLowerCase() === "email"
          );
          const value = emailKey ? row[emailKey] : Object.values(row)[0];

          return String(value ?? "")
            .split(/[;,\s]+/)
            .map((email) => email.trim().toLowerCase())
            .filter((email) => emailPattern.test(email));
        });

        const combined = [...new Set([...recipients, ...extracted])];
        setRecipients(combined);
        const successMessage = `${extracted.length} valid email entries found; ${combined.length} unique recipients selected.`;
        setMessage(successMessage);
        showToast(successMessage);
      } catch {
        const errorMessage = "Could not read this Excel file. Please check its format.";
        setMessage(errorMessage);
        showToast(errorMessage, "error");
      }
    };

    reader.onerror = () => {
      const errorMessage = "Unable to read the selected file.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <section className="upload-section">
      <label htmlFor="recipient-file">Recipient Excel file</label>
      <input
        id="recipient-file"
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
      />
      {fileName && <p className="muted">{fileName}</p>}
      {message && <p className="feedback">{message}</p>}
      <p className="recipient-count">Recipients selected: <strong>{recipients.length}</strong></p>
    </section>
  );
}
