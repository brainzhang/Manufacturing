import React, { useState, useEffect } from 'react';
import { fetchParts } from '../services/partService';

const PartForm = ({ part, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    part_no: '',
    quantity: 1,
    position: 'Top Side',
    product_id: '',
    product_name: '',
    spec: '',
    vendor: '',
    category: '',
    version: '',
    product_line: '',
    status: 'active'
  });
  const [suggestedNames, setSuggestedNames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([
    'CPU', 'Memory', 'Storage', 'Motherboard', 'GPU', 'Power Supply', 'Case', 'Cooling', 
    'Display', 'Keyboard', 'Mouse', 'Battery', 'Adapter', 'Cable', 'Other'
  ]);
  const [availableVendors, setAvailableVendors] = useState([
    'Intel', 'AMD', 'Corsair', 'Kingston', 'Samsung', 'Western Digital', 'Seagate',
    'ASUS', 'Gigabyte', 'MSI', 'NVIDIA', 'Cooler Master', 'Thermaltake', 'Lenovo',
    'Dell', 'HP', 'Other'
  ]);

  useEffect(() => {
    if (part) {
      setFormData({
        name: part.name || '',
        quantity: part.quantity || 1,
        position: part.position || 'Top Side',
        product_id: part.product_id || '',
        product_name: part.product_name || '',
        spec: part.spec || '',
        vendor: part.vendor || '',
        category: part.category || '',
        version: part.version || '',
        product_line: part.product_line || '',
        status: part.status || 'active'
      });
    }
  }, [part]);

  // 动态获取数据库中已有的Category和Vendor值
  useEffect(() => {
    const loadAvailableValues = async () => {
      try {
        const partsData = await fetchParts();
        
        // 确保parts是数组格式
        const parts = Array.isArray(partsData) ? partsData : 
                     partsData.parts ? partsData.parts : 
                     partsData.data ? partsData.data : [];
        
        console.log('Loaded parts for available values:', parts.length);
        
        // 获取所有唯一的Category值
        const uniqueCategories = [...new Set(parts.map(p => p.category).filter(Boolean))];
        if (uniqueCategories.length > 0) {
          setAvailableCategories(prev => {
            const combined = [...new Set([...prev, ...uniqueCategories])];
            return combined.sort();
          });
        }
        
        // 获取所有唯一的Vendor值
        const uniqueVendors = [...new Set(parts.map(p => p.vendor).filter(Boolean))];
        if (uniqueVendors.length > 0) {
          setAvailableVendors(prev => {
            const combined = [...new Set([...prev, ...uniqueVendors])];
            return combined.sort();
          });
        }
      } catch (error) {
        console.error('Failed to load available values:', error);
        // 即使加载失败，也使用默认值继续显示表单
        console.log('Using default categories and vendors');
      }
    };

    loadAvailableValues();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="part-form bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{part ? 'Edit Part' : 'Add New Part'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Part Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="position">
              Position
            </label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="Top Side">Top Side</option>
              <option value="Bottom Side">Bottom Side</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_id">
              Product ID
            </label>
            <input
              type="text"
              id="product_id"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_name">
              Product Name
            </label>
            <input
              type="text"
              id="product_name"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spec">
              Specification
            </label>
            <textarea
              id="spec"
              name="spec"
              value={formData.spec}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vendor">
              Vendor
            </label>
            <select
              id="vendor"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select Vendor</option>
              {availableVendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select Category</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="version">
              Version
            </label>
            <input
              type="text"
              id="version"
              name="version"
              value={formData.version}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_line">
              Product Line
            </label>
            <input
              type="text"
              id="product_line"
              name="product_line"
              value={formData.product_line}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discarded">Discarded</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartForm;