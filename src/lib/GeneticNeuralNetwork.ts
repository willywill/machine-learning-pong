import * as tf from '@tensorflow/tfjs';

class GeneticNeuralNetwork {
  public id: number;
  model: tf.LayersModel;
  inputNodes: number;
  hiddenNodes: number;
  outputNodes: number;

  constructor(b: number, c: number, d: number, a?: any) {
    if (a instanceof tf.Sequential) {
      this.model = a;
      this.inputNodes = b;
      this.hiddenNodes = c;
      this.outputNodes = d;
      this.id = Math.round(Math.random() * 100000);
    } else {
      this.inputNodes = b;
      this.hiddenNodes = c;
      this.outputNodes = d;
      this.model = this.createModel();
      this.id = Math.round(Math.random() * 100000);
    }
  }

  copy() {
    // @ts-ignore
    return tf.tidy(() => {
      const modelCopy = this.createModel();
      const weights = this.model.getWeights();
      const weightCopies = [];
      for (let i = 0; i < weights.length; i++) {
        weightCopies[i] = weights[i].clone();
      }
      modelCopy.setWeights(weightCopies);
      return new GeneticNeuralNetwork(
        this.inputNodes,
        this.hiddenNodes,
        this.outputNodes,
        modelCopy,
      );
    });
  }

  mutate(rate: number) {
    // console.log(`Mutation rate: ${rate}`);
    tf.tidy(() => {
      // If the mutation rate >= 1 then we just set the model as a brand new model.
      if (rate >= 1) {
        this.model = this.createModel();
        return;
      }

      const weights = this.model.getWeights();
      const mutatedWeights = [];
      for (let i = 0; i < weights.length; i++) {
        let tensor = weights[i];
        let shape = weights[i].shape;
        let values = tensor.dataSync().slice();
        for (let j = 0; j < values.length; j++) {
          if (Math.random() < rate) {
            let w = values[j];
            values[j] = w + Math.random();
          }
        }
        let newTensor = tf.tensor(values, shape);
        mutatedWeights[i] = newTensor;
      }
      this.model.setWeights(mutatedWeights);
      // Give this brain a new id
      this.id = Math.round(Math.random() * 100000);
    });
  }

  dispose() {
    this.model.dispose();
  }

  predict(inputs: Array<any>) {
    return tf.tidy(() => {
      const xs = tf.tensor2d([inputs]);
      const ys = this.model.predict(xs);
      // @ts-ignore
      const outputs = ys.dataSync();
      return outputs;
    });
  }

  createModel() {
    const model = tf.sequential();
    const hidden = tf.layers.dense({
      units: this.hiddenNodes,
      inputShape: [this.inputNodes],
      activation: 'sigmoid'
    });
    model.add(hidden);
    const output = tf.layers.dense({
      units: this.outputNodes,
      activation: 'softmax'
    });
    model.add(output);
    this.id = Math.round(Math.random() * 100000);
    return model;
  }

  inspectMemory() {
    return tf.memory();
  }

  extractWeights() {
    return tf.tidy(() => {
      const weights = this.model.getWeights();
      const weightCopies = [];
      for (let i = 0; i < weights.length; i++) {
        weightCopies[i] = weights[i].clone();
      }
      return weightCopies;
    });
  }

  calculateFitness(ballsHit: number, score: number, dist: number) {
    // If we scored a point, we count this as a big bonus!
    // For each ball hit, we get an additional point.
    return Math.pow(score, 2) + ballsHit + (dist <= 305 ? 1.25 : 0);
  }

}

export default GeneticNeuralNetwork;