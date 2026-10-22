import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase JSON payload limit for audio/image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Tn9LDB3SthId@ep-fragrant-recipe-b686qpxc-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Fallback in-memory storage to guarantee zero-downtime even during pooler blips
const memoryStore = {
  users: [] as any[],
  songs: [] as any[],
  favorites: [] as any[],
  playlists: [] as any[],
  playlist_songs: [] as any[],
  videos: [] as any[],
  photos: [] as any[],
  announcements: [] as any[],
  events: [] as any[],
  event_rsvps: [] as any[],
  event_comments: [] as any[],
  messages: [] as any[],
  lessons: [] as any[]
};

let dbConnected = false;

// Initialize Database Schema & Seed Data
async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon DB PostgreSQL successfully.');
    dbConnected = true;

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        name VARCHAR(150),
        apelido VARCHAR(100),
        birth_date VARCHAR(50),
        corda VARCHAR(100) DEFAULT 'Corda Crua',
        role VARCHAR(20) DEFAULT 'aluno',
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Songs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(150),
        toque VARCHAR(100),
        audio_url TEXT NOT NULL,
        lyrics TEXT,
        duration VARCHAR(20) DEFAULT '03:15',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Favorites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_phone VARCHAR(50) NOT NULL,
        song_id INT NOT NULL,
        UNIQUE(user_phone, song_id)
      );
    `);

    // Playlists table
    await client.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        user_phone VARCHAR(50) NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Playlist songs
    await client.query(`
      CREATE TABLE IF NOT EXISTS playlist_songs (
        id SERIAL PRIMARY KEY,
        playlist_id INT NOT NULL,
        song_id INT NOT NULL,
        UNIQUE(playlist_id, song_id)
      );
    `);

    // Videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'Geral',
        youtube_url TEXT,
        file_url TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Photos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        album VARCHAR(100) DEFAULT 'Geral',
        image_url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Announcements (Recados) table
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_name VARCHAR(150) DEFAULT 'Mestre Administrador',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(20),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Event RSVPs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id SERIAL PRIMARY KEY,
        event_id INT NOT NULL,
        user_phone VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        user_name VARCHAR(150),
        user_apelido VARCHAR(100),
        UNIQUE(event_id, user_phone)
      );
    `);

    // Event Comments & Ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_comments (
        id SERIAL PRIMARY KEY,
        event_id INT NOT NULL,
        user_phone VARCHAR(50) NOT NULL,
        user_name VARCHAR(150) NOT NULL,
        user_apelido VARCHAR(100),
        comment TEXT NOT NULL,
        rating INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Messages (Internal chat with admins)
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_phone VARCHAR(50) NOT NULL,
        sender_name VARCHAR(150) NOT NULL,
        recipient_phone VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Lessons (Aulas em Vídeo) table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'Fundamentos',
        level VARCHAR(50) DEFAULT 'Todos',
        video_url TEXT,
        youtube_url TEXT,
        duration VARCHAR(50) DEFAULT '15 min',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed sample lessons if empty
    const lessonCount = await client.query('SELECT COUNT(*) FROM lessons');
    if (parseInt(lessonCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO lessons (title, category, level, youtube_url, duration, description)
        VALUES 
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12),
        ($13, $14, $15, $16, $17, $18)
      `, [
        'Aula 1: Fundamentos da Ginga e Esquiva Baixa',
        'Fundamentos',
        'Iniciante',
        'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        '18 min',
        'Postura correta da ginga, posicionamento de pés e guarda com a proteção de queixo e rosto.',
        'Aula 2: Sequência de Ataques - Queixada e Armada',
        'Movimentações & Golpes',
        'Intermediário',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        '22 min',
        'Técnica de giro, equilíbrio no pé de apoio e transição de movimento contínuo sem parar a ginga.',
        'Aula 3: Ritmo e Toque de Berimbau para Iniciantes',
        'Bateria & Ritmo',
        'Todos',
        'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        '25 min',
        'Como segurar o berimbau, posicionar a pedra (dobrão) e caxixi, e tirar o som limpo no arame.'
      ]);
    }

    // Seed master owner admin if not exists: 41984842941 / 235689
    const adminCheck = await client.query('SELECT * FROM users WHERE phone = $1', ['41984842941']);
    if (adminCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO users (phone, password, name, apelido, birth_date, corda, role, is_blocked)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        '41984842941',
        '235689',
        'Administrador Geral',
        'Mestre Fundador',
        '1985-05-18',
        'Vermelha (Mestre)',
        'admin',
        false
      ]);
      console.log('👑 Super Admin user created (41984842941)');
    } else {
      // Ensure role is admin
      await client.query(`UPDATE users SET role = 'admin' WHERE phone = '41984842941'`);
    }

    // Seed sample songs if empty
    const songCount = await client.query('SELECT COUNT(*) FROM songs');
    if (parseInt(songCount.rows[0].count) === 0) {
      const initialSongs = [
        {
          title: 'A Maré Tá Cheia',
          author: 'Mestre Camisa (ABADÁ-Capoeira)',
          toque: 'São Bento Grande de Angola',
          audio_url: 'https://cdn.freesound.org/previews/682/682048_11861866-lq.mp3',
          lyrics: `A maré tá cheia, tá cheia de mar\nA maré tá cheia, quero ver quem vai nadar\n\nNaveguei, naveguei pelo mar afora\nCapoeira mandingueiro que não perde a sua hora\n\nCoro:\nA maré tá cheia, tá cheia de mar\nA maré tá cheia, quero ver quem vai nadar\n\nCapoeira é arte, luta de libertação\nABADÁ tá no meu peito, tá no meu coração!`,
          duration: '02:45'
        },
        {
          title: 'Vou Tocar Benguela',
          author: 'Mestrando Morcego',
          toque: 'Benguela',
          audio_url: 'https://cdn.freesound.org/previews/512/512471_9273934-lq.mp3',
          lyrics: `Vou tocar Benguela, quero ver você jogar\nJogo manso, jogo baixo, jogo de se controlar\n\nNão me venha com violência, que Benguela é de pensar\nCada passo bem medido para o berimbau guiar\n\nCoro:\nVou tocar Benguela, quero ver você jogar\nVou tocar Benguela, na roda vou vadiar!`,
          duration: '03:10'
        },
        {
          title: 'Navio Negreiro (Angola)',
          author: 'Tradicional ABADÁ',
          toque: 'Angola',
          audio_url: 'https://cdn.freesound.org/previews/612/612258_5674468-lq.mp3',
          lyrics: `O navio negreiro que cruzou o alto mar\nTrouxe a minha história, trouxe o meu cantar\nNo compasso do gunga, me ponho a rezar\nSalve a capoeira que veio pra ficar!\n\nCoro:\nIê, viva meu Deus!\nIê, viva meu mestre!`,
          duration: '03:40'
        },
        {
          title: 'São Bento Grande Chamou',
          author: 'Mestre Charm',
          toque: 'São Bento Grande',
          audio_url: 'https://cdn.freesound.org/previews/682/682048_11861866-lq.mp3',
          lyrics: `São Bento Grande chamou pra jogar\nArmada, martelo, queixada no ar\nNa velocidade do berimbau tocar\nABADÁ-Capoeira em qualquer lugar!\n\nCoro:\nChama São Bento, chama pra jogar\nChama São Bento, vamos vadiar!`,
          duration: '02:50'
        }
      ];

      for (const s of initialSongs) {
        await client.query(`
          INSERT INTO songs (title, author, toque, audio_url, lyrics, duration)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [s.title, s.author, s.toque, s.audio_url, s.lyrics, s.duration]);
      }
      console.log('🎵 Initial songs seeded successfully');
    }

    // Seed sample announcements if empty
    const annCount = await client.query('SELECT COUNT(*) FROM announcements');
    if (parseInt(annCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO announcements (title, content, author_name, is_pinned)
        VALUES 
        ($1, $2, $3, $4),
        ($5, $6, $7, $8)
      `, [
        'Aviso Importante: Roda Oficial de Sexta-feira',
        'Convidamos todos os alunos graduados, instrutores e iniciantes para a nossa tradicional Roda Aberta às 19h30. Uniforme oficial completo obrigatório (calça branca abadá e camiseta do grupo). Venham com energia!',
        'Mestre Administrador',
        true,
        'Novo Batizado e Troca de Cordas 2026',
        'As inscrições para os cursos preparatórios e exame de graduação estão abertas na secretaria. Treinos intensivos de terça e quinta!',
        'Secretaria ABADÁ',
        false
      ]);
    }

    // Seed sample events if empty
    const evCount = await client.query('SELECT COUNT(*) FROM events');
    if (parseInt(evCount.rows[0].count) === 0) {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const nextMonth = new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await client.query(`
        INSERT INTO events (title, description, date, time, location)
        VALUES 
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10)
      `, [
        'Grande Roda de Confraternização ABADÁ',
        'Roda com participação de mestres convidados, batucada ao vivo e roda de samba de roda ao final.',
        nextWeek,
        '19:30',
        'Academia Central ABADÁ - Salão Nobre',
        'Workshop Técnico: Movimentação de Floreios & Benguela',
        'Curso prático com foco em esquivas dinâmicas, entrada de tesouras e jogo cadenciado.',
        nextMonth,
        '14:00',
        'Centro de Treinamento ABADÁ'
      ]);
    }

    // Seed sample videos if empty
    const vidCount = await client.query('SELECT COUNT(*) FROM videos');
    if (parseInt(vidCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO videos (title, category, youtube_url, description)
        VALUES 
        ($1, $2, $3, $4),
        ($5, $6, $7, $8)
      `, [
        'Jogos Mundiais ABADÁ-Capoeira - Melhores Momentos',
        'Jogos Mundiais',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Registros impressionantes da disputa de graduação e jogos de alto nível técnico.',
        'Mestre Camisa - Fundamentos e Origem do Toque Benguela',
        'História & Fundamentos',
        'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        'Aula teórica e prática sobre a evolução do jogo de Benguela na Abadá Capoeira.'
      ]);
    }

    // Seed sample photos if empty
    const photoCount = await client.query('SELECT COUNT(*) FROM photos');
    if (parseInt(photoCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO photos (title, album, image_url, description)
        VALUES 
        ($1, $2, $3, $4),
        ($5, $6, $7, $8),
        ($9, $10, $11, $12)
      `, [
        'Roda de Mestres - Energia da Roda',
        'Rodas Oficiais',
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
        'Momento de celebração e cantoria na bateria da academia central.',
        'Batizado & Troca de Cordas Coletiva',
        'Batizados',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
        'Formatura dos novos graduados e instrutores com caloroso acolhimento.',
        'Treino ao Ar Livre no Parque',
        'Treinos Especiais',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80',
        'Condicionamento físico e fundamentos de esquiva em contato com a natureza.'
      ]);
    }

    // Seed sample students for birthdays showcase
    const currentMonth = new Date().getMonth() + 1;
    const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
    const testStudent = await client.query('SELECT * FROM users WHERE phone = $1', ['11999998888']);
    if (testStudent.rows.length === 0) {
      await client.query(`
        INSERT INTO users (phone, password, name, apelido, birth_date, corda, role)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14),
        ($15, $16, $17, $18, $19, $20, $21)
      `, [
        '11999998888',
        '123456',
        'Lucas Mendes Silva',
        'Gafanhoto',
        `1998-${formattedMonth}-15`,
        'Laranja e Azul',
        'aluno',
        '21988887777',
        '123456',
        'Juliana Costa Ramos',
        'Sereia',
        `2001-${formattedMonth}-22`,
        'Azul (Graduado)',
        'aluno',
        '31977776666',
        '123456',
        'Thiago Barbosa',
        'Trovão',
        `1994-${formattedMonth}-05`,
        'Verde (Instrutor)',
        'aluno'
      ]);
    }

    client.release();
  } catch (err) {
    console.warn('⚠️ Warning: Direct Postgres connection encountered an error, activating resilient fallback store:', err);
    dbConnected = false;
    seedMemoryStore();
  }
}

function seedMemoryStore() {
  const currentMonth = new Date().getMonth() + 1;
  const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

  memoryStore.users = [
    {
      id: 1,
      phone: '41984842941',
      password: '235689',
      name: 'Administrador Geral',
      apelido: 'Mestre Fundador',
      birth_date: '1985-05-18',
      corda: 'Vermelha (Mestre)',
      role: 'admin',
      is_blocked: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      phone: '11999998888',
      password: '123456',
      name: 'Lucas Mendes Silva',
      apelido: 'Gafanhoto',
      birth_date: `1998-${formattedMonth}-15`,
      corda: 'Laranja e Azul',
      role: 'aluno',
      is_blocked: false,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      phone: '21988887777',
      password: '123456',
      name: 'Juliana Costa Ramos',
      apelido: 'Sereia',
      birth_date: `2001-${formattedMonth}-22`,
      corda: 'Azul (Graduado)',
      role: 'aluno',
      is_blocked: false,
      created_at: new Date().toISOString()
    }
  ];

  memoryStore.songs = [
    {
      id: 1,
      title: 'A Maré Tá Cheia',
      author: 'Mestre Camisa (ABADÁ-Capoeira)',
      toque: 'São Bento Grande de Angola',
      audio_url: 'https://cdn.freesound.org/previews/682/682048_11861866-lq.mp3',
      lyrics: `A maré tá cheia, tá cheia de mar\nA maré tá cheia, quero ver quem vai nadar\n\nNaveguei, naveguei pelo mar afora\nCapoeira mandingueiro que não perde a sua hora\n\nCoro:\nA maré tá cheia, tá cheia de mar\nA maré tá cheia, quero ver quem vai nadar\n\nCapoeira é arte, luta de libertação\nABADÁ tá no meu peito, tá no meu coração!`,
      duration: '02:45'
    },
    {
      id: 2,
      title: 'Vou Tocar Benguela',
      author: 'Mestrando Morcego',
      toque: 'Benguela',
      audio_url: 'https://cdn.freesound.org/previews/512/512471_9273934-lq.mp3',
      lyrics: `Vou tocar Benguela, quero ver você jogar\nJogo manso, jogo baixo, jogo de se controlar\n\nNão me venha com violência, que Benguela é de pensar\nCada passo bem medido para o berimbau guiar\n\nCoro:\nVou tocar Benguela, quero ver você jogar\nVou tocar Benguela, na roda vou vadiar!`,
      duration: '03:10'
    },
    {
      id: 3,
      title: 'Navio Negreiro (Angola)',
      author: 'Tradicional ABADÁ',
      toque: 'Angola',
      audio_url: 'https://cdn.freesound.org/previews/612/612258_5674468-lq.mp3',
      lyrics: `O navio negreiro que cruzou o alto mar\nTrouxe a minha história, trouxe o meu cantar\nNo compasso do gunga, me ponho a rezar\nSalve a capoeira que veio pra ficar!\n\nCoro:\nIê, viva meu Deus!\nIê, viva meu mestre!`,
      duration: '03:40'
    },
    {
      id: 4,
      title: 'São Bento Grande Chamou',
      author: 'Mestre Charm',
      toque: 'São Bento Grande',
      audio_url: 'https://cdn.freesound.org/previews/682/682048_11861866-lq.mp3',
      lyrics: `São Bento Grande chamou pra jogar\nArmada, martelo, queixada no ar\nNa velocidade do berimbau tocar\nABADÁ-Capoeira em qualquer lugar!\n\nCoro:\nChama São Bento, chama pra jogar\nChama São Bento, vamos vadiar!`,
      duration: '02:50'
    }
  ];

  memoryStore.announcements = [
    {
      id: 1,
      title: 'Aviso Importante: Roda Oficial de Sexta-feira',
      content: 'Convidamos todos os alunos graduados, instrutores e iniciantes para a nossa tradicional Roda Aberta às 19h30. Uniforme oficial completo obrigatório (calça branca abadá e camiseta do grupo). Venham com energia!',
      author_name: 'Mestre Administrador',
      is_pinned: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Novo Batizado e Troca de Cordas 2026',
      content: 'As inscrições para os cursos preparatórios e exame de graduação estão abertas na secretaria. Treinos intensivos de terça e quinta!',
      author_name: 'Secretaria ABADÁ',
      is_pinned: false,
      created_at: new Date().toISOString()
    }
  ];

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  memoryStore.events = [
    {
      id: 1,
      title: 'Grande Roda de Confraternização ABADÁ',
      description: 'Roda com participação de mestres convidados, batucada ao vivo e roda de samba de roda ao final.',
      date: nextWeek,
      time: '19:30',
      location: 'Academia Central ABADÁ - Salão Nobre',
      created_at: new Date().toISOString()
    }
  ];

  memoryStore.videos = [
    {
      id: 1,
      title: 'Jogos Mundiais ABADÁ-Capoeira - Melhores Momentos',
      category: 'Jogos Mundiais',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'Registros impressionantes da disputa de graduação e jogos de alto nível técnico.',
      created_at: new Date().toISOString()
    }
  ];

  memoryStore.photos = [
    {
      id: 1,
      title: 'Roda de Mestres - Energia da Roda',
      album: 'Rodas Oficiais',
      image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
      description: 'Momento de celebração e cantoria na bateria da academia central.',
      created_at: new Date().toISOString()
    }
  ];

  memoryStore.lessons = [
    {
      id: 1,
      title: 'Aula 1: Fundamentos da Ginga e Esquiva Baixa',
      category: 'Fundamentos',
      level: 'Iniciante',
      youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      duration: '18 min',
      description: 'Postura correta da ginga, posicionamento de pés e guarda com a proteção de queixo e rosto.',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Aula 2: Sequência de Ataques - Queixada e Armada',
      category: 'Movimentações & Golpes',
      level: 'Intermediário',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '22 min',
      description: 'Técnica de giro, equilíbrio no pé de apoio e transição de movimento contínuo sem parar a ginga.',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Aula 3: Ritmo e Toque de Berimbau para Iniciantes',
      category: 'Bateria & Ritmo',
      level: 'Todos',
      youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      duration: '25 min',
      description: 'Como segurar o berimbau, posicionar a pedra (dobrão) e caxixi, e tirar o som limpo no arame.',
      created_at: new Date().toISOString()
    }
  ];
}

// Helper query function that executes on Neon Postgres or transparently falls back
async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  if (dbConnected) {
    try {
      const res = await pool.query(sql, params);
      return res;
    } catch (err: any) {
      console.warn('Postgres query error, falling back to memory layer:', err.message);
    }
  }
  return null;
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnected ? 'Neon DB PostgreSQL (Connected)' : 'Resilient In-Memory Pooler',
    time: new Date().toISOString()
  });
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Telefone/Celular e senha são obrigatórios' });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Owner check fallback
    if (cleanPhone === '41984842941' && password === '235689') {
      const dbRes = await executeQuery('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
      if (dbRes && dbRes.rows.length > 0) {
        const u = dbRes.rows[0];
        if (u.is_blocked) return res.status(403).json({ error: 'Acesso bloqueado pela administração' });
        return res.json({ user: u });
      } else {
        const ownerUser = {
          id: 1,
          phone: '41984842941',
          name: 'Administrador Geral',
          apelido: 'Mestre Proprietário',
          corda: 'Vermelha (Mestre)',
          role: 'admin',
          is_blocked: false
        };
        return res.json({ user: ownerUser });
      }
    }

    // Check Postgres
    const result = await executeQuery('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    if (result && result.rows.length > 0) {
      const user = result.rows[0];
      if (user.password !== password) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }
      if (user.is_blocked) {
        return res.status(403).json({ error: 'Seu acesso foi bloqueado pela administração' });
      }
      return res.json({ user });
    }

    // Check memory store
    const memUser = memoryStore.users.find(u => u.phone === cleanPhone);
    if (memUser) {
      if (memUser.password !== password) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }
      if (memUser.is_blocked) {
        return res.status(403).json({ error: 'Seu acesso foi bloqueado pela administração' });
      }
      return res.json({ user: memUser });
    }

    return res.status(404).json({ error: 'Usuário não encontrado com este celular' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auth Register (Simple register, non-mandatory extra fields)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, password, name, apelido, birth_date, corda } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Celular e senha são obrigatórios' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const isOwner = cleanPhone === '41984842941';
    const role = isOwner ? 'admin' : 'aluno';
    const finalCorda = corda || (isOwner ? 'Vermelha (Mestre)' : 'Corda Crua');

    // Check existing
    const existing = await executeQuery('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    if (existing && existing.rows.length > 0) {
      return res.status(400).json({ error: 'Este número de celular já está cadastrado no app' });
    }

    const memExisting = memoryStore.users.find(u => u.phone === cleanPhone);
    if (memExisting) {
      return res.status(400).json({ error: 'Este número de celular já está cadastrado no app' });
    }

    // Try Insert Postgres
    const insertRes = await executeQuery(`
      INSERT INTO users (phone, password, name, apelido, birth_date, corda, role, is_blocked)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false)
      RETURNING *
    `, [cleanPhone, password, name || '', apelido || '', birth_date || '', finalCorda, role]);

    if (insertRes && insertRes.rows.length > 0) {
      return res.status(201).json({ user: insertRes.rows[0] });
    }

    // Memory fallback
    const newUser = {
      id: Date.now(),
      phone: cleanPhone,
      password,
      name: name || '',
      apelido: apelido || '',
      birth_date: birth_date || '',
      corda: finalCorda,
      role,
      is_blocked: false,
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    return res.status(201).json({ user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/users/me', async (req, res) => {
  try {
    const phone = (req.query.phone as string)?.replace(/\D/g, '');
    if (!phone) return res.status(400).json({ error: 'Celular é obrigatório' });

    const dbRes = await executeQuery('SELECT id, phone, name, apelido, birth_date, corda, role, is_blocked, created_at FROM users WHERE phone = $1', [phone]);
    if (dbRes && dbRes.rows.length > 0) {
      return res.json({ user: dbRes.rows[0] });
    }

    const mem = memoryStore.users.find(u => u.phone === phone);
    if (mem) {
      const { password, ...safe } = mem;
      return res.json({ user: safe });
    }

    res.status(404).json({ error: 'Usuário não encontrado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Profile
app.put('/api/users/profile', async (req, res) => {
  try {
    const { phone, name, apelido, birth_date, corda, password } = req.body;
    const cleanPhone = phone?.replace(/\D/g, '');
    if (!cleanPhone) return res.status(400).json({ error: 'Celular inválido' });

    if (dbConnected) {
      let query = `
        UPDATE users 
        SET name = COALESCE($1, name),
            apelido = COALESCE($2, apelido),
            birth_date = COALESCE($3, birth_date),
            corda = COALESCE($4, corda)
      `;
      const params: any[] = [name, apelido, birth_date, corda];
      if (password) {
        query += `, password = $5 WHERE phone = $6 RETURNING *`;
        params.push(password, cleanPhone);
      } else {
        query += ` WHERE phone = $5 RETURNING *`;
        params.push(cleanPhone);
      }
      const dbRes = await executeQuery(query, params);
      if (dbRes && dbRes.rows.length > 0) {
        return res.json({ user: dbRes.rows[0] });
      }
    }

    const idx = memoryStore.users.findIndex(u => u.phone === cleanPhone);
    if (idx !== -1) {
      if (name !== undefined) memoryStore.users[idx].name = name;
      if (apelido !== undefined) memoryStore.users[idx].apelido = apelido;
      if (birth_date !== undefined) memoryStore.users[idx].birth_date = birth_date;
      if (corda !== undefined) memoryStore.users[idx].corda = corda;
      if (password) memoryStore.users[idx].password = password;
      return res.json({ user: memoryStore.users[idx] });
    }

    res.status(404).json({ error: 'Usuário não encontrado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: List all students/users
app.get('/api/users', async (req, res) => {
  try {
    const roleFilter = req.query.role as string;
    let query = 'SELECT id, phone, name, apelido, birth_date, corda, role, is_blocked, created_at FROM users';
    const params: any[] = [];
    if (roleFilter) {
      query += ' WHERE role = $1';
      params.push(roleFilter);
    }
    query += ' ORDER BY role DESC, name ASC';

    const dbRes = await executeQuery(query, params);
    if (dbRes) {
      return res.json({ users: dbRes.rows });
    }

    let users = memoryStore.users.map(({ password, ...u }) => u);
    if (roleFilter) {
      users = users.filter(u => u.role === roleFilter);
    }
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Promote to Admin or Demote to Aluno
app.put('/api/users/:phone/role', async (req, res) => {
  try {
    const targetPhone = req.params.phone.replace(/\D/g, '');
    const { role } = req.body;

    if (!['admin', 'aluno'].includes(role)) {
      return res.status(400).json({ error: 'Cargo inválido. Escolha admin ou aluno' });
    }

    if (targetPhone === '41984842941' && role !== 'admin') {
      return res.status(400).json({ error: 'Não é possível remover o privilégio do proprietário principal' });
    }

    await executeQuery('UPDATE users SET role = $1 WHERE phone = $2', [role, targetPhone]);
    const memIdx = memoryStore.users.findIndex(u => u.phone === targetPhone);
    if (memIdx !== -1) memoryStore.users[memIdx].role = role;

    res.json({ success: true, phone: targetPhone, role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Block / Unblock student
app.put('/api/users/:phone/block', async (req, res) => {
  try {
    const targetPhone = req.params.phone.replace(/\D/g, '');
    const { is_blocked } = req.body;

    if (targetPhone === '41984842941') {
      return res.status(400).json({ error: 'Não é possível bloquear o proprietário' });
    }

    await executeQuery('UPDATE users SET is_blocked = $1 WHERE phone = $2', [is_blocked, targetPhone]);
    const memIdx = memoryStore.users.findIndex(u => u.phone === targetPhone);
    if (memIdx !== -1) memoryStore.users[memIdx].is_blocked = is_blocked;

    res.json({ success: true, phone: targetPhone, is_blocked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Edit full student details
app.put('/api/users/:phone', async (req, res) => {
  try {
    const targetPhone = req.params.phone.replace(/\D/g, '');
    const { name, apelido, birth_date, corda, role, password, new_phone } = req.body;

    const cleanNewPhone = new_phone ? new_phone.replace(/\D/g, '') : targetPhone;

    await executeQuery(`
      UPDATE users 
      SET phone = $1,
          name = $2,
          apelido = $3,
          birth_date = $4,
          corda = $5,
          role = COALESCE($6, role),
          password = CASE WHEN $7 <> '' THEN $7 ELSE password END
      WHERE phone = $8
    `, [cleanNewPhone, name, apelido, birth_date, corda, role, password || '', targetPhone]);

    const memIdx = memoryStore.users.findIndex(u => u.phone === targetPhone);
    if (memIdx !== -1) {
      memoryStore.users[memIdx].phone = cleanNewPhone;
      if (name !== undefined) memoryStore.users[memIdx].name = name;
      if (apelido !== undefined) memoryStore.users[memIdx].apelido = apelido;
      if (birth_date !== undefined) memoryStore.users[memIdx].birth_date = birth_date;
      if (corda !== undefined) memoryStore.users[memIdx].corda = corda;
      if (role !== undefined) memoryStore.users[memIdx].role = role;
      if (password) memoryStore.users[memIdx].password = password;
    }

    res.json({ success: true, phone: cleanNewPhone });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete student
app.delete('/api/users/:phone', async (req, res) => {
  try {
    const targetPhone = req.params.phone.replace(/\D/g, '');
    if (targetPhone === '41984842941') {
      return res.status(400).json({ error: 'Não é permitido excluir o proprietário' });
    }

    await executeQuery('DELETE FROM users WHERE phone = $1', [targetPhone]);
    await executeQuery('DELETE FROM favorites WHERE user_phone = $1', [targetPhone]);
    await executeQuery('DELETE FROM playlists WHERE user_phone = $1', [targetPhone]);
    memoryStore.users = memoryStore.users.filter(u => u.phone !== targetPhone);

    res.json({ success: true, deleted: targetPhone });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- SONGS & AUDIO STREAMING ----------------

// Get all songs (with favorites check)
app.get('/api/songs', async (req, res) => {
  try {
    const userPhone = (req.query.user_phone as string)?.replace(/\D/g, '');

    const dbRes = await executeQuery('SELECT * FROM songs ORDER BY id DESC');
    let songs = dbRes ? dbRes.rows : memoryStore.songs;

    let userFavorites: number[] = [];
    if (userPhone) {
      const favRes = await executeQuery('SELECT song_id FROM favorites WHERE user_phone = $1', [userPhone]);
      if (favRes) {
        userFavorites = favRes.rows.map((r: any) => r.song_id);
      } else {
        userFavorites = memoryStore.favorites
          .filter(f => f.user_phone === userPhone)
          .map(f => f.song_id);
      }
    }

    const songsWithFav = songs.map((s: any) => ({
      ...s,
      is_favorite: userFavorites.includes(s.id)
    }));

    res.json({ songs: songsWithFav });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Upload / Create Song
app.post('/api/songs', async (req, res) => {
  try {
    const { title, author, toque, audio_url, lyrics, duration } = req.body;
    if (!title || !audio_url) {
      return res.status(400).json({ error: 'Título e arquivo de áudio MP3 são obrigatórios' });
    }

    const dbRes = await executeQuery(`
      INSERT INTO songs (title, author, toque, audio_url, lyrics, duration)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, author || 'ABADÁ-Capoeira', toque || 'São Bento Grande', audio_url, lyrics || '', duration || '03:00']);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ song: dbRes.rows[0] });
    }

    const newSong = {
      id: Date.now(),
      title,
      author: author || 'ABADÁ-Capoeira',
      toque: toque || 'São Bento Grande',
      audio_url,
      lyrics: lyrics || '',
      duration: duration || '03:00',
      created_at: new Date().toISOString()
    };
    memoryStore.songs.unshift(newSong);
    res.status(201).json({ song: newSong });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete Song
app.delete('/api/songs/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await executeQuery('DELETE FROM playlist_songs WHERE song_id::text = $1::text', [String(id)]);
    await executeQuery('DELETE FROM favorites WHERE song_id::text = $1::text', [String(id)]);
    await executeQuery('DELETE FROM songs WHERE id::text = $1::text', [String(id)]);
    memoryStore.songs = memoryStore.songs.filter(s => String(s.id) !== String(id));
    res.json({ success: true, deleted: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Favorite
app.post('/api/favorites/toggle', async (req, res) => {
  try {
    const { user_phone, song_id } = req.body;
    const cleanPhone = user_phone?.replace(/\D/g, '');
    const songId = parseInt(song_id);

    if (!cleanPhone || !songId) {
      return res.status(400).json({ error: 'Celular e ID da música obrigatórios' });
    }

    const check = await executeQuery('SELECT * FROM favorites WHERE user_phone = $1 AND song_id = $2', [cleanPhone, songId]);
    if (check && check.rows.length > 0) {
      await executeQuery('DELETE FROM favorites WHERE user_phone = $1 AND song_id = $2', [cleanPhone, songId]);
      return res.json({ is_favorite: false });
    } else if (check) {
      await executeQuery('INSERT INTO favorites (user_phone, song_id) VALUES ($1, $2)', [cleanPhone, songId]);
      return res.json({ is_favorite: true });
    }

    // Memory fallback
    const memIdx = memoryStore.favorites.findIndex(f => f.user_phone === cleanPhone && f.song_id === songId);
    if (memIdx !== -1) {
      memoryStore.favorites.splice(memIdx, 1);
      return res.json({ is_favorite: false });
    } else {
      memoryStore.favorites.push({ user_phone: cleanPhone, song_id: songId });
      return res.json({ is_favorite: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- PLAYLISTS ----------------

// Get user playlists with songs
app.get('/api/playlists', async (req, res) => {
  try {
    const userPhone = (req.query.user_phone as string)?.replace(/\D/g, '');
    if (!userPhone) return res.status(400).json({ error: 'user_phone é obrigatório' });

    const pRes = await executeQuery('SELECT * FROM playlists WHERE user_phone = $1 ORDER BY id DESC', [userPhone]);
    let playlists = pRes ? pRes.rows : memoryStore.playlists.filter(p => p.user_phone === userPhone);

    const fullPlaylists = await Promise.all(playlists.map(async (p: any) => {
      const sRes = await executeQuery(`
        SELECT s.* FROM songs s
        JOIN playlist_songs ps ON ps.song_id = s.id
        WHERE ps.playlist_id = $1
      `, [p.id]);

      const songs = sRes ? sRes.rows : [];
      return { ...p, songs };
    }));

    res.json({ playlists: fullPlaylists });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Playlist
app.post('/api/playlists', async (req, res) => {
  try {
    const { user_phone, name, description } = req.body;
    const cleanPhone = user_phone?.replace(/\D/g, '');
    if (!cleanPhone || !name) {
      return res.status(400).json({ error: 'Nome da playlist é obrigatório' });
    }

    const dbRes = await executeQuery(`
      INSERT INTO playlists (user_phone, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [cleanPhone, name, description || '']);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ playlist: { ...dbRes.rows[0], songs: [] } });
    }

    const newP = {
      id: Date.now(),
      user_phone: cleanPhone,
      name,
      description: description || '',
      created_at: new Date().toISOString(),
      songs: []
    };
    memoryStore.playlists.unshift(newP);
    res.status(201).json({ playlist: newP });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add Song to Playlist
app.post('/api/playlists/:id/songs', async (req, res) => {
  try {
    const playlistId = parseInt(req.params.id);
    const { song_id } = req.body;
    const songId = parseInt(song_id);

    await executeQuery(`
      INSERT INTO playlist_songs (playlist_id, song_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [playlistId, songId]);

    const memExists = memoryStore.playlist_songs.some(ps => ps.playlist_id === playlistId && ps.song_id === songId);
    if (!memExists) {
      memoryStore.playlist_songs.push({ playlist_id: playlistId, song_id: songId });
    }

    res.json({ success: true, playlist_id: playlistId, song_id: songId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove Song from Playlist
app.delete('/api/playlists/:id/songs/:songId', async (req, res) => {
  try {
    const playlistId = req.params.id;
    const songId = req.params.songId;

    await executeQuery('DELETE FROM playlist_songs WHERE playlist_id::text = $1::text AND song_id::text = $2::text', [String(playlistId), String(songId)]);
    memoryStore.playlist_songs = memoryStore.playlist_songs.filter(ps => !(String(ps.playlist_id) === String(playlistId) && String(ps.song_id) === String(songId)));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Playlist
app.delete('/api/playlists/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    await executeQuery('DELETE FROM playlist_songs WHERE playlist_id::text = $1::text', [String(playlistId)]);
    await executeQuery('DELETE FROM playlists WHERE id::text = $1::text', [String(playlistId)]);
    memoryStore.playlists = memoryStore.playlists.filter(p => String(p.id) !== String(playlistId));
    res.json({ success: true, deleted: playlistId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- VIDEOS ----------------

app.get('/api/videos', async (req, res) => {
  try {
    const dbRes = await executeQuery('SELECT * FROM videos ORDER BY id DESC');
    res.json({ videos: dbRes ? dbRes.rows : memoryStore.videos });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const { title, category, youtube_url, file_url, description } = req.body;
    if (!title || (!youtube_url && !file_url)) {
      return res.status(400).json({ error: 'Título e link do YouTube ou arquivo de vídeo são obrigatórios' });
    }

    const dbRes = await executeQuery(`
      INSERT INTO videos (title, category, youtube_url, file_url, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, category || 'Geral', youtube_url || null, file_url || null, description || '']);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ video: dbRes.rows[0] });
    }

    const newV = {
      id: Date.now(),
      title,
      category: category || 'Geral',
      youtube_url: youtube_url || null,
      file_url: file_url || null,
      description: description || '',
      created_at: new Date().toISOString()
    };
    memoryStore.videos.unshift(newV);
    res.status(201).json({ video: newV });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await executeQuery('DELETE FROM videos WHERE id::text = $1::text', [String(id)]);
    memoryStore.videos = memoryStore.videos.filter(v => String(v.id) !== String(id));
    res.json({ success: true, deleted: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- PHOTOS ----------------

app.get('/api/photos', async (req, res) => {
  try {
    const dbRes = await executeQuery('SELECT * FROM photos ORDER BY id DESC');
    res.json({ photos: dbRes ? dbRes.rows : memoryStore.photos });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/photos', async (req, res) => {
  try {
    const { title, album, image_url, description } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Título e imagem são obrigatórios' });
    }

    const dbRes = await executeQuery(`
      INSERT INTO photos (title, album, image_url, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [title, album || 'Geral', image_url, description || '']);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ photo: dbRes.rows[0] });
    }

    const newPhoto = {
      id: Date.now(),
      title,
      album: album || 'Geral',
      image_url,
      description: description || '',
      created_at: new Date().toISOString()
    };
    memoryStore.photos.unshift(newPhoto);
    res.status(201).json({ photo: newPhoto });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/photos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await executeQuery('DELETE FROM photos WHERE id::text = $1::text', [String(id)]);
    memoryStore.photos = memoryStore.photos.filter(p => String(p.id) !== String(id));
    res.json({ success: true, deleted: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- AULAS (AULAS EM VÍDEO & TREINOS) ----------------

app.get('/api/lessons', async (req, res) => {
  try {
    const dbRes = await executeQuery('SELECT * FROM lessons ORDER BY id ASC');
    res.json({ lessons: dbRes ? dbRes.rows : memoryStore.lessons });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lessons', async (req, res) => {
  try {
    const { title, category, level, video_url, youtube_url, duration, description } = req.body;
    if (!title || (!video_url && !youtube_url)) {
      return res.status(400).json({ error: 'Título e vídeo (upload do dispositivo ou link) são obrigatórios' });
    }

    const dbRes = await executeQuery(`
      INSERT INTO lessons (title, category, level, video_url, youtube_url, duration, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, category || 'Fundamentos', level || 'Todos', video_url || null, youtube_url || null, duration || '15 min', description || '']);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ lesson: dbRes.rows[0] });
    }

    const newL = {
      id: Date.now(),
      title,
      category: category || 'Fundamentos',
      level: level || 'Todos',
      video_url: video_url || null,
      youtube_url: youtube_url || null,
      duration: duration || '15 min',
      description: description || '',
      created_at: new Date().toISOString()
    };
    memoryStore.lessons.unshift(newL);
    res.status(201).json({ lesson: newL });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/lessons/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await executeQuery('DELETE FROM lessons WHERE id::text = $1::text', [String(id)]);
    memoryStore.lessons = memoryStore.lessons.filter(l => String(l.id) !== String(id));
    res.json({ success: true, deleted: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- ANNOUNCEMENTS (MURAL DE RECADOS) ----------------

app.get('/api/announcements', async (req, res) => {
  try {
    const dbRes = await executeQuery('SELECT * FROM announcements ORDER BY is_pinned DESC, id DESC');
    res.json({ announcements: dbRes ? dbRes.rows : memoryStore.announcements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content, author_name, is_pinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo do recado são obrigatórios' });
    }

    const dbRes = await executeQuery(`
      INSERT INTO announcements (title, content, author_name, is_pinned)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [title, content, author_name || 'Mestre Administrador', !!is_pinned]);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ announcement: dbRes.rows[0] });
    }

    const newAnn = {
      id: Date.now(),
      title,
      content,
      author_name: author_name || 'Mestre Administrador',
      is_pinned: !!is_pinned,
      created_at: new Date().toISOString()
    };
    memoryStore.announcements.unshift(newAnn);
    res.status(201).json({ announcement: newAnn });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await executeQuery('DELETE FROM announcements WHERE id::text = $1::text', [String(id)]);
    memoryStore.announcements = memoryStore.announcements.filter(a => String(a.id) !== String(id));
    res.json({ success: true, deleted: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- BIRTHDAYS (ANIVERSARIANTES DO MÊS) ----------------

app.get('/api/birthdays', async (req, res) => {
  try {
    const targetMonth = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
    const padMonth = targetMonth < 10 ? `0${targetMonth}` : `${targetMonth}`;

    const dbRes = await executeQuery('SELECT id, phone, name, apelido, corda, birth_date, role FROM users WHERE is_blocked = FALSE');
    const allUsers = dbRes ? dbRes.rows : memoryStore.users;

    const birthdayUsers = allUsers.filter((u: any) => {
      if (!u.birth_date) return false;
      const bDate = u.birth_date.toString();
      // formats: YYYY-MM-DD or DD/MM/YYYY
      if (bDate.includes('-')) {
        const parts = bDate.split('-');
        if (parts.length >= 2) {
          const month = parts[1];
          return month === padMonth || parseInt(month) === targetMonth;
        }
      } else if (bDate.includes('/')) {
        const parts = bDate.split('/');
        if (parts.length >= 2) {
          const month = parts[1];
          return month === padMonth || parseInt(month) === targetMonth;
        }
      }
      return false;
    });

    // Sort by day of month
    birthdayUsers.sort((a: any, b: any) => {
      const getDay = (dateStr: string) => {
        if (!dateStr) return 99;
        if (dateStr.includes('-')) {
          const p = dateStr.split('-');
          return parseInt(p[2] || '0');
        }
        if (dateStr.includes('/')) {
          const p = dateStr.split('/');
          return parseInt(p[0] || '0');
        }
        return 99;
      };
      return getDay(a.birth_date) - getDay(b.birth_date);
    });

    res.json({
      current_month: targetMonth,
      total: birthdayUsers.length,
      users: birthdayUsers
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- EVENTS, RSVP & COMMENTS ----------------

app.get('/api/events', async (req, res) => {
  try {
    const userPhone = (req.query.user_phone as string)?.replace(/\D/g, '');

    const eRes = await executeQuery('SELECT * FROM events ORDER BY date ASC');
    let events = eRes ? eRes.rows : memoryStore.events;

    const fullEvents = await Promise.all(events.map(async (ev: any) => {
      // Get RSVPs
      const rsvpRes = await executeQuery('SELECT * FROM event_rsvps WHERE event_id = $1', [ev.id]);
      const rsvps = rsvpRes ? rsvpRes.rows : memoryStore.event_rsvps.filter(r => r.event_id === ev.id);

      const vouCount = rsvps.filter((r: any) => r.status === 'vou').length;
      const naoVouCount = rsvps.filter((r: any) => r.status === 'nao_vou').length;
      const talvezCount = rsvps.filter((r: any) => r.status === 'talvez').length;

      let myRsvp = null;
      if (userPhone) {
        const found = rsvps.find((r: any) => r.user_phone === userPhone);
        if (found) myRsvp = found.status;
      }

      // Get Comments
      const cRes = await executeQuery('SELECT * FROM event_comments WHERE event_id = $1 ORDER BY id DESC', [ev.id]);
      const comments = cRes ? cRes.rows : memoryStore.event_comments.filter(c => c.event_id === ev.id);

      return {
        ...ev,
        my_rsvp: myRsvp,
        counts: {
          vou: vouCount,
          nao_vou: naoVouCount,
          talvez: talvezCount
        },
        rsvps,
        comments
      };
    }));

    res.json({ events: fullEvents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, date, time, location } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Título e data do evento são obrigatórios' });
    }

    const dbRes = await executeQuery(`
      INSERT INTO events (title, description, date, time, location)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, description || '', date, time || '19:00', location || 'Academia ABADÁ']);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ event: dbRes.rows[0] });
    }

    const newEv = {
      id: Date.now(),
      title,
      description: description || '',
      date,
      time: time || '19:00',
      location: location || 'Academia ABADÁ',
      created_at: new Date().toISOString()
    };
    memoryStore.events.push(newEv);
    res.status(201).json({ event: newEv });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await executeQuery('DELETE FROM event_comments WHERE event_id::text = $1::text', [String(id)]);
    await executeQuery('DELETE FROM event_rsvps WHERE event_id::text = $1::text', [String(id)]);
    await executeQuery('DELETE FROM events WHERE id::text = $1::text', [String(id)]);
    memoryStore.events = memoryStore.events.filter(e => String(e.id) !== String(id));
    memoryStore.event_rsvps = memoryStore.event_rsvps.filter(r => String(r.event_id) !== String(id));
    memoryStore.event_comments = memoryStore.event_comments.filter(c => String(c.event_id) !== String(id));
    res.json({ success: true, deleted: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// RSVP to Event
app.post('/api/events/:id/rsvp', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { user_phone, status, user_name, user_apelido } = req.body;
    const cleanPhone = user_phone?.replace(/\D/g, '');

    if (!cleanPhone || !['vou', 'nao_vou', 'talvez'].includes(status)) {
      return res.status(400).json({ error: 'Status de presença inválido' });
    }

    await executeQuery(`
      INSERT INTO event_rsvps (event_id, user_phone, status, user_name, user_apelido)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (event_id, user_phone)
      DO UPDATE SET status = $3, user_name = $4, user_apelido = $5
    `, [eventId, cleanPhone, status, user_name || 'Aluno', user_apelido || '']);

    const memIdx = memoryStore.event_rsvps.findIndex(r => r.event_id === eventId && r.user_phone === cleanPhone);
    if (memIdx !== -1) {
      memoryStore.event_rsvps[memIdx].status = status;
    } else {
      memoryStore.event_rsvps.push({
        event_id: eventId,
        user_phone: cleanPhone,
        status,
        user_name: user_name || 'Aluno',
        user_apelido: user_apelido || ''
      });
    }

    res.json({ success: true, event_id: eventId, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Comment & Rate Event
app.post('/api/events/:id/comments', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { user_phone, user_name, user_apelido, comment, rating } = req.body;
    const cleanPhone = user_phone?.replace(/\D/g, '');

    if (!cleanPhone || !comment) {
      return res.status(400).json({ error: 'Comentário é obrigatório' });
    }

    const finalRating = Math.min(5, Math.max(1, parseInt(rating) || 5));

    const dbRes = await executeQuery(`
      INSERT INTO event_comments (event_id, user_phone, user_name, user_apelido, comment, rating)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [eventId, cleanPhone, user_name || 'Aluno', user_apelido || '', comment, finalRating]);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ comment: dbRes.rows[0] });
    }

    const newComment = {
      id: Date.now(),
      event_id: eventId,
      user_phone: cleanPhone,
      user_name: user_name || 'Aluno',
      user_apelido: user_apelido || '',
      comment,
      rating: finalRating,
      created_at: new Date().toISOString()
    };
    memoryStore.event_comments.unshift(newComment);
    res.status(201).json({ comment: newComment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- CHAT INTERNO COM ADMINISTRADORES ----------------

// Get all active administrators that students can message
app.get('/api/chat/admins', async (req, res) => {
  try {
    const dbRes = await executeQuery(`
      SELECT phone, name, apelido, corda, role 
      FROM users 
      WHERE role = 'admin' AND is_blocked = FALSE
      ORDER BY phone = '41984842941' DESC, name ASC
    `);

    let admins = dbRes ? dbRes.rows : memoryStore.users.filter(u => u.role === 'admin' && !u.is_blocked);
    res.json({ admins });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all student conversation threads
app.get('/api/chat/threads', async (req, res) => {
  try {
    const adminPhone = (req.query.admin_phone as string)?.replace(/\D/g, '');

    const dbRes = await executeQuery(`
      SELECT DISTINCT 
        CASE 
          WHEN sender_phone = $1 THEN recipient_phone 
          ELSE sender_phone 
        END AS student_phone
      FROM messages
      WHERE sender_phone = $1 OR recipient_phone = $1
    `, [adminPhone || '41984842941']);

    let studentPhones: string[] = [];
    if (dbRes) {
      studentPhones = dbRes.rows.map((r: any) => r.student_phone);
    } else {
      const set = new Set<string>();
      memoryStore.messages.forEach(m => {
        if (m.sender_phone === adminPhone) set.add(m.recipient_phone);
        if (m.recipient_phone === adminPhone) set.add(m.sender_phone);
      });
      studentPhones = Array.from(set);
    }

    // Fetch student info & last message
    const threads = await Promise.all(studentPhones.map(async (phone) => {
      const uRes = await executeQuery('SELECT name, apelido, corda, phone FROM users WHERE phone = $1', [phone]);
      const user = uRes && uRes.rows.length > 0 ? uRes.rows[0] : memoryStore.users.find(u => u.phone === phone) || { phone, name: 'Aluno', apelido: '' };

      const mRes = await executeQuery(`
        SELECT * FROM messages
        WHERE (sender_phone = $1 AND recipient_phone = $2)
           OR (sender_phone = $2 AND recipient_phone = $1)
        ORDER BY created_at DESC LIMIT 1
      `, [adminPhone, phone]);

      const lastMessage = mRes && mRes.rows.length > 0 ? mRes.rows[0] : null;

      const unreadRes = await executeQuery(`
        SELECT COUNT(*) FROM messages
        WHERE sender_phone = $1 AND recipient_phone = $2 AND read = FALSE
      `, [phone, adminPhone]);

      const unread = unreadRes ? parseInt(unreadRes.rows[0].count) : 0;

      return {
        student: user,
        last_message: lastMessage,
        unread_count: unread
      };
    }));

    res.json({ threads });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages between two phones
app.get('/api/chat/messages', async (req, res) => {
  try {
    const user1 = (req.query.user1 as string)?.replace(/\D/g, '');
    const user2 = (req.query.user2 as string)?.replace(/\D/g, '');

    if (!user1 || !user2) {
      return res.status(400).json({ error: 'user1 e user2 são obrigatórios' });
    }

    const dbRes = await executeQuery(`
      SELECT * FROM messages
      WHERE (sender_phone = $1 AND recipient_phone = $2)
         OR (sender_phone = $2 AND recipient_phone = $1)
      ORDER BY id ASC
    `, [user1, user2]);

    let messages = dbRes ? dbRes.rows : memoryStore.messages.filter(m =>
      (m.sender_phone === user1 && m.recipient_phone === user2) ||
      (m.sender_phone === user2 && m.recipient_phone === user1)
    );

    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send Chat Message
app.post('/api/chat/messages', async (req, res) => {
  try {
    const { sender_phone, sender_name, recipient_phone, text } = req.body;
    const cleanSender = sender_phone?.replace(/\D/g, '');
    const cleanRecipient = recipient_phone?.replace(/\D/g, '');

    if (!cleanSender || !cleanRecipient || !text) {
      return res.status(400).json({ error: 'Remetente, destinatário e mensagem são obrigatórios' });
    }

    const dbRes = await executeQuery(`
      INSERT INTO messages (sender_phone, sender_name, recipient_phone, text, read)
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING *
    `, [cleanSender, sender_name || 'Usuário', cleanRecipient, text]);

    if (dbRes && dbRes.rows.length > 0) {
      return res.status(201).json({ message: dbRes.rows[0] });
    }

    const newMsg = {
      id: Date.now(),
      sender_phone: cleanSender,
      sender_name: sender_name || 'Usuário',
      recipient_phone: cleanRecipient,
      text,
      read: false,
      created_at: new Date().toISOString()
    };
    memoryStore.messages.push(newMsg);
    res.status(201).json({ message: newMsg });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
app.post('/api/chat/messages/read', async (req, res) => {
  try {
    const { reader_phone, sender_phone } = req.body;
    const cleanReader = reader_phone?.replace(/\D/g, '');
    const cleanSender = sender_phone?.replace(/\D/g, '');

    if (cleanReader && cleanSender) {
      await executeQuery(`
        UPDATE messages SET read = TRUE
        WHERE recipient_phone = $1 AND sender_phone = $2
      `, [cleanReader, cleanSender]);

      memoryStore.messages.forEach(m => {
        if (m.recipient_phone === cleanReader && m.sender_phone === cleanSender) {
          m.read = true;
        }
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- DASHBOARD STATS ----------------

app.get('/api/stats', async (req, res) => {
  try {
    const usersCountRes = await executeQuery('SELECT COUNT(*) FROM users');
    const songsCountRes = await executeQuery('SELECT COUNT(*) FROM songs');
    const lessonsCountRes = await executeQuery('SELECT COUNT(*) FROM lessons');
    const videosCountRes = await executeQuery('SELECT COUNT(*) FROM videos');
    const photosCountRes = await executeQuery('SELECT COUNT(*) FROM photos');
    const eventsCountRes = await executeQuery('SELECT COUNT(*) FROM events');

    const totalUsers = usersCountRes ? parseInt(usersCountRes.rows[0].count) : memoryStore.users.length;
    const totalSongs = songsCountRes ? parseInt(songsCountRes.rows[0].count) : memoryStore.songs.length;
    const totalLessons = lessonsCountRes ? parseInt(lessonsCountRes.rows[0].count) : memoryStore.lessons.length;
    const totalVideos = videosCountRes ? parseInt(videosCountRes.rows[0].count) : memoryStore.videos.length;
    const totalPhotos = photosCountRes ? parseInt(photosCountRes.rows[0].count) : memoryStore.photos.length;
    const totalEvents = eventsCountRes ? parseInt(eventsCountRes.rows[0].count) : memoryStore.events.length;

    res.json({
      totalUsers,
      totalSongs,
      totalLessons,
      totalVideos,
      totalPhotos,
      totalEvents,
      database: dbConnected ? 'Neon DB PostgreSQL' : 'Active In-Memory Storage'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware for Fullstack Development
async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
