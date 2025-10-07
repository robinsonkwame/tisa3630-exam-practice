import React from 'react';

function CategoryAccuracyChart({ answeredCards, categories }) {
  // Calculate accuracy per category
  const calculateCategoryAccuracy = () => {
    const categoryStats = {};
    
    // Initialize all categories
    categories.forEach(category => {
      categoryStats[category] = {
        correct: 0,
        total: 0,
        accuracy: 0
      };
    });
    
    // Count answers per category
    answeredCards.forEach(card => {
      if (categoryStats[card.category]) {
        categoryStats[card.category].total += 1;
        if (card.isCorrect) {
          categoryStats[card.category].correct += 1;
        }
      }
    });
    
    // Calculate accuracy percentages
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    });
    
    return categoryStats;
  };

  const categoryStats = calculateCategoryAccuracy();
  
  // Get short category names for display
  const getShortName = (category) => {
    const shortNames = {
      'Business Management Systems': 'BMS',
      'Computer Hardware': 'Hardware', 
      'Computing Networks': 'Networks',
      'Competitive Advantage': 'Advantage',
      'Data Analytics': 'Analytics',
      'MIS': 'MIS',
      'Database': 'Database',
      'Computer Software': 'Software'
    };
    return shortNames[category] || category.split(' ')[0];
  };

  // Sort categories by accuracy (highest first), then by total questions answered
  const sortedCategories = categories.sort((a, b) => {
    const statsA = categoryStats[a];
    const statsB = categoryStats[b];
    
    // First sort by accuracy (descending)
    if (statsA.accuracy !== statsB.accuracy) {
      return statsB.accuracy - statsA.accuracy;
    }
    
    // Then by total answered (descending)
    return statsB.total - statsA.total;
  });

  return (
    <div className="flex-1 md:w-64 lg:w-80 h-20 md:h-24 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white font-bold text-xs md:text-sm">Category Accuracy</span>
        <span className="text-white text-xs opacity-75">
          {answeredCards.length > 0 ? `${answeredCards.length} answered` : 'No data'}
        </span>
      </div>
      
      {answeredCards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-white text-xs opacity-75">Start answering to see stats</span>
        </div>
      ) : (
        <div className="flex-1 flex items-end gap-1 overflow-hidden">
          {sortedCategories.map((category, index) => {
            const stats = categoryStats[category];
            const shortName = getShortName(category);
            const maxHeight = 32; // Maximum bar height in pixels
            const barHeight = Math.max(2, (stats.accuracy / 100) * maxHeight);
            
            // Color based on accuracy
            let barColor = 'rgba(156, 163, 175, 0.6)'; // Gray for no data
            if (stats.total > 0) {
              if (stats.accuracy >= 80) {
                barColor = 'rgba(34, 197, 94, 0.8)'; // Green for high accuracy
              } else if (stats.accuracy >= 60) {
                barColor = 'rgba(251, 191, 36, 0.8)'; // Yellow for medium accuracy  
              } else {
                barColor = 'rgba(239, 68, 68, 0.8)'; // Red for low accuracy
              }
            }
            
            return (
              <div 
                key={category}
                className="flex-1 flex flex-col items-center justify-end group relative"
                title={`${category}: ${stats.accuracy}% (${stats.correct}/${stats.total})`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-50">
                  <div className="bg-black/90 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                    <div className="font-semibold">{shortName}</div>
                    <div>{stats.accuracy}% ({stats.correct}/{stats.total})</div>
                  </div>
                </div>
                
                {/* Bar */}
                <div
                  className="w-full rounded-t transition-all duration-300 hover:opacity-90"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: barColor,
                    minHeight: stats.total > 0 ? '2px' : '1px'
                  }}
                />
                
                {/* Category label */}
                <div className="text-white text-xs mt-1 text-center leading-tight">
                  <div className="truncate" style={{ fontSize: '10px' }}>
                    {shortName}
                  </div>
                  {stats.total > 0 && (
                    <div className="font-bold" style={{ fontSize: '9px' }}>
                      {stats.accuracy}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoryAccuracyChart;