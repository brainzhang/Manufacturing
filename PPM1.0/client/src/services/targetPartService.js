import api from './api';

export const fetchTargetParts = async (params = {}) => {
  try {
    const response = await api.get('/target-parts', { params });
    // Handle both paginated and non-paginated responses
    if (response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch target parts');
  }
};

export const fetchTargetPartById = async (id) => {
  try {
    const response = await api.get(`/target-parts/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch target part');
  }
};

export const createTargetPart = async (targetPartData) => {
  try {
    const response = await api.post('/target-parts', targetPartData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create target part');
  }
};

export const updateTargetPart = async (id, targetPartData) => {
  try {
    const response = await api.put(`/target-parts/${id}`, targetPartData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update target part');
  }
};

export const deleteTargetPart = async (id) => {
  try {
    const response = await api.delete(`/target-parts/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete target part');
  }
};

export const importTargetParts = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/import/target-parts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to import target parts');
  }
};