import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AlignmentChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow">No alignment data available</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Alignment Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="aligned" fill="#8884d8" name="Aligned Parts" />
          <Bar dataKey="misaligned" fill="#82ca9d" name="Misaligned Parts" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AlignmentChart;