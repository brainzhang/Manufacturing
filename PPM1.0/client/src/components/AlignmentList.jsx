import React from 'react';

const AlignmentList = ({ alignments }) => {
  return (
    <div className="alignment-list">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">ID</th>
            <th className="py-2 px-4 border-b text-left">BOM ID</th>
            <th className="py-2 px-4 border-b text-left">PN Map ID</th>
            <th className="py-2 px-4 border-b text-left">Target PN</th>
            <th className="py-2 px-4 border-b text-left">Priority</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
            <th className="py-2 px-4 border-b text-left">Created At</th>
          </tr>
        </thead>
        <tbody>
          {alignments.map((alignment) => (
            <tr key={alignment._id}>
              <td className="py-2 px-4 border-b">{alignment._id}</td>
              <td className="py-2 px-4 border-b">{alignment.bom_id?.model || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{alignment.pn_id?.target_pn || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{alignment.target_pn}</td>
              <td className="py-2 px-4 border-b">{alignment.priority}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  alignment.status === 'completed' ? 'bg-green-200 text-green-800' : 
                  alignment.status === 'failed' ? 'bg-red-200 text-red-800' : 
                  alignment.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
                  'bg-yellow-200 text-yellow-800'
                }`}>
                  {alignment.status}
                </span>
              </td>
              <td className="py-2 px-4 border-b">{new Date(alignment.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlignmentList;