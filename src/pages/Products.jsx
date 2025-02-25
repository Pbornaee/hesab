import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function Products({ products, setProducts }) {
  const { currentUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'عمومی',
    variants: [
      {
        id: Date.now(),
        purchasePrice: '',
        salePrice: '',
        stock: '',
        isOriginal: true
      }
    ]
  });
  const [categories, setCategories] = useState([
    { id: 'general', label: 'عمومی', icon: 'box' },
    { id: 'food', label: 'خوراکی', icon: 'utensils' },
    { id: 'clothing', label: 'پوشاک', icon: 'tshirt' },
    { id: 'home', label: 'لوازم خانگی', icon: 'home' },
    { id: 'stationery', label: 'لوازم التحریر', icon: 'pen' }
  ]);
  const [newCategory, setNewCategory] = useState({
    label: '',
    icon: 'box'
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViewCategory, setSelectedViewCategory] = useState('all');
  const [isViewCategoryDropdownOpen, setIsViewCategoryDropdownOpen] = useState(false);
  const isProcessing = useRef(false);

  // اضافه کردن آیکون‌های موجود
  const availableIcons = [
    { name: 'box', label: 'جعبه' },
    { name: 'utensils', label: 'خوراکی' },
    { name: 'tshirt', label: 'پوشاک' },
    { name: 'home', label: 'خانه' },
    { name: 'pen', label: 'قلم' },
    { name: 'book', label: 'کتاب' },
    { name: 'mobile', label: 'موبایل' },
    { name: 'laptop', label: 'لپ‌تاپ' },
    { name: 'gift', label: 'هدیه' },
    { name: 'car', label: 'خودرو' }
  ];

  // لود دسته‌بندی‌ها از فایربیس
  useEffect(() => {
    const loadCategories = async () => {
      if (!currentUser || !currentUser.id) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (userDoc.exists() && userDoc.data().categories) {
          setCategories(userDoc.data().categories);
        }
      } catch (error) {
        console.error('خطا در بارگیری دسته‌بندی‌ها:', error);
      }
    };

    loadCategories();
  }, [currentUser]);

  // آپدیت handleAddCategory برای ذخیره در فایربیس
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.label) {
      alert('لطفاً نام دسته‌بندی را وارد کنید');
      return;
    }

    const categoryId = newCategory.label
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const updatedCategories = [
      ...categories,
      { id: categoryId, label: newCategory.label, icon: newCategory.icon }
    ];

    try {
      await setProducts([...products]); // این خط برای تریگر کردن آپدیت در فایربیس است
      setCategories(updatedCategories);
      setNewCategory({ label: '', icon: 'box' });
      setShowCategoryForm(false);
    } catch (error) {
      console.error('خطا در افزودن دسته‌بندی:', error);
      alert('خطا در افزودن دسته‌بندی');
    }
  };

  // حذف دسته‌بندی
  const handleDeleteCategory = (categoryId) => {
    if (products.some(p => p.category === categories.find(c => c.id === categoryId)?.label)) {
      alert('این دسته‌بندی دارای محصول است و نمی‌توان آن را حذف کرد');
      return;
    }

    if (window.confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
      setCategories(categories.filter(c => c.id !== categoryId));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'price' || name === 'stock') {
      // تبدیل اعداد فارسی به انگلیسی
      newValue = value.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      // فقط اعداد و نقطه
      const regex = /^\d*\.?\d{0,2}$/;
      if (!regex.test(newValue)) return;
    }

    setNewProduct(prev => ({ ...prev, [name]: newValue }));
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      variants: product.variants.map(v => ({
        ...v,
        purchasePrice: v.purchasePrice.toString(),
        stock: v.stock.toString()
      }))
    });
    setShowAddForm(true);
  };

  // آپدیت handleSubmit برای محصولات
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing.current) return;

    try {
      isProcessing.current = true;

      if (!newProduct.name) {
        alert('لطفاً نام محصول را وارد کنید');
        return;
      }

      const productToAdd = {
        ...newProduct,
        id: Date.now(),
        variants: newProduct.variants.map(variant => ({
          ...variant,
          purchasePrice: parseFloat(variant.purchasePrice) || 0,
          salePrice: parseFloat(variant.salePrice) || 0,
          stock: parseFloat(variant.stock) || 0
        }))
      };

      if (editingProduct) {
        // آپدیت محصول موجود
        const updatedProducts = products.map(p => 
          p.id === editingProduct.id ? productToAdd : p
        );
        await setProducts(updatedProducts);
      } else {
        // اضافه کردن محصول جدید
        await setProducts([productToAdd, ...products]);
      }

      setNewProduct({
        name: '',
        category: 'عمومی',
        variants: [
          {
            id: Date.now(),
            purchasePrice: '',
            stock: '',
            isOriginal: true
          }
        ]
      });
      setEditingProduct(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('خطا در ذخیره محصول:', error);
      alert('خطا در ذخیره محصول');
    } finally {
      isProcessing.current = false;
    }
  };

  // اضافه کردن فرم نرخ جدید
  const handleAddVariant = () => {
    setNewProduct(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: Date.now(),
          purchasePrice: '',
          salePrice: '',
          stock: '',
          isOriginal: false
        }
      ]
    }));
  };

  // حذف نرخ
  const handleRemoveVariant = (variantId) => {
    setNewProduct(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId)
    }));
  };

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num) => {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  };

  // فرمت کردن قیمت
  const formatPrice = (price) => {
    if (!price) return '۰ تومان';  // اگر قیمت undefined یا خالی بود
    return toPersianNumber(price.toLocaleString()) + ' تومان';
  };

  // استایل مشترک برای دکمه‌ها
  const buttonStyle = "flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors min-w-[160px]";

  // اضافه کردن فیلتر محصولات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedViewCategory === 'all' || product.category === selectedViewCategory;
    return matchesSearch && matchesCategory;
  });

  // اضافه کردن useEffect برای خواندن محصولات از فایربیس
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.products) {
            setProducts(userData.products);
          }
        }
      } catch (error) {
        console.error('خطا در بارگیری محصولات:', error);
      }
    };

    loadProducts();
  }, [currentUser]);

  const handleDelete = async (productId) => {
    if (window.confirm('آیا از حذف این محصول اطمینان دارید؟')) {
      try {
        // حذف محصول از آرایه محصولات
        const updatedProducts = products.filter(p => p.id !== productId);
        
        // آپدیت state و فایربیس
        await setProducts(updatedProducts);

        // نمایش پیام موفقیت
        alert('محصول با موفقیت حذف شد');
      } catch (error) {
        console.error('خطا در حذف محصول:', error);
        alert('خطا در حذف محصول');
      }
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      category: 'عمومی',
      variants: [
        {
          id: Date.now(),
          purchasePrice: '',
          salePrice: '',
          stock: '',
          isOriginal: true
        }
      ]
    });
  };

  return (
    <div className="lg:p-6 p-4 max-w-7xl mx-auto mt-16 lg:mt-0">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت محصولات</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setShowAddForm(true);
            }}
            className="flex-1 sm:w-40 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <i className="fas fa-plus"></i>
            افزودن محصول
          </button>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="flex-1 sm:w-40 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <i className="fas fa-tags"></i>
            دسته‌بندی‌ها
          </button>
        </div>
      </div>

      {/* فرم افزودن/ویرایش محصول */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام محصول
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* نرخ‌های محصول */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    نرخ‌های محصول
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + افزودن نرخ جدید
                  </button>
                </div>

                {newProduct.variants.map((variant, index) => (
                  <div key={variant.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium mb-2">
                      {variant.isOriginal ? 'نرخ اصلی' : `نرخ ${index + 1}`}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* قیمت خرید */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          قیمت خرید
                        </label>
                        <input
                          type="text"
                          value={variant.purchasePrice}
                          onChange={(e) => {
                            const newValue = e.target.value.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
                            if (!/^\d*\.?\d{0,2}$/.test(newValue)) return;
                            
                            setNewProduct(prev => ({
                              ...prev,
                              variants: prev.variants.map(v =>
                                v.id === variant.id ? { ...v, purchasePrice: newValue } : v
                              )
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="قیمت خرید..."
                        />
                      </div>
                      
                      {/* قیمت فروش - اضافه شده */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          قیمت فروش
                        </label>
                        <input
                          type="text"
                          value={variant.salePrice}
                          onChange={(e) => {
                            const newValue = e.target.value.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
                            if (!/^\d*\.?\d{0,2}$/.test(newValue)) return;
                            
                            setNewProduct(prev => ({
                              ...prev,
                              variants: prev.variants.map(v =>
                                v.id === variant.id ? { ...v, salePrice: newValue } : v
                              )
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="قیمت فروش..."
                        />
                      </div>

                      {/* موجودی */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          موجودی
                        </label>
                        <input
                          type="text"
                          value={variant.stock}
                          onChange={(e) => {
                            const newValue = e.target.value.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
                            if (!/^\d*\.?\d{0,2}$/.test(newValue)) return;
                            
                            setNewProduct(prev => ({
                              ...prev,
                              variants: prev.variants.map(v =>
                                v.id === variant.id ? { ...v, stock: newValue } : v
                              )
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="موجودی..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  دسته‌بندی
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-12 px-4 text-right bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {newProduct.category || 'انتخاب دسته‌بندی'}
                    </span>
                    <i className={`fas fa-chevron-down transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 py-2 bg-white rounded-lg shadow-lg border border-gray-200">
                      <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setNewProduct(prev => ({ ...prev, category: cat.label }));
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between
                              ${newProduct.category === cat.label ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                          >
                            <span>{cat.label}</span>
                            {newProduct.category === cat.label && (
                              <i className="fas fa-check text-blue-600"></i>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategoryForm(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-right px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                        >
                          <i className="fas fa-plus"></i>
                          <span>افزودن دسته‌بندی جدید</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isProcessing.current}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing.current ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <span>ثبت محصول</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال افزودن دسته‌بندی */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">مدیریت دسته‌بندی‌ها</h2>
              <button
                onClick={() => setShowCategoryForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newCategory.label}
                  onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="نام دسته‌بندی جدید"
                  dir="rtl"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  افزودن
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-600">{cat.label}</span>
                    {cat.id !== 'general' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* اضافه کردن بخش فیلتر قبل از جدول محصولات */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="fas fa-search absolute left-3 top-2.5 text-gray-400"></i>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsViewCategoryDropdownOpen(!isViewCategoryDropdownOpen)}
                className="w-full sm:w-48 h-10 px-4 text-right bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
              >
                <span className="text-sm text-gray-700">
                  {selectedViewCategory === 'all' ? 'همه دسته‌ها' : selectedViewCategory}
                </span>
                <i className={`fas fa-chevron-down transition-transform ${isViewCategoryDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isViewCategoryDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedViewCategory('all');
                      setIsViewCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between
                      ${selectedViewCategory === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                  >
                    <span>همه دسته‌ها</span>
                    {selectedViewCategory === 'all' && (
                      <i className="fas fa-check text-blue-600"></i>
                    )}
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedViewCategory(cat.label);
                        setIsViewCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between
                        ${selectedViewCategory === cat.label ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    >
                      <span>{cat.label}</span>
                      {selectedViewCategory === cat.label && (
                        <i className="fas fa-check text-blue-600"></i>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* تغییر در نمایش محصولات */}
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <i className="fas fa-search text-4xl mb-4"></i>
            <p>محصولی یافت نشد</p>
          </div>
        ) : (
          <>
            {/* نمایش موبایل */}
            <div className="md:hidden">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <span className="text-sm text-gray-500">{product.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    {product.variants.map((variant, index) => (
                      <div key={variant.id} className="mb-2 last:mb-0">
                        <div className={`text-sm ${variant.isOriginal ? 'font-medium' : 'text-gray-500'}`}>
                          <div className="flex justify-between items-center">
                            <span>
                              {variant.isOriginal ? 'نرخ اصلی' : `نرخ ${index + 1}`}
                            </span>
                            <span>{formatPrice(variant.purchasePrice || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span>موجودی:</span>
                            <span>
                              {toPersianNumber(variant.stock)}
                              {variant.stock === 0 && <span className="mr-1 text-xs text-red-500">(ناموجود)</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">دسته‌بندی</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">نرخ خرید</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">موجودی</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 w-20">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          {product.variants.map((variant, index) => (
                            <div key={variant.id} className={`${variant.isOriginal ? 'font-medium' : 'text-gray-500'}`}>
                              <div>خرید: {formatPrice(variant.purchasePrice || 0)}</div>
                              <div>فروش: {formatPrice(variant.salePrice || 0)}</div>
                              {variant.isOriginal && <span className="mr-1 text-xs text-blue-600">(نرخ اصلی)</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          {product.variants.map((variant, index) => (
                            <div key={variant.id} className={variant.isOriginal ? 'font-medium' : 'text-gray-500'}>
                              {toPersianNumber(variant.stock)}
                              {variant.stock === 0 && <span className="mr-1 text-xs text-red-500">(ناموجود)</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
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

export default Products; 