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
//
// Every parser below now resolves to an array of:
//   { text: string, images: string[] }   // images = data URLs
// instead of plain strings, so that figures/diagrams found in
// the source file can travel alongside the question they belong
// to and get uploaded together.
// =========================================================

const cleanItems = (items) =>
  items
    .map((it) => ({
      text: (it.text || "").replace(/\s+/g, " ").trim(),
      images: it.images || [],
    }))
    .filter((it) => it.text.length > 3)
    .filter(
      (it) => !/^(page \d+|sheet\d*|©|table of contents)$/i.test(it.text)
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

        resolve(
          rows
            .map((r) => String(r[qColIdx] ?? "").trim())
            .filter(Boolean)
            .map((text) => ({ text, images: [] }))
        );
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });

// DOCX: mammoth converts to HTML and lets us intercept every embedded
// image as a base64 data URL. We then walk the resulting HTML and
// attach any image found inside (or immediately before) a paragraph
// to that paragraph's text — i.e. the question closest to the figure.
const parseDocx = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const result = await mammoth.convertToHtml(
          { arrayBuffer: e.target.result },
          {
            convertImage: mammoth.images.imgElement((image) =>
              image.read("base64").then((b64) => ({
                src: `data:${image.contentType};base64,${b64}`,
              }))
            ),
          }
        );

        const doc = new DOMParser().parseFromString(result.value, "text/html");
        const items = [];
        let pendingImages = [];

        Array.from(doc.body.children).forEach((el) => {
          const imgEls = el.querySelectorAll ? el.querySelectorAll("img") : [];
          const imgSrcs = Array.from(imgEls)
            .map((img) => img.getAttribute("src"))
            .filter(Boolean);

          const text = (el.textContent || "").trim();

          if (text) {
            items.push({ text, images: [...pendingImages, ...imgSrcs] });
            pendingImages = [];
          } else if (imgSrcs.length) {
            // Image sits on its own line/paragraph with no text — hold
            // onto it and attach it to the next question that has text.
            pendingImages.push(...imgSrcs);
          }
        });

        // Trailing images with nothing after them: attach to the last
        // question found instead of dropping them.
        if (pendingImages.length && items.length) {
          items[items.length - 1].images.push(...pendingImages);
        }

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

// --- PDF image extraction helpers -------------------------------------

const OPS = pdfjsLib.OPS;

// Converts a pdf.js decoded image object (RGB/RGBA/grayscale raw pixel
// data) into a PNG data URL via an offscreen canvas.
const imageDataToDataUrl = (imgData) => {
  if (!imgData || !imgData.data || !imgData.width || !imgData.height) {
    return null;
  }

  const { width, height, data } = imgData;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  let rgba;
  if (data.length === width * height * 4) {
    rgba = new Uint8ClampedArray(data);
  } else if (data.length === width * height * 3) {
    rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i + 1];
      rgba[j + 2] = data[i + 2];
      rgba[j + 3] = 255;
    }
  } else if (data.length === width * height) {
    rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0, j = 0; i < data.length; i += 1, j += 4) {
      rgba[j] = rgba[j + 1] = rgba[j + 2] = data[i];
      rgba[j + 3] = 255;
    }
  } else {
    return null;
  }

  try {
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

// Scans a page's operator list for image paint operations and resolves
// each referenced image object to a data URL.
const extractPageImages = async (page) => {
  const opList = await page.getOperatorList();
  const names = new Set();

  opList.fnArray.forEach((fn, idx) => {
    if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
      const name = opList.argsArray[idx][0];
      if (name) names.add(name);
    }
  });

  const images = [];
  for (const name of names) {
    try {
      const imgData = await new Promise((resolve) => page.objs.get(name, resolve));
      const dataUrl = imageDataToDataUrl(imgData);
      if (dataUrl) images.push(dataUrl);
    } catch {
      // Skip images pdf.js can't decode (e.g. unsupported filters)
      // rather than failing the whole import.
    }
  }

  return images;
};

// Proper line reconstruction using Y position + hasEOL, and throws a clear
// error when the PDF has no text layer (scanned/image PDF). Figures found
// on a page are attached to the LAST text line on that same page — the
// common layout where a diagram sits right below the question it belongs
// to. If your source PDFs put the figure ABOVE the question instead,
// attach to the first line of the page rather than the last.
const parsePdf = async (file) => {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const items = [];
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    let currentLine = "";
    let lastY = null;
    const pageLineIndices = [];

    const pushLine = () => {
      if (currentLine.trim()) {
        items.push({ text: currentLine.trim(), images: [] });
        pageLineIndices.push(items.length - 1);
      }
      currentLine = "";
    };

    content.items.forEach((item) => {
      totalChars += item.str.length;
      const y = item.transform[5];

      if (lastY !== null && Math.abs(y - lastY) > 2) {
        pushLine();
        currentLine = item.str;
      } else {
        currentLine += (currentLine ? " " : "") + item.str;
      }

      lastY = y;

      if (item.hasEOL) pushLine();
    });

    pushLine();

    try {
      const pageImages = await extractPageImages(page);
      if (pageImages.length && pageLineIndices.length) {
        const lastIdx = pageLineIndices[pageLineIndices.length - 1];
        items[lastIdx].images.push(...pageImages);
      }
    } catch {
      // If image extraction fails for this page, keep the text-only result.
    }
  }

  if (totalChars === 0) {
    const err = new Error(
      "This PDF has no selectable text (it looks like a scanned image). Try a text-based PDF, or use OCR first."
    );
    err.isNoTextLayer = true;
    throw err;
  }

  return items;
};

const parseText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve(
        e.target.result.split("\n").map((text) => ({ text, images: [] }))
      );
    reader.onerror = reject;
    reader.readAsText(file);
  });

// OCR for photos / scanned images (jpg, png, webp, etc.) using Tesseract.js,
// entirely in the browser — no server round-trip needed. Since a photo of
// a question usually contains its own figure baked into the same image,
// we attach the ORIGINAL photo to the first detected question line rather
// than trying to crop the figure out.
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

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const lines = text.split("\n");
  let attached = false;

  return lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed && !attached) {
      attached = true;
      return { text: trimmed, images: [dataUrl] };
    }
    return { text: trimmed, images: [] };
  });
};

const SUPPORTED_FORMATS = ["XLSX", "CSV", "DOCX", "PDF", "TXT", "IMAGE"];

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "bmp"];

// Converts a base64 data URL into a Blob so it can be sent as a real file
// in a multipart/form-data request.
const dataUrlToBlob = (dataUrl) => {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

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

  // Parses the file, then imports every detected question straight away —
  // no checkbox review step. Each question may carry along 0+ figure
  // images extracted from the source file.
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
      let parsedItems = [];

      if (["xlsx", "xls", "csv"].includes(ext)) {
        parsedItems = await parseSpreadsheet(file);
      } else if (ext === "docx") {
        parsedItems = await parseDocx(file);
      } else if (ext === "pdf") {
        parsedItems = await parsePdf(file);
      } else if (ext === "txt") {
        parsedItems = await parseText(file);
      } else if (IMAGE_EXTENSIONS.includes(ext)) {
        setStatus({ message: `Reading text from ${file.name}...`, isError: false });
        parsedItems = await parseImage(file, (pct) => {
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

      const cleaned = cleanItems(parsedItems);

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

  // Saves every detected question straight to the Subject question bank
  // (mirrors the "Subject-based" path used by AddQuestionForm), then jumps
  // into that subject's page to show the result. Any figure attached to a
  // question is uploaded alongside it as a file field.
  const handleImport = async (itemsToImport) => {
    const selected = itemsToImport.filter((it) => it.text.trim());

    if (selected.length === 0) return;

    setIsImporting(true);
    setStatus({
      message: "Processing...",
      isError: false,
    });
    const token = sessionStorage.getItem("token");

    const BATCH_SIZE = 8;

    const importOne = async (item) => {
      try {
        const fd = new FormData();
        fd.append("subjectID", selectedSubjectId);
        fd.append("coverage_id", DEFAULT_COVERAGE_ID);
        fd.append("questionText", item.text);
        fd.append("score", 1);
        fd.append("difficulty_id", 1); // Easy by default; editable later
        fd.append("status_id", 1); // Pending
        fd.append("purpose_id", DEFAULT_PURPOSE_ID);

        // NOTE: field name "image" is a guess — match it to whatever
        // your /questions/add multer/upload middleware expects. If the
        // backend accepts several figures per question, loop over
        // item.images and append each with its own field/array name
        // instead of just the first one.
        if (item.images && item.images.length) {
          const blob = dataUrlToBlob(item.images[0]);
          fd.append("image", blob, "figure.png");
        }

        const res = await fetch(`${apiUrl}/questions/add`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        return res.ok;
      } catch (err) {
        console.error("Error importing question:", item.text, err);
        return false;
      }
    };

    // Fire the uploads in the background and navigate away immediately —
    // the user doesn't wait for 100+ requests to finish. The toast reports
    // the final success/fail counts once everything settles in the
    // background, whichever page the user is on by then.
    (async () => {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selected.length; i += BATCH_SIZE) {
        const batch = selected.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(importOne));
        results.forEach((ok) => (ok ? successCount++ : failCount++));
      }

      showToast(
        `${successCount} question${successCount === 1 ? "" : "s"} imported${
          failCount ? `, ${failCount} failed` : ""
        }`,
        failCount ? "error" : "success",
      );
    })();

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

              {!isParsing && !isImporting && (
                <>
                  <div className="outfit-400 mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                    One question per line works best for text-based files.
                    Photos are read automatically with OCR. Figures/diagrams
                    found in PDF or Word files are attached to the question
                    automatically. Detected questions are imported right away
                    — no review step.
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
                </>
              )}
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
