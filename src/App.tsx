import React from 'react';
import './App.css';
import PongGame from './Canvas';
import NetworkGraph from './NetworkGraph';

const useScore = (initialScore: number) => {
  const [scoreValue, setScoreValue] = React.useState(initialScore);
  return {
    score: scoreValue,
    setScore: (score: number) => setScoreValue(score),
    reset: () => setScoreValue(0),
  };
};

const timeout = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const useSignal = (): [boolean, (isActive: boolean) => Promise<void>] => {
  const [isActivated, setActive] = React.useState(false);
  
  return [
    isActivated,
    async (isActive: boolean): Promise<void> => {
      if (isActive) {
        setActive(true);
        await timeout(1000);
        setActive(false);
      }
      setActive(false);
    },
  ];
};


const useOutputSignal = () => {
  const [isMovingUp, setIsMovingUp] = useSignal();
  const [isMovingDown, setIsMovingDown] = useSignal();
  const [isStopped, setIsStopped] = useSignal();

  return {
    isMovingUp,
    isMovingDown,
    isStopped,
    setIsMovingUp,
    setIsMovingDown,
    setIsStopped,
  };
};

const App = () => {
  const playerScore = useScore(0);
  const aiScore = useScore(0);
  const outputSignal = useOutputSignal();

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
      <div>
        <NetworkGraph 
          layers={[
            { id: 'input', label: 'Input', nodes: 6 },
            { id: 'hidden', label: 'Hidden', nodes: 8 },
            { id: 'output', label: 'Output', nodes: 3 },
          ]}
          outputSignal={outputSignal}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '50vw' }}>
        <h1 style={{ color: 'white', marginRight: '10px' }}>Player: {playerScore.score}</h1>
        <h1 style={{ color: 'white' }}>AI: {aiScore.score}</h1>
      </div>
       <PongGame
        playerScore={playerScore.score}
        aiScore={aiScore.score}
        onPlayerScore={playerScore.setScore} 
        onAIScore={aiScore.setScore}
        onMoveUp={() => outputSignal.setIsMovingUp(true)}
        onMoveDown={() => outputSignal.setIsMovingDown(true)}
        onStop={() => outputSignal.setIsStopped(true)}
      />
    </div>
  )
}

export default App;
