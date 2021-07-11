import React from 'react';
import './App.css';
import PongGame from './Canvas';

const useScore = (initialScore: number) => {
  const [scoreValue, setScoreValue] = React.useState(initialScore);
  return {
    score: scoreValue,
    setScore: (score: number) => setScoreValue(score),
    reset: () => setScoreValue(0),
  };
};

const App = () => {
  const playerScore = useScore(0);
  const aiScore = useScore(0);

  return (
    <div
      className="App" 
      style={{ 
        backgroundColor: '#161414',
        width: '100vw',
        height: '100vh',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '50vw' }}>
        <h1 style={{ color: 'white', marginRight: '10px' }}>Player: {playerScore.score}</h1>
        <h1 style={{ color: 'white' }}>AI: {aiScore.score}</h1>
      </div>
       <PongGame 
        playerScore={playerScore.score}
        aiScore={aiScore.score}
        onPlayerScore={playerScore.setScore} 
        onAIScore={aiScore.setScore}
      />
    </div>
  )
}

export default App;
