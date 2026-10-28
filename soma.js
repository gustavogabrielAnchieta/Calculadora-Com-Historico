// operacoes.js
// Módulo com as funções matemáticas da calculadora.

// Soma dois números
export function soma(a, b) {
  return a + b;
}

// Subtrai o segundo número do primeiro
export function subtracao(a, b) {
  return a - b;
}

// Multiplica dois números
export function multiplicacao(a, b) {
  return a * b;
}

// Divide o primeiro número pelo segundo.
// Se o divisor for zero, retorna uma mensagem de erro (string).
export function divisao(a, b) {
  if (b === 0) {
    return 'Erro: divisão por zero não é permitida';
  }
  return a / b;
}
