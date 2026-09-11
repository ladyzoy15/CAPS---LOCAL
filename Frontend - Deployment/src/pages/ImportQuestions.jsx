import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import mammoth from "mammoth/mammoth.browser";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Tesseract from "tesseract.js";
import DOMPurify from "dompurify";

import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import { getToken, getUser, handleUnauthorized } from "../utils/authStorage";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// =========================================================
// DEFAULTS
// =========================================================

const DEFAULT_COVERAGE_ID = "1";
const DEFAULT_PURPOSE_ID = "2";

const renderImportedHtml = (value) => ({
  __html: DOMPurify.sanitize(String(value ?? ""), {
    USE_PROFILES: { html: true },
    FORBID_ATTR: ["style", "class", "id"],
  }),
});

// =========================================================
// FILE PARSING HELPERS
// =========================================================

const cleanLines = (lines) =>
  lines
    .map((l) => (l || "").replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 3)
    .filter(
      (l) =>
        !/^(page \d+|sheet\d*|©|table of contents)$/i.test(l)
    );

// =========================================================
// QUESTION + CHOICE GROUPING (for DOCX / PDF / TXT / IMAGE)
// =========================================================
// Turns raw extracted lines like:
//   "1. What is the SI unit of electrical resistance?"
//   "A. Ampere"
//   "B. Volt"
//   "C. Ohm  ✓ (Correct)"
//   "D. Watt"
// into structured { questionText, choices: [...], difficulty_id } objects,
// the same shape the manual "Add Question" form sends to the API.

const DIFFICULTY_LABEL_TO_ID = {
  easy: 1,
  moderate: 2,
  difficult: 3,
  hard: 3,
};

// Matches a question start line, e.g. "1. ..." or "12) ..."
const QUESTION_START_RE = /^(\d{1,3})[.)]\s+(.+)$/;

// Matches a lettered choice line, e.g. "A. ..." or "b) ..."
const CHOICE_LINE_RE = /^([A-Ea-e])[.)]\s*(.*)$/;

// Any of these markers on a choice line means it's the correct answer.
// They're stripped from the stored choice text afterward.
const CORRECT_MARKER_RE = /(✓|✔|\(\s*correct\s*\)|\[\s*correct\s*\])/gi;

const groupQuestionsFromTokens = (tokens) => {
  const questions = [];
  let current = null;
  let currentDifficulty = 1; // default: easy

  const pushCurrent = () => {
    if (
      current &&
      current.questionText &&
      current.choices.length >= 2
    ) {
      questions.push(current);
    }
    current = null;
  };

  tokens.forEach((token) => {
    if (token.type === "image") {
      // Attach the figure to the question currently being built, as long
      // as we haven't started reading its choices yet (i.e. the image
      // appeared between the question stem and option A).
      if (current && current.choices.length === 0 && !current.image) {
        current.image = token.dataUri;
      }
      return;
    }

    const line = (token.text || "").trim();
    if (!line) return;

    const lower = line.toLowerCase().replace(/[^a-z]/g, "");

    if (DIFFICULTY_LABEL_TO_ID[lower] !== undefined) {
      currentDifficulty = DIFFICULTY_LABEL_TO_ID[lower];
      return;
    }

    const choiceMatch = line.match(CHOICE_LINE_RE);
    const questionMatch = !choiceMatch && line.match(QUESTION_START_RE);

    if (questionMatch) {
      pushCurrent();
      current = {
        questionText: questionMatch[2].trim(),
        choices: [],
        difficulty_id: currentDifficulty,
        image: null,
      };
      return;
    }

    if (choiceMatch && current) {
      const isCorrect = CORRECT_MARKER_RE.test(line);
      CORRECT_MARKER_RE.lastIndex = 0;

      const choiceText = choiceMatch[2]
        .replace(CORRECT_MARKER_RE, "")
        .trim();

      current.choices.push({ choiceText, isCorrect });
      return;
    }

    // Continuation of the question stem (e.g. a figure caption on its own
    // line) — only append while we haven't started reading choices yet.
    if (current && current.choices.length === 0 && line) {
      current.questionText = `${current.questionText} ${line}`.trim();
    }
  });

  pushCurrent();

  return questions;
};

const groupQuestionsFromLines = (rawLines) => {
  const tokens = rawLines
    .map((l) => (l || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((text) => ({ type: "text", text }));

  return groupQuestionsFromTokens(tokens);
};

const parseSpreadsheet = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, {
          type: "binary",
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        if (rows.length === 0) {
          reject(
            new Error(
              "The spreadsheet is empty."
            )
          );

          return;
        }

        const header = rows[0].map((h) =>
          String(h).toLowerCase().trim()
        );

        let qColIdx = header.findIndex((h) =>
          h.includes("question")
        );

        if (qColIdx === -1) {
          const textCol = header.findIndex(
            (h) =>
              h &&
              !/^(no|id|num|#|index|sn|code)$/i.test(
                h
              )
          );

          if (textCol !== -1) {
            qColIdx = textCol;
          }
        }

        if (qColIdx === -1) {
          reject(
            new Error(
              "Could not detect a valid question column in this file."
            )
          );

          return;
        }

        const choiceColIndices = [];
        const choiceLabels = [
          "a",
          "b",
          "c",
          "d",
          "e",
          "choice a",
          "choice b",
          "choice c",
          "choice d",
          "choice e",
        ];

        header.forEach((h, idx) => {
          const lower = h
            .toLowerCase()
            .trim();
          if (
            choiceLabels.includes(lower) ||
            /^choice\s*[a-e]$/i.test(lower)
          ) {
            choiceColIndices.push(idx);
          }
        });

        let correctColIdx = -1;
        header.forEach((h, idx) => {
          if (
            /^(correct|answer|correct answer)$/i.test(
              h
            )
          ) {
            correctColIdx = idx;
          }
        });

        const dataRows = rows.slice(1);
        const isStructured =
          choiceColIndices.length > 0;

        if (isStructured) {
          const questions = [];

          for (const row of dataRows) {
            const qText = String(
              row[qColIdx] ?? ""
            ).trim();

            if (!qText || qText.length <= 3)
              continue;

            const choices = [];
            choiceColIndices.forEach(
              (colIdx, i) => {
                const choiceText = String(
                  row[colIdx] ?? ""
                ).trim();

                if (choiceText) {
                  choices.push({
                    choiceText,
                    isCorrect:
                      correctColIdx !==
                      -1
                        ? String(
                            row[
                              correctColIdx
                            ] ?? ""
                          ).trim() ===
                          choiceText
                        : false,
                    position: i + 1,
                  });
                }
              }
            );

            questions.push({
              questionText: qText,
              choices,
            });
          }

          if (questions.length === 0) {
            reject(
              new Error(
                "No valid question rows found in the spreadsheet."
              )
            );

            return;
          }

          resolve(questions);
        } else {
          const questionLines = dataRows
            .map((r) =>
              String(r[qColIdx] ?? "")
                .trim()
            )
            .filter((l) => l.length > 3);

          if (
            questionLines.length === 0 &&
            dataRows.length > 0
          ) {
            reject(
              new Error(
                "No question text found in the detected column."
              )
            );

            return;
          }

          resolve(questionLines);
        }
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });

// DOCX parsing that keeps embedded circuit/figure images in place (in the
// same order they appear relative to the question text), instead of the
// text-only extraction above which silently drops them. Each returned
// token is either { type: "text", text } or { type: "image", dataUri }.
const parseDocxTokens = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const result = await mammoth.convertToHtml(
          { arrayBuffer: e.target.result },
          {
            convertImage: mammoth.images.imgElement(async (image) => {
              const base64 = await image.read("base64");
              return {
                src: `data:${image.contentType};base64,${base64}`,
              };
            }),
          }
        );

        const doc = new DOMParser().parseFromString(
          result.value,
          "text/html"
        );

        const tokens = [];

        const walk = (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "IMG") {
              const src = node.getAttribute("src");
              if (src) {
                tokens.push({ type: "image", dataUri: src });
              }
              return;
            }

            // If an element wraps both text and an image (rare, but
            // possible), walk its children individually so the image
            // still lands in the right position relative to the text.
            if (node.querySelector && node.querySelector("img")) {
              Array.from(node.childNodes).forEach(walk);
              return;
            }

            const text = (node.textContent || "")
              .replace(/\s+/g, " ")
              .trim();

            if (text) {
              tokens.push({ type: "text", text });
            }

            return;
          }

          if (node.nodeType === Node.TEXT_NODE) {
            const text = (node.textContent || "")
              .replace(/\s+/g, " ")
              .trim();

            if (text) {
              tokens.push({ type: "text", text });
            }
          }
        };

        Array.from(doc.body.childNodes).forEach(walk);

        resolve(tokens);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

// Converts a "data:<mime>;base64,...." string (as produced by
// parseDocxTokens) into a File object suitable for FormData upload.
const dataUriToFile = (dataUri, filename) => {
  const [header, base64] = dataUri.split(",");
  const mimeMatch = header.match(/data:(.*);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime });
};

const extractPdfPageLines = (content) => {
  const lines = [];
  let currentLine = "";
  let lastY = null;

  content.items.forEach((item) => {
    if (!item?.str) {
      return;
    }

    const y = item.transform[5];

    if (
      lastY !== null &&
      Math.abs(y - lastY) > 2
    ) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      currentLine = item.str;
    } else {
      currentLine +=
        (currentLine ? " " : "") + item.str;
    }

    lastY = y;

    if (item.hasEOL) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      currentLine = "";
    }
  });

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
};

const renderPdfPageForOcr = async (page) => {
  const baseViewport = page.getViewport({ scale: 1 });
  const maxDimension = 2200;
  const scale = Math.min(
    2.5,
    Math.max(
      1.5,
      maxDimension /
        Math.max(
          baseViewport.width,
          baseViewport.height
        )
    )
  );
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error(
      "Could not prepare the PDF page for OCR."
    );
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page
    .render({
      canvasContext: context,
      canvas,
      viewport,
    })
    .promise;

  return canvas;
};

const parsePdf = async (file, onProgress) => {
  const buffer = await file.arrayBuffer();
  let pdf = null;
  let loadingTask = null;
  const pageLines = [];
  let needsOcr = false;

  try {
    loadingTask = pdfjsLib.getDocument({
      data: buffer,
    });
    pdf = await loadingTask.promise;

    for (
      let pageNum = 1;
      pageNum <= pdf.numPages;
      pageNum++
    ) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const lines = extractPdfPageLines(content);
      const charCount = lines
        .join(" ")
        .replace(/\s/g, "")
        .length;

      pageLines.push(lines);

      if (charCount < 20) {
        needsOcr = true;
      }
    }

    if (!needsOcr) {
      return pageLines.flat();
    }

    let currentPage = 1;
    const worker = await Tesseract.createWorker(
      "eng",
      1,
      {
        logger: (message) => {
          if (
            message.status === "recognizing text" &&
            onProgress
          ) {
            const pageProgress =
              message.progress || 0;
            const overallProgress =
              ((currentPage - 1 + pageProgress) /
                pdf.numPages) *
              100;

            onProgress(
              Math.min(
                99,
                Math.round(overallProgress)
              )
            );
          }
        },
      }
    );

    try {
      const lines = [];

      for (
        let pageNum = 1;
        pageNum <= pdf.numPages;
        pageNum++
      ) {
        currentPage = pageNum;
        const existingLines = pageLines[pageNum - 1];
        const existingCharCount = existingLines
          .join(" ")
          .replace(/\s/g, "")
          .length;

        if (existingCharCount >= 20) {
          lines.push(...existingLines);
          continue;
        }

        const page = await pdf.getPage(pageNum);
        const canvas = await renderPdfPageForOcr(
          page
        );

        try {
          const {
            data: { text },
          } = await worker.recognize(canvas);
          const ocrLines = (text || "")
            .split(/\r?\n/)
            .map((line) =>
              line.replace(/\s+/g, " ").trim()
            )
            .filter(Boolean);

          lines.push(...ocrLines);
        } finally {
          canvas.remove();
        }

        if (onProgress) {
          onProgress(
            Math.round(
              (pageNum / pdf.numPages) * 100
            )
          );
        }
      }

      return lines;
    } finally {
      await worker.terminate();
    }
  } finally {
    if (loadingTask) {
      await loadingTask.destroy();
    }
  }
};

const parseText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) =>
      resolve(e.target.result.split("\n"));

    reader.onerror = reject;

    reader.readAsText(file);
  });

const parseImage = async (file, onProgress) => {
  const {
    data: { text },
  } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (
        m.status === "recognizing text" &&
        onProgress
      ) {
        onProgress(
          Math.round((m.progress || 0) * 100)
        );
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

const SUPPORTED_FORMATS = [
  "XLSX",
  "CSV",
  "DOCX",
  "PDF",
  "TXT",
  "IMAGE",
];

const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "bmp",
];

// =========================================================
// COMPONENT
// =========================================================

const ImportQuestions = () => {
  const [isDragging, setIsDragging] = useState(false);

  const [status, setStatus] = useState({
    message: "",
    isError: false,
  });

  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);

  // Destination subjects
  const [subjects, setSubjects] = useState([]);
  const [isSubjectsLoading, setIsSubjectsLoading] =
    useState(false);
  const [selectedSubjectId, setSelectedSubjectId] =
    useState("");

  // Database import
  const [sourceMode, setSourceMode] =
    useState("file");

  // Source databases
  const [databaseSources, setDatabaseSources] =
    useState([]);

  const [selectedSourceDatabaseId, setSelectedSourceDatabaseId] =
    useState("");

  const [isDatabaseSourcesLoading, setIsDatabaseSourcesLoading] =
    useState(false);

  const [showAddDatabase, setShowAddDatabase] =
    useState(false);

  const [isSavingDatabase, setIsSavingDatabase] =
    useState(false);

  const [isTestingDatabase, setIsTestingDatabase] =
    useState(false);

  const [databaseForm, setDatabaseForm] =
    useState({
      name: "",
      driver: "mysql",
      host: "mysql",
      port: "3306",
      database: "",
      username: "root",
      password: "",
    });

  const [sourceSubjects, setSourceSubjects] =
    useState([]);

  const [sourceSubjectId, setSourceSubjectId] =
    useState("");

  const [sourceQuestions, setSourceQuestions] =
    useState([]);

  const [selectedQuestionIds, setSelectedQuestionIds] =
    useState([]);

  const [
    isSourceSubjectsLoading,
    setIsSourceSubjectsLoading,
  ] = useState(false);

  const [
    isQuestionsLoading,
    setIsQuestionsLoading,
  ] = useState(false);

  const [
    isDatabaseImporting,
    setIsDatabaseImporting,
  ] = useState(false);

  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const { toast, showToast } = useToast();

  const apiUrl =
    import.meta.env.VITE_API_BASE_URL;

  // =========================================================
  // LOAD DESTINATION SUBJECTS
  // =========================================================

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsSubjectsLoading(true);

      try {
        const token = getToken();

        // Faculty should only ever see the subjects assigned to them,
        // same behavior as the main Subjects page (SubjectList.jsx).
        // Every other role continues to see the full subject list.
        const user = getUser() || {};
        const roleID = user?.roleID ?? user?.roleId;
        const isFaculty = roleID === 2;

        const endpoint = isFaculty
          ? `${apiUrl}/faculty/my-subjects`
          : `${apiUrl}/subjects/all`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
          console.error(
            "Failed to load destination subjects:",
            response.status
          );

          return;
        }

        const data = await response.json();

        // /faculty/my-subjects responds with { subjects: [...] } directly,
        // while /subjects/all responds with { success, subjects: [...] }.
        const rawSubjects = isFaculty
          ? Array.isArray(data.subjects)
            ? data.subjects
            : []
          : data.success && Array.isArray(data.subjects)
          ? data.subjects
          : [];

        const sorted = [...rawSubjects].sort((a, b) => {
          const programCompare = (a.programName || "").localeCompare(
            b.programName || ""
          );

          if (programCompare !== 0) {
            return programCompare;
          }

          return (a.subjectCode || "").localeCompare(
            b.subjectCode || ""
          );
        });

        setSubjects(sorted);
      } catch (err) {
        console.error(
          "Error loading subjects:",
          err
        );
      } finally {
        setIsSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [apiUrl]);

  // =========================================================
  // LOAD DATABASE SOURCES
  // =========================================================

  useEffect(() => {
    if (sourceMode !== "database") {
      return;
    }

    const fetchDatabaseSources = async () => {
      setIsDatabaseSourcesLoading(true);

      try {
        const token =
          getToken();

        const response = await fetch(
          `${apiUrl}/database-import/sources`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (handleUnauthorized(response)) return;

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not load database sources."
          );
        }

        const sources = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.sources)
          ? data.sources
          : [];

        setDatabaseSources(sources);

        if (sources.length > 0) {
          const currentExists = sources.some(
            (source) =>
              String(source.id) ===
              String(selectedSourceDatabaseId)
          );

          if (!currentExists) {
            setSelectedSourceDatabaseId(
              String(sources[0].id)
            );
          }
        } else {
          setSelectedSourceDatabaseId("");
        }
      } catch (err) {
        console.error(
          "Error loading database sources:",
          err
        );

        setDatabaseSources([]);
        setSelectedSourceDatabaseId("");

        setStatus({
          message:
            err.message ||
            "Could not load database sources.",
          isError: true,
        });
      } finally {
        setIsDatabaseSourcesLoading(false);
      }
    };

    fetchDatabaseSources();
  }, [apiUrl, sourceMode, selectedSourceDatabaseId]);

  // =========================================================
  // LOAD SOURCE SUBJECTS FROM SELECTED DATABASE
  // =========================================================

  useEffect(() => {
    if (sourceMode !== "database") {
      setSourceSubjects([]);
      setSourceSubjectId("");
      setSourceQuestions([]);
      setSelectedQuestionIds([]);
      return;
    }

    if (!selectedSourceDatabaseId) {
      setSourceSubjects([]);
      setSourceSubjectId("");
      setSourceQuestions([]);
      setSelectedQuestionIds([]);
      setIsSourceSubjectsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSourceSubjects = async () => {
      setIsSourceSubjectsLoading(true);

      try {
        const token = getToken();

        const query = `?sourceDatabaseID=${encodeURIComponent(
          selectedSourceDatabaseId
        )}`;

        const response = await fetch(
          `${apiUrl}/database-import/subjects${query}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (handleUnauthorized(response)) return;

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not load source subjects."
          );
        }

        const sourceData = Array.isArray(data.data)
          ? data.data
          : [];

        if (cancelled) {
          return;
        }

        setSourceSubjects(sourceData);

        if (
          sourceSubjectId &&
          !sourceData.some(
            (subject) =>
              String(subject.subjectID) ===
              String(sourceSubjectId)
          )
        ) {
          setSourceSubjectId("");
          setSourceQuestions([]);
          setSelectedQuestionIds([]);
        }

        if (sourceData.length === 0) {
          setStatus({
            message:
              "No subjects were found in the source database.",
            isError: true,
          });
        } else {
          setStatus({
            message: "",
            isError: false,
          });
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Error loading source subjects:",
          err
        );

        setStatus({
          message:
            err.message ||
            "Could not load source database subjects.",
          isError: true,
        });
      } finally {
        if (!cancelled) {
          setIsSourceSubjectsLoading(false);
        }
      }
    };

    fetchSourceSubjects();

    return () => {
      cancelled = true;
    };
  }, [
    apiUrl,
    sourceMode,
    selectedSourceDatabaseId,
    sourceSubjectId,
  ]);

  // =========================================================
  // LOAD QUESTIONS FOR SELECTED SOURCE SUBJECT
  // =========================================================

  useEffect(() => {
    if (
      sourceMode !== "database" ||
      !sourceSubjectId
    ) {
      setSourceQuestions([]);
      setSelectedQuestionIds([]);
      return;
    }

    const fetchSourceQuestions = async () => {
      setIsQuestionsLoading(true);

      try {
        const token =
          getToken();

        const query = selectedSourceDatabaseId
          ? `?sourceDatabaseID=${encodeURIComponent(
              selectedSourceDatabaseId
            )}`
          : "";

        const response = await fetch(
          `${apiUrl}/database-import/questions/${sourceSubjectId}${query}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not load source questions."
          );
        }

        const questions = Array.isArray(
          data.data
        )
          ? data.data
          : [];

        setSourceQuestions(questions);
        setSelectedQuestionIds([]);

        if (questions.length === 0) {
          setStatus({
            message:
              "No questions found for this source subject.",
            isError: true,
          });
        } else {
          setStatus({
            message: `${questions.length} question${
              questions.length === 1
                ? ""
                : "s"
            } found.`,
            isError: false,
          });
        }
      } catch (err) {
        console.error(
          "Error loading source questions:",
          err
        );

        setSourceQuestions([]);
        setSelectedQuestionIds([]);

        setStatus({
          message:
            err.message ||
            "Could not load source questions.",
          isError: true,
        });
      } finally {
        setIsQuestionsLoading(false);
      }
    };

    fetchSourceQuestions();
  }, [
    apiUrl,
    sourceMode,
    sourceSubjectId,
    selectedSourceDatabaseId,
  ]);

  // =========================================================
  // FILE IMPORT
  // =========================================================

  const handleFile = async (file) => {
    if (!selectedSubjectId) {
      setStatus({
        message:
          "Please select which subject to import these questions into first.",
        isError: true,
      });

      return;
    }

    const ext = file.name
      .split(".")
      .pop()
      .toLowerCase();

    setFileName(file.name);
    setIsParsing(true);
    setOcrProgress(null);

    setStatus({
      message: `Reading ${file.name}...`,
      isError: false,
    });

    try {
      let parsedLines = [];
      let docxTokens = null;

      if (
        ["xlsx", "xls", "csv"].includes(ext)
      ) {
        parsedLines =
          await parseSpreadsheet(file);
      } else if (ext === "docx") {
        // Token-based parse keeps embedded circuit/figure images attached
        // to their question instead of dropping them (plain parseDocx
        // above is left in place, unused, in case it's needed elsewhere).
        docxTokens = await parseDocxTokens(file);
        parsedLines = docxTokens
          .filter((t) => t.type === "text")
          .map((t) => t.text);
      } else if (ext === "pdf") {
        parsedLines = await parsePdf(
          file,
          (pct) => {
            setOcrProgress(pct);
            setStatus({
              message: `Reading PDF with OCR... ${pct}%`,
              isError: false,
            });
          }
        );
      } else if (ext === "txt") {
        parsedLines =
          await parseText(file);
      } else if (
        IMAGE_EXTENSIONS.includes(ext)
      ) {
        setStatus({
          message: `Reading text from ${file.name}...`,
          isError: false,
        });

        parsedLines =
          await parseImage(
            file,
            (pct) => {
              setOcrProgress(pct);

              setStatus({
                message: `Reading text from image... ${pct}%`,
                isError: false,
              });
            }
          );
      } else {
        setStatus({
          message: `Unsupported file type: .${ext}. Use Excel, CSV, Word, PDF, TXT, or an image.`,
          isError: true,
        });

        setIsParsing(false);

        return;
      }

      // Spreadsheets with dedicated "Choice A/B/C/D" + "Correct" columns
      // already come back as structured { questionText, choices } objects.
      const isStructuredRows =
        Array.isArray(parsedLines) &&
        parsedLines.length > 0 &&
        typeof parsedLines[0] === "object";

      if (isStructuredRows) {
        setIsParsing(false);
        setOcrProgress(null);

        await handleImportQuestions(parsedLines);
        return;
      }

      // For DOCX / PDF / TXT / images: try to detect question + lettered
      // choice patterns (e.g. "1. ..." followed by "A. ...", "B. ...",
      // with the correct one marked "✓" or "(Correct)") so choices are
      // imported along with the question text, not dropped. For DOCX,
      // this also carries over any embedded figure/circuit image.
      const groupedQuestions = docxTokens
        ? groupQuestionsFromTokens(docxTokens)
        : groupQuestionsFromLines(parsedLines);

      if (groupedQuestions.length > 0) {
        setIsParsing(false);
        setOcrProgress(null);

        await handleImportQuestions(groupedQuestions);
        return;
      }

      // Fallback: no recognizable question/choice pattern was found, so
      // import each remaining line as a standalone question with no
      // choices (previous behavior).
      const cleaned =
        cleanLines(parsedLines);

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
          : `Could not read that file (${
              err.message ||
              "unknown error"
            }).`,
        isError: true,
      });
    }
  };

  // =========================================================
  // DROP FILE
  // =========================================================

  const onDrop = (e) => {
    e.preventDefault();

    setIsDragging(false);

    const file =
      e.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  // =========================================================
  // BROWSE FILE
  // =========================================================

  const onBrowseSelect = (e) => {
    const file =
      e.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    e.target.value = "";
  };

  // =========================================================
  // EXISTING FILE IMPORT API
  // =========================================================

  const handleImport = async (
    linesToImport
  ) => {
    const selected =
      linesToImport.filter(
        (l) => l.trim()
      );

    if (selected.length === 0) {
      return;
    }

    setIsImporting(true);

    setStatus({
      message: `Importing ${selected.length} question${
        selected.length === 1
          ? ""
          : "s"
      }...`,
      isError: false,
    });

    const token =
      getToken();

    let successCount = 0;
    let failCount = 0;

    for (const line of selected) {
      try {
        const fd = new FormData();

        fd.append(
          "subjectID",
          selectedSubjectId
        );

        fd.append(
          "coverage_id",
          DEFAULT_COVERAGE_ID
        );

        fd.append(
          "questionText",
          line
        );

        fd.append(
          "score",
          1
        );

        fd.append(
          "difficulty_id",
          1
        );

        fd.append(
          "status_id",
          1
        );

        fd.append(
          "purpose_id",
          DEFAULT_PURPOSE_ID
        );

        const res = await fetch(
          `${apiUrl}/questions/add`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: fd,
          }
        );

        if (res.ok) {
          successCount += 1;
        } else {
          failCount += 1;

          const errorText =
            await res.text();

          console.error(
            "File import failed:",
            errorText
          );
        }
      } catch (err) {
        console.error(
          "Error importing line:",
          line,
          err
        );

        failCount += 1;
      }
    }

    setIsImporting(false);

    finishImport(successCount, failCount);
  };

  // =========================================================
  // FINISH IMPORT (shared by both import paths)
  // =========================================================

  const finishImport = (successCount, failCount) => {
    if (successCount > 0) {
      showToast(
        `${successCount} question${
          successCount === 1
            ? ""
            : "s"
        } imported${
          failCount
            ? `, ${failCount} failed`
            : ""
        }`,
        failCount
          ? "error"
          : "success"
      );

      const subject =
        subjects.find(
          (s) =>
            String(s.subjectID) ===
            String(selectedSubjectId)
        );

      if (subject) {
        localStorage.setItem(
          "selectedSubject",
          JSON.stringify(subject)
        );
      }

      const user = getUser() || {};

      const roleID =
        user?.roleID ??
        user?.roleId;

      let contentPath =
        "/dean/subjects/content";

      if (roleID === 2) {
        contentPath =
          "/faculty/subjects/content";
      } else if (roleID === 3) {
        contentPath =
          "/program-chair/subjects/content";
      } else if (roleID === 5) {
        contentPath =
          "/asso-dean/subjects/content";
      }

      navigate(
        `${contentPath}?subjectID=${selectedSubjectId}`,
        {
          state: {
            subject,
            initialTab: 4,
          },
        }
      );
    } else {
      setStatus({
        message:
          "Could not import any questions. Please try again.",
        isError: true,
      });
    }
  };

  // =========================================================
  // STRUCTURED IMPORT (question + choices, from DOCX/PDF/TXT/
  // image grouping or from a spreadsheet with choice columns)
  // =========================================================

  const handleImportQuestions = async (questionsToImport) => {
    const selected = questionsToImport.filter(
      (q) => q && q.questionText && q.questionText.trim()
    );

    if (selected.length === 0) {
      return;
    }

    setIsImporting(true);

    setStatus({
      message: `Importing ${selected.length} question${
        selected.length === 1 ? "" : "s"
      }...`,
      isError: false,
    });

    const token = getToken();

    let successCount = 0;
    let failCount = 0;

    for (const q of selected) {
      try {
        const qfd = new FormData();

        qfd.append("subjectID", selectedSubjectId);
        qfd.append("coverage_id", DEFAULT_COVERAGE_ID);
        qfd.append("questionText", q.questionText);
        qfd.append("score", 1);
        qfd.append("difficulty_id", q.difficulty_id || 1);
        qfd.append("status_id", 1);
        qfd.append("purpose_id", DEFAULT_PURPOSE_ID);

        // Attach the figure/circuit image (DOCX imports only) if one was
        // captured alongside this question by groupQuestionsFromTokens.
        if (q.image) {
          try {
            qfd.append(
              "image",
              dataUriToFile(q.image, `question-figure.png`)
            );
          } catch (imgErr) {
            console.error(
              "Could not attach question image, continuing without it:",
              imgErr
            );
          }
        }

        const qRes = await fetch(`${apiUrl}/questions/add`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
          body: qfd,
        });

        const qData = await qRes.json().catch(() => ({}));

        if (!qRes.ok || !qData?.data?.questionID) {
          failCount += 1;
          console.error("Question import failed:", qData);
          continue;
        }

        // Backend requires exactly 5 choices: the (up to) 4 parsed
        // choices, plus a fixed "None of the above" 5th choice —
        // matching the manual Add Question form's behavior.
        const normalizedChoices = [...(q.choices || [])]
          .slice(0, 4)
          .map((c) => ({
            choiceText: (c.choiceText || "").trim(),
            isCorrect: !!c.isCorrect,
          }));

        while (normalizedChoices.length < 4) {
          normalizedChoices.push({ choiceText: "", isCorrect: false });
        }

        normalizedChoices.push({
          choiceText: "None of the above",
          isCorrect: false,
        });

        const cfd = new FormData();
        cfd.append("questionID", qData.data.questionID);

        normalizedChoices.forEach((choice, index) => {
          cfd.append(`choices[${index}][choiceText]`, choice.choiceText);
          cfd.append(
            `choices[${index}][isCorrect]`,
            choice.isCorrect ? "1" : "0"
          );
        });

        const cRes = await fetch(`${apiUrl}/questions/choices`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
          body: cfd,
        });

        if (cRes.ok) {
          successCount += 1;
        } else {
          failCount += 1;
          const errorText = await cRes.text();
          console.error("Choices import failed:", errorText);
        }
      } catch (err) {
        console.error("Error importing question:", q, err);
        failCount += 1;
      }
    }

    setIsImporting(false);

    finishImport(successCount, failCount);
  };

  // =========================================================
  // SELECT / UNSELECT QUESTIONS
  // =========================================================

  const allSelected =
    sourceQuestions.length > 0 &&
    selectedQuestionIds.length ===
      sourceQuestions.length;

  const toggleQuestion = (id) => {
    setSelectedQuestionIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) => item !== id
            )
          : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedQuestionIds(
      allSelected
        ? []
        : sourceQuestions.map(
            (question) =>
              question.questionID
          )
    );
  };

  // =========================================================
  // DATABASE IMPORT - SELECTED QUESTIONS
  // =========================================================

  const handleDatabaseImport =
    async () => {
      if (!selectedSubjectId) {
        showToast(
          "Please select a destination subject.",
          "error"
        );

        return;
      }

      if (!sourceSubjectId) {
        showToast(
          "Please select a source subject.",
          "error"
        );

        return;
      }

      if (
        selectedQuestionIds.length ===
        0
      ) {
        showToast(
          "Please select at least one question.",
          "error"
        );

        return;
      }

      setIsDatabaseImporting(true);

      setStatus({
        message: `Importing ${selectedQuestionIds.length} selected question${
          selectedQuestionIds.length ===
          1
            ? ""
            : "s"
        }...`,
        isError: false,
      });

      try {
        const token =
          getToken();

        const response = await fetch(
          `${apiUrl}/database-import/questions`,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({
              sourceDatabaseID:
                selectedSourceDatabaseId,

              sourceSubjectID:
                sourceSubjectId,

              destinationSubjectID:
                selectedSubjectId,

              questionIDs:
                selectedQuestionIds,
            }),
          }
        );

        if (handleUnauthorized(response)) {
          setIsDatabaseImporting(false);
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Database import failed."
          );
        }

        const imported =
          Number(
            data.importedCount || 0
          );

        const failed =
          Number(
            data.failedCount || 0
          );

        if (imported <= 0) {
          throw new Error(
            "No questions were imported."
          );
        }

        showToast(
          `${imported} question${
            imported === 1
              ? ""
              : "s"
          } imported${
            failed
              ? `, ${failed} failed`
              : ""
          }`,
          failed
            ? "error"
            : "success"
        );

        const subject =
          subjects.find(
            (s) =>
              String(s.subjectID) ===
              String(
                selectedSubjectId
              )
          );

        if (subject) {
          localStorage.setItem(
            "selectedSubject",
            JSON.stringify(subject)
          );
        }

        const user = JSON.parse(
          sessionStorage.getItem(
            "user"
          ) || "{}"
        );

        const roleID =
          user?.roleID ??
          user?.roleId;

        let contentPath =
          "/dean/subjects/content";

        if (roleID === 2) {
          contentPath =
            "/faculty/subjects/content";
        } else if (roleID === 3) {
          contentPath =
            "/program-chair/subjects/content";
        } else if (roleID === 5) {
          contentPath =
            "/asso-dean/subjects/content";
        }

        navigate(
          `${contentPath}?subjectID=${selectedSubjectId}`,
          {
            state: {
              subject,
              initialTab: 4,
            },
          }
        );
      } catch (err) {
        console.error(
          "Database import error:",
          err
        );

        setStatus({
          message:
            err.message ||
            "Database import failed.",
          isError: true,
        });

        showToast(
          err.message ||
            "Database import failed.",
          "error"
        );
      } finally {
        setIsDatabaseImporting(
          false
        );
      }
    };

  // =========================================================
  // DATABASE SOURCE FORM
  // =========================================================

  const updateDatabaseForm = (
    field,
    value
  ) => {
    setDatabaseForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const testDatabaseConnection =
    async () => {
      if (!databaseForm.name.trim()) {
        showToast(
          "Please enter a database name.",
          "error"
        );
        return;
      }

      if (!databaseForm.host.trim()) {
        showToast(
          "Please enter the database host.",
          "error"
        );
        return;
      }

      if (!databaseForm.port.trim()) {
        showToast(
          "Please enter the database port.",
          "error"
        );
        return;
      }

      if (!databaseForm.database.trim()) {
        showToast(
          "Please enter the database name.",
          "error"
        );
        return;
      }

      if (!databaseForm.username.trim()) {
        showToast(
          "Please enter the database username.",
          "error"
        );
        return;
      }

      setIsTestingDatabase(true);

      try {
        const token =
          getToken();

        const response = await fetch(
          `${apiUrl}/database-sources`,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({
              ...databaseForm,
              port: Number(
                databaseForm.port
              ),
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          const firstError =
            data?.errors &&
            Object.values(
              data.errors
            )[0]?.[0];

          throw new Error(
            firstError ||
              data.message ||
              "Connection test failed."
          );
        }

        showToast(
          "Connection successful. The database source is ready to save.",
          "success"
        );
      } catch (err) {
        console.error(
          "Database connection test error:",
          err
        );

        showToast(
          err.message ||
            "Could not connect to the database.",
          "error"
        );
      } finally {
        setIsTestingDatabase(
          false
        );
      }
    };

  const saveDatabaseSource =
    async () => {
      if (!databaseForm.name.trim()) {
        showToast(
          "Please enter a database name.",
          "error"
        );
        return;
      }

      if (!databaseForm.host.trim()) {
        showToast(
          "Please enter the database host.",
          "error"
        );
        return;
      }

      if (!databaseForm.port.trim()) {
        showToast(
          "Please enter the database port.",
          "error"
        );
        return;
      }

      if (!databaseForm.database.trim()) {
        showToast(
          "Please enter the database name.",
          "error"
        );
        return;
      }

      if (!databaseForm.username.trim()) {
        showToast(
          "Please enter the database username.",
          "error"
        );
        return;
      }

      setIsSavingDatabase(true);

      try {
        const token =
          getToken();

        const response = await fetch(
          `${apiUrl}/database-sources`,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({
              ...databaseForm,
              port: Number(
                databaseForm.port
              ),
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          const firstError =
            data?.errors &&
            Object.values(
              data.errors
            )[0]?.[0];

          throw new Error(
            firstError ||
              data.message ||
              "Could not save the database source."
          );
        }

        const newSource =
          data.source ||
          data.data;

        if (!newSource?.id) {
          throw new Error(
            "Database was saved, but the server did not return the source ID."
          );
        }

        setDatabaseSources(
          (current) => {
            const withoutDuplicate =
              current.filter(
                (source) =>
                  String(
                    source.id
                  ) !==
                  String(
                    newSource.id
                  )
              );

            return [
              ...withoutDuplicate,
              newSource,
            ].sort((a, b) =>
              String(
                a.name || ""
              ).localeCompare(
                String(
                  b.name || ""
                )
              )
            );
          }
        );

        setSelectedSourceDatabaseId(
          String(newSource.id)
        );

        setSourceSubjectId("");
        setSourceQuestions([]);
        setSelectedQuestionIds([]);

        setDatabaseForm({
          name: "",
          driver: "mysql",
          host: "mysql",
          port: "3306",
          database: "",
          username: "root",
          password: "",
        });

        setShowAddDatabase(false);

        setStatus({
          message: `${newSource.name} database source added successfully.`,
          isError: false,
        });

        showToast(
          `${newSource.name} added successfully.`,
          "success"
        );
      } catch (err) {
        console.error(
          "Save database source error:",
          err
        );

        showToast(
          err.message ||
            "Could not save the database source.",
          "error"
        );
      } finally {
        setIsSavingDatabase(
          false
        );
      }
    };

  // =========================================================
  // SELECTED SOURCE DATABASE
  // =========================================================

  const selectedSourceDatabase =
    databaseSources.find(
      (source) =>
        String(source.id) ===
        String(
          selectedSourceDatabaseId
        )
    );

  // =========================================================
  // SELECTED SOURCE SUBJECT
  // =========================================================

  const selectedSourceSubject =
    sourceSubjects.find(
      (s) =>
        String(s.subjectID) ===
        String(sourceSubjectId)
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <div className="min-h-screen bg-[#fff1dc] px-6 py-8 dark:bg-[#11161d] sm:px-10 lg:px-14">
        <div className="mx-auto max-w-4xl">

          {/* HEADER */}
          <div className="mb-6">
            <div className="outfit-700 text-[26px] text-amber-950 dark:text-gray-100">
              Import questions
            </div>

            <div className="outfit-400 mt-1 text-[14px] text-gray-500 dark:text-gray-400">
              Bring in questions from Excel,
              Word, PDF, CSV, plain text, a
              photo, or the CAPS database.
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#171d25]">

            {/* =================================================
                DESTINATION SUBJECT
            ================================================= */}

            <div className="mb-5">
              <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                Import into{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              {isSubjectsLoading ? (
                <div className="outfit-400 text-[13px] text-gray-500">
                  Loading subjects...
                </div>
              ) : (
                <select
                  value={
                    selectedSubjectId
                  }
                  onChange={(e) =>
                    setSelectedSubjectId(
                      e.target.value
                    )
                  }
                  disabled={
                    isImporting ||
                    isDatabaseImporting
                  }
                  className="outfit-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                >
                  <option value="">
                    Select a subject...
                  </option>

                  {subjects.map((s) => (
                    <option
                      key={s.subjectID}
                      value={s.subjectID}
                    >
                      {s.subjectCode} -{" "}
                      {s.subjectName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* =================================================
                SOURCE TABS
            ================================================= */}

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-amber-50 p-1 dark:bg-gray-800">

              {/* FILE */}
              <button
                type="button"
                onClick={() => {
                  setSourceMode(
                    "file"
                  );

                  setStatus({
                    message: "",
                    isError: false,
                  });
                }}
                disabled={
                  isImporting ||
                  isDatabaseImporting
                }
                className={`outfit-700 rounded-lg px-4 py-2.5 text-sm transition ${
                  sourceMode === "file"
                    ? "bg-white text-orange-600 shadow-sm dark:bg-[#171d25]"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                <i className="bx bx-file mr-1" />
                From File
              </button>

              {/* DATABASE */}
              <button
                type="button"
                onClick={() => {
                  setSourceMode(
                    "database"
                  );

                  setStatus({
                    message: "",
                    isError: false,
                  });
                }}
                disabled={
                  isImporting ||
                  isDatabaseImporting
                }
                className={`outfit-700 rounded-lg px-4 py-2.5 text-sm transition ${
                  sourceMode ===
                  "database"
                    ? "bg-white text-orange-600 shadow-sm dark:bg-[#171d25]"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                <i className="bx bx-data mr-1" />
                From Database
              </button>
            </div>

            {/* =================================================
                FILE MODE
            ================================================= */}

            {sourceMode === "file" && (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(
                      true
                    );
                  }}
                  onDragLeave={() =>
                    setIsDragging(
                      false
                    )
                  }
                  onDrop={onDrop}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                    isDragging
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                      : "border-amber-300 bg-amber-50/40 hover:bg-amber-50 dark:border-gray-600 dark:bg-gray-800/40"
                  } ${
                    isParsing ||
                    isImporting
                      ? "pointer-events-none opacity-60"
                      : ""
                  }`}
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange-400 text-orange-500">
                    <i className="bx bx-cloud-upload text-[24px]" />
                  </div>

                  <div className="outfit-700 text-[15px] text-amber-950 dark:text-gray-100">
                    {isParsing
                      ? ocrProgress !==
                        null
                        ? `Reading image... ${ocrProgress}%`
                        : "Reading file..."
                      : isImporting
                      ? "Importing..."
                      : "Drag a file here, or click to browse"}
                  </div>

                  <div className="outfit-400 mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                    One question per
                    line works best.
                    Photos are read
                    automatically with
                    OCR.
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {SUPPORTED_FORMATS.map(
                      (fmt) => (
                        <span
                          key={fmt}
                          className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 shadow-sm dark:bg-gray-900 dark:text-gray-300"
                        >
                          {fmt}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv,.docx,.pdf,.txt,.jpg,.jpeg,.png,.webp,.bmp"
                  onChange={
                    onBrowseSelect
                  }
                />

                {fileName &&
                  (isParsing ||
                    isImporting) && (
                    <div className="outfit-400 mt-3 text-[11px] tracking-wide text-amber-800/80 uppercase dark:text-gray-400">
                      {fileName}
                    </div>
                  )}
              </>
            )}

            {/* =================================================
                DATABASE MODE
            ================================================= */}

            {sourceMode ===
              "database" && (
              <div className="space-y-4">

                {/* SOURCE DATABASE */}
                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500 dark:bg-orange-500/10">
                      <i className="bx bx-data text-2xl" />
                    </div>

                    <div className="min-w-0">
                      <div className="outfit-700 text-sm text-gray-800 dark:text-gray-100">
                        Source Database
                      </div>

                      <div className="outfit-400 text-xs text-gray-500 dark:text-gray-400">
                        Choose where the questions will be imported from.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                    {/* DATABASE SELECT */}
                    <select
                      value={
                        selectedSourceDatabaseId
                      }
                      onChange={(e) => {
                        setSelectedSourceDatabaseId(
                          e.target.value
                        );

                        setSourceSubjectId("");
                        setSourceQuestions([]);
                        setSelectedQuestionIds([]);

                        setStatus({
                          message: "",
                          isError: false,
                        });
                      }}
                      disabled={
                        isDatabaseSourcesLoading ||
                        isDatabaseImporting ||
                        isSavingDatabase
                      }
                      className="outfit-400 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                    >
                      <option value="">
                        {isDatabaseSourcesLoading
                          ? "Loading databases..."
                          : databaseSources.length === 0
                          ? "No database sources available"
                          : "Select a database..."}
                      </option>

                      {databaseSources.map(
                        (source) => (
                          <option
                            key={source.id}
                            value={source.id}
                          >
                            {source.name}
                          </option>
                        )
                      )}
                    </select>

                    {/* ADD DATABASE */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddDatabase(
                          true
                        )
                      }
                      disabled={
                        isDatabaseImporting ||
                        isSavingDatabase
                      }
                      className="outfit-700 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-sm text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-[#171d25] dark:text-orange-400 dark:hover:bg-gray-800"
                    >
                      <i className="bx bx-plus text-lg" />
                      Add Database
                    </button>
                  </div>

                  {selectedSourceDatabase && (
                    <div className="outfit-400 mt-2 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                      <i className="bx bx-server" />
                      {selectedSourceDatabase.driver ||
                        "mysql"}{" "}
                      •{" "}
                      {
                        selectedSourceDatabase.host
                      }
                      :
                      {
                        selectedSourceDatabase.port
                      }{" "}
                      •{" "}
                      {
                        selectedSourceDatabase.database
                      }
                    </div>
                  )}

                  {/* MANUAL IMPORT INFORMATION */}
                  {selectedSourceDatabase && (
                    <div className="mt-3 rounded-lg border border-orange-200 bg-white/70 px-3 py-2.5 text-xs leading-5 text-orange-800 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                      <i className="bx bx-info-circle mr-1" />
                      Select a subject that already exists in your Subjects page,
                      choose a source subject, select the questions you want,
                      then click <strong>Import Selected</strong>. Source subjects
                      are never added automatically.
                    </div>
                  )}
                </div>

                {/* SOURCE SUBJECT */}
                <div>
                  <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                    Source Subject{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      sourceSubjectId
                    }
                    onChange={(e) => {
                      setSourceSubjectId(
                        e.target.value
                      );

                      setSelectedQuestionIds(
                        []
                      );
                    }}
                    disabled={
                      isSourceSubjectsLoading ||
                      isDatabaseImporting}
                    className="outfit-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                  >
                    <option value="">
                      {isSourceSubjectsLoading
                        ? "Loading source subjects..."
                        : "Select a source subject..."}
                    </option>

                    {sourceSubjects.map(
                      (s) => (
                        <option
                          key={
                            s.subjectID
                          }
                          value={
                            s.subjectID
                          }
                        >
                          {s.subjectCode} -{" "}
                          {s.subjectName}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* QUESTIONS */}
                {sourceSubjectId && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">

                    {/* QUESTION HEADER */}
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                      <div>
                        <div className="outfit-700 text-sm text-gray-800 dark:text-gray-100">
                          {selectedSourceSubject?.subjectName ||
                            "Selected Subject"}
                        </div>

                        <div className="outfit-400 text-xs text-gray-500 dark:text-gray-400">
                          {isQuestionsLoading
                            ? "Loading..."
                            : `${sourceQuestions.length} question${
                                sourceQuestions.length ===
                                1
                                  ? ""
                                  : "s"
                              } found`}
                        </div>
                      </div>

                      {sourceQuestions.length >
                        0 && (
                        <button
                          type="button"
                          onClick={
                            toggleSelectAll
                          }
                          disabled={
                            isDatabaseImporting
                          }
                          className="outfit-700 rounded-lg border border-orange-300 px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                        >
                          {allSelected
                            ? "Unselect All"
                            : "Select All"}
                        </button>
                      )}
                    </div>

                    {/* LOADING */}
                    {isQuestionsLoading ? (
                      <div className="p-8 text-center text-sm text-gray-500">
                        <i className="bx bx-loader-alt mr-2 animate-spin text-xl text-orange-500" />
                        Loading questions...
                      </div>
                    ) : sourceQuestions.length ===
                      0 ? (
                      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No questions found for this subject.
                      </div>
                    ) : (
                      <div className="max-h-[560px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">

                        {sourceQuestions.map(
                          (
                            question,
                            index
                          ) => {
                            const selected =
                              selectedQuestionIds.includes(
                                question.questionID
                              );

                            return (
                              <div
                                key={
                                  question.questionID
                                }
                                onClick={() =>
                                  toggleQuestion(
                                    question.questionID
                                  )
                                }
                                className={`cursor-pointer p-4 transition ${
                                  selected
                                    ? "bg-orange-50 dark:bg-orange-500/10"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                }`}
                              >
                                <div className="flex gap-3">

                                  {/* CHECKBOX */}
                                  <input
                                    type="checkbox"
                                    checked={
                                      selected
                                    }
                                    onChange={() =>
                                      toggleQuestion(
                                        question.questionID
                                      )
                                    }
                                    onClick={(
                                      e
                                    ) =>
                                      e.stopPropagation()
                                    }
                                    className="mt-1 h-5 w-5 rounded text-orange-500 focus:ring-orange-500"
                                  />

                                  <div className="min-w-0 flex-1">

                                    {/* QUESTION LABEL */}
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                      <span className="outfit-700 text-xs text-orange-600">
                                        Question{" "}
                                        {index +
                                          1}
                                      </span>

                                      <span className="text-[11px] text-gray-400">
                                        ID:{" "}
                                        {
                                          question.questionID
                                        }
                                      </span>
                                    </div>

                                    {/* QUESTION TEXT */}
                                    <div className="outfit-500 whitespace-pre-wrap text-sm leading-6 text-gray-800 dark:text-gray-100">
                                      <span
                                        dangerouslySetInnerHTML={renderImportedHtml(
                                          question.questionText
                                        )}
                                      />
                                    </div>

                                    {/* CHOICES */}
                                    {Array.isArray(
                                      question.choices
                                    ) &&
                                      question
                                        .choices
                                        .length >
                                        0 && (
                                        <div className="mt-3 space-y-1.5">
                                          {question.choices.map(
                                            (
                                              choice
                                            ) => (
                                              <div
                                                key={
                                                  choice.choiceID
                                                }
                                                className={`rounded-lg border px-3 py-2 text-sm ${
                                                  choice.isCorrect
                                                    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
                                                    : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-300"
                                                }`}
                                              >
                                                <span className="mr-2 font-semibold">
                                                  {String.fromCharCode(
                                                    64 +
                                                      Number(
                                                        choice.position ||
                                                          0
                                                      )
                                                  )}
                                                  .
                                                </span>

                                                <span
                                                  dangerouslySetInnerHTML={renderImportedHtml(
                                                    choice.choiceText
                                                  )}
                                                />

                                                {choice.isCorrect && (
                                                  <span className="ml-2 text-xs font-semibold">
                                                    ✓ Correct
                                                  </span>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* IMPORT BUTTON */}
                    {sourceQuestions.length >
                      0 && (
                      <div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#171d25] sm:flex-row sm:items-center sm:justify-between">

                        <div className="outfit-400 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold text-orange-600">
                            {
                              selectedQuestionIds.length
                            }
                          </span>{" "}
                          selected
                        </div>

                        <button
                          type="button"
                          onClick={
                            handleDatabaseImport
                          }
                          disabled={
                            isDatabaseImporting ||
                            selectedQuestionIds.length ===
                              0 ||
                            !selectedSubjectId
                          }
                          className="outfit-700 rounded-xl bg-orange-500 px-5 py-2.5 text-sm text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDatabaseImporting ? (
                            <>
                              <i className="bx bx-loader-alt mr-1 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <i className="bx bx-import mr-1" />
                              Import Selected (
                              {
                                selectedQuestionIds.length
                              }
                              )
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                STATUS
            ================================================= */}

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
          </div>

          {/* =================================================
              CANCEL
          ================================================= */}

          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={() =>
                navigate(-1)
              }
              disabled={
                isImporting ||
                isParsing ||
                isDatabaseImporting
              }
              className="border-color outfit-400 cursor-pointer rounded-lg border px-4 py-2 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          ADD DATABASE MODAL
      ================================================= */}

      {showAddDatabase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddDatabase(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#171d25]">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <div>
                <div className="outfit-700 text-lg text-amber-950 dark:text-gray-100">
                  Add Database
                </div>

                <div className="outfit-400 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Add another question database as an import source.
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddDatabase(false)
                }
                disabled={
                  isSavingDatabase
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <i className="bx bx-x text-xl" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                  Database Name{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={
                    databaseForm.name
                  }
                  onChange={(e) =>
                    updateDatabaseForm(
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="e.g. MAGS"
                  disabled={
                    isSavingDatabase
                  }
                  className="outfit-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
                <div>
                  <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                    Host{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      databaseForm.host
                    }
                    onChange={(e) =>
                      updateDatabaseForm(
                        "host",
                        e.target.value
                      )
                    }
                    placeholder="127.0.0.1"
                    disabled={
                      isSavingDatabase}
                    className="outfit-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                    Port{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="number"
                    value={
                      databaseForm.port
                    }
                    onChange={(e) =>
                      updateDatabaseForm(
                        "port",
                        e.target.value
                      )
                    }
                    min="1"
                    max="65535"
                    disabled={
                      isSavingDatabase}
                    className="outfit-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                    Database{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      databaseForm.database
                    }
                    onChange={(e) =>
                      updateDatabaseForm(
                        "database",
                        e.target.value
                      )
                    }
                    placeholder="mags"
                    disabled={
                      isSavingDatabase}
                    className="outfit-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                    Username{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      databaseForm.username
                    }
                    onChange={(e) =>
                      updateDatabaseForm(
                        "username",
                        e.target.value
                      )
                    }
                    placeholder="root"
                    disabled={
                      isSavingDatabase}
                    className="outfit-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="outfit-700 mb-1.5 block text-[13px] text-amber-950 dark:text-gray-100">
                  Password
                </label>

                <input
                  type="password"
                  value={
                    databaseForm.password
                  }
                  onChange={(e) =>
                    updateDatabaseForm(
                      "password",
                      e.target.value
                    )
                  }
                  placeholder="Enter database password"
                  disabled={
                    isSavingDatabase
                  }
                  className="outfit-400 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161d] dark:text-gray-100"
                />
              </div>

              <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:bg-gray-800 dark:text-gray-300">
                <i className="bx bx-lock-alt mr-1" />
                Database credentials are handled by the backend and the password is stored encrypted.
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-700 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowAddDatabase(false)
                }
                disabled={
                  isSavingDatabase ||
                  isTestingDatabase
                }
                className="outfit-700 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  testDatabaseConnection
                }
                disabled={
                  isSavingDatabase ||
                  isTestingDatabase
                }
                className="outfit-700 rounded-xl border border-orange-300 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-50 dark:border-gray-600 dark:text-orange-400 dark:hover:bg-gray-800"
              >
                {isTestingDatabase ? (
                  <>
                    <i className="bx bx-loader-alt mr-1 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <i className="bx bx-plug mr-1" />
                    Test Connection
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={
                  saveDatabaseSource
                }
                disabled={
                  isSavingDatabase ||
                  isTestingDatabase
                }
                className="outfit-700 rounded-xl bg-orange-500 px-4 py-2.5 text-sm text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingDatabase ? (
                  <>
                    <i className="bx bx-loader-alt mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save mr-1" />
                    Save Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
      />
    </>
  );
};

export default ImportQuestions;