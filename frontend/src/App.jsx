// ============================================
// FRONTEND - LOJA VIRTUAL DE ROUPAS
// React + Tailwind CSS
// ============================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// ============ COMPONENTES ============

// Header/Navegação
function Header({ cartCount, isLoggedIn, onLogout }) {
  return (
    <header className="bg-gray-900 text-white py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <div className="text-2xl font-bold">👕 VirtualStyle</div>
        <nav className="flex gap-6 items-center">
          <a href="#home" className="hover:text-gray-300">Início</a>
          <a href="#catalog" className="hover:text-gray-300">Catálogo</a>
          <a href="#cart" className="hover:text-gray-300 relative">
            🛒 Carrinho
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cartCount}
              </span>
            )}
          </a>
          {isLoggedIn ? (
            <button onClick={onLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
              Sair
            </button>
          ) : (
            <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
              Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

// Card de Produto
function ProductCard({ product, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition bg-white">
      <div className="bg-gray-200 h-48 flex items-center justify-center">
        <span className="text-gray-400">📸 Imagem do produto</span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>

        {/* Tamanhos */}
        {product.sizes?.length > 0 && (
          <div className="mb-3">
            <label className="text-sm font-semibold">Tamanho:</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full border p-2 rounded text-sm mt-1"
            >
              {product.sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}

        {/* Cores */}
        {product.colors?.length > 0 && (
          <div className="mb-3">
            <label className="text-sm font-semibold">Cor:</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full border p-2 rounded text-sm mt-1"
            >
              {product.colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        )}

        {/* Preço */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-green-600">
            R$ {product.price.toFixed(2)}
          </span>
          <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
          </span>
        </div>

        {/* Botão */}
        <button
          onClick={() => onAddToCart(product, selectedSize, selectedColor)}
          disabled={product.stock === 0}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
}

// Página Home
function Home() {
  return (
    <section id="home" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-4">Bem-vindo à VirtualStyle</h1>
        <p className="text-xl mb-6">Moda de qualidade entregue na sua porta</p>
        <button className="bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100">
          Começar a Comprar
        </button>
      </div>
    </section>
  );
}

// Página Catálogo
function Catalog({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = category ? `${API_URL}/products?category=${category}` : `${API_URL}/products`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['camisetas', 'calças', 'vestidos', 'jaquetas', 'shorts', 'esportes'];

  return (
    <section id="catalog" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8">Catálogo de Produtos</h2>

        {/* Filtro por categoria */}
        <div className="mb-8 flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory(null)}
            className={`px-4 py-2 rounded ${!category ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded capitalize ${
                category === cat ? 'bg-blue-600 text-white' : 'bg-white border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Produtos */}
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-600">
            Nenhum produto encontrado
          </div>
        )}
      </div>
    </section>
  );
}

// Página Carrinho
function Cart({ token, cartItems, onRemoveFromCart }) {
  const [shippingCost] = useState(15.00);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% de imposto
  const total = subtotal + tax + shippingCost;

  return (
    <section id="cart" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8">🛒 Carrinho de Compras</h2>

        {cartItems.length === 0 ? (
          <div className="bg-white p-8 rounded text-center">
            <p className="text-gray-600 mb-4">Seu carrinho está vazio</p>
            <a href="#catalog" className="text-blue-600 hover:underline">
              Voltar ao catálogo
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.color} | Tamanho: {item.size} | Qtd: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo */}
            <div className="bg-white p-6 rounded h-fit">
              <h3 className="font-bold text-xl mb-4">Resumo do Pedido</h3>
              <div className="space-y-2 mb-4 border-b pb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Imposto (10%):</span>
                  <span>R$ {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {shippingCost.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-xl font-bold mb-6">
                <span>Total:</span>
                <span className="text-green-600">R$ {total.toFixed(2)}</span>
              </div>
              <button className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold">
                Ir para Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4">Sobre Nós</h4>
            <p className="text-gray-400">Sua loja de moda online de confiança</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Contato</h4>
            <p className="text-gray-400">📧 contato@virtualstyle.com</p>
            <p className="text-gray-400">📞 (11) 9999-9999</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Redes Sociais</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 text-center text-gray-400">
          <p>&copy; 2026 VirtualStyle. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

// ============ APP PRINCIPAL ============

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cartItems, setCartItems] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');

  // Buscar carrinho ao fazer login
  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token]);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(response.data.items);
    } catch (error) {
      console.error('Erro ao buscar carrinho:', error);
    }
  };

  const handleAddToCart = async (product, size, color) => {
    if (!token) {
      alert('Faça login para adicionar ao carrinho');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/cart/add`,
        {
          product_id: product.id,
          quantity: 1,
          size,
          color
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
      alert('Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      alert('Erro ao adicionar ao carrinho');
    }
  };

  const handleRemoveFromCart = async (cartItemId) => {
    try {
      await axios.delete(`${API_URL}/cart/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCart();
    } catch (error) {
      console.error('Erro ao remover:', error);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setCartItems([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header
        cartCount={cartItems.length}
        isLoggedIn={!!token}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <Home />
        <Catalog onAddToCart={handleAddToCart} />
        <Cart
          token={token}
          cartItems={cartItems}
          onRemoveFromCart={handleRemoveFromCart}
        />
      </main>

      <Footer />
    </div>
  );
}
