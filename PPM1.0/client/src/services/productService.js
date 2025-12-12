import api from './api';

export const fetchProducts = async (params = {}) => {
  try {
    // Request all products without pagination limit for dropdowns
    const requestParams = {
      ...params,
      limit: params.limit || 1000 // Set high limit to get all products
    };
    
    const response = await api.get('/products', { params: requestParams });
    
    console.log('fetchProducts API response:', response.data);
    
    // Handle both paginated and non-paginated responses
    if (response.data.products) {
      console.log('Returning response.data.products:', response.data.products.length, 'items');
      return response.data.products;
    } else if (response.data.data) {
      console.log('Returning response.data.data:', response.data.data.length, 'items');
      return response.data.data;
    }
    console.log('Returning response.data directly');
    return response.data;
  } catch (error) {
    console.error('fetchProducts error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch products');
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch product');
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create product');
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update product');
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete product');
  }
};

export const importProducts = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/import/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to import products');
  }
};