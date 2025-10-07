import React, { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import quizDataFile from '../../data/test_mock_exam.json';

export default function QuizCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredCards, setAnsweredCards] = useState([]);
  const [selectedChoices, setSelectedChoices] = useState([]);
  const swiperRef = useRef(null);
  const swiperContainerRef = useRef(null);


  // Use questions from the imported JSON file
  const quizData = quizDataFile.questions;

  const toggleChoice = (index) => {
    const currentCard = quizData[currentIndex];
    
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
    const currentCard = quizData[currentIndex];
    
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

    // Animate current card to the right
    const currentSlide = document.querySelector('.swiper-slide-active .quiz-card');
    if (currentSlide) {
      currentSlide.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s';
      currentSlide.style.transform = 'translateX(150%) scale(0.3)';
      currentSlide.style.opacity = '0';
    }

    // Animate next card from left stack to center (if there is a next card)
    if (currentIndex < quizData.length - 1) {
      // Create a temporary flying card from left stack
      const leftStack = document.querySelector('.left-stack');
      const mainCardContainer = document.querySelector('.main-card-container');
      
      if (leftStack && mainCardContainer) {
        const flyingCard = document.createElement('div');
        flyingCard.className = 'flying-card';
        flyingCard.textContent = '●';
        
        const leftRect = leftStack.getBoundingClientRect();
        const centerRect = mainCardContainer.getBoundingClientRect();
        
        flyingCard.style.position = 'fixed';
        flyingCard.style.left = leftRect.left + 25 + 'px';
        flyingCard.style.top = leftRect.top + 100 + 'px';
        flyingCard.style.width = '50px';
        flyingCard.style.height = '70px';
        flyingCard.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)';
        flyingCard.style.borderRadius = '12px';
        flyingCard.style.display = 'flex';
        flyingCard.style.alignItems = 'center';
        flyingCard.style.justifyContent = 'center';
        flyingCard.style.color = 'white';
        flyingCard.style.fontSize = '28px';
        flyingCard.style.zIndex = '100';
        flyingCard.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        flyingCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        flyingCard.style.border = '2px solid rgba(255,255,255,0.3)';
        
        document.body.appendChild(flyingCard);
        
        // Trigger animation on next frame
        requestAnimationFrame(() => {
          flyingCard.style.left = centerRect.left + centerRect.width / 2 - 275 + 'px';
          flyingCard.style.top = centerRect.top + 100 + 'px';
          flyingCard.style.transform = 'scale(10)';
          flyingCard.style.opacity = '0';
        });
        
        // Clean up flying card
        setTimeout(() => {
          document.body.removeChild(flyingCard);
        }, 700);
      }
    }

    // Wait for animation, then update state and move to next card
    setTimeout(() => {
      setAnsweredCards(prev => [...prev, answeredCard]);
      setSelectedChoices([]);
      
      if (currentIndex < quizData.length - 1) {
        setCurrentIndex(prev => prev + 1);
        if (swiperRef.current && swiperRef.current.slideNext) {
          swiperRef.current.slideNext(400);
        }
      }

      // Reset the transform on the slide
      if (currentSlide) {
        currentSlide.style.transform = '';
        currentSlide.style.opacity = '';
        currentSlide.style.transition = '';
      }
    }, 650);
  };

  const goToCard = (index) => {
    const card = answeredCards.find(c => c.index === index);
    if (card) {
      setSelectedChoices(card.selectedChoices);
    }
    setCurrentIndex(index);
    if (swiperRef.current) {
      swiperRef.current.slideTo(index, 500);
    }
  };

  return (
    <div className="quiz-container">
      {/* Left Stack - Upcoming Cards */}
      <div className="left-stack">
        <div className="stack-label">C2 Swiper<br/>Stack Left</div>
        <div className="stack-indicators">
          {quizData.slice(currentIndex + 1, currentIndex + 4).map((card, idx) => (
            <div 
              key={card.id} 
              className={`stack-card upcoming ${idx === 0 ? 'next-card' : ''}`}
            >
              <div className="status-icon">●</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Card Area */}
      <div className="main-card-container">
        <div className="top-bar">
          <div className="bar-title">B1 Top bar chart metrics</div>
          <div className="difficulty">
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Difficulty</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Mode: Easy</div>
          </div>
        </div>

        <Swiper
          modules={[EffectFade]}
          effect="fade"
          fadeEffect={{
            crossFade: true
          }}
          allowTouchMove={false}
          speed={600}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          className="swiper-container"
        >
          {quizData.map((card, idx) => (
            <SwiperSlide key={card.id}>
              <div className="quiz-card">
                <div className="card-header">
                  <div className="question-label">Question</div>
                  <div className="card-title">C5 Main Card Top</div>
                </div>

                <button
                  onClick={submitAnswer}
                  disabled={selectedChoices.length === 0 || idx !== currentIndex}
                  className="submit-button-top"
                  style={{
                    opacity: (selectedChoices.length > 0 && idx === currentIndex) ? 1 : 0.5,
                    cursor: (selectedChoices.length > 0 && idx === currentIndex) ? 'pointer' : 'not-allowed'
                  }}
                >
                  Submit Answer
                </button>

                <div className="card-content">
                  <div className="category-label">Category</div>
                  <div className="category-value">{card.category}</div>

                  <h2 className="question-text">{card.question}</h2>
                  
                  <div className="answer-type-indicator">
                    {card.answer_type === 'multiple' ? 
                      '(Select all that apply)' : 
                      '(Select one answer)'
                    }
                  </div>

                  <div className="choices-label">Choices</div>
                  <div className="choices-container">
                    {card.choices.map((choice, choiceIdx) => {
                      const isSelected = selectedChoices.includes(choiceIdx) && idx === currentIndex;
                      const wasSelected = idx !== currentIndex && 
                        answeredCards.find(c => c.index === idx)?.selectedChoices.includes(choiceIdx);
                      
                      return (
                        <button
                          key={choiceIdx}
                          onClick={() => idx === currentIndex && toggleChoice(choiceIdx)}
                          disabled={idx !== currentIndex}
                          className={`choice-button ${isSelected || wasSelected ? 'selected' : ''}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  <div className="card-bottom-label">C5 Main Card Bottom</div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Right Stack - Completed Cards */}
      <div className="right-stack">
        <div className="stack-label">C3 Swiper<br/>Stack Right</div>
        <div className="stack-indicators">
          {answeredCards.map((card) => (
            <div
              key={card.id}
              onClick={() => goToCard(card.index)}
              className={`stack-card ${card.isCorrect ? 'correct' : 'incorrect'}`}
            >
              <div className="status-icon">
                {card.isCorrect ? '●' : '●'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Score Bar */}
      <div className="score-bar">
        <div className="score-section">
          <div className="score-label">Your Score</div>
          <div className="score-value" style={{ color: '#10b981' }}>
            {Math.round((answeredCards.filter(c => c.isCorrect).length / Math.max(answeredCards.length, 1)) * 100)}%
          </div>
        </div>
        <div className="score-section">
          <div className="score-label">Computer</div>
          <div className="score-value" style={{ color: '#ef4444' }}>
            {Math.round((answeredCards.filter(c => !c.isCorrect).length / Math.max(answeredCards.length, 1)) * 100)}%
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }

        .quiz-container {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(to bottom, 
            #5dade2 0%, 
            #85c1e9 30%,
            #aed6f1 50%, 
            #f9e79f 75%,
            #f8c471 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .left-stack, .right-stack {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .left-stack {
          left: 40px;
        }

        .right-stack {
          right: 40px;
        }

        .stack-label {
          font-size: 12px;
          color: white;
          text-align: center;
          font-weight: 600;
          line-height: 1.3;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-bottom: 10px;
        }

        .stack-indicators {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          transition: all 0.3s ease;
        }

        .stack-card {
          width: 50px;
          height: 70px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(10px);
        }

        .stack-card.correct {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          cursor: pointer;
          animation: fadeInCard 0.5s ease;
        }

        .stack-card.incorrect {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          cursor: pointer;
          animation: fadeInCard 0.5s ease;
        }

        @keyframes fadeInCard {
          0% {
            opacity: 0;
            transform: translateX(-20px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .stack-card.upcoming {
          background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%);
        }

        .stack-card.next-card {
          background: linear-gradient(135deg, rgba(74, 144, 226, 0.5) 0%, rgba(53, 122, 189, 0.3) 100%);
          animation: pulse 2s infinite;
          border-color: rgba(74, 144, 226, 0.6);
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }

        .stack-card:hover:not(.upcoming) {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.25);
        }

        .status-icon {
          color: white;
          font-size: 28px;
          font-weight: bold;
        }

        .main-card-container {
          width: 90%;
          max-width: 550px;
          height: 700px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
        }

        .top-bar {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          background: rgba(255,255,255,0.3);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          margin-bottom: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .bar-title {
          color: white;
          font-size: 18px;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .difficulty {
          text-align: right;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .swiper {
          width: 100%;
          height: 550px;
        }

        .swiper-wrapper {
          height: 100%;
        }

        .swiper-slide {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .quiz-card {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, 
            rgba(255,255,255,0.95) 0%, 
            rgba(240,248,255,0.95) 100%
          );
          border-radius: 24px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.5);
          overflow: auto;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .question-label {
          font-size: 18px;
          color: #333;
          font-weight: 600;
        }

        .card-title {
          font-size: 12px;
          color: #666;
          text-align: right;
        }

        .card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .category-label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .category-value {
          font-size: 15px;
          color: #4A90E2;
          font-weight: 600;
          margin-bottom: 18px;
        }

        .question-text {
          font-size: 22px;
          color: #333;
          line-height: 1.4;
          margin-bottom: 10px;
          font-weight: 500;
        }

        .answer-type-indicator {
          font-size: 14px;
          color: #666;
          font-style: italic;
          margin-bottom: 20px;
          text-align: center;
          padding: 8px;
          background: rgba(74, 144, 226, 0.1);
          border-radius: 8px;
        }

        .choices-label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .choices-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }

        .choice-button {
          padding: 14px 18px;
          background: rgba(255,255,255,0.9);
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          color: #333;
          text-align: left;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
        }

        .choice-button:hover:not(:disabled) {
          border-color: #4A90E2;
          background: rgba(74, 144, 226, 0.05);
          transform: translateX(4px);
        }

        .choice-button.selected {
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          border-color: #357ABD;
          color: white;
          font-weight: 600;
          transform: translateX(4px);
        }

        .choice-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .card-bottom-label {
          font-size: 10px;
          color: #999;
          text-align: center;
          margin-top: auto;
          padding-top: 10px;
        }

        .submit-button-top {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 17px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .submit-button-top:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .score-bar {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 60px;
          padding: 20px 40px;
          background: rgba(255,255,255,0.9);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .score-section {
          text-align: center;
        }

        .score-label {
          font-size: 13px;
          color: #666;
          margin-bottom: 5px;
        }

        .score-value {
          font-size: 28px;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .left-stack, .right-stack {
            display: none;
          }

          .main-card-container {
            width: 95%;
            height: 650px;
          }

          .quiz-card {
            padding: 25px;
          }

          .question-text {
            font-size: 20px;
          }

          .score-bar {
            gap: 30px;
            padding: 15px 25px;
          }
        }
      `}</style>
    </div>
  );
}
