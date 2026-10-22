import { CordaGraduation } from '../types';

export const ABADA_GRADUATIONS: CordaGraduation[] = [
  {
    id: 'crua',
    name: 'Corda Crua',
    category: 'adulto',
    title: 'Iniciante',
    colorLeft: '#E4DFD3',
    meaning: 'Início da jornada na Capoeira',
    symbol: 'A Origem / O Cordão Cru',
    description: 'Representa o potencial bruto do aluno. Não possui cor definida pois reflete o ponto de partida onde o capoeirista começa a absorver os fundamentos, rituais e a disciplina da arte.',
    level: 1
  },
  {
    id: 'crua-amarela',
    name: 'Corda Crua e Amarela',
    category: 'adulto',
    title: 'Aluno em Transição',
    colorLeft: '#E4DFD3',
    colorRight: '#FACC15',
    meaning: 'Transição da iniciação para o aprendizado',
    symbol: 'Primeiro Contato com a Luz',
    description: 'O aluno já aprendeu os movimentos básicos (ginga, esquivas fundamentais, meia-lua de frente, queixada) e começa a entender a musicalidade e a roda.',
    level: 2
  },
  {
    id: 'amarela',
    name: 'Corda Amarela',
    category: 'adulto',
    title: 'Aluno',
    colorLeft: '#FACC15',
    meaning: 'O Ouro - A valorização do aprendizado',
    symbol: 'O Ouro',
    description: 'Simboliza a riqueza do conhecimento adquirido e o brilho do aprendizado. O aluno demonstra dedicação, presença nos treinos e compreensão dos toques fundamentais de berimbau.',
    level: 3
  },
  {
    id: 'amarela-laranja',
    name: 'Corda Amarela e Laranja',
    category: 'adulto',
    title: 'Aluno em Transição',
    colorLeft: '#FACC15',
    colorRight: '#F97316',
    meaning: 'Transição para o despertar da consciência',
    symbol: 'O Alvorecer',
    description: 'Momento de consolidação técnica. O aluno ganha fluidez nos movimentos, maior rapidez de raciocínio no jogo e segurança na bateria.',
    level: 4
  },
  {
    id: 'laranja',
    name: 'Corda Laranja',
    category: 'adulto',
    title: 'Aluno',
    colorLeft: '#F97316',
    meaning: 'O Sol - O despertar da consciência',
    symbol: 'O Sol',
    description: 'Representa o despertar da consciência do capoeirista. O aluno reconhece seu papel na roda, domina diversos golpes e desenvolve sua própria personalidade no jogo.',
    level: 5
  },
  {
    id: 'laranja-azul',
    name: 'Corda Laranja e Azul',
    category: 'adulto',
    title: 'Aluno em Transição',
    colorLeft: '#F97316',
    colorRight: '#2563EB',
    meaning: 'Transição para a graduação avançada',
    symbol: 'O Encontro do Céu e do Sol',
    description: 'Fase de transição decisiva. O capoeirista se prepara tecnicamente, fisicamente e filosoficamente para assumir o título de Graduado na Abadá-Capoeira.',
    level: 6
  },
  {
    id: 'azul',
    name: 'Corda Azul',
    category: 'adulto',
    title: 'Graduado',
    colorLeft: '#2563EB',
    meaning: 'O Mar - A consciência da imensidão do caminho',
    symbol: 'O Mar',
    description: 'Primeiro grande marco de graduação no grupo. O mar representa a imensidão do caminho que ainda há por percorrer. O Graduado tem maturidade para auxiliar nos treinos e puxar cantorias.',
    level: 7
  },
  {
    id: 'azul-verde',
    name: 'Corda Azul e Verde',
    category: 'adulto',
    title: 'Graduado em Transição',
    colorLeft: '#2563EB',
    colorRight: '#16A34A',
    meaning: 'Transição para o corpo de instrutores',
    symbol: 'O Encontro das Águas com a Floresta',
    description: 'O graduado aprofunda conhecimentos pedagógicos, didática com iniciantes e responsabilidade social da capoeira.',
    level: 8
  },
  {
    id: 'verde',
    name: 'Corda Verde',
    category: 'adulto',
    title: 'Instrutor',
    colorLeft: '#16A34A',
    meaning: 'A Floresta - A consolidação do aprendizado e respiração no jogo',
    symbol: 'A Floresta',
    description: 'O Instrutor é um multiplicador da filosofia da ABADÁ-Capoeira. Assim como a floresta é o pulmão da Terra, o instrutor renova o ar e a energia do grupo, ensinando com método e respeito.',
    level: 9
  },
  {
    id: 'verde-roxa',
    name: 'Corda Verde e Roxa',
    category: 'adulto',
    title: 'Instrutor em Transição',
    colorLeft: '#16A34A',
    colorRight: '#7C3AED',
    meaning: 'Transição para o corpo de professores',
    symbol: 'Amadurecimento da Floresta',
    description: 'Fase de refinamento da postura, liderança comunitária e aprofundamento histórico da capoeira regional e de Angola.',
    level: 10
  },
  {
    id: 'roxa',
    name: 'Corda Roxa',
    category: 'adulto',
    title: 'Professor',
    colorLeft: '#7C3AED',
    meaning: 'A Ametista - A reflexão, serenidade e continuidade',
    symbol: 'A Ametista',
    description: 'A pedra preciosa simboliza a reflexão e superação de dores e desafios. O Professor tem total autonomia para conduzir núcleos, formar novos alunos e zelar pela integridade do grupo.',
    level: 11
  },
  {
    id: 'roxa-marrom',
    name: 'Corda Roxa e Marrom',
    category: 'adulto',
    title: 'Professor em Transição',
    colorLeft: '#7C3AED',
    colorRight: '#92400E',
    meaning: 'Transição para o corpo de mestrandos',
    symbol: 'Raízes Profundas',
    description: 'Preparação para ingressar na alta cúpula dos mestres da instituição.',
    level: 12
  },
  {
    id: 'marrom',
    name: 'Corda Marrom',
    category: 'adulto',
    title: 'Mestrando',
    colorLeft: '#92400E',
    meaning: 'O Camaleão / A Madeira - Maleabilidade, solidez e equilíbrio',
    symbol: 'O Camaleão & O Tronco Firme',
    description: 'O Mestrando é o elo direto de sustentação da ABADÁ-Capoeira. O camaleão se adapta a qualquer ambiente sem perder sua essência. Representa a sabedoria e a maleabilidade no jogo da vida.',
    level: 13
  },
  {
    id: 'marrom-vermelha',
    name: 'Corda Marrom e Vermelha',
    category: 'adulto',
    title: 'Mestrando em Transição',
    colorLeft: '#92400E',
    colorRight: '#DC2626',
    meaning: 'Transição para o grau de Mestre',
    symbol: 'A Chama da Tradição',
    description: 'O ápice da preparação como mestrando, demonstrando anos de lealdade, excelência técnica e dedicação à formação humana.',
    level: 14
  },
  {
    id: 'vermelha',
    name: 'Corda Vermelha',
    category: 'adulto',
    title: 'Mestre',
    colorLeft: '#DC2626',
    meaning: 'O Rubi - A justiça, a paixão e a grande responsabilidade',
    symbol: 'O Rubi',
    description: 'Representa a justiça e a responsabilidade máxima perante a arte. O Mestre carrega em suas palavras e atos a tradição de Mestre Bimba, Mestre Camisa e os grandes pioneiros da Capoeira.',
    level: 15
  },
  {
    id: 'vermelha-branca',
    name: 'Corda Vermelha e Branca',
    category: 'adulto',
    title: 'Grão-Mestre em Transição',
    colorLeft: '#DC2626',
    colorRight: '#FFFFFF',
    meaning: 'Transição para a plenitude',
    symbol: 'A Harmonia Suprema',
    description: 'Grau concedido à liderança suprema da instituição, sintetizando a força do rubi com a pureza do diamante.',
    level: 16
  },
  {
    id: 'branca',
    name: 'Corda Branca',
    category: 'adulto',
    title: 'Grão-Mestre',
    colorLeft: '#FFFFFF',
    meaning: 'O Diamante - A totalidade, o reflexo de todas as cores',
    symbol: 'O Diamante',
    description: 'Graduação máxima da ABADÁ-Capoeira, outorgada ao Fundador e Grão-Mestre Camisa. O branco contém todas as cores do prisma, simbolizando a união, paz e a imortalidade da capoeira.',
    level: 17
  }
];

export const CORDAS_LIST = ABADA_GRADUATIONS.map(g => g.name);
