import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, ShieldCheck, Truck, Wrench, Layers, PlusCircle } from 'lucide-react';
import { productsApi } from '../../services/api';
import { Product } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      productsApi.getById(id)
        .then(res => setProduct(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading product specifications..." />;
  if (!product) return <div className="p-8 text-center text-white">Product not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        to="/products"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Product Catalog</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Gallery / Image Showcase */}
        <div className="space-y-4">
          <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden h-96 flex items-center justify-center p-6">
            {product.primary_image ? (
              <img
                src={product.primary_image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-metal-600">
                <Layers className="w-16 h-16 mx-auto mb-2" />
                <span className="text-xs uppercase font-bold">Hara Workshop Product</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6 text-left">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-bold text-brand-red uppercase tracking-wider">
                {product.category_name}
              </span>
              <StatusBadge status={product.stock_status} />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">
              {product.name}
            </h1>
            <p className="text-xs text-metal-400 font-mono mt-1">SKU: {product.sku}</p>
          </div>

          <div className="p-4 rounded-xl bg-metal-900 border border-metal-800 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-gray-400 block uppercase">Starting Price (ETB)</span>
              <span className="text-2xl font-black text-white">
                {product.starting_price.toLocaleString()} ETB
              </span>
            </div>
            <span className="text-xs text-metal-400">per {product.unit}</span>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Description</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{product.description}</p>
          </div>

          {/* Specifications Table */}
          <div className="bg-metal-900/60 border border-metal-800 rounded-xl p-4 text-xs space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              Dimensions & Material
            </h4>
            <div className="grid grid-cols-2 gap-2 text-gray-300 pt-1">
              <div><span className="text-gray-500">Material:</span> {product.material}</div>
              <div><span className="text-gray-500">Unit:</span> {product.unit}</div>
              {product.dimensions_length && (
                <div><span className="text-gray-500">Length:</span> {product.dimensions_length} {product.dimensions_unit}</div>
              )}
              {product.dimensions_width && (
                <div><span className="text-gray-500">Width:</span> {product.dimensions_width} {product.dimensions_unit}</div>
              )}
              {product.dimensions_height && (
                <div><span className="text-gray-500">Height:</span> {product.dimensions_height} {product.dimensions_unit}</div>
              )}
              <div><span className="text-gray-500">Customizable:</span> {product.is_customizable ? 'Yes, Bespoke Dimensions' : 'Standard'}</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <Link
              to={`/request-quote?product=${encodeURIComponent(product.name)}`}
              className="flex-1 inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-lg text-sm uppercase tracking-wider transition-colors shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request Quote for This Item</span>
            </Link>
            <a
              href="tel:+251926629999"
              className="inline-flex items-center justify-center bg-metal-800 hover:bg-metal-700 text-white font-semibold py-3.5 px-5 rounded-lg text-sm border border-metal-700 transition-colors"
            >
              <span>Call Workshop</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
