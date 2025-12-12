import React, { useState, useEffect } from 'react';

const PNMapForm = ({ pnMap, onSave, onCancel }) => {
  const [parts, setParts] = useState([]);
  const [targetParts, setTargetParts] = useState([]);
  const [formData, setFormData] = useState({
    part_id: '',
    target_part_id: '',
    target_pn: '',
    match_strength: 'medium',
    source: 'manual',
    status: 'active'
  });

  useEffect(() => {
    // 加载零件和目标零件列表
    const loadData = async () => {
      try {
        // 这里需要调用API获取零件和目标零件列表
        // 暂时使用模拟数据
        setParts([{ _id: '1', part_id: 'P001', name: '电阻' }]);
        setTargetParts([{ _id: '1', target_part_id: 'TP001', function_description: '显示器模块' }]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (pnMap) {
      setFormData({
        part_id: pnMap.part_id || '',
        target_part_id: pnMap.target_part_id || '',
        target_pn: pnMap.target_pn || '',
        match_strength: pnMap.match_strength || 'medium',
        source: pnMap.source || 'manual',
        status: pnMap.status || 'active'
      });
    }
  }, [pnMap]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="pn-map-form bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">{pnMap ? 'Edit PN Mapping' : 'Create New PN Mapping'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="part_id">
            Part
          </label>
          <select
            id="part_id"
            name="part_id"
            value={formData.part_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">选择零件</option>
            {parts.map(part => (
              <option key={part._id} value={part._id}>
                {part.part_no} - {part.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="target_part_id">
            Target Part
          </label>
          <select
            id="target_part_id"
            name="target_part_id"
            value={formData.target_part_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">选择目标零件</option>
            {targetParts.map(targetPart => (
              <option key={targetPart._id} value={targetPart._id}>
                {targetPart.target_part_id} - {targetPart.function_description}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="target_pn">
            Target PN
          </label>
          <input
            type="text"
            id="target_pn"
            name="target_pn"
            value={formData.target_pn}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="match_strength">
            Match Strength
          </label>
          <select
            id="match_strength"
            name="match_strength"
            value={formData.match_strength}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="source">
            Source
          </label>
          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="manual">Manual</option>
            <option value="auto_generated">Auto Generated</option>
            <option value="imported">Imported</option>
          </select>
        </div>
        
        <div className="mb-4">
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
            <option value="pending_review">Pending Review</option>
          </select>
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
            Save Mapping
          </button>
        </div>
      </form>
    </div>
  );
};

export default PNMapForm;