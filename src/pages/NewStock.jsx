import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function NewStock({ products, setProducts, stockLogs, setStockLogs }) {
  const { currentUser } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [newStock, setNewStock] = useState({
    quantity: '',
    price: ''
  });

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num) => {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  };

  // فرمت کردن قیمت
  const formatPrice = (price) => {
    return toPersianNumber(price.toLocaleString()) + ' تومان';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // تبدیل اعداد فارسی به انگلیسی
    newValue = value.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    
    if (!/^\d*\.?\d{0,2}$/.test(newValue)) return;

    setNewStock(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !newStock.quantity || !newStock.price) {
      alert('لطفاً همه فیلدهای ضروری را پر کنید');
      return;
    }

    try {
      const quantity = parseFloat(newStock.quantity);
      const price = parseFloat(newStock.price);

      // بررسی وجود نرخ مشابه
      const existingVariantIndex = selectedProduct.variants.findIndex(v => v.purchasePrice === price);

      let updatedProducts;
      if (existingVariantIndex !== -1) {
        updatedProducts = products.map(p => 
          p.id === selectedProduct.id 
            ? {
                ...p,
                variants: p.variants.map((v, i) => 
                  i === existingVariantIndex
                    ? { ...v, stock: v.stock + quantity }
                    : v
                )
              }
            : p
        );
      } else {
        updatedProducts = products.map(p => 
          p.id === selectedProduct.id 
            ? {
                ...p,
                variants: [
                  ...p.variants,
                  {
                    id: Date.now(),
                    purchasePrice: price,
                    stock: quantity,
                    isOriginal: false
                  }
                ]
              }
            : p
        );
      }

      // ثبت در لاگ بارها
      const stockLog = {
        id: Date.now(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        price,
        timestamp: new Date().toISOString()
      };

      // آپدیت همزمان محصولات و لاگ‌ها
      await Promise.all([
        setProducts(updatedProducts),
        setStockLogs([stockLog, ...stockLogs])
      ]);

      // ریست فرم
      setNewStock({
        quantity: '',
        price: ''
      });
      setSelectedProduct(null);
      setIsProductDropdownOpen(false);
    } catch (error) {
      console.error('خطا در ثبت بار:', error);
      alert('خطا در ثبت بار');
    }
  };

  // فیلتر محصولات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="lg:p-6 p-4 max-w-7xl mx-auto mt-16 lg:mt-0">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ثبت بار جدید</h1>
      </div>

      {/* فرم اصلی */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* انتخاب محصول */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              انتخاب محصول
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                className="w-full h-12 px-4 text-right bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {selectedProduct ? selectedProduct.name : 'انتخاب محصول'}
                </span>
                <i className={`fas fa-chevron-down transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isProductDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی محصول..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        محصولی یافت نشد
                      </div>
                    ) : (
                      filteredProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsProductDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between
                            ${selectedProduct?.id === product.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              {product.variants.map((v, i) => (
                                <span key={v.id} className={i > 0 ? 'mr-2' : ''}>
                                  {formatPrice(v.purchasePrice)} ({toPersianNumber(v.stock)})
                                </span>
                              ))}
                            </div>
                          </div>
                          {selectedProduct?.id === product.id && (
                            <i className="fas fa-check text-blue-600"></i>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedProduct && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تعداد
                </label>
                <input
                  type="text"
                  name="quantity"
                  value={newStock.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  قیمت خرید (تومان)
                </label>
                <input
                  type="text"
                  name="price"
                  value={newStock.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedProduct}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ثبت بار جدید
            </button>
          </div>
        </form>
      </div>

      {/* لیست بارهای ثبت شده */}
      <div className="bg-white rounded-xl shadow-sm mt-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">لیست بارهای ثبت شده</h2>
        </div>

        {stockLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <i className="fas fa-box text-4xl mb-4"></i>
            <p>هنوز باری ثبت نشده است</p>
          </div>
        ) : (
          <>
            {/* نمایش موبایل */}
            <div className="md:hidden">
              {stockLogs.map((log) => (
                <div key={log.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{log.productName}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        <div>تعداد: {toPersianNumber(log.quantity)}</div>
                        <div>قیمت: {formatPrice(log.price)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleDateString('fa-IR')}
                      <br />
                      {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* نمایش دسکتاپ */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">نام محصول</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">تعداد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">قیمت خرید</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">تاریخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">ساعت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{log.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{toPersianNumber(log.quantity)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(log.price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NewStock; 