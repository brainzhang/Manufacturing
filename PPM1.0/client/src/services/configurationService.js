import api from './api';

export const generateConfigurations = async (productId, targetPartIds, criteria = {}) => {
  try {
    const response = await api.post('/configurations/generate', {
      product_id: productId,
      target_part_ids: targetPartIds,
      criteria
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to generate configurations');
  }
};

export const getConfigurationReport = async (productId, targetPartIds) => {
  try {
    const response = await api.post('/configurations/report', {
      product_id: productId,
      target_part_ids: targetPartIds
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to get configuration report');
  }
};

export const validateConfiguration = async (configuration) => {
  try {
    const response = await api.post('/configurations/validate', configuration);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to validate configuration');
  }
};