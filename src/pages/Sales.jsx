import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { format, parse, parseISO } from 'date-fns-jalali';

function Sales({ products, setProducts, todaySales, setTodaySales, salesArchive, setSalesArchive }) {
  const { currentUser } = useAuth();
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newSale, setNewSale] = useState({
    productId: '',
    quantity: 1,
    price: '',
    discount: 0,
    customerName: '',
    year: format(new Date(), 'yyyy'),
    month: format(new Date(), 'MM'),
    day: format(new Date(), 'dd')
  });
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessing = useRef(false);
  const [editingSale, setEditingSale] = useState(null);
  const [startDateFields, setStartDateFields] = useState({
    year: '',
    month: '',
    day: ''
  });
  const [endDateFields, setEndDateFields] = useState({
    year: '',
    month: '',
    day: ''
  });
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');

  // تابع تبدیل اعداد فارسی به انگلیسی
  const toEnglishNumber = (str) => {
    return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  };

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num) => {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  };

  // فرمت کردن قیمت
  const formatPrice = (price) => {
    return toPersianNumber(price.toLocaleString()) + ' تومان';
  };

  // محاسبه مجموع فروش امروز
  const calculateTotalSales = () => {
    return todaySales.reduce((total, sale) => {
      return total + ((sale.salePrice * sale.quantity) - sale.discount);
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // برای فیلدهای عددی
    if (name === 'quantity' || name === 'price' || name === 'discount') {
      // تبدیل اعداد فارسی به انگلیسی
      newValue = toEnglishNumber(value);
      if (!/^\d*\.?\d{0,2}$/.test(newValue)) return;
    }
    // برای فیلدهای تاریخ
    else if (name === 'year' || name === 'month' || name === 'day') {
      // تبدیل به اعداد فارسی برای نمایش
      newValue = value.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    }

    setNewSale(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing.current) return;

    if (!selectedProduct || !newSale.quantity || !newSale.price) {
      alert('لطفاً همه فیلدهای ضروری را پر کنید');
      return;
    }

    try {
      setIsSubmitting(true);
      isProcessing.current = true;

      // تبدیل اعداد فارسی به انگلیسی
      const persianDate = `${toEnglishNumber(newSale.year)}/${toEnglishNumber(newSale.month)}/${toEnglishNumber(newSale.day)}`;
      const now = new Date();
      const timestamp = parse(persianDate, 'yyyy/MM/dd', now);
      
      // تنظیم ساعت
      timestamp.setHours(now.getHours());
      timestamp.setMinutes(now.getMinutes());
      timestamp.setSeconds(now.getSeconds());
      timestamp.setMilliseconds(0);

      const quantity = parseFloat(newSale.quantity);

      if (editingSale) {
        // 1. برگرداندن موجودی قبلی به محصول
        const oldSale = todaySales.find(s => s.id === editingSale.id);
        const oldProduct = products.find(p => p.id === oldSale.productId);
        
        // برگرداندن موجودی به اولین واریانت
        const updatedOldVariants = [...oldProduct.variants];
        updatedOldVariants[0].stock += oldSale.quantity;

        await setProducts(products.map(p => 
          p.id === oldProduct.id 
            ? { ...p, variants: updatedOldVariants }
            : p
        ));

        // 2. کم کردن موجودی جدید
        const totalStock = selectedProduct.variants.reduce((total, v) => total + v.stock, 0);
        if (quantity > totalStock) {
          alert('موجودی کافی نیست');
          return;
        }

        let remainingQuantity = quantity;
        let totalPurchaseCost = 0;
        const updatedVariants = [...selectedProduct.variants]
          .sort((a, b) => a.purchasePrice - b.purchasePrice)
          .map(variant => {
            if (remainingQuantity <= 0) return variant;
            
            const quantityToDeduct = Math.min(remainingQuantity, variant.stock);
            remainingQuantity -= quantityToDeduct;
            totalPurchaseCost += variant.purchasePrice * quantityToDeduct;
            
            return {
              ...variant,
              stock: variant.stock - quantityToDeduct
            };
          });

        // 3. آپدیت فروش و محصول
        await Promise.all([
          setProducts(products.map(p => 
            p.id === selectedProduct.id 
              ? { ...p, variants: updatedVariants }
              : p
          )),
          setTodaySales(todaySales.map(s => s.id === editingSale.id ? {
            id: editingSale.id,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity,
            salePrice: parseFloat(newSale.price),
            discount: parseFloat(newSale.discount || 0),
            purchaseCost: totalPurchaseCost,
            customerName: newSale.customerName,
            timestamp: timestamp.toISOString(),
            total: (quantity * parseFloat(newSale.price)) - parseFloat(newSale.discount || 0)
          } : s))
        ]);

        setEditingSale(null);
        setShowSaleForm(false);
      } else {
        // افزودن فروش جدید
        const totalStock = selectedProduct.variants.reduce((total, v) => total + v.stock, 0);
        if (quantity > totalStock) {
          alert('موجودی کافی نیست');
          return;
        }

        let remainingQuantity = quantity;
        let totalPurchaseCost = 0;
        const updatedVariants = [...selectedProduct.variants]
          .sort((a, b) => a.purchasePrice - b.purchasePrice)
          .map(variant => {
            if (remainingQuantity <= 0) return variant;
            
            const quantityToDeduct = Math.min(remainingQuantity, variant.stock);
            remainingQuantity -= quantityToDeduct;
            totalPurchaseCost += variant.purchasePrice * quantityToDeduct;
            
            return {
              ...variant,
              stock: variant.stock - quantityToDeduct
            };
          });

        await Promise.all([
          setTodaySales([{
            id: Date.now(),
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity,
            salePrice: parseFloat(newSale.price),
            discount: parseFloat(newSale.discount || 0),
            purchaseCost: totalPurchaseCost,
            customerName: newSale.customerName,
            timestamp: timestamp.toISOString(),
            total: (quantity * parseFloat(newSale.price)) - parseFloat(newSale.discount || 0)
          }, ...todaySales]),
          setProducts(products.map(p => 
            p.id === selectedProduct.id 
              ? { ...p, variants: updatedVariants }
              : p
          ))
        ]);
      }

      resetForm();
    } catch (error) {
      console.error('خطا در ثبت فروش:', error);
      alert('خطا در ثبت فروش');
    } finally {
      setIsSubmitting(false);
      isProcessing.current = false;
    }
  };

  const resetForm = () => {
    setNewSale({
      productId: '',
      quantity: 1,
      price: '',
      discount: 0,
      customerName: '',
      year: format(new Date(), 'yyyy'),
      month: format(new Date(), 'MM'),
      day: format(new Date(), 'dd')
    });
    setSelectedProduct(null);
    setEditingSale(null);
  };

  // اضافه کردن فیلتر محصولات
  const filteredProducts = products.filter(product => {
    // جستجو در نام محصول
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    // فیلتر دسته‌بندی
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    // فقط محصولات موجود
    const hasStock = product.variants.some(v => v.stock > 0);
    
    return matchesSearch && matchesCategory && hasStock;
  });

  // تغییر تابع فیلتر آرشیو
  const filteredArchive = [...todaySales, ...salesArchive].filter(sale => {
    // گرفتن تاریخ شمسی از timestamp
    const jalaliDate = format(parseISO(sale.timestamp), 'yyyy/MM/dd').split('/');
    const saleYear = parseInt(jalaliDate[0]);
    const saleMonth = parseInt(jalaliDate[1]);
    const saleDay = parseInt(jalaliDate[2]);

    let matchesDateRange = true;

    // تبدیل اعداد فارسی به انگلیسی و تبدیل به عدد
    const startYear = startDateFields.year ? parseInt(toEnglishNumber(startDateFields.year)) : null;
    const startMonth = startDateFields.month ? parseInt(toEnglishNumber(startDateFields.month)) : null;
    const startDay = startDateFields.day ? parseInt(toEnglishNumber(startDateFields.day)) : null;

    const endYear = endDateFields.year ? parseInt(toEnglishNumber(endDateFields.year)) : null;
    const endMonth = endDateFields.month ? parseInt(toEnglishNumber(endDateFields.month)) : null;
    const endDay = endDateFields.day ? parseInt(toEnglishNumber(endDateFields.day)) : null;

    // مقایسه تاریخ شروع
    if (startYear) {
      if (saleYear < startYear) return false;
      if (saleYear === startYear) {
        if (startMonth && saleMonth < startMonth) return false;
        if (startMonth && saleMonth === startMonth && startDay && saleDay < startDay) return false;
      }
    }

    // مقایسه تاریخ پایان
    if (endYear) {
      if (saleYear > endYear) return false;
      if (saleYear === endYear) {
        if (endMonth && saleMonth > endMonth) return false;
        if (endMonth && saleMonth === endMonth && endDay && saleDay > endDay) return false;
      }
    }

    // جستجو در نام محصول و مشتری
    const matchesSearch = !archiveSearchQuery || 
      sale.productName.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(archiveSearchQuery.toLowerCase()));

    return matchesDateRange && matchesSearch;
  });

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setNewSale({
      productId: sale.productId,
      quantity: sale.quantity,
      price: sale.salePrice,
      discount: sale.discount,
      customerName: sale.customerName,
      // تبدیل تاریخ به اعداد فارسی
      year: toPersianNumber(format(parseISO(sale.timestamp), 'yyyy')),
      month: toPersianNumber(format(parseISO(sale.timestamp), 'MM')),
      day: toPersianNumber(format(parseISO(sale.timestamp), 'dd'))
    });
    setSelectedProduct(products.find(p => p.id === sale.productId));
    setShowSaleForm(true);
  };

  const handleDelete = async (saleId) => {
    if (!window.confirm('آیا از حذف این فروش اطمینان دارید؟')) return;

    try {
      // پیدا کردن فروش
      const sale = todaySales.find(s => s.id === saleId);
      if (!sale) return;

      // برگرداندن موجودی به محصول
      const product = products.find(p => p.id === sale.productId);
      if (!product) return;

      const updatedVariants = [...product.variants];
      // اضافه کردن به موجودی اولین واریانت
      updatedVariants[0].stock += sale.quantity;

      // آپدیت همزمان محصول و حذف فروش
      await Promise.all([
        setProducts(products.map(p => 
          p.id === product.id 
            ? { ...p, variants: updatedVariants }
            : p
        )),
        setTodaySales(todaySales.filter(s => s.id !== saleId))
      ]);

    } catch (error) {
      console.error('خطا در حذف فروش:', error);
      alert('خطا در حذف فروش');
    }
  };

  return (
    <div className="lg:p-6 p-4 max-w-7xl mx-auto mt-16 lg:mt-0">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">فروش روز</h1>
          <p className="text-sm text-gray-500 mt-1">
            مجموع فروش امروز: {formatPrice(calculateTotalSales())}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSale(null);
            setNewSale({
              productId: '',
              quantity: 1,
              price: '',
              discount: 0,
              customerName: '',
              year: format(new Date(), 'yyyy'),
              month: format(new Date(), 'MM'),
              day: format(new Date(), 'dd')
            });
            setSelectedProduct(null);
            setShowSaleForm(true);
          }}
          className="w-full sm:w-40 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <i className="fas fa-plus"></i>
          ثبت فروش
        </button>
      </div>

      {/* تب‌ها */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            ${activeTab === 'today' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          فروش امروز
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            ${activeTab === 'archive' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          آرشیو فروش
        </button>
      </div>

      {/* نمایش لیست فروش بر اساس تب فعال */}
      {activeTab === 'today' ? (
        <>
          {/* فرم ثبت فروش */}
          {showSaleForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingSale ? 'ویرایش فروش' : 'ثبت فروش جدید'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowSaleForm(false);
                      setEditingSale(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                          {selectedProduct ? (
                            `${selectedProduct.name} (موجودی: ${toPersianNumber(
                              selectedProduct.variants.reduce((total, v) => total + v.stock, 0)
                            )})`
                          ) : (
                            'انتخاب محصول'
                          )}
                        </span>
                        <i className={`fas fa-chevron-down transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`}></i>
                      </button>

                      {isProductDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                          <div className="p-2 border-b border-gray-200">
                            <div className="flex gap-2 mb-2">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="جستجوی محصول..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                  className="h-10 px-4 text-right bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2"
                                >
                                  <span className="text-sm text-gray-700">
                                    {selectedCategory === 'all' ? 'همه دسته‌ها' : selectedCategory}
                                  </span>
                                  <i className={`fas fa-chevron-down transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </button>

                                {isCategoryDropdownOpen && (
                                  <div className="absolute left-0 right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCategory('all');
                                        setIsCategoryDropdownOpen(false);
                                      }}
                                      className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between
                                        ${selectedCategory === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                                    >
                                      <span>همه دسته‌ها</span>
                                      {selectedCategory === 'all' && (
                                        <i className="fas fa-check text-blue-600"></i>
                                      )}
                                    </button>
                                    {[...new Set(products.map(p => p.category))].map(category => (
                                      <button
                                        key={category}
                                        type="button"
                                        onClick={() => {
                                          setSelectedCategory(category);
                                          setIsCategoryDropdownOpen(false);
                                        }}
                                        className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between
                                          ${selectedCategory === category ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                                      >
                                        <span>{category}</span>
                                        {selectedCategory === category && (
                                          <i className="fas fa-check text-blue-600"></i>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
                                    // پر کردن خودکار قیمت پیشنهادی با کمترین قیمت موجود
                                    const lowestPrice = Math.min(...product.variants.filter(v => v.stock > 0).map(v => v.purchasePrice));
                                    setNewSale(prev => ({
                                      ...prev,
                                      price: lowestPrice.toString()
                                    }));
                                  }}
                                  className={`w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between
                                    ${selectedProduct?.id === product.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                                >
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {product.variants.map((v, i) => (
                                        <span key={v.id} className={i > 0 ? 'mr-2' : ''}>
                                          موجودی: {toPersianNumber(v.stock)}
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
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <input
                            type="text"
                            name="day"
                            value={newSale.day}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="روز"
                            maxLength="2"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            name="month"
                            value={newSale.month}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="ماه"
                            maxLength="2"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            name="year"
                            value={newSale.year}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="سال"
                            maxLength="4"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          تعداد
                        </label>
                        <input
                          type="text"
                          name="quantity"
                          value={newSale.quantity}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`حداکثر: ${toPersianNumber(
                            selectedProduct.variants.reduce((total, v) => total + v.stock, 0)
                          )}`}
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          قیمت فروش (تومان)
                        </label>
                        <input
                          type="text"
                          name="price"
                          value={newSale.price}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="تومان"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          تخفیف (تومان)
                        </label>
                        <input
                          type="text"
                          name="discount"
                          value={newSale.discount}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="تومان"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          نام خریدار (اختیاری)
                        </label>
                        <input
                          type="text"
                          name="customerName"
                          value={newSale.customerName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="نام خریدار"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowSaleForm(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedProduct || isSubmitting}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>در حال ثبت...</span>
                        </>
                      ) : (
                        <span>{editingSale ? 'ویرایش فروش' : 'ثبت فروش'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* لیست فروش‌های امروز */}
          <div className="bg-white rounded-xl shadow-sm">
            {todaySales.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <i className="fas fa-shopping-cart text-4xl mb-4"></i>
                <p>هنوز فروشی ثبت نشده است</p>
              </div>
            ) : (
              <>
                {/* نمایش موبایل */}
                <div className="md:hidden">
                  {todaySales.map((sale) => (
                    <div key={sale.id} className="p-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{sale.productName}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            <div>تعداد: {toPersianNumber(sale.quantity)}</div>
                            <div>قیمت فروش: {formatPrice(sale.salePrice)}</div>
                            <div>تخفیف: {formatPrice(sale.discount)}</div>
                            <div>نام خریدار: {sale.customerName || '-'}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 text-left mb-2">
                            <div className="text-xs text-gray-500">
                              {new Date(sale.timestamp).toLocaleDateString('fa-IR')} - {' '}
                              {new Date(sale.timestamp).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 text-left">
                            {formatPrice(sale.total)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => handleEdit(sale)} className="text-blue-600 hover:text-blue-700">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => handleDelete(sale.id)} className="text-red-600 hover:text-red-700">
                          <i className="fas fa-trash"></i>
                        </button>
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
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">قیمت فروش</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">تخفیف</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">نام خریدار</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">مجموع</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">زمان</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {todaySales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{sale.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{toPersianNumber(sale.quantity)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(sale.salePrice)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(sale.discount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{sale.customerName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(sale.total)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            <div className="text-xs text-gray-500">
                              {new Date(sale.timestamp).toLocaleDateString('fa-IR')} - {' '}
                              {new Date(sale.timestamp).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(sale)} className="text-blue-600 hover:text-blue-700">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button onClick={() => handleDelete(sale.id)} className="text-red-600 hover:text-red-700">
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
        </>
      ) : (
        // نمایش آرشیو فروش
        <div className="bg-white rounded-xl shadow-sm">
          {/* فیلترها */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={startDateFields.day}
                    onChange={e => {
                      // تبدیل اعداد انگلیسی به فارسی
                      const persianValue = e.target.value.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                      setStartDateFields(prev => ({ ...prev, day: persianValue }));
                    }}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
                    placeholder="روز"
                    maxLength="2"
                  />
                  <input
                    type="text"
                    value={startDateFields.month}
                    onChange={e => {
                      const persianValue = e.target.value.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                      setStartDateFields(prev => ({ ...prev, month: persianValue }));
                    }}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
                    placeholder="ماه"
                    maxLength="2"
                  />
                  <input
                    type="text"
                    value={startDateFields.year}
                    onChange={e => {
                      const persianValue = e.target.value.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                      setStartDateFields(prev => ({ ...prev, year: persianValue }));
                    }}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-center"
                    placeholder="سال"
                    maxLength="4"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={endDateFields.day}
                    onChange={e => {
                      const persianValue = e.target.value.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                      setEndDateFields(prev => ({ ...prev, day: persianValue }));
                    }}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
                    placeholder="روز"
                    maxLength="2"
                  />
                  <input
                    type="text"
                    value={endDateFields.month}
                    onChange={e => {
                      const persianValue = e.target.value.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                      setEndDateFields(prev => ({ ...prev, month: persianValue }));
                    }}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
                    placeholder="ماه"
                    maxLength="2"
                  />
                  <input
                    type="text"
                    value={endDateFields.year}
                    onChange={e => {
                      const persianValue = e.target.value.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                      setEndDateFields(prev => ({ ...prev, year: persianValue }));
                    }}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-center"
                    placeholder="سال"
                    maxLength="4"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">جستجو</label>
                <input
                  type="text"
                  value={archiveSearchQuery}
                  onChange={e => setArchiveSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="جستجو در نام محصول یا خریدار..."
                />
              </div>
            </div>

            {/* نمایش مجموع فروش */}
            <div className="text-sm text-gray-500">
              مجموع فروش: {formatPrice(
                filteredArchive.reduce((total, sale) => total + sale.total, 0)
              )}
            </div>
          </div>

          {filteredArchive.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="fas fa-archive text-4xl mb-4"></i>
              <p>فروشی در این تاریخ ثبت نشده است</p>
            </div>
          ) : (
            <>
              {/* نمایش موبایل */}
              <div className="md:hidden">
                {filteredArchive.map((sale) => (
                  <div key={sale.id} className="p-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{sale.productName}</h3>
                        <div className="text-sm text-gray-500 mt-1">
                          <div>تعداد: {toPersianNumber(sale.quantity)}</div>
                          <div>قیمت فروش: {formatPrice(sale.salePrice)}</div>
                          <div>تخفیف: {formatPrice(sale.discount)}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(sale.total)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(sale.timestamp).toLocaleDateString('fa-IR')} - {' '}
                      {new Date(sale.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(sale)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* نمایش دسکتاپ */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">زمان</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">نام محصول</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">تعداد</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">قیمت فروش</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">تخفیف</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">مجموع</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">نام خریدار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredArchive.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(sale.timestamp).toLocaleDateString('fa-IR')} - {' '}
                            {new Date(sale.timestamp).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{sale.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{toPersianNumber(sale.quantity)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(sale.salePrice)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(sale.discount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(sale.total)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{sale.customerName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(sale)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(sale.id)}
                                className="text-red-600 hover:text-red-700"
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Sales; 