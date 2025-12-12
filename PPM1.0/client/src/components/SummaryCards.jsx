import React from 'react';

const SummaryCards = ({ data }) => {
  if (!data) {
    return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"></div>;
  }

  const cards = [
    { title: 'Total Parts', value: data.totalParts || 0, icon: '📦' },
    { title: 'Active BOMs', value: data.activeBoms || 0, icon: '📋' },
    { title: 'Alignments', value: data.alignments || 0, icon: '🔄' },
    { title: 'Users', value: data.users || 0, icon: '👥' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">{card.icon}</div>
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;