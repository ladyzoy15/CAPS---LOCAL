const apiUrl = import.meta.env.VITE_API_BASE_URL;

function getHeaders() {
  const token = sessionStorage.getItem("token");

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse(response) {
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`,
    );
  }

  return data;
}

export async function getArchivedSubjects() {
  const response = await fetch(`${apiUrl}/subjects/archived`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  return parseResponse(response);
}

export async function restoreSubject(subjectID) {
  const response = await fetch(
    `${apiUrl}/subjects/${subjectID}/restore`,
    {
      method: "PATCH",
      headers: getHeaders(),
      credentials: "include",
    },
  );

  return parseResponse(response);
}

export async function permanentlyDeleteSubject(subjectID) {
  const response = await fetch(
    `${apiUrl}/subjects/${subjectID}/delete`,
    {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "include",
    },
  );

  return parseResponse(response);
}