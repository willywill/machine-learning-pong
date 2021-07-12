import React, { useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import GeneticNeuralNetwork from './lib/GeneticNeuralNetwork';

// Loosely based on the following implementation:
// https://thecodingpie.com/post/learn-to-code-ping-pong-game-using-javascript-and-html5

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;

interface PongProps {
  onPlayerScore: (score: number) => void;
  onAIScore: (score: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onStop: () => void;
  playerScore: number;
  aiScore: number;
}

type GameState = {
  input: {
    upArrowPressed: boolean;
    downArrowPressed: boolean;
  },
  events: {
    onPlayerScore: (score: number) => void;
    onAIScore: (score: number) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onStop: () => void;
  },
  net: {
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  },
  ball: {
    x: number,
    y: number,
    radius: number,
    xVelocity: number,
    yVelocity: number,
    speed: number,
    color: string,
  },
  player: {
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    score: number,
    ballsHit: number,
    brain: GeneticNeuralNetwork,
    distBetweenPlayerAndBallOnLastMiss: number,
  },
  ai: {
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    score: number,
  },
};

const getCanvas = () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  return canvas;
};

const isCollision = (ball: any, player: any) => {
  player.top = player.y;
  player.right = player.x + player.width;
  player.bottom = player.y + player.height;
  player.left = player.x;

  ball.top = ball.y - ball.radius;
  ball.right = ball.x + ball.radius;
  ball.bottom = ball.y + ball.radius;
  ball.left = ball.x - ball.radius;

  return ball.left <= player.right && ball.right >= player.left && ball.top <= player.bottom && ball.bottom >= player.top;
};

const serveOnScore = (canvas: HTMLCanvasElement, gameState: GameState) => {
  const fitness = gameState.player.brain.calculateFitness(gameState.player.ballsHit, gameState.player.score, gameState.player.distBetweenPlayerAndBallOnLastMiss);
  console.log({fitness});
  gameState.player.brain.mutate(fitness <= 1 ? 1 : Math.max(0.00000001, (0.1 / (10 / fitness))));
  gameState.player.score = 0;
  gameState.player.ballsHit = 0;
  gameState.ball.speed = 7;
  gameState.ball.yVelocity = -Math.sign(gameState.ball.yVelocity) * 5;
  gameState.ball.xVelocity = -Math.sign(gameState.ball.xVelocity) * 5;

  gameState.ball.x = canvas.width / 2;
  gameState.ball.y = canvas.height / 2;
};

const renderPongBoard = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {  
  const { net, ball, player, ai } = gameState;

  // Draw the background
  ctx.fillStyle = "#161414";
  ctx.fillRect(0, 0, canvas.width, canvas.height); 
  
  // Draw the net
  ctx.fillStyle = net.color;
  ctx.fillRect(net.x, net.y, net.width, net.height);
  
  // Draw the ball
  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
  ctx.fill();

  // Draw the player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw the ai
  ctx.fillStyle = ai.color;
  ctx.fillRect(ai.x, ai.y, ai.width, ai.height);
};

const updatePongBoard = (canvas: HTMLCanvasElement, gameState: GameState) => {
  const { ball, player, ai, input } = gameState;

  ball.x += ball.xVelocity;
  ball.y += ball.yVelocity;

  // Feed the brain with inputs
  const inputs = [
    // Paddle's y position
    player.y,
    // Ball's x position
    ball.x,
    // Ball's y position
    ball.y,
    // Ball's x velocity
    ball.xVelocity,
    // Ball's y velocity
    ball.yVelocity,
    // Distance between ball and player
    Math.abs(ball.x - player.x),
  ];

  const [moveUp, moveDown, stop] = player.brain.predict(inputs);

  // If the brain returned a direction, move the paddle
  if (moveUp > 0.5 && player.y > 0) {
    player.y -= 8;
    gameState.events?.onMoveUp();
  } 
  else if (moveDown > 0.5 && player.y < canvas.height - player.height) {
    player.y += 8;
    gameState.events?.onMoveDown();
  }

  // Near perfect AI movement
  ai.y += ((ball.y - (ai.y + ai.height / 2))) * 0.9;

  const closestPaddle = ball.x < canvas.width / 2 ? player : ai;

  // Check for collision with the top or bottom of the canvas
  if (ball.y <= 0 || ball.y + ball.radius >= canvas.height) {
    ball.yVelocity *= -1;
  }

  // Check for collision with the left or right of the canvas
  if (ball.x <= 0) {
    // ball.xVelocity *= -1;
    // console.log('Ball hit left wall');
    ++ai.score;
    gameState.events.onAIScore(ai.score);
    // player.brain.dispose();
    player.distBetweenPlayerAndBallOnLastMiss = Math.abs(ball.y - (player.y + player.height / 2));
    serveOnScore(canvas, gameState);
  } else if (ball.x + ball.radius >= canvas.width) {
    // ball.xVelocity *= -1;
    // console.log('Ball hit right wall');
    ++player.score;
    gameState.events.onPlayerScore(player.score * 2);
    // player.brain.dispose();
    serveOnScore(canvas, gameState);
  }

  // Check for collision with a player
  if (isCollision(gameState.ball, closestPaddle)) {
    if (closestPaddle === player) {
      ++player.ballsHit;
      gameState.events.onPlayerScore(++player.score);
    }
    let angle = 0;

    // If ball hit the top of paddle
    if (ball.y < (closestPaddle.y + closestPaddle.height / 2)) {
      // then the angle will be -45deg
      angle = -1 * Math.PI / 4;
      // If it hit the bottom of paddle
    } else if (ball.y > (closestPaddle.y + closestPaddle.height / 2)) {
      // then angle will be 45deg
      angle = Math.PI / 4;
    }

    /* Change velocity of ball according to which paddle the ball hit */
    ball.xVelocity = (closestPaddle === player ? 1 : -1) * ball.speed * Math.cos(angle);
    ball.yVelocity = ball.speed * Math.sin(angle);

    // Increase ball speed for each hit
    ball.speed += 0.25;

    // Increment the number of ballsHit for the player
    if (closestPaddle === player) {
      ++player.ballsHit;
    }
  }

  return gameState;
};

const gameLoop = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  updatePongBoard(canvas, gameState);
  renderPongBoard(ctx, canvas, gameState);
  window.requestAnimationFrame(() => gameLoop(ctx, canvas, gameState));
};

const Canvas = (props: PongProps) => {
  useEffect(() => {
    // Get the canvas element
    const canvas = getCanvas();
    if (!canvas) return;
    // Get the context for the canvas
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    let brain = null;
    // If we already have a brain, this brain has failed us, lets get a new one
    if (props.brain) {
      brain = props.brain;
    } else {
      brain = new GeneticNeuralNetwork(6, 8, 2);
      props.setBrain(brain);
    }

    // Initialize the game state
    const gameState = {
      net: {
        x: canvas.width / 2,
        y: 0,
        width: 2,
        height: canvas.height,
        color: "white"
      },
      ball:{
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        speed: 7,
        xVelocity: 5,
        yVelocity: 5,
        color: 'lightsteelblue'
      },
      player: {
        x: 10,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: 'white',
        score: 0,
        brain,
        ballsHit: 0,
      },
      ai: {
        x: canvas.width - (PADDLE_WIDTH + 10),
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: 'cadetblue',
        score: 0,
      },
      input: {
        upArrowPressed: false,
        downArrowPressed: false,
      },
      events: {
        onPlayerScore: props.onPlayerScore,
        onAIScore: props.onAIScore,
        onMoveUp: props.onMoveUp,
        onMoveDown: props.onMoveDown,
        onStop: props.onStop,
      },
    };

    window.requestAnimationFrame(() => gameLoop(ctx, canvas, gameState));

    return () => {
      tf.disposeVariables();
    };

  }, []);

  return (
    <canvas id="canvas"
      width="1000px"
      height="720px"
      style={{
        width: '50vw',
        height: '50vh',
        maxWidth: '1000px',
        maxHeight: '720px',
        border: '2px solid white',
        borderRadius: '5px',
      }}
    >
    </canvas>
  );
};

export default Canvas;