// ============================================================
// REFRESH SUBJECTS WHEN MODAL OPENS
// ============================================================
useEffect(() => {
  if (!isOpen) return;

  const refreshExamGeneratorData = async () => {
    try {
      await Promise.all([
        fetchSubjects(),
        fetchDifficultyCounts(),
      ]);
    } catch (error) {
      console.error("Failed to refresh exam generator data:", error);
    }
  };

  refreshExamGeneratorData();
}, [isOpen]);


// ============================================================
// REFRESH WHEN SUBJECT IS CREATED / UPDATED
// ============================================================
useEffect(() => {
  const handleSubjectsRefresh = async () => {
    if (!isOpen) return;

    try {
      await Promise.all([
        fetchSubjects(),
        fetchDifficultyCounts(),
      ]);
    } catch (error) {
      console.error("Failed to refresh subjects:", error);
    }
  };

  window.addEventListener(
    "refreshSubjectsList",
    handleSubjectsRefresh
  );

  return () => {
    window.removeEventListener(
      "refreshSubjectsList",
      handleSubjectsRefresh
    );
  };
}, [isOpen]);