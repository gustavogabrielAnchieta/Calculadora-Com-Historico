// App.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';

// Importa as funções do módulo de operações (arquivo operacoes.js)
import { soma, subtracao, multiplicacao, divisao } from './operacoes';

// Fonte monoespaçada para o visor e a fita de papel
const MONO = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
});

// Cores do visor LCD, da mesa e do papel
const CORES = {
  mesa: '#26272A',
  corpo: '#3A3D42',
  corpoBorda: '#2A2C30',
  lcd: '#B9C7A6',
  lcdTexto: '#1D2A18',
  lcdApagado: 'rgba(29,42,24,0.35)',
  lcdErro: '#7A1A10',
  papel: '#FBFAF4',
  papelTexto: '#2B2B2B',
};

// Estilo de cada tipo de tecla: cor da face e cor da "lateral" (relevo 3D)
const TECLA = {
  numero: { cor: '#ECEAE2', borda: '#B5B2A6', texto: '#1F2023' },
  operacao: { cor: '#5A5F69', borda: '#383C44', texto: '#FFFFFF' },
  operacaoAtiva: { cor: '#F2A33A', borda: '#B0721A', texto: '#1F2023' },
  funcao: { cor: '#8B909A', borda: '#5C6069', texto: '#FFFFFF' },
  limpar: { cor: '#E5533D', borda: '#A9301E', texto: '#FFFFFF' },
  igual: { cor: '#3FA66B', borda: '#26774A', texto: '#FFFFFF' },
};

// As 4 operações
const OPERACOES = [
  { nome: 'Dividir', simbolo: '÷', funcao: divisao },
  { nome: 'Multiplicar', simbolo: '×', funcao: multiplicacao },
  { nome: 'Subtrair', simbolo: '−', funcao: subtracao },
  { nome: 'Somar', simbolo: '+', funcao: soma },
];

const LIMITE_HISTORICO = 10; // itens na fita de papel
const LIMITE_DIGITOS = 12; // caracteres por número
const ESPACO = 10; // espaço entre as teclas

// Mostra números com vírgula decimal (padrão brasileiro)
const formatar = (n) => String(n).replace('.', ',');

// Tecla com efeito 3D: ao tocar, a lateral diminui e a tecla "afunda"
function Tecla({ rotulo, label, onPress, largura, altura, tipo }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || rotulo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tecla,
        {
          width: largura,
          height: altura,
          backgroundColor: tipo.cor,
          borderBottomColor: tipo.borda,
        },
        pressed && styles.teclaPressionada,
      ]}
    >
      <Text style={[styles.teclaTexto, { color: tipo.texto }]}>{rotulo}</Text>
    </Pressable>
  );
}

export default function App() {
  const { width } = useWindowDimensions();

  // Dimensões da calculadora e das teclas (4 colunas)
  const larguraCorpo = Math.min(width - 24, 380);
  const larguraTecla = (larguraCorpo - 32 - ESPACO * 3) / 4;
  const alturaTecla = larguraTecla * 0.78;

  // Campos de entrada (mantidos como texto)
  const [valor1, setValor1] = useState('');
  const [valor2, setValor2] = useState('');

  // Campo que recebe os dígitos do teclado (1 ou 2)
  const [campoAtivo, setCampoAtivo] = useState(1);

  // Operação escolhida (aparece no visor e fica destacada)
  const [opSel, setOpSel] = useState(null);

  // Resultado e erro
  const [resultado, setResultado] = useState('');
  const [temErro, setTemErro] = useState(false);

  // Destaque dos campos com problema
  const [erroCampo1, setErroCampo1] = useState(false);
  const [erroCampo2, setErroCampo2] = useState(false);

  // Fita de papel (histórico, mais recente primeiro) e contador de ids
  const [historico, setHistorico] = useState([]);
  const proximoId = useRef(1);

  // Operação atual (objeto completo) ou null
  const operacaoAtual = OPERACOES.find((o) => o.nome === opSel) || null;

  // Limpa o resultado e o erro do visor
  const limparDisplay = () => {
    setResultado('');
    setTemErro(false);
  };

  // Regra de limpeza: qualquer alteração no campo 1 apaga o resultado
  const handleChangeValor1 = (texto) => {
    setValor1(texto);
    setErroCampo1(false);
    limparDisplay();
  };

  // Regra de limpeza: qualquer alteração no campo 2 apaga o resultado
  const handleChangeValor2 = (texto) => {
    setValor2(texto);
    setErroCampo2(false);
    limparDisplay();
  };

  // Aplica uma edição de texto ao campo ativo
  const editarCampoAtivo = (editar) => {
    if (campoAtivo === 1) {
      handleChangeValor1(editar(valor1));
    } else {
      handleChangeValor2(editar(valor2));
    }
  };

  // Teclado: digita um número
  const digitar = (digito) => {
    editarCampoAtivo((atual) => {
      if (atual.length >= LIMITE_DIGITOS) return atual;
      if (atual === '0') return digito; // evita "05"
      if (atual === '-0') return '-' + digito;
      return atual + digito;
    });
  };

  // Teclado: vírgula decimal (só uma por número)
  const digitarVirgula = () => {
    editarCampoAtivo((atual) => {
      if (atual.includes(',') || atual.includes('.')) return atual;
      if (atual === '' || atual === '-') return atual + '0,';
      return atual + ',';
    });
  };

  // Teclado: alterna positivo/negativo
  const alternarSinal = () => {
    editarCampoAtivo((atual) => (atual.startsWith('-') ? atual.slice(1) : '-' + atual));
  };

  // Teclado: apaga o último caractere
  const apagar = () => {
    editarCampoAtivo((atual) => atual.slice(0, -1));
  };

  // Escolhe a operação; se o 1º número já foi digitado, passa para o 2º campo
  const selecionarOperacao = (op) => {
    setOpSel(op.nome);
    limparDisplay();
    if (valor1.trim() !== '') setCampoAtivo(2);
  };

  // Mostra uma mensagem de erro no visor
  const mostrarErro = (mensagem) => {
    setResultado(mensagem);
    setTemErro(true);
  };

  // Tecla C: limpa campos, operação e visor (a fita é mantida)
  const limparCampos = () => {
    setValor1('');
    setValor2('');
    setOpSel(null);
    setCampoAtivo(1);
    setErroCampo1(false);
    setErroCampo2(false);
    limparDisplay();
  };

  // Limpa somente a fita de papel
  const limparHistorico = () => setHistorico([]);

  // Toque em um item da fita: recarrega os números e a operação
  const reutilizarHistorico = (item) => {
    setValor1(formatar(item.n1));
    setValor2(formatar(item.n2));
    setOpSel(item.opNome);
    setCampoAtivo(2);
    setErroCampo1(false);
    setErroCampo2(false);
    limparDisplay();
  };

  // Tecla "=": valida e executa a operação escolhida
  const igual = () => {
    const vazio1 = valor1.trim() === '';
    const vazio2 = valor2.trim() === '';

    // Validação: impede campos vazios
    if (vazio1 || vazio2) {
      setErroCampo1(vazio1);
      setErroCampo2(vazio2);
      if (vazio1 && vazio2) {
        mostrarErro('Preencha os dois campos.');
      } else if (vazio1) {
        mostrarErro('Preencha o primeiro número.');
        setCampoAtivo(1);
      } else {
        mostrarErro('Preencha o segundo número.');
        setCampoAtivo(2);
      }
      return;
    }

    // Aceita vírgula como separador decimal
    const n1 = parseFloat(valor1.replace(',', '.'));
    const n2 = parseFloat(valor2.replace(',', '.'));

    // Validação: valores que não são números (ex.: "-")
    const invalido1 = isNaN(n1);
    const invalido2 = isNaN(n2);
    if (invalido1 || invalido2) {
      setErroCampo1(invalido1);
      setErroCampo2(invalido2);
      mostrarErro('Digite números válidos.');
      return;
    }

    setErroCampo1(false);
    setErroCampo2(false);

    // Validação: precisa ter escolhido uma operação
    if (!operacaoAtual) {
      mostrarErro('Escolha uma operação.');
      return;
    }

    const res = operacaoAtual.funcao(n1, n2);

    // Texto retornado = erro (ex.: divisão por zero)
    if (typeof res === 'string') {
      setErroCampo2(true);
      mostrarErro(res);
      return;
    }

    // Evita imprecisão de ponto flutuante (ex.: 0.1 + 0.2)
    const resultadoFormatado = formatar(parseFloat(res.toFixed(10)));

    setResultado(resultadoFormatado);
    setTemErro(false);

    // Registra na fita (apenas cálculos bem-sucedidos)
    const novoItem = {
      id: String(proximoId.current++),
      n1,
      n2,
      opNome: operacaoAtual.nome,
      expressao: `${formatar(n1)} ${operacaoAtual.simbolo} ${formatar(n2)}`,
      resultado: resultadoFormatado,
    };
    setHistorico((anterior) => [novoItem, ...anterior].slice(0, LIMITE_HISTORICO));
  };

  // Gera uma tecla numérica
  const num = (d) => (
    <Tecla
      rotulo={d}
      onPress={() => digitar(d)}
      largura={larguraTecla}
      altura={alturaTecla}
      tipo={TECLA.numero}
    />
  );

  // Gera a tecla de uma operação (índice em OPERACOES)
  const teclaOp = (i) => {
    const op = OPERACOES[i];
    return (
      <Tecla
        rotulo={op.simbolo}
        label={op.nome}
        onPress={() => selecionarOperacao(op)}
        largura={larguraTecla}
        altura={alturaTecla}
        tipo={opSel === op.nome ? TECLA.operacaoAtiva : TECLA.operacao}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={CORES.mesa} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Corpo da calculadora */}
        <View style={[styles.corpo, { width: larguraCorpo }]}>
          {/* Cabeçalho: marca e painel solar */}
          <View style={styles.cabecalho}>
            <View>
              <Text style={styles.marca}>Calculadora 2</Text>
              <Text style={styles.modelo}> Edison Proti</Text>
            </View>
            <View style={styles.solar}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.solarCelula} />
              ))}
            </View>
          </View>

          {/* Visor LCD */}
          <View style={styles.lcd}>
            {/* Indicadores */}
            <View style={styles.indicadores}>
              <Text style={[styles.indicador, temErro && styles.indicadorLigado]}>ERRO</Text>
              <Text style={[styles.indicador, opSel && styles.indicadorLigado]}>
                {opSel ? opSel.toUpperCase() : 'OPERAÇÃO'}
              </Text>
            </View>

            {/* Linha A: primeiro número (TextInput) */}
            <View style={[styles.lcdLinha, campoAtivo === 1 && styles.lcdLinhaAtiva]}>
              <Text style={styles.lcdTag}>A</Text>
              <TextInput
                style={[styles.lcdInput, erroCampo1 && styles.lcdInputErro]}
                placeholder="0"
                placeholderTextColor={CORES.lcdApagado}
                keyboardType="numeric"
                showSoftInputOnFocus={false}
                inputMode="none"
                value={valor1}
                onChangeText={handleChangeValor1}
                onFocus={() => setCampoAtivo(1)}
              />
            </View>

            {/* Linha B: segundo número (TextInput), com o símbolo da operação */}
            <View style={[styles.lcdLinha, campoAtivo === 2 && styles.lcdLinhaAtiva]}>
              <Text style={styles.lcdTag}>{operacaoAtual ? operacaoAtual.simbolo : 'B'}</Text>
              <TextInput
                style={[styles.lcdInput, erroCampo2 && styles.lcdInputErro]}
                placeholder="0"
                placeholderTextColor={CORES.lcdApagado}
                keyboardType="numeric"
                showSoftInputOnFocus={false}
                inputMode="none"
                value={valor2}
                onChangeText={handleChangeValor2}
                onFocus={() => setCampoAtivo(2)}
              />
            </View>

            <View style={styles.lcdDivisor} />

            {/* Resultado ou mensagem de erro */}
            <View style={styles.lcdResultadoLinha}>
              <Text style={styles.lcdTag}>=</Text>
              <Text
                style={[styles.lcdResultado, temErro && styles.lcdResultadoErro]}
                adjustsFontSizeToFit
                numberOfLines={temErro ? 2 : 1}
              >
                {resultado === '' ? '0' : resultado}
              </Text>
            </View>
          </View>

          {/* Teclado */}
          <View style={styles.teclado}>
            <View style={styles.linha}>
              <Tecla
                rotulo="C"
                label="Limpar campos"
                onPress={limparCampos}
                largura={larguraTecla}
                altura={alturaTecla}
                tipo={TECLA.limpar}
              />
              <Tecla
                rotulo="⌫"
                label="Apagar"
                onPress={apagar}
                largura={larguraTecla}
                altura={alturaTecla}
                tipo={TECLA.funcao}
              />
              <Tecla
                rotulo="±"
                label="Inverter sinal"
                onPress={alternarSinal}
                largura={larguraTecla}
                altura={alturaTecla}
                tipo={TECLA.funcao}
              />
              {teclaOp(0)}
            </View>
            <View style={styles.linha}>
              {num('7')}
              {num('8')}
              {num('9')}
              {teclaOp(1)}
            </View>
            <View style={styles.linha}>
              {num('4')}
              {num('5')}
              {num('6')}
              {teclaOp(2)}
            </View>
            <View style={styles.linha}>
              {num('1')}
              {num('2')}
              {num('3')}
              {teclaOp(3)}
            </View>
            <View style={styles.linha}>
              <Tecla
                rotulo="0"
                onPress={() => digitar('0')}
                largura={larguraTecla * 2 + ESPACO}
                altura={alturaTecla}
                tipo={TECLA.numero}
              />
              <Tecla
                rotulo=","
                label="Vírgula"
                onPress={digitarVirgula}
                largura={larguraTecla}
                altura={alturaTecla}
                tipo={TECLA.numero}
              />
              <Tecla
                rotulo="="
                label="Igual"
                onPress={igual}
                largura={larguraTecla}
                altura={alturaTecla}
                tipo={TECLA.igual}
              />
            </View>
          </View>
        </View>

        {/* Fita de papel (histórico) */}
        <View style={[styles.papel, { width: larguraCorpo - 24 }]}>
          <View style={styles.papelHeader}>
            <View>
              <Text style={styles.papelTitulo}>FITA DE PAPEL</Text>
              <Text style={styles.papelDica}>Toque é Reutiliza papael</Text>
            </View>
            {historico.length > 0 && (
              <TouchableOpacity onPress={limparHistorico}>
                <Text style={styles.papelLimpar}>[ rasgar ]</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.papelTracejado} numberOfLines={1}>
            - - - - - - - - - - - - - - - - - - - - - - - -
          </Text>

          {historico.length === 0 ? (
            <Text style={styles.papelVazio}>(fita em branco)</Text>
          ) : (
            historico.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.papelItem}
                onPress={() => reutilizarHistorico(item)}
                activeOpacity={0.5}
              >
                <Text style={styles.papelExpressao} numberOfLines={1}>
                  {item.expressao}
                </Text>
                <Text style={styles.papelResultado} numberOfLines={1}>
                  = {item.resultado}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CORES.mesa,
    // No Android, o SafeAreaView não evita a barra de status
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  scroll: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 48,
  },

  // Corpo da calculadora
  corpo: {
    backgroundColor: CORES.corpo,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: CORES.corpoBorda,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },

  // Cabeçalho: marca e painel solar
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  marca: {
    color: '#F5F5F0',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
  },
  modelo: {
    color: '#9A9EA6',
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  solar: {
    flexDirection: 'row',
    backgroundColor: '#1B1512',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#14100E',
    padding: 2,
  },
  solarCelula: {
    width: 22,
    height: 22,
    backgroundColor: '#4A3B33',
    borderWidth: 1,
    borderColor: '#2A201B',
    marginHorizontal: 1,
  },

  // Visor LCD
  lcd: {
    backgroundColor: CORES.lcd,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: '#14161A',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    marginBottom: 18,
  },
  indicadores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  indicador: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: CORES.lcdApagado,
  },
  indicadorLigado: {
    color: CORES.lcdTexto,
  },
  lcdLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  lcdLinhaAtiva: {
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  lcdTag: {
    width: 22,
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.lcdTexto,
  },
  lcdInput: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 26,
    fontWeight: 'bold',
    color: CORES.lcdTexto,
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  lcdInputErro: {
    color: CORES.lcdErro,
    textDecorationLine: 'underline',
  },
  lcdDivisor: {
    height: 2,
    backgroundColor: CORES.lcdApagado,
    marginVertical: 6,
  },
  lcdResultadoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingHorizontal: 4,
  },
  lcdResultado: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 42,
    fontWeight: 'bold',
    color: CORES.lcdTexto,
    textAlign: 'right',
  },
  lcdResultadoErro: {
    fontSize: 14,
    color: CORES.lcdErro,
  },

  // Teclado
  teclado: {},
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ESPACO + 2,
  },
  tecla: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderBottomWidth: 5, // "lateral" da tecla (efeito 3D)
  },
  teclaPressionada: {
    borderBottomWidth: 2,
    transform: [{ translateY: 3 }],
  },
  teclaTexto: {
    fontSize: 26,
    fontWeight: '700',
  },

  // Fita de papel
  papel: {
    backgroundColor: CORES.papel,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  papelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  papelTitulo: {
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.papelTexto,
    letterSpacing: 1,
  },
  papelDica: {
    fontFamily: MONO,
    fontSize: 10,
    color: '#8A8A80',
    marginTop: 2,
  },
  papelLimpar: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B3261E',
  },
  papelTracejado: {
    fontFamily: MONO,
    color: '#B8B8AE',
    marginVertical: 8,
  },
  papelVazio: {
    fontFamily: MONO,
    fontSize: 13,
    color: '#8A8A80',
    textAlign: 'center',
    paddingVertical: 10,
  },
  papelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  papelExpressao: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 14,
    color: '#6A6A62',
  },
  papelResultado: {
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.papelTexto,
    marginLeft: 8,
  },
});
