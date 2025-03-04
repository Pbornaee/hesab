import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PersonSelect from '../components/PersonSelect';
import PersonSearchSelect from '../components/PersonSearchSelect';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import React from 'react';

function Invoice({ products, people, setPeople }) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([{
    id: Date.now(),
    productId: '',
    quantity: '',
    price: 0,
    searchQuery: '',
    isDropdownOpen: false,
    selectedCategory: 'all',
    isCategoryDropdownOpen: false
  }]);
  const [customerName, setCustomerName] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [showInvoiceLog, setShowInvoiceLog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // دریافت صورت حساب‌ها از دیتابیس
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!currentUser?.id) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setInvoices(userData.invoices || []);
        }
      } catch (error) {
        console.error('خطا در دریافت صورت حساب‌ها:', error);
      }
    };

    fetchInvoices();
  }, [currentUser]);

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num) => {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  };

  // تبدیل اعداد فارسی به انگلیسی
  const toEnglishNumber = (str) => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/[۰-۹]/g, d => persianNumbers.indexOf(d));
  };

  // فرمت کردن قیمت
  const formatPrice = (price) => {
    return toPersianNumber(price.toLocaleString()) + ' تومان';
  };

  // محاسبه جمع کل
  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return total;
      const variant = product.variants.find(v => v.isOriginal);
      if (!variant) return total;
      return total + (variant.salePrice * item.quantity);
    }, 0);
  };

  const handleAddItem = () => {
    setItems([...items, {
      id: Date.now(),
      productId: '',
      quantity: '',
      price: 0,
      searchQuery: '',
      isDropdownOpen: false,
      selectedCategory: 'all',
      isCategoryDropdownOpen: false
    }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmitInvoice = async () => {
    const hasEmptyFields = items.some(item => !item.productId || !item.quantity);
    if (hasEmptyFields) {
      alert('لطفاً همه فیلدها را پر کنید');
      return;
    }

    const newInvoice = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      customerName: customerName || 'مشتری متفرقه',
      items: items.map(item => ({
        productId: item.productId,
        productName: products.find(p => p.id === item.productId)?.name,
        quantity: item.quantity,
        price: products.find(p => p.id === item.productId)?.variants.find(v => v.isOriginal)?.salePrice
      })),
      total: calculateTotal()
    };

    try {
      // اضافه کردن صورت حساب جدید به آرایه موجود
      const updatedInvoices = [newInvoice, ...invoices];
      
      // آپدیت در فایربیس
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        invoices: updatedInvoices
      });

      // آپدیت state
      setInvoices(updatedInvoices);

      // پاک کردن فرم
      setCustomerName('');
      setItems([{
        id: Date.now(),
        productId: '',
        quantity: '',
        price: 0,
        searchQuery: '',
        isDropdownOpen: false,
        selectedCategory: 'all',
        isCategoryDropdownOpen: false
      }]);
    } catch (error) {
      console.error('خطا در ثبت صورت حساب:', error);
      alert('خطا در ثبت صورت حساب');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('آیا از حذف این صورت حساب مطمئن هستید؟')) return;

    try {
      // حذف از آرایه
      const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
      
      // آپدیت در فایربیس
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        invoices: updatedInvoices
      });

      // آپدیت state
      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('خطا در حذف صورت حساب:', error);
      alert('خطا در حذف صورت حساب');
    }
  };

  return (
    <div className="lg:p-6 p-4 max-w-7xl mx-auto mt-16 lg:mt-0">
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-6">صورت حساب</h1>

        {/* انتخاب مشتری */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نام مشتری (اختیاری)
          </label>
          <PersonSelect
            value={customerName}
            onChange={setCustomerName}
            placeholder="نام مشتری را وارد کنید..."
            people={people}
            onAddPerson={(newPerson) => setPeople([...people, newPerson])}
          />
        </div>

        {/* لیست اقلام */}
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-4 items-start">
              {/* انتخاب محصول */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  محصول {toPersianNumber(index + 1)}
                </label>
                <PersonSearchSelect
                  value={products.find(p => p.id === item.productId)}
                  onChange={(product) => {
                    const newItems = [...items];
                    newItems[index].productId = product?.id || '';
                    newItems[index].isDropdownOpen = false;
                    setItems(newItems);
                  }}
                  options={products}
                  getOptionLabel={(product) => product.name}
                  placeholder="محصول ..."
                  searchQuery={item.searchQuery}
                  setSearchQuery={(query) => {
                    const newItems = [...items];
                    newItems[index].searchQuery = query;
                    setItems(newItems);
                  }}
                  isDropdownOpen={item.isDropdownOpen}
                  setIsDropdownOpen={(isOpen) => {
                    const newItems = [...items];
                    newItems.forEach((item, i) => {
                      item.isDropdownOpen = i === index ? isOpen : false;
                    });
                    setItems([...newItems]);
                  }}
                  selectedCategory={item.selectedCategory}
                  setSelectedCategory={(category) => {
                    const newItems = [...items];
                    newItems[index].selectedCategory = category;
                    setItems(newItems);
                  }}
                  isCategoryDropdownOpen={item.isCategoryDropdownOpen}
                  setIsCategoryDropdownOpen={(isOpen) => {
                    const newItems = [...items];
                    newItems[index].isCategoryDropdownOpen = isOpen;
                    setItems(newItems);
                  }}
                />
              </div>

              {/* تعداد */}
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تعداد
                </label>
                <input
                  type="text"
                  value={item.quantity ? toPersianNumber(item.quantity) : ''}
                  onChange={(e) => {
                    const newItems = [...items];
                    const englishNumber = toEnglishNumber(e.target.value);
                    newItems[index].quantity = englishNumber ? parseInt(englishNumber) : '';
                    setItems(newItems);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* دکمه حذف */}
              {items.length > 1 && (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="mt-7 text-red-600 hover:text-red-700"
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* دکمه اضافه کردن آیتم */}
        <button
          onClick={handleAddItem}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mb-6 flex items-center justify-center gap-2 transition-colors"
        >
          <i className="fas fa-plus"></i>
          افزودن محصول
        </button>

        {/* جمع کل */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>جمع کل:</span>
            <span>{formatPrice(calculateTotal())}</span>
          </div>
        </div>

        {/* دکمه‌های پایین صفحه */}
        <div className="flex flex-col lg:flex-row gap-4 mt-6">
          <button
            onClick={handleSubmitInvoice}
            className="w-full lg:flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-base"
          >
            <i className="fas fa-save"></i>
            ثبت صورت حساب
          </button>
          <button
            onClick={() => setShowInvoiceLog(!showInvoiceLog)}
            className="w-full lg:w-auto h-12 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <i className="fas fa-history"></i>
            تاریخچه
          </button>
        </div>

        {/* نمایش لاگ صورت حساب‌ها */}
        {showInvoiceLog && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4">تاریخچه صورت حساب‌ها</h2>
            
            {/* نمایش موبایل */}
            <div className="lg:hidden space-y-4">
              {invoices.map(invoice => (
                <div 
                  key={invoice.id} 
                  className="bg-gray-50 rounded-lg p-4 cursor-pointer"
                  onClick={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-900">
                      <div>{invoice.customerName}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        {new Date(invoice.timestamp).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteInvoice(invoice.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>تعداد اقلام:</span>
                      <span>{toPersianNumber(invoice.items.length)}</span>
                    </div>
                    <div className="flex justify-between font-medium mt-1">
                      <span>جمع کل:</span>
                      <span>{formatPrice(invoice.total)}</span>
                    </div>
                  </div>
                  {selectedInvoice?.id === invoice.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="font-medium mb-2">جزئیات اقلام:</h3>
                      <div className="space-y-2">
                        {invoice.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.productName}</span>
                            <span>{toPersianNumber(item.quantity)} × {formatPrice(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* نمایش دسکتاپ */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">تاریخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">نام مشتری</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">تعداد اقلام</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">جمع کل</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map(invoice => (
                    <React.Fragment key={invoice.id}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(invoice.timestamp).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{invoice.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{toPersianNumber(invoice.items.length)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(invoice.total)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInvoice(invoice.id);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {selectedInvoice?.id === invoice.id && (
                        <tr>
                          <td colSpan="5" className="px-4 py-3 bg-gray-50">
                            <div className="space-y-2">
                              {invoice.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{item.productName}</span>
                                  <span>{toPersianNumber(item.quantity)} × {formatPrice(item.price)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Invoice; 