import React, { useEffect } from 'react';

type Layer = {
  id: string,
  label: string,
  nodes: number,
};

type OutputSignal = {
  isMovingUp: boolean,
  isMovingDown: boolean,
  isStopped: boolean,
  setIsMovingUp: (isActive: boolean) => Promise<void>,
  setIsMovingDown: (isActive: boolean) => Promise<void>,
  setIsStopped: (isActive: boolean) => Promise<void>,
};

interface NetworkProps {
  layers: Array<Layer>,
  outputSignal: OutputSignal,
};

const range = (n: number) => [...Array(n).keys()];

const getIsSignalActive = (outputSignal: OutputSignal, node: number) => {
  if (outputSignal.isMovingUp && node === 0) {
    return true;
  }

  if (outputSignal.isMovingDown && node === 1) {
    return true;
  }

  if (outputSignal.isStopped && node === 2) {
    return true;
  }

  return false;
};

const NetworkGraph = (props: NetworkProps) => {

  useEffect(() => {
    if (props.layers.length === 0) {
      return;
    }

    const canvas = document.getElementById('network-graph') as HTMLCanvasElement;

    if (!canvas) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // Draw the background
    ctx.fillStyle = '#161414';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the nodes for each layer
    const padding = 50;
    // Get the index of the layer with the most nodes
    let maxIndex = 0;
    let maxNodes = 0;
    props.layers.forEach((layer, index) => {
      if (layer.nodes > maxNodes) {
        maxIndex = index;
        maxNodes = layer.nodes;
      }
    });

    props.layers.forEach((layer, i) => {
      // For each layer, draw the nodes as a vertical array of circles
      range(layer.nodes).forEach(node => {
        ctx.beginPath();
        // Center the circles by adding some vertical padding
        const centerOffset = (canvas.height / (0.4 * props.layers[i].nodes) * 0.25);
        const x = i * 200 + padding;
        const y = node * 45 + padding + (i !== maxIndex ? centerOffset : 0);
        const radius = 20;
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = layer.label === 'Output' && getIsSignalActive(props.outputSignal, node) ? 'limegreen' : 'white';
        ctx.fill();
        // If we aren't the last layer, draw a line to the next layer
        if (i !== props.layers.length - 1) {
          range(props.layers[i + 1].nodes).forEach((nextNode, idx) => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            const nextX = (i + 1) * 200 + padding;
            const nextY = nextNode * 45 + padding + (i === 1 ? 80 : 0); // TODO: Fix this specific hacky offset
            ctx.lineTo(nextX, nextY);
            ctx.strokeStyle = 'white';
            ctx.stroke();
          });
        }
      });
    });
    
  }, [props.outputSignal]);

  return (
    <canvas id="network-graph" width="600" height="400" />
  );
};

export default NetworkGraph;