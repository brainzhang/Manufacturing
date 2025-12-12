import React from 'react';

const PNMapList = ({ pnMaps, onEdit, onDelete }) => {
  return (
    <div className="pn-map-list">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">Part ID</th>
            <th className="py-2 px-4 border-b text-left">Part Name</th>
            <th className="py-2 px-4 border-b text-left">Target Part</th>
            <th className="py-2 px-4 border-b text-left">Target PN</th>
            <th className="py-2 px-4 border-b text-left">Match Strength</th>
            <th className="py-2 px-4 border-b text-left">Source</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
            <th className="py-2 px-4 border-b text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pnMaps.map((pnMap) => (
            <tr key={pnMap._id}>
              <td className="py-2 px-4 border-b">{pnMap.part_id?.part_id || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{pnMap.part_id?.name || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{pnMap.target_part_id?.target_part_id || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{pnMap.target_pn}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded text-xs ${
                  pnMap.match_strength === 'high' ? 'bg-green-100 text-green-800' :
                  pnMap.match_strength === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {pnMap.match_strength}
                </span>
              </td>
              <td className="py-2 px-4 border-b">{pnMap.source}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded text-xs ${
                  pnMap.status === 'active' ? 'bg-green-100 text-green-800' :
                  pnMap.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {pnMap.status}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => onEdit(pnMap)}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2 text-sm"
                >
                  编辑
                </button>
                <button
                  onClick={() => onDelete(pnMap._id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PNMapList;