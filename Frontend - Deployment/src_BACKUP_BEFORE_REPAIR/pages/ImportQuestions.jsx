import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import mammoth from "mammoth/mammoth.browser";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Tesseract from "tesseract.js";

import useToast from "../hooks/useToast";
import Toast from "../components/Toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// =========================================================
// DEFAULTS (Coverage / Purpose no longer shown in the UI —
// every import goes in as Midterm / Practice by default and
// can be reclassified later from the subject's question bank)
// =========================================================

const DEFAULT_COVERAGE_ID = "1"; // Midterm
const DEFAULT_PURPOSE_ID = "2"; // Practice

// =========================================================
// FILE PARSING HELPERS
// =========================================================

const cleanLines = (lines) =>
  lines
    .map((l) => (l || "").replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 3)
    .filter(
      (l) => !/^(page \d+|sheet\d*|©|table of contents)$/i.test(l)
    );

const parseSpreadsheet = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        let qColIdx = 0;

        if (rows.length) {
          const header = rows[0].map((h) => String(h).toLowerCase());
          const found = header.findIndex((h) => h.includes("question"));

          if (found !== -1) {
            qColIdx = found;
            rows.shift();
          }
        }

        resolve(rows.map((r) => String(r[qColIdx] ?? "").trim()).filter(Boolean));
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });

const parseDocx = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const result = await mammoth.extractRawText({
          arrayBuffer: e.target.result,
        });

        resolve(
          result.value
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
        );
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

// Proper line reconstruction using Y position + hasEOL, and throws a clear
// error when the PDF has no text layer (scanned/image PDF).
const parsePdf = async (file) => {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const allLines = [];
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    let currentLine = "";
    let lastY = null;

    content.items.forEach((item) => {
      totalChars += item.str.length;
      const y = item.transform[5];

      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (currentLine.trim()) allLines.push(currentLine.trim());
        currentLine = item.str;
      } else {
        currentLine += (currentLine ? " " : "") + item.str;
      }

      lastY = y;

      if (item.hasEOL) {
        if (currentLine.trim()) allLines.push(currentLine.trim());
        currentLine = "";
      }
    });

    if (currentLine.trim()) allLines.push(currentLine.trim());
  }

  if (totalChars === 0) {
    const err = new Error(
      "This PDF has no selectable text (it looks like a scanned image). Try a text-based PDF, or use OCR first."
    );
    err.isNoTextLayer = true;
    throw err;
  }

  return allLines;
};

const parseText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split("\n"));
    reader.onerror = reject;
    reader.readAsText(file);
  });

// OCR for photos / scanned images (jpg, png, webp, etc.) using Tesseract.js,
// entirely in the browser — no server round-trip needed.
const parseImage = async (file, onProgress) => {
  const {
    data: { text },
  } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress || 0) * 100));
      }
    },
  });

  if (!text || !text.trim()) {
    const err = new Error(
      "Could not detect any readable text in that image. Try a clearer, higher-resolution photo."
    );
    err.isNoTextLayer = true;
    throw err;
  }

  return text.split("\n");
};

const SUPPORTED_FORMATS = ["XLSX", "CSV", "DOCX", "PDF", "TXT", "IMAGE"];

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "bmp"];

// =========================================================
// COMPONENT
// =========================================================

const ImportQuestions = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState({ message: "", isError: false });
  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);

  // Destination selection
  const [subjects, setSubjects] = useState([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Fetch subjects so the user can pick the destination subject before importing
  useEffect(() => {
    const fetchSubjects = async () => {
      setIsSubjectsLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(
          `${apiUrl}/personal-quizzes/subject-options`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          },
        );

        if (!response.ok) return;

        const data = await response.json();
        if (data.success && Array.isArray(data.subjects)) {
          const sorted = [...data.subjects].sort((a, b) => {
            const programCompare = (a.programName || "").localeCompare(
              b.programName || "",
            );
            if (programCompare !== 0) return programCompare;
            return (a.subjectCode || "").localeCompare(b.subjectCode || "");
          });
          setSubjects(sorted);
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
      } finally {
        setIsSubjectsLoading(false);
      }
    };

    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parses the file, then imports every detected line straight away —
  // no checkbox review step.
  const handleFile = async (file) => {
    if (!selectedSubjectId) {
      setStatus({
        message: "Please select which subject to import these questions into first.",
        isError: true,
      });
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();
    setFileName(file.name);
    setIsParsing(true);
    setOcrProgress(null);
    setStatus({ message: `Reading ${file.name}...`, isError: false });

    try {
      let parsedLines = [];

      if (["xlsx", "xls", "csv"].includes(ext)) {
        parsedLines = await parseSpreadsheet(file);
      } else if (ext === "docx") {
        parsedLines = await parseDocx(file);
      } else if (ext === "pdf") {
        parsedLines = await parsePdf(file);
      } else if (ext === "txt") {
        parsedLines = await parseText(file);
      } else if (IMAGE_EXTENSIONS.includes(ext)) {
        setStatus({ message: `Reading text from ${file.name}...`, isError: false });
        parsedLines = await parseImage(file, (pct) => {
          setOcrProgress(pct);
          setStatus({
            message: `Reading text from image... ${pct}%`,
            isError: false,
          });
        });
      } else {
        setStatus({
          message: `Unsupported file type: .${ext}. Use Excel, CSV, Word, PDF, TXT, or an image.`,
          isError: true,
        });
        setIsParsing(false);
        return;
      }

      const cleaned = cleanLines(parsedLines);

      if (cleaned.length === 0) {
        setStatus({
          message:
            "No usable text found in that file. Try a different file, or add questions manually instead.",
          isError: true,
        });
        setIsParsing(false);
        return;
      }

      setIsParsing(false);
      setOcrProgress(null);
      await handleImport(cleaned);
    } catch (err) {
      console.error(err);
      setIsParsing(false);
      setOcrProgress(null);
      setStatus({
        message: err.isNoTextLayer
          ? err.message
          : `Could not read that file (${err.message || "unknown error"}).`,
        isError: true,
      });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onBrowseSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  // Saves every detected line straight to the Qualifying Exam Question bank
  // (mirrors the "Subject-based" path used by AddQuestionForm), then jumps
  // into that subject's page to show the result.
  const handleImport = async (linesToImport) => {
    const selected = linesToImport.filter((l) => l.trim());

    if (selected.length === 0) return;

    setIsImporting(true);
    setStatus({
      message: `Importing ${selected.length} question${selected.length === 1 ? "" : "s"}...`,
      isError: false,
    });
    const token = sessionStorage.getItem("token");

    let successCount = 0;
    let failCount = 0;

    for (const line of selected) {
      try {
        const fd = new FormData();
        fd.append("subjectID", selectedSubjectId);
        fd.append("coverage_id", DEFAULT_COVERAGE_ID);
        fd.append("questionText", line);
        fd.append("score", 1);
        fd.append("difficulty_id", 1); // Easy by default; editable later
        fd.append("status_id", 1); // Pending
        fd.append("purpose_id", DEFAULT_PURPOSE_ID);

        const res = await fetch(`${apiUrl}/questions/add`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (res.ok) {
          successCount += 1;
        } else {
          failCount += 1;
        }
      } catch (err) {
        console.error("Error importing line:", line, err);
        failCount += 1;
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      showToast(
        `${successCount} question${successCount === 1 ? "" : "s"} imported${
          failCount ? `, ${failCount} failed` : ""
        }`,
        failCount ? "error" : "success",
      );

      const subject = subjects.find(
        (s) => String(s.subjectID) === String(selectedSubjectId),
      );

      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const roleID = user?.roleID ?? user?.roleId;
      let path = "/dean/subjects?subject_id=" + selectedSubjectId;
      if (roleID === 2) path = "/faculty/subjects?subject_id=" + selectedSubjectId;
      else if (roleID === 3)
        path = "/program-chair/subjects?subject_id=" + selectedSubjectId;

      navigate(path, { state: { subject } });
    } else {
      setStatus({
        message: "Could not import any questions. Please try again.",
        isError: true,
      });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#fff1dc] px-6 py-8 dark:bg-[#11161d] sm:px-10 lg:px-14">
        <div className="mx-auto max-w-3xl">
          {/* HEADER */}
          <div className="mb-6">
            <div className="outfit-700 text-[26px] text-amber-950 dark:text-gray-100">
              Import questions
            </div>
            <div className="outfit-400 mt-1 text-[14px] text-gray-500 dark:text-gray-400">
              Bring in questions from Excel, Word, PDF, CSV, plain text, or a photo.
            </div>
          </div>

          {/* BODY */}
          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#171d25]">
            {/* DESTINATION SELECTOR */}
            <div className="mb-5">
              <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                Import into <span className="text-red-500">*</span>
              </label>

              {isSubjectsLoading ? (
                <div className="outfit-400 text-[13px] text-gray-500 dark:text-gray-400">
                  Loading subjects...
                </div>
              ) : subjects.length === 0 ? (
                <div className="outfit-400 rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2.5 text-[13px] text-amber-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  No subjects found.
                </div>
              ) : (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="outfit-400 w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm text-gray-900 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((s) => (
                    <option key={s.subjectID} value={s.subjectID}>
                      {s.subjectCode} - {s.subjectName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                isDragging
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                  : "border-amber-300 bg-amber-50/40 hover:bg-amber-50 dark:border-gray-600 dark:bg-gray-800/40 dark:hover:bg-gray-800"
              } ${isParsing || isImporting ? "pointer-events-none opacity-60" : ""}`}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange-400 text-orange-500">
                <i className="bx bx-cloud-upload text-[24px]" />
              </div>

              <div className="outfit-700 text-[15px] text-amber-950 dark:text-gray-100">
                {isParsing
                  ? ocrProgress !== null
                    ? `Reading image... ${ocrProgress}%`
                    : "Reading file..."
                  : isImporting
                    ? "Importing..."
                    : "Drag a file here, or click to browse"}
              </div>

              <div className="outfit-400 mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                One question per line works best for text-based files. Photos
                are read automatically with OCR. Detected questions are
                imported right away — no review step.
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {SUPPORTED_FORMATS.map((fmt) => (
                  <span
                    key={fmt}
                    className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 shadow-sm dark:bg-gray-900 dark:text-gray-300"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv,.docx,.pdf,.txt,.jpg,.jpeg,.png,.webp,.bmp"
              onChange={onBrowseSelect}
            />

            {status.message && (
              <div
                className={`outfit-400 mt-4 rounded-lg border-l-4 px-3 py-2.5 text-[13px] ${
                  status.isError
                    ? "border-red-400 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                    : "border-orange-400 bg-amber-50 text-amber-800 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {status.message}
              </div>
            )}

            {fileName && (isParsing || isImporting) && (
              <div className="outfit-400 mt-3 text-[11px] tracking-wide text-amber-800/80 uppercase dark:text-gray-400">
                {fileName}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={() => navigate(-1)}
              disabled={isImporting}
              className="border-color outfit-400 cursor-pointer rounded-lg border px-4 py-2 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
};

export default ImportQuestions;
