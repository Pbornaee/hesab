import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format, parse, parseISO } from 'date-fns-jalali';

function NewStock({ products, setProducts, stockLogs, setStockLogs }) {
  const { currentUser } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStock, setNewStock] = useState({
    productId: '',
    quantity: 1,
    purchasePrice: '',
    customerName: '',
    year: format(new Date(), 'yyyy'),
    month: format(new Date(), 'MM'),
    day: format(new Date(), 'dd')
  });
  const isProcessing = useRef(false);
  const [editingStock, setEditingStock] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
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

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num) => {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  };

  // فرمت کردن قیمت
  const formatPrice = (price) => {
    return toPersianNumber(price.toLocaleString()) + ' تومان';
  };

  // تابع تبدیل اعداد فارسی به انگلیسی
  const toEnglishNumber = (str) => {
    return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // برای فیلدهای عددی
    if (name === 'quantity' || name === 'purchasePrice') {
      // تبدیل اعداد فارسی به انگلیسی
      newValue = toEnglishNumber(value);
      if (!/^\d*\.?\d{0,2}$/.test(newValue)) return;
    }
    // برای فیلدهای تاریخ
    else if (name === 'year' || name === 'month' || name === 'day') {
      // تبدیل به اعداد فارسی برای نمایش
      newValue = value.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    }

    setNewStock(prev => ({ ...prev, [name]: newValue }));
  };

  const handleEdit = (log) => {
    setEditingStock(log);
    setNewStock({
      productId: log.productId,
      quantity: log.quantity,
      purchasePrice: log.price,
      customerName: log.customerName,
      // تبدیل تاریخ به اعداد فارسی
      year: toPersianNumber(format(parseISO(log.timestamp), 'yyyy')),
      month: toPersianNumber(format(parseISO(log.timestamp), 'MM')),
      day: toPersianNumber(format(parseISO(log.timestamp), 'dd'))
    });
    setSelectedProduct(products.find(p => p.id === log.productId));
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('آیا از حذف این ورود بار اطمینان دارید؟')) return;

    try {
      // پیدا کردن لاگ
      const log = stockLogs.find(l => l.id === logId);
      if (!log) return;

      // کم کردن از موجودی محصول
      const product = products.find(p => p.id === log.productId);
      if (!product) return;

      const variant = product.variants.find(v => v.purchasePrice === log.price);
      if (!variant) return;

      const updatedVariants = product.variants.map(v =>
        v.id === variant.id
          ? { ...v, stock: v.stock - log.quantity }
          : v
      );

      // آپدیت همزمان محصول و حذف لاگ
      await Promise.all([
        setProducts(products.map(p => 
          p.id === product.id 
            ? { ...p, variants: updatedVariants }
            : p
        )),
        setStockLogs(stockLogs.filter(l => l.id !== logId))
      ]);

    } catch (error) {
      console.error('خطا در حذف بار:', error);
      alert('خطا در حذف بار');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing.current) return;

    if (!selectedProduct || !newStock.quantity || !newStock.purchasePrice) {
      alert('لطفاً همه فیلدهای ضروری را پر کنید');
      return;
    }

    try {
      isProcessing.current = true;

      // تبدیل اعداد فارسی به انگلیسی
      const persianDate = `${toEnglishNumber(newStock.year)}/${toEnglishNumber(newStock.month)}/${toEnglishNumber(newStock.day)}`;
      const now = new Date();
      const timestamp = parse(persianDate, 'yyyy/MM/dd', now);
      
      // تنظیم ساعت
      timestamp.setHours(now.getHours());
      timestamp.setMinutes(now.getMinutes());
      timestamp.setSeconds(now.getSeconds());
      timestamp.setMilliseconds(0);

      const quantity = parseFloat(newStock.quantity);
      const price = parseFloat(newStock.purchasePrice);

      if (editingStock) {
        // 1. پیدا کردن اطلاعات قبلی
        const oldLog = stockLogs.find(l => l.id === editingStock.id);
        const oldProduct = products.find(p => p.id === oldLog.productId);
        const oldVariant = oldProduct.variants.find(v => v.purchasePrice === oldLog.price);

        // 2. کم کردن موجودی قبلی
        let updatedProducts = [...products];
        if (oldVariant) {
          updatedProducts = products.map(p => {
            if (p.id === oldProduct.id) {
              const updatedVariants = p.variants.map(v => {
                if (v.id === oldVariant.id) {
                  return { ...v, stock: v.stock - oldLog.quantity };
                }
                return v;
              });
              return { ...p, variants: updatedVariants };
            }
            return p;
          });
        }

        // 3. اضافه کردن موجودی جدید
        const targetProduct = updatedProducts.find(p => p.id === selectedProduct.id);
        const existingVariant = targetProduct.variants.find(v => v.purchasePrice === price);

        if (existingVariant) {
          // اگر واریانت با این قیمت وجود دارد
          updatedProducts = updatedProducts.map(p => {
            if (p.id === selectedProduct.id) {
              const updatedVariants = p.variants.map(v => {
                if (v.id === existingVariant.id) {
                  return { ...v, stock: v.stock + quantity };
                }
                return v;
              });
              return { ...p, variants: updatedVariants };
            }
            return p;
          });
        } else {
          // اگر واریانت جدید است
          updatedProducts = updatedProducts.map(p => {
            if (p.id === selectedProduct.id) {
              return {
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
              };
            }
            return p;
          });
        }

        // 4. آپدیت همزمان محصولات و لاگ
        await Promise.all([
          setProducts(updatedProducts),
          setStockLogs(stockLogs.map(l => l.id === editingStock.id ? {
            id: editingStock.id,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity,
            price,
            timestamp: timestamp.toISOString(),
            customerName: newStock.customerName
          } : l))
        ]);

        setEditingStock(null);
      } else {
        // افزودن بار جدید
        const existingVariant = selectedProduct.variants.find(v => v.purchasePrice === price);
        let updatedVariants;

        if (existingVariant) {
          updatedVariants = selectedProduct.variants.map(v =>
            v.purchasePrice === price
              ? { ...v, stock: v.stock + quantity }
              : v
          );
        } else {
          updatedVariants = [
            ...selectedProduct.variants,
            {
              id: Date.now(),
              purchasePrice: price,
              stock: quantity,
              isOriginal: false
            }
          ];
        }

        await Promise.all([
          setProducts(products.map(p => 
            p.id === selectedProduct.id 
              ? { ...p, variants: updatedVariants }
              : p
          )),
          setStockLogs([{
            id: Date.now(),
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity,
            price,
            timestamp: timestamp.toISOString(),
            customerName: newStock.customerName
          }, ...stockLogs])
        ]);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('خطا در ثبت بار:', error);
      alert('خطا در ثبت بار');
    } finally {
      isProcessing.current = false;
    }
  };

  const resetForm = () => {
    setNewStock({
      productId: '',
      quantity: 1,
      purchasePrice: '',
      customerName: '',
      year: format(new Date(), 'yyyy'),
      month: format(new Date(), 'MM'),
      day: format(new Date(), 'dd')
    });
    setSelectedProduct(null);
    setEditingStock(null);
    setShowForm(false);
  };

  // فیلتر محصولات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // تابع فیلتر
  const filteredLogs = [...stockLogs].filter(log => {
    // گرفتن تاریخ شمسی از timestamp
    const jalaliDate = format(parseISO(log.timestamp), 'yyyy/MM/dd').split('/');
    const logYear = parseInt(jalaliDate[0]);
    const logMonth = parseInt(jalaliDate[1]);
    const logDay = parseInt(jalaliDate[2]);

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
      if (logYear < startYear) return false;
      if (logYear === startYear) {
        if (startMonth && logMonth < startMonth) return false;
        if (startMonth && logMonth === startMonth && startDay && logDay < startDay) return false;
      }
    }

    // مقایسه تاریخ پایان
    if (endYear) {
      if (logYear > endYear) return false;
      if (logYear === endYear) {
        if (endMonth && logMonth > endMonth) return false;
        if (endMonth && logMonth === endMonth && endDay && logDay > endDay) return false;
      }
    }

    // جستجو در نام محصول و مشتری
    const matchesCustomer = !archiveSearchQuery || 
      (log.customerName && log.customerName.toLowerCase().includes(archiveSearchQuery.toLowerCase()));
    const matchesProduct = !searchQuery || 
      log.productName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDateRange && matchesCustomer && matchesProduct;
  });

  return (
    <div className="lg:p-6 p-4 max-w-7xl mx-auto mt-16 lg:mt-0">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ثبت بار جدید</h1>
        </div>
        <button
          onClick={() => {
            setEditingStock(null);
            setNewStock({
              productId: '',
              quantity: 1,
              purchasePrice: '',
              customerName: '',
              year: format(new Date(), 'yyyy'),
              month: format(new Date(), 'MM'),
              day: format(new Date(), 'dd')
            });
            setSelectedProduct(null);
            setShowForm(true);
          }}
          className="w-full sm:w-40 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <i className="fas fa-plus"></i>
          ثبت بار جدید
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
          بارهای امروز
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            ${activeTab === 'archive' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          آرشیو بارها
        </button>
      </div>

      {/* نمایش لیست بر اساس تب فعال */}
      {activeTab === 'today' ? (
        <>
          {/* لیست بارهای امروز */}
          <div className="bg-white rounded-xl shadow-sm">
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
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{log.productName}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            <div>تعداد: {toPersianNumber(log.quantity)}</div>
                            <div>قیمت: {formatPrice(log.price)}</div>
                            <div>نام فروشنده: {log.customerName || '-'}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 text-left mb-2">
                            <div>{new Date(log.timestamp).toLocaleDateString('fa-IR')} - {' '}
                              {new Date(log.timestamp).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => handleEdit(log)} className="text-blue-600 hover:text-blue-700">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => handleDelete(log.id)} className="text-red-600 hover:text-red-700">
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
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">قیمت خرید</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">نام فروشنده</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">زمان</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stockLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{log.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{toPersianNumber(log.quantity)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(log.price)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{log.customerName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            <div>{new Date(log.timestamp).toLocaleDateString('fa-IR')} - {' '}
                              {new Date(log.timestamp).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(log)} className="text-blue-600 hover:text-blue-700">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button onClick={() => handleDelete(log.id)} className="text-red-600 hover:text-red-700">
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
        // بخش آرشیو با فیلترها
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
                  placeholder="جستجو در نام محصول یا فروشنده..."
                />
              </div>
            </div>
          </div>

          {/* نمایش لیست آرشیو */}
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 border-b border-gray-200 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{log.productName}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    <div>تعداد: {toPersianNumber(log.quantity)}</div>
                    <div>قیمت: {formatPrice(log.price)}</div>
                    <div>نام فروشنده: {log.customerName || '-'}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-left">
                  <div>{new Date(log.timestamp).toLocaleDateString('fa-IR')} - {' '}
                    {new Date(log.timestamp).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleEdit(log)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal فرم ثبت/ویرایش (بدون تغییر) */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingStock ? 'ویرایش بار' : 'ثبت بار جدید'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

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
                      name="purchasePrice"
                      value={newStock.purchasePrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="تومان"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام فروشنده (اختیاری)
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={newStock.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="نام فروشنده"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاریخ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      name="day"
                      value={newStock.day}
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
                      value={newStock.month}
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
                      value={newStock.year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="سال"
                      maxLength="4"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!selectedProduct || isProcessing.current}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing.current ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <span>{editingStock ? 'ویرایش بار' : 'ثبت بار'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewStock; 