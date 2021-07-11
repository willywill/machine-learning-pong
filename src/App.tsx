import React from 'react';
import './App.css';
import Canvas from './Canvas';

const App = () => {
  return (
    <div
      className="App" 
      style={{ 
        backgroundColor: '#161414',
        width: '100vw',
        height: '100vh',
      }}
    >
       <Canvas />
    </div>
  )
}

export default App;
