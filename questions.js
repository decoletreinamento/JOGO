// Edite aqui as perguntas. c = categoria (Excel, Word, PowerPoint, Windows), r = índice da resposta certa (0 a 3)
const QUESTIONS = [
    { c: 'Excel', q: 'Qual atalho insere a data atual em uma célula?', a: ['Ctrl + ;', 'Ctrl + D', 'Alt + D', 'Ctrl + T'], r: 0 },
    { c: 'Excel', q: 'Qual função soma apenas as células que atendem a um critério?', a: ['SOMA', 'SOMASE', 'SE', 'MÉDIA'], r: 1 },
    { c: 'Excel', q: 'Qual símbolo fixa a referência de uma célula (ex.: $A$1)?', a: ['#', '&', '$', '@'], r: 2 },
    { c: 'Excel', q: 'Qual função procura um valor na primeira coluna de uma tabela?', a: ['PROCV', 'CONT.SE', 'HOJE', 'ARRUMAR'], r: 0 },
    { c: 'Word', q: 'No Word em português, qual atalho aplica NEGRITO?', a: ['Ctrl + K', 'Ctrl + N', 'Ctrl + G', 'Ctrl + Q'], r: 1 },
    { c: 'Word', q: 'Em qual guia fica o Sumário automático?', a: ['Inserir', 'Revisão', 'Referências', 'Exibir'], r: 2 },
    { c: 'Word', q: 'A tecla F7 no Word abre qual recurso?', a: ['Localizar', 'Salvar como', 'Imprimir', 'Ortografia e gramática'], r: 3 },
    { c: 'PowerPoint', q: 'Qual tecla inicia a apresentação do primeiro slide?', a: ['F5', 'F1', 'F12', 'F9'], r: 0 },
    { c: 'PowerPoint', q: 'Qual guia controla o efeito de passagem entre slides?', a: ['Animações', 'Transições', 'Design', 'Inserir'], r: 1 },
    { c: 'Windows', q: 'Qual atalho abre as Configurações do Windows 11?', a: ['Win + R', 'Win + E', 'Win + I', 'Win + L'], r: 2 },
    { c: 'Windows', q: 'Qual atalho captura uma parte da tela?', a: ['Win + Shift + S', 'Ctrl + P', 'Alt + Tab', 'Win + D'], r: 0 },
    { c: 'Windows', q: 'Win + V abre o quê?', a: ['Gerenciador de tarefas', 'Histórico da Área de Transferência', 'Pesquisa', 'Widgets'], r: 1 },
  ];