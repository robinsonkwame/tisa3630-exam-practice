import React, { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import quizDataFile from '../../data/test_mock_exam.json';
import CategoryAccuracyChart from './CategoryAccuracyChart';

function GameLayout() {
  // Quiz state from QuizCarousel
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredCards, setAnsweredCards] = useState([]);
  const [selectedChoices, setSelectedChoices] = useState([]);
  const swiperRef = useRef(null);
  
  // Resizable card state
  const [cardSize, setCardSize] = useState({ width: 320, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  
  // Use questions from the imported JSON file
  const quizData = quizDataFile.questions || [];
  const categories = quizDataFile.metadata?.categories || [];
  
  // Early return if no quiz data
  if (!quizData || quizData.length === 0) {
    return (
      <div className="relative z-10 w-full h-screen p-2 md:p-4 flex items-center justify-center">
        <div className="text-white text-xl">Loading quiz data...</div>
      </div>
    );
  }
  
  const toggleChoice = (index) => {
    if (!quizData || currentIndex >= quizData.length) return;
    const currentCard = quizData[currentIndex];
    if (!currentCard) return;
    
    if (currentCard.answer_type === 'single') {
      // For single choice questions, only allow one selection
      setSelectedChoices([index]);
    } else {
      // For multiple choice questions, allow multiple selections
      setSelectedChoices(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    }
  };
  
  const submitAnswer = () => {
    if (!quizData || currentIndex >= quizData.length) return;
    const currentCard = quizData[currentIndex];
    if (!currentCard) return;
    
    // Check if answer is correct based on question type
    let isCorrect = false;
    if (currentCard.answer_type === 'single') {
      // For single choice, check if the selected choice matches the correct answer
      isCorrect = selectedChoices.length === 1 && 
                  selectedChoices[0] === currentCard.correct_answers[0];
    } else if (currentCard.answer_type === 'multiple') {
      // For multiple choice, check if all selected choices match correct answers
      const sortedSelected = [...selectedChoices].sort();
      const sortedCorrect = [...currentCard.correct_answers].sort();
      isCorrect = sortedSelected.length === sortedCorrect.length &&
                  sortedSelected.every((val, idx) => val === sortedCorrect[idx]);
    }
    
    const answeredCard = {
      ...currentCard,
      selectedChoices: [...selectedChoices],
      isCorrect,
      index: currentIndex
    };

    // Add flying card animation before state update
    const createFlyingCard = () => {
      const mainCard = document.querySelector('.swiper-slide-active');
      const completedStack = document.querySelector('.completed-questions-scroll');
      
      if (mainCard && completedStack) {
        const flyingCard = document.createElement('div');
        flyingCard.className = 'flying-card-mini';
        flyingCard.innerHTML = `
          <div class="p-1 text-white text-xs font-semibold">
            ${currentCard.category.split(' ')[0]}
          </div>
        `;
        
        const mainRect = mainCard.getBoundingClientRect();
        const stackRect = completedStack.getBoundingClientRect();
        
        flyingCard.style.cssText = `
          position: fixed;
          left: ${mainRect.left + mainRect.width/2 - 25}px;
          top: ${mainRect.top + mainRect.height/2 - 32}px;
          width: 50px;
          height: 64px;
          background: ${isCorrect ? 
            'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.7))' : 
            'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.7))'}
          border-radius: 8px;
          border: 2px solid ${isCorrect ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
          z-index: 1000;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(flyingCard);
        
        // Animate to completed stack
        requestAnimationFrame(() => {
          flyingCard.style.left = stackRect.right - 30 + 'px';
          flyingCard.style.top = stackRect.top + 20 + 'px';
          flyingCard.style.transform = 'scale(0.8) rotateZ(15deg)';
          flyingCard.style.opacity = '0.8';
        });
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(flyingCard);
        }, 800);
      }
    };
    
    // Trigger flying card animation
    createFlyingCard();
    
    // Check if this is a reanswer before updating state
    const wasAlreadyAnswered = answeredCards.some(card => card.index === currentIndex);
    
    // Update state after a short delay
    setTimeout(() => {
      setAnsweredCards(prev => {
        // Check if this question was already answered
        const existingCardIndex = prev.findIndex(card => card.index === currentIndex);
        
        if (existingCardIndex >= 0) {
          // Replace the existing answer
          const updatedCards = [...prev];
          updatedCards[existingCardIndex] = answeredCard;
          return updatedCards;
        } else {
          // Add new answer
          return [...prev, answeredCard];
        }
      });
      setSelectedChoices([]);
      
      // Find next unanswered question or advance to next if at current position
      let nextIndex = currentIndex + 1;
      
      // If we're answering in sequence, just go to next
      if (currentIndex === Math.max(...answeredCards.map(c => c.index), -1)) {
        if (nextIndex < quizData.length) {
          setCurrentIndex(nextIndex);
          setTimeout(() => {
            if (swiperRef.current && swiperRef.current.slideNext) {
              swiperRef.current.slideNext();
            }
          }, 100);
        }
      } else {
        // If we're reanswering an older question, find the next unanswered question
        const answeredIndices = new Set(answeredCards.map(c => c.index));
        answeredIndices.add(currentIndex); // Add current since we just answered it
        
        // Find next unanswered question
        for (let i = 0; i < quizData.length; i++) {
          if (!answeredIndices.has(i)) {
            setCurrentIndex(i);
            setTimeout(() => {
              if (swiperRef.current) {
                swiperRef.current.slideTo(i, 500);
              }
            }, 100);
            break;
          }
        }
      }
    }, 200);
  };
  
  const goToCard = (index) => {
    const card = answeredCards.find(c => c.index === index);
    if (card) {
      setSelectedChoices(card.selectedChoices || []);
    } else {
      setSelectedChoices([]);
    }
    setCurrentIndex(index);
    if (swiperRef.current) {
      swiperRef.current.slideTo(index, 500);
    }
  };
  
  // Auto-scroll completed questions to bottom when new items are added
  useEffect(() => {
    if (answeredCards.length > 0) {
      const scrollContainer = document.querySelector('.completed-questions-scroll');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [answeredCards.length]);
  
  // Resize handling
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX || (e.touches && e.touches[0].clientX);
    const startY = e.clientY || (e.touches && e.touches[0].clientY);
    const startWidth = cardSize.width;
    const startHeight = cardSize.height;
    
    const handleResize = (e) => {
      const currentX = e.clientX || (e.touches && e.touches[0].clientX);
      const currentY = e.clientY || (e.touches && e.touches[0].clientY);
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      if (direction.includes('right')) {
        newWidth = Math.max(280, Math.min(800, startWidth + (currentX - startX)));
      }
      if (direction.includes('left')) {
        newWidth = Math.max(280, Math.min(800, startWidth - (currentX - startX)));
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(400, Math.min(700, startHeight + (currentY - startY)));
      }
      if (direction.includes('top')) {
        newHeight = Math.max(400, Math.min(700, startHeight - (currentY - startY)));
      }
      
      setCardSize({ width: newWidth, height: newHeight });
    };
    
    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResize);
      document.removeEventListener('touchend', handleResizeEnd);
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchmove', handleResize);
    document.addEventListener('touchend', handleResizeEnd);
  };
  
  return (
    <div className="relative z-10 w-full h-screen p-2 md:p-4">
        {/* Top bar container - Category Accuracy Chart only */}
        <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 w-11/12 flex flex-row gap-2 items-center justify-center">
          {/* Category Accuracy Bar Chart */}
          <CategoryAccuracyChart 
            answeredCards={answeredCards}
            categories={categories}
          />
        </div>

        {/* C3 Swiper Stack Left - Desktop: Left, Mobile: Top Left */}
        <div 
          className="absolute left-4 md:left-8 top-36 md:top-1/2 md:translate-x-0 md:-translate-y-1/2 w-40 md:w-44 h-52 md:h-60 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center transition-all duration-300 hover:z-50 hover:scale-105 hover:shadow-2xl group cursor-pointer active:scale-110 md:active:scale-105 z-0"
          onMouseEnter={(e) => {
            e.currentTarget.style.zIndex = '100';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.zIndex = '0';
          }}
          onTouchStart={(e) => {
            // Mobile: expand on tap
            e.currentTarget.style.zIndex = '100';
            e.currentTarget.style.transform = 'scale(1.1) translateY(-10px)';
          }}
          onTouchEnd={(e) => {
            // Mobile: return to normal after tap
            setTimeout(() => {
              e.currentTarget.style.zIndex = '0';
              e.currentTarget.style.transform = '';
            }, 2000);
          }}
        >
          <span className="text-white font-bold text-center text-sm mb-3">Upcoming<br/>Questions</span>
          
          {/* Horizontal scrollable container */}
          <div className="relative w-full px-2">
            <div 
              className="upcoming-scroll flex gap-2 overflow-x-auto pb-2 scroll-smooth"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.3) transparent'
              }}
              onMouseMove={(e) => {
                const container = e.currentTarget;
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const scrollWidth = container.scrollWidth - container.clientWidth;
                
                if (scrollWidth > 0) {
                  const scrollPosition = (x / rect.width) * scrollWidth;
                  container.scrollLeft = scrollPosition;
                }
              }}
            >
              {quizData && quizData.slice(currentIndex + 1, Math.min(currentIndex + 8, quizData.length)).map((question, idx) => {
                const isNext = idx === 0;
                return (
                  <div 
                    key={question.id}
                    className={`flex-shrink-0 w-16 h-20 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/30 cursor-pointer transition-all duration-300 transform hover:scale-110 hover:z-20 relative ${
                      isNext ? 'shadow-lg border-blue-300 ring-2 ring-blue-300/50' : ''
                    }`}
                    style={{
                      background: isNext 
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.3))'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                      animation: isNext ? 'cardHover 2s infinite' : 'none'
                    }}
                    onClick={() => {
                      // Preview functionality - could expand card or show details
                      console.log('Preview question:', question.question);
                    }}
                  >
                    <div className="p-2 h-full flex flex-col justify-between">
                      <div className="text-white text-xs font-semibold truncate">
                        {question.category.split(' ')[0]}
                      </div>
                      <div className="text-white text-xs opacity-75 line-clamp-3 leading-tight">
                        {question.question.substring(0, 25)}...
                      </div>
                      <div className={`w-2 h-2 rounded-full mx-auto ${
                        isNext ? 'bg-blue-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Scroll indicators */}
            <div className="text-white text-xs text-center mt-2 opacity-75 group-hover:opacity-100 transition-opacity">
              {quizData && currentIndex < quizData.length - 1 && (
                <span>Hover to scroll • {quizData.length - currentIndex - 1} remaining</span>
              )}
            </div>
          </div>
        </div>

        {/* C3 Swiper Stack Right - Desktop: Right, Mobile: Bottom Right (above footer) */}
        <div 
          className="absolute right-4 md:left-auto md:right-8 bottom-24 md:bottom-auto md:top-1/2 md:translate-x-0 md:-translate-y-1/2 w-40 md:w-44 h-52 md:h-60 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center transition-all duration-300 hover:z-50 hover:scale-105 hover:shadow-2xl group cursor-pointer active:scale-110 md:active:scale-105 z-0"
          onMouseEnter={(e) => {
            e.currentTarget.style.zIndex = '100';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.zIndex = '0';
          }}
          onTouchStart={(e) => {
            // Mobile: expand on tap
            e.currentTarget.style.zIndex = '100';
            e.currentTarget.style.transform = 'scale(1.1) translateY(-10px)';
          }}
          onTouchEnd={(e) => {
            // Mobile: return to normal after tap
            setTimeout(() => {
              e.currentTarget.style.zIndex = '0';
              e.currentTarget.style.transform = '';
            }, 2000);
          }}
        >
          <span className="text-white font-bold text-center text-sm mb-3">Completed<br/>Questions</span>
          
          {/* Horizontal scrollable container */}
          <div className="relative w-full px-2">
            <div 
              className="completed-horizontal-scroll flex gap-2 overflow-x-auto pb-2 scroll-smooth"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.3) transparent'
              }}
              onMouseMove={(e) => {
                const container = e.currentTarget;
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const scrollWidth = container.scrollWidth - container.clientWidth;
                
                if (scrollWidth > 0) {
                  const scrollPosition = (x / rect.width) * scrollWidth;
                  container.scrollLeft = scrollPosition;
                }
              }}
            >
              {answeredCards && answeredCards.slice(-8).map((card, idx) => {
                const actualIdx = Math.max(0, answeredCards.length - 8) + idx;
                const isLatest = idx === answeredCards.slice(-8).length - 1;
                return (
                  <div 
                    key={card.id}
                    className={`flex-shrink-0 w-16 h-20 backdrop-blur-sm rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-110 hover:z-20 relative ${
                      isLatest ? 'shadow-lg ring-2 ring-opacity-50' : ''
                    } ${card.isCorrect ? 'ring-green-300' : 'ring-red-300'}`}
                    style={{
                      background: card.isCorrect 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(22, 163, 74, 0.3))'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.3))',
                      borderColor: card.isCorrect ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                      animation: !card.isCorrect 
                        ? 'wiggleIncorrect 2s infinite, slideInRight 0.5s ease-out'
                        : isLatest 
                          ? 'cardDrop 0.5s ease-out' 
                          : 'slideInRight 0.5s ease-out'
                    }}
                    onClick={() => goToCard(card.index)}
                  >
                    <div className="p-2 h-full flex flex-col justify-between">
                      <div className="text-white text-xs font-semibold truncate">
                        {card.category.split(' ')[0]}
                      </div>
                      <div className="text-white text-xs opacity-75 line-clamp-3 leading-tight">
                        {card.question.substring(0, 25)}...
                      </div>
                      <div className={`w-3 h-3 rounded-full mx-auto flex items-center justify-center ${
                        card.isCorrect ? 'bg-green-400' : 'bg-red-400'
                      }`}>
                        <span className="text-white text-xs font-bold">
                          {card.isCorrect ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Scroll indicators */}
            <div className="text-white text-xs text-center mt-2 opacity-75 group-hover:opacity-100 transition-opacity">
              {answeredCards && answeredCards.length > 0 && (
                <span>Hover to scroll • {answeredCards.length} completed</span>
              )}
            </div>
          </div>
        </div>

        {/* C5 Main Card (Center) - Quiz Swiper */}
        <div 
          ref={resizeRef}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 ${
            isResizing ? 'select-none' : ''
          }`}
          style={{
            width: `${cardSize.width}px`,
            height: `${cardSize.height}px`,
            minWidth: '280px',
            maxWidth: '800px',
            minHeight: '400px',
            maxHeight: '700px'
          }}
        >
          <Swiper
            modules={[EffectFade]}
            effect="fade"
            fadeEffect={{
              crossFade: true
            }}
            allowTouchMove={false}
            speed={800}
            spaceBetween={30}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={() => {
              // Add visual feedback when sliding
              const activeSlide = document.querySelector('.swiper-slide-active');
              if (activeSlide) {
                activeSlide.style.transform = 'scale(1.02)';
                setTimeout(() => {
                  activeSlide.style.transform = 'scale(1)';
                }, 200);
              }
            }}
            className="w-full h-full"
          >
            {quizData && quizData.map((card, idx) => (
              <SwiperSlide key={card.id}>
                <div className="bg-gradient-to-br from-white/98 to-blue-50/96 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white/60 p-4 md:p-6 h-full flex flex-col transform transition-all duration-300">
                  {/* Question Header */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-800 font-bold text-lg">Question</span>
                    <button
                      onClick={submitAnswer}
                      disabled={selectedChoices.length === 0 || idx !== currentIndex}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform active:scale-95 ${
                        selectedChoices.length > 0 && idx === currentIndex
                          ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Submit
                    </button>
                  </div>
                  
                  {/* Category */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Category</div>
                    <div className="text-blue-600 font-semibold">{card.category}</div>
                  </div>
                  
                  {/* Question Text */}
                  <h2 className="text-gray-800 text-base md:text-lg font-medium leading-tight mb-2">
                    {card.question}
                  </h2>
                  
                  {/* Answer Type Indicator */}
                  <div className="text-xs text-gray-600 italic mb-3 text-center p-1.5 bg-blue-50 rounded">
                    {card.answer_type === 'multiple' ? 
                      'Select all that apply' : 
                      'Select one answer'
                    }
                  </div>
                  
                  {/* Choices */}
                  <div className="flex-1 min-h-0">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Choices</div>
                    <div className="h-full overflow-y-auto space-y-1.5 md:space-y-2 pr-1">
                      {card.choices.map((choice, choiceIdx) => {
                        const isSelected = selectedChoices.includes(choiceIdx) && idx === currentIndex;
                        const wasSelected = idx !== currentIndex && 
                          answeredCards.find(c => c.index === idx)?.selectedChoices.includes(choiceIdx);
                        
                        return (
                          <button
                            key={choiceIdx}
                            onClick={() => idx === currentIndex && toggleChoice(choiceIdx)}
                            disabled={idx !== currentIndex}
                            className={`w-full text-left p-1.5 md:p-3 rounded-lg md:rounded-xl border-2 transition-all text-xs md:text-sm shadow-sm hover:shadow-md transform hover:scale-102 leading-tight ${
                              isSelected || wasSelected
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600 text-white shadow-lg scale-102'
                                : 'bg-white/95 backdrop-blur-sm border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-blue-50/70'
                            } ${idx !== currentIndex ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span className="block break-words">{choice}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Resize Handles */}
        <div 
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-gray-700/80 hover:bg-gray-800/90 cursor-n-resize rounded-full transition-all shadow-xl border-2 border-gray-800/80 hover:border-gray-900"
          onMouseDown={(e) => handleResizeStart(e, 'top')}
          onTouchStart={(e) => handleResizeStart(e, 'top')}
          title="Resize height"
        ></div>
        
        <div 
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-gray-700/80 hover:bg-gray-800/90 cursor-s-resize rounded-full transition-all shadow-xl border-2 border-gray-800/80 hover:border-gray-900"
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          onTouchStart={(e) => handleResizeStart(e, 'bottom')}
          title="Resize height"
        ></div>
        
        <div 
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-gray-700/80 hover:bg-gray-800/90 cursor-w-resize rounded-full transition-all shadow-xl border-2 border-gray-800/80 hover:border-gray-900"
          onMouseDown={(e) => handleResizeStart(e, 'left')}
          onTouchStart={(e) => handleResizeStart(e, 'left')}
          title="Resize width"
        ></div>
        
        <div 
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-gray-700/80 hover:bg-gray-800/90 cursor-e-resize rounded-full transition-all shadow-xl border-2 border-gray-800/80 hover:border-gray-900"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
          onTouchStart={(e) => handleResizeStart(e, 'right')}
          title="Resize width"
        ></div>
        
        {/* Corner resize handles */}
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-gray-700/80 hover:bg-gray-800/90 cursor-ne-resize rounded-full transition-all shadow-xl border-2 border-gray-800/80 hover:border-gray-900"
          onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          onTouchStart={(e) => handleResizeStart(e, 'top-right')}
          title="Resize both"
        ></div>
        
        <div 
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-700/80 hover:bg-gray-800/90 cursor-se-resize rounded-full transition-all shadow-xl border-2 border-gray-800/80 hover:border-gray-900"
          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          onTouchStart={(e) => handleResizeStart(e, 'bottom-right')}
          title="Resize both"
        ></div>
        
        </div>

        {/* Bottom score bar */}
        <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2">
          {/* Your Score */}
          <div className="w-36 md:w-40 h-16 md:h-18 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <span className="text-white font-bold text-sm">Your Score</span>
            <span className="text-green-300 text-base md:text-lg font-bold">
              {answeredCards.length > 0 ? 
                Math.round((answeredCards.filter(c => c.isCorrect).length / answeredCards.length) * 100) 
                : 0
              }%
            </span>
          </div>
        </div>
        
        {/* Custom CSS for animations */}
        <style>{`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px) scale(0.8) rotateY(10deg);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1) rotateY(0deg);
            }
          }
          
          @keyframes cardDrop {
            0% {
              opacity: 0;
              transform: translateY(-20px) rotateZ(5deg) scale(0.8);
            }
            50% {
              transform: translateY(2px) rotateZ(-2deg) scale(1.05);
            }
            100% {
              opacity: 1;
              transform: translateY(0) rotateZ(0deg) scale(1);
            }
          }
          
          @keyframes cardHover {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-2px) scale(1.05);
            }
          }
          
          @keyframes wiggleIncorrect {
            0%, 100% {
              transform: translateX(0) rotate(0deg);
            }
            25% {
              transform: translateX(-2px) rotate(-1deg);
            }
            75% {
              transform: translateX(2px) rotate(1deg);
            }
          }
          
          .completed-questions-scroll {
            scroll-behavior: smooth;
          }
          
          .completed-questions-scroll::-webkit-scrollbar {
            width: 4px;
          }
          
          .completed-questions-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
          }
          
          .completed-questions-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
          }
          
          .completed-questions-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          
          /* Horizontal scroll styling for upcoming questions */
          .upcoming-scroll::-webkit-scrollbar {
            height: 4px;
          }
          
          .upcoming-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
          }
          
          .upcoming-scroll::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 2px;
          }
          
          .upcoming-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.7);
          }
          
          /* Horizontal scroll styling for completed questions */
          .completed-horizontal-scroll::-webkit-scrollbar {
            height: 4px;
          }
          
          .completed-horizontal-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
          }
          
          .completed-horizontal-scroll::-webkit-scrollbar-thumb {
            background: rgba(34, 197, 94, 0.5);
            border-radius: 2px;
          }
          
          .completed-horizontal-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 197, 94, 0.7);
          }
          
          /* Mobile touch scrolling */
          @media (max-width: 768px) {
            .upcoming-scroll,
            .completed-horizontal-scroll {
              -webkit-overflow-scrolling: touch;
            }
          }
          
          /* Resize handle styling */
          .cursor-n-resize { cursor: n-resize; }
          .cursor-s-resize { cursor: s-resize; }
          .cursor-e-resize { cursor: e-resize; }
          .cursor-w-resize { cursor: w-resize; }
          .cursor-ne-resize { cursor: ne-resize; }
          .cursor-se-resize { cursor: se-resize; }
          
          /* Prevent text selection during resize */
          .select-none {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
        `}</style>
    </div>
  );
}

export default GameLayout;
