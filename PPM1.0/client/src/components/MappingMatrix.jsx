import React, { useState, useEffect } from 'react';

const MappingMatrix = ({ 
  parts = [], 
  targetParts = [], 
  mappings = [],
  onMappingChange 
}) => {
  const [matrix, setMatrix] = useState({});

  useEffect(() => {
    // 初始化映射矩阵
    const initialMatrix = {};
    parts.forEach(part => {
      initialMatrix[part._id] = {};
      targetParts.forEach(targetPart => {
        // 检查是否存在映射关系
        const existingMapping = mappings.find(m => 
          m.part_id === part._id && m.target_part_id === targetPart._id
        );
        initialMatrix[part._id][targetPart._id] = existingMapping ? {
          exists: true,
          match_strength: existingMapping.match_strength,
          status: existingMapping.status
        } : { exists: false };
      });
    });
    setMatrix(initialMatrix);
  }, [parts, targetParts, mappings]);

  const handleMappingToggle = (partId, targetPartId) => {
    const currentState = matrix[partId]?.[targetPartId];
    const newState = {
      ...matrix,
      [partId]: {
        ...matrix[partId],
        [targetPartId]: {
          exists: !currentState?.exists,
          match_strength: currentState?.exists ? undefined : 'medium',
          status: currentState?.exists ? undefined : 'active'
        }
      }
    };
    setMatrix(newState);
    
    if (onMappingChange) {
      onMappingChange(partId, targetPartId, !currentState?.exists);
    }
  };

  const handleStrengthChange = (partId, targetPartId, strength) => {
    const newState = {
      ...matrix,
      [partId]: {
        ...matrix[partId],
        [targetPartId]: {
          ...matrix[partId][targetPartId],
          match_strength: strength
        }
      }
    };
    setMatrix(newState);
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mapping-matrix">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50">Part / Target Part</th>
              {targetParts.map(targetPart => (
                <th key={targetPart._id} className="border p-2 bg-gray-50 text-center">
                  <div className="font-medium">{targetPart.target_part_id}</div>
                  <div className="text-xs text-gray-600">{targetPart.function_description}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part._id}>
                <td className="border p-2 bg-gray-50">
                  <div className="font-medium">{part.part_no}</div>
                  <div className="text-xs text-gray-600">{part.name}</div>
                </td>
                {targetParts.map(targetPart => {
                  const mapping = matrix[part._id]?.[targetPart._id];
                  return (
                    <td key={targetPart._id} className="border p-2 text-center">
                      {mapping?.exists ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleMappingToggle(part._id, targetPart._id)}
                            className="bg-red-500 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                          >
                            移除
                          </button>
                          <div>
                            <select
                              value={mapping.match_strength || 'medium'}
                              onChange={(e) => handleStrengthChange(part._id, targetPart._id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded ${getStrengthColor(mapping.match_strength)}`}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            mapping.status === 'active' ? 'bg-green-100 text-green-800' :
                            mapping.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {mapping.status || 'active'}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMappingToggle(part._id, targetPart._id)}
                          className="bg-blue-500 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                        >
                          添加映射
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">图例说明</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-100 border border-green-300 mr-2"></span>
            <span>High Match Strength</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-100 border border-yellow-300 mr-2"></span>
            <span>Medium Match Strength</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-100 border border-red-300 mr-2"></span>
            <span>Low Match Strength</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingMatrix;