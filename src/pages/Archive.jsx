import React, { useState } from "react";
import { RefreshCw, Trash2, Archive } from "lucide-react";

const ArchivePage = () => {
  // Demo state para sa gipang-delete nga subjects
  const [archivedSubjects, setArchivedSubjects] = useState([
    { id: 1, code: "CS101", name: "Introduction to Computing", deletedAt: "2026-08-20" },
    { id: 2, code: "ENG202", name: "Differential Equations", deletedAt: "2026-08-19" },
  ]);

  // Handler para i-retrieve / restore ang subject
  const handleRestore = (subject) => {
    setArchivedSubjects((prev) => prev.filter((item) => item.id !== subject.id));
    alert(`"${subject.name}" has been retrieved successfully!`);
  };

  // Handler para i-permanently delete
  const handlePermanentDelete = (id) => {
    if (window.confirm("Are you sure you want to permanently delete this subject? This cannot be undone.")) {
      setArchivedSubjects((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <Archive className="w-7 h-7 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Archived Subjects</h1>
          <p className="text-sm text-gray-500">Manage soft-deleted subjects, retrieve them, or remove them permanently.</p>
        </div>
      </div>

      {/* Table / Empty State */}
      {archivedSubjects.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No archived subjects found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm font-semibold border-b">
                <th className="p-4">Subject Code</th>
                <th className="p-4">Subject Name</th>
                <th className="p-4">Deleted On</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {archivedSubjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold text-gray-700">{subject.code}</td>
                  <td className="p-4 text-gray-600">{subject.name}</td>
                  <td className="p-4 text-gray-400">{subject.deletedAt}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      {/* Retrieve Button */}
                      <button
                        onClick={() => handleRestore(subject)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-medium transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retrieve
                      </button>

                      {/* Permanent Delete Button */}
                      <button
                        onClick={() => handlePermanentDelete(subject.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Permanently
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;