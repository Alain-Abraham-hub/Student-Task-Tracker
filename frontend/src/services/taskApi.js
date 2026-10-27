const API_BASE = '/api/tasks';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function fetchTasks(filters = {}) {
  const params = new URLSearchParams();
  if (filters.subject && filters.subject !== 'All') params.set('subject', filters.subject);
  if (filters.priority && filters.priority !== 'All') params.set('priority', filters.priority);
  if (filters.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());

  const queryString = params.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return handleResponse(res);
}

export async function createTask(taskData) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  return handleResponse(res);
}

export async function updateTask(id, taskData) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  return handleResponse(res);
}

export async function updateTaskStatus(id, status) {
  const res = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return handleResponse(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(res);
}

