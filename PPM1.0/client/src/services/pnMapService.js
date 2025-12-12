import api from './api';

export const fetchPNMaps = async (params = {}) => {
  try {
    const response = await api.get('/pn-maps', { params });
    // Handle both paginated and non-paginated responses
    if (response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch PN maps');
  }
};

export const fetchPNMapById = async (id) => {
  try {
    const response = await api.get(`/pn-maps/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch PN map');
  }
};

export const createPNMap = async (pnMapData) => {
  try {
    const response = await api.post('/pn-maps', pnMapData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create PN map');
  }
};

export const updatePNMap = async (id, pnMapData) => {
  try {
    const response = await api.put(`/pn-maps/${id}`, pnMapData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update PN map');
  }
};

export const deletePNMap = async (id) => {
  try {
    const response = await api.delete(`/pn-maps/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete PN map');
  }
};

export const importPNMaps = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/import/pn-maps', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to import PN maps');
  }
};