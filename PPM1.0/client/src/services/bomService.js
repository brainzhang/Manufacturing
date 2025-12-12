import api from './api';

export const fetchBOMs = async (params = {}) => {
  try {
    const response = await api.get('/boms', { params });
    // Handle both paginated and non-paginated responses
    if (response.data.boms) {
      return response.data.boms;
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch BOMs');
  }
};

export const fetchBOMById = async (id) => {
  try {
    const response = await api.get(`/boms/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch BOM');
  }
};

export const createBOM = async (bomData) => {
  try {
    const response = await api.post('/boms', bomData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create BOM');
  }
};

export const updateBOM = async (id, bomData) => {
  try {
    const response = await api.put(`/boms/${id}`, bomData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update BOM');
  }
};

export const deleteBOM = async (id) => {
  try {
    const response = await api.delete(`/boms/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete BOM');
  }
};

export const deleteBOMs = async (bomIds) => {
  try {
    const response = await api.delete('/boms', { data: { bomIds } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete BOMs');
  }
};

export const performAlignment = async (bomId, alignmentData) => {
  try {
    const response = await api.post(`/boms/${bomId}/align`, alignmentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to perform alignment');
  }
};

export const importBOMs = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/import/boms', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to import BOMs');
  }
};

export const fetchParts = async () => {
  try {
    const response = await api.get('/parts');
    return response.data.parts || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch parts');
  }
};

export const fetchProducts = async () => {
  try {
    const response = await api.get('/products');
    return response.data.products || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch products');
  }
};