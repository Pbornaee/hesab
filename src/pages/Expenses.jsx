import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { debounce } from '../utils/debounce';

function Expenses({ expenses, setExpenses }) {
  const { currentUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'عمومی',
    description: ''
  });

  // اضافه کردن state برای دسته‌بندی‌ها
  const [categories] = useState([
    { id: 'general', label: 'عمومی' },
    { id: 'rent', label: 'اجاره' },
    { id: 'utilities', label: 'قبوض' },
    { id: 'salary', label: 'حقوق' },
    { id: 'supplies', label: 'ملزومات' },
    { id: 'other', label: 'سایر' }
  ]);

  // اضافه کردن state برای کنترل نمایش منوی دسته‌بندی
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const isProcessing = useRef(false);

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

    if (name === 'amount') {
      // تبدیل اعداد فارسی به انگلیسی
      newValue = value.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      if (!/^\d*\.?\d{0,2}$/.test(newValue)) return;
    }

    setNewExpense(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      if (!newExpense.title || !newExpense.amount) {
        alert('لطفاً عنوان و مبلغ را وارد کنید');
        return;
      }

      const expense = {
        id: editingExpense?.id || Date.now(),
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        timestamp: new Date().toISOString()
      };

      if (editingExpense) {
        await setExpenses(expenses.map(e => e.id === editingExpense.id ? expense : e));
      } else {
        await setExpenses([expense, ...expenses]);
      }

      setNewExpense({
        title: '',
        amount: '',
        category: 'عمومی',
        description: ''
      });
      setEditingExpense(null);
      setShowAddForm(false);

      // تاخیر 2 ثانیه‌ای قبل از فعال شدن مجدد دکمه
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);

    } catch (error) {
      console.error('خطا در ثبت هزینه:', error);
      alert('خطا در ثبت هزینه');
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      description: expense.description || '',
      category: expense.category
    });
    setShowAddForm(true);
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('آیا از حذف این هزینه اطمینان دارید؟')) {
      try {
        const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
        await setExpenses(updatedExpenses);
      } catch (error) {
        console.error('خطا در حذف هزینه:', error);
        alert('خطا در حذف هزینه');
      }
    }
  };

  // محاسبه مجموع هزینه‌ها
  const totalExpenses = expenses.reduce((total, exp) => total + exp.amount, 0);

  return (
    <div className="lg:p-6 p-4 max-w-7xl mx-auto mt-16 lg:mt-0">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت هزینه‌ها</h1>
          <div className="mt-3 bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">مجموع هزینه‌ها</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatPrice(totalExpenses)}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setNewExpense({
              title: '',
              amount: '',
              category: 'عمومی',
              description: ''
            });
            setShowAddForm(true);
          }}
          className="w-full sm:w-40 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <i className="fas fa-plus"></i>
          ثبت هزینه جدید
        </button>
      </div>

      {/* فرم افزودن/ویرایش هزینه */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingExpense ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}
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
                  عنوان هزینه
                </label>
                <input
                  type="text"
                  name="title"
                  value={newExpense.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: اجاره مغازه"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  دسته‌بندی
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right flex justify-between items-center"
                  >
                    <span>{newExpense.category}</span>
                    <i className={`fas fa-chevron-down transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="py-1 max-h-60 overflow-auto">
                        {categories.map(category => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              setNewExpense(prev => ({ ...prev, category: category.label }));
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-right hover:bg-gray-100 transition-colors"
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مبلغ (تومان)
                </label>
                <input
                  type="text"
                  name="amount"
                  value={newExpense.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 1000000"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  name="description"
                  value={newExpense.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="توضیحات اضافی..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <span>{editingExpense ? 'ویرایش هزینه' : 'ثبت هزینه'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* لیست هزینه‌ها */}
      <div className="bg-white rounded-xl shadow-sm">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <i className="fas fa-receipt text-4xl mb-4"></i>
            <p>هنوز هزینه‌ای ثبت نشده است</p>
          </div>
        ) : (
          <>
            {/* نمایش موبایل */}
            <div className="md:hidden">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{expense.title}</h3>
                      <span className="text-sm text-gray-500">{expense.category}</span>
                      {expense.description && (
                        <p className="text-sm text-gray-500 mt-1">{expense.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-gray-900">{formatPrice(expense.amount)}</span>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(expense.timestamp).toLocaleDateString('fa-IR')} - {' '}
                    {new Date(expense.timestamp).toLocaleTimeString('fa-IR')}
                  </div>
                </div>
              ))}
            </div>

            {/* نمایش دسکتاپ */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">عنوان</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">دسته‌بندی</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">مبلغ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">توضیحات</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">تاریخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 w-20">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{expense.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{expense.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(expense.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{expense.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(expense.timestamp).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
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

export default Expenses; 