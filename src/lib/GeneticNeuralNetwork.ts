import * as tf from '@tensorflow/tfjs';

class GeneticNeuralNetwork {
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
    } else {
      this.inputNodes = b;
      this.hiddenNodes = c;
      this.outputNodes = d;
      this.model = this.createModel();
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
    tf.tidy(() => {
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
      // console.log(outputs);
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
    return model;
  }
}

export default GeneticNeuralNetwork;