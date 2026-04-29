// ============================================
// BACKEND - LOJA VIRTUAL DE ROUPAS
// Node.js + Express + SQLite
// ============================================

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');
require('dotenv').config();

const app = express();

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// ============ BANCO DE DADOS ============
const db = new sqlite3.Database(':memory:');

// Inicializar tabelas
db.serialize(() => {
  // Tabela de Usuários
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabela de Produtos
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    colors TEXT,
    sizes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabela de Carrinhos
  db.run(`CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    size TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  // Tabela de Pedidos
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_amount REAL,
    shipping_cost REAL DEFAULT 15.00,
    tax REAL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    tracking_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Tabela de Itens do Pedido
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    size TEXT,
    color TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  console.log('✅ Banco de dados inicializado');

  // Inserir produtos padrão
  insertDefaultProducts();
});

// Função para inserir produtos padrão
function insertDefaultProducts() {
  const products = [
    {
      name: 'Camiseta Premium Branca',
      category: 'camisetas',
      description: '100% algodão, confortável',
      price: 89.90,
      colors: JSON.stringify(['Branco', 'Preto', 'Cinza']),
      sizes: JSON.stringify(['P', 'M', 'G', 'GG']),
      stock: 50
    },
    {
      name: 'Calça Jeans Clássica',
      category: 'calças',
      description: 'Jeans azul profundo',
      price: 159.90,
      colors: JSON.stringify(['Azul', 'Preto']),
      sizes: JSON.stringify(['34', '36', '38', '40', '42']),
      stock: 40
    },
    {
      name: 'Vestido Floral',
      category: 'vestidos',
      description: 'Vestido estampado floral',
      price: 199.90,
      colors: JSON.stringify(['Vermelho', 'Azul', 'Verde']),
      sizes: JSON.stringify(['P', 'M', 'G']),
      stock: 30
    },
    {
      name: 'Jaqueta de Couro',
      category: 'jaquetas',
      description: 'Jaqueta de couro genuíno',
      price: 399.90,
      colors: JSON.stringify(['Preto', 'Marrom']),
      sizes: JSON.stringify(['P', 'M', 'G', 'GG']),
      stock: 20
    },
    {
      name: 'Short Casual',
      category: 'shorts',
      description: 'Short confortável para o dia a dia',
      price: 79.90,
      colors: JSON.stringify(['Azul', 'Cáqui', 'Preto']),
      sizes: JSON.stringify(['P', 'M', 'G']),
      stock: 60
    },
    {
      name: 'Top Esporte',
      category: 'esportes',
      description: 'Top para atividades físicas',
      price: 99.90,
      colors: JSON.stringify(['Preto', 'Rosa', 'Azul']),
      sizes: JSON.stringify(['P', 'M', 'G']),
      stock: 45
    }
  ];

  products.forEach(p => {
    db.run(
      `INSERT INTO products (name, category, description, price, colors, sizes, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.category, p.description, p.price, p.colors, p.sizes, p.stock]
    );
  });
}

const SECRET_KEY = process.env.SECRET_KEY || 'sua-chave-secreta-segura-2026';

// ============ AUTENTICAÇÃO ============

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = decoded;
    next();
  });
};

// Registrar cliente
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  db.run(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email já registrado' });
      }
      res.status(201).json({ message: 'Conta criada com sucesso', userId: this.lastID });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  });
});

// ============ PRODUTOS ============

// Listar todos os produtos
app.get('/api/products', (req, res) => {
  const { category } = req.query;

  let query = 'SELECT * FROM products';
  let params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar produtos' });
    }

    const formattedProducts = products.map(p => ({
      ...p,
      colors: JSON.parse(p.colors || '[]'),
      sizes: JSON.parse(p.sizes || '[]')
    }));

    res.json(formattedProducts);
  });
});

// Obter detalhes de um produto
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({
      ...product,
      colors: JSON.parse(product.colors || '[]'),
      sizes: JSON.parse(product.sizes || '[]')
    });
  });
});

// ============ CARRINHO ============

// Obter carrinho do usuário
app.get('/api/cart', verifyToken, (req, res) => {
  db.all(
    `SELECT c.*, p.name, p.price, p.image_url
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?`,
    [req.user.id],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar carrinho' });
      }

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      res.json({ items, total });
    }
  );
});

// Adicionar ao carrinho
app.post('/api/cart/add', verifyToken, (req, res) => {
  const { product_id, quantity, size, color } = req.body;

  db.run(
    'INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, product_id, quantity, size, color],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
      }
      res.json({ message: 'Produto adicionado ao carrinho', cartItemId: this.lastID });
    }
  );
});

// Remover do carrinho
app.delete('/api/cart/:itemId', verifyToken, (req, res) => {
  const { itemId } = req.params;

  db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [itemId, req.user.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao remover item' });
    }
    res.json({ message: 'Item removido do carrinho' });
  });
});

// ============ PEDIDOS ============

// Criar pedido
app.post('/api/orders', verifyToken, (req, res) => {
  const {
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    payment_method,
    total_amount,
    tax
  } = req.body;

  // Criar pedido
  db.run(
    `INSERT INTO orders (user_id, total_amount, tax, status, payment_method, shipping_address, shipping_city, shipping_state, shipping_zip)
     VALUES (?, ?, ?, 'paid', ?, ?, ?, ?, ?)`,
    [req.user.id, total_amount, tax, payment_method, shipping_address, shipping_city, shipping_state, shipping_zip],
    function(orderId) {
      const newOrderId = this.lastID;

      // Buscar itens do carrinho
      db.all(
        `SELECT c.*, p.price FROM cart_items c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [req.user.id],
        (err, cartItems) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao processar pedido' });
          }

          // Adicionar itens ao pedido
          let itemsAdded = 0;
          cartItems.forEach(item => {
            db.run(
              'INSERT INTO order_items (order_id, product_id, quantity, price, size, color) VALUES (?, ?, ?, ?, ?, ?)',
              [newOrderId, item.product_id, item.quantity, item.price, item.size, item.color],
              () => {
                itemsAdded++;
                if (itemsAdded === cartItems.length) {
                  // Limpar carrinho
                  db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id], () => {
                    res.status(201).json({
                      message: 'Pedido criado com sucesso',
                      orderId: newOrderId,
                      trackingNumber: `TRACK-${newOrderId}-${Date.now()}`
                    });
                  });
                }
              }
            );
          });
        }
      );
    }
  );
});

// Obter histórico de pedidos
app.get('/api/orders', verifyToken, (req, res) => {
  db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar pedidos' });
      }
      res.json(orders);
    }
  );
});

// Obter detalhes de um pedido
app.get('/api/orders/:orderId', verifyToken, (req, res) => {
  const { orderId } = req.params;

  db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id], (err, order) => {
    if (err || !order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId], (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar itens do pedido' });
      }

      res.json({ ...order, items });
    });
  });
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', message: 'Loja Virtual rodando normalmente' });
});

// ============ INICIALIZAR SERVIDOR ============

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   👕 LOJA VIRTUAL DE ROUPAS 👕        ║
  ║                                        ║
  ║   Servidor rodando em:                ║
  ║   http://localhost:${PORT}             ║
  ║                                        ║
  ║   ✅ Banco de dados inicializado      ║
  ║   ✅ Produtos carregados             ║
  ║   ✅ Pronto para compras!            ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
