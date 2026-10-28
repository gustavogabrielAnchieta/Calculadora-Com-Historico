// soma.js
// Módulo com as funções matemáticas da calculadora.

// Converte a entrada em número, aceitando vírgula como separador decimal.
function converterNumero(valor) {
  if (typeof valor === 'number') {
    return valor;
  }

  const texto = String(valor).trim().replace(',', '.');
  return texto === '' ? NaN : Number(texto);
}

// Soma dois números
export function soma(a, b) {
  return converterNumero(a) + converterNumero(b);
}

// Subtrai o segundo número do primeiro
export function subtracao(a, b) {
  return converterNumero(a) - converterNumero(b);
}

// Multiplica dois números
export function multiplicacao(a, b) {
  return converterNumero(a) * converterNumero(b);
}

// Divide o primeiro número pelo segundo.
// Se o divisor for zero, retorna uma mensagem de erro (string)
// em vez de um número, evitando o resultado "Infinity".
export function divisao(a, b) {
  const n1 = converterNumero(a);
  const n2 = converterNumero(b);

  if (n2 === 0) {
    return 'Erro: divisão por zero não é permitida';
  }

  return n1 / n2;
}