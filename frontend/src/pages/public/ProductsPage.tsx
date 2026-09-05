import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Layers, Eye, PlusCircle } from 'lucide-react';
import { productsApi, categoriesApi } from '../../services/api';
import { Product, Category } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.getAll().then(res => {
      setCategories(res.data.results || res.data || []);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      const res = await productsApi.getAll(params);
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.material.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-metal-800 pb-6">
        <div>
          <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Showroom & Catalog</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wide mt-1">
            Workshop Products
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Precision fabricated metal works, custom cabinetry, and hardwood furniture in Addis Ababa.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search products, materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-metal-900 border border-metal-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === ''
              ? 'bg-brand-red text-white'
              : 'bg-metal-900 text-gray-300 hover:bg-metal-800 border border-metal-800'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-brand-red text-white'
                : 'bg-metal-900 text-gray-300 hover:bg-metal-800 border border-metal-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <LoadingSpinner text="Loading products..." />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try selecting a different category or refining your search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden hover:border-metal-700 transition-all flex flex-col group shadow-lg"
            >
              <div className="h-48 bg-metal-950 relative overflow-hidden flex items-center justify-center p-4">
                {product.primary_image ? (
                  <img
                    src={product.primary_image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-metal-700 flex flex-col items-center">
                    <Layers className="w-10 h-10 mb-2" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Hara Workshop</span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                  <StatusBadge status={product.stock_status} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-metal-400 block uppercase">
                    {product.category_name}
                  </span>
                  <h3 className="text-sm font-bold text-white group-hover:text-brand-red transition-colors line-clamp-1 mt-0.5">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-2">
                    <span className="font-semibold text-metal-400">Material:</span> {product.material}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-metal-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase">Starting Price</span>
                    <p className="text-sm font-black text-white">
                      {product.starting_price.toLocaleString()} ETB
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Link
                      to={`/products/${product.id}`}
                      className="bg-metal-800 hover:bg-metal-700 text-white p-2 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/request-quote?product=${encodeURIComponent(product.name)}`}
                      className="bg-brand-red hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                      title="Request Quote"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
