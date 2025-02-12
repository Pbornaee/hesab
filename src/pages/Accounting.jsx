import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function Accounting({ products, todaySales, salesArchive, expenses, stockLogs }) {
  const { currentUser } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month, year
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalStock: 0,
    stockValue: 0,
    totalDiscounts: 0,
    totalPurchaseCost: 0
  });

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num) => {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  };

  // فرمت کردن قیمت
  const formatPrice = (price) => {
    return toPersianNumber(price.toLocaleString()) + ' تومان';
  };

  // لود اطلاعات از فایربیس
  useEffect(() => {
    const loadAccountingData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // اینجا می‌تونیم اطلاعات اضافی حسابداری رو از فایربیس بخونیم
          // مثلاً تنظیمات یا گزارش‌های ذخیره شده
        }
      } catch (error) {
        console.error('خطا در بارگیری اطلاعات حسابداری:', error);
      }
    };

    loadAccountingData();
  }, [currentUser]);

  // محاسبه خلاصه آمار بر اساس دوره انتخاب شده
  useEffect(() => {
    const calculateSummary = async () => {
      try {
        const now = new Date();
        const startDate = new Date();

        switch (selectedPeriod) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default: // today
            startDate.setHours(0, 0, 0, 0);
        }

        // فیلتر کردن فروش‌ها بر اساس تاریخ
        const filteredSales = [...todaySales, ...salesArchive].filter(sale => 
          new Date(sale.timestamp) >= startDate
        );

        // فیلتر کردن هزینه‌ها بر اساس تاریخ
        const filteredExpenses = expenses.filter(expense => 
          new Date(expense.timestamp) >= startDate
        );

        // محاسبات آماری
        const totalSales = filteredSales.reduce((total, sale) => 
          total + ((sale.salePrice * sale.quantity) - (sale.discount || 0)), 0
        );

        const totalExpenses = filteredExpenses.reduce((total, expense) => 
          total + expense.amount, 0
        );

        const totalProfit = filteredSales.reduce((total, sale) => {
          const revenue = (sale.salePrice * sale.quantity) - (sale.discount || 0);
          return total + (revenue - (sale.purchaseCost || 0));
        }, 0) - totalExpenses;

        const stockValue = products.reduce((total, product) => 
          total + product.variants.reduce((variantTotal, variant) => 
            variantTotal + (variant.purchasePrice * variant.stock), 0
          ), 0
        );

        const totalStock = products.reduce((total, product) => 
          total + product.variants.reduce((variantTotal, variant) => 
            variantTotal + variant.stock, 0
          ), 0
        );

        const totalDiscounts = filteredSales.reduce((total, sale) => 
          total + (sale.discount || 0), 0
        );

        const totalPurchaseCost = filteredSales.reduce((total, sale) => 
          total + (sale.purchaseCost || 0), 0
        );

        setSummary({
          totalSales,
          totalExpenses,
          totalProfit,
          totalStock,
          stockValue,
          totalDiscounts,
          totalPurchaseCost
        });

      } catch (error) {
        console.error('خطا در محاسبه آمار:', error);
      }
    };

    calculateSummary();
  }, [selectedPeriod, todaySales, salesArchive, expenses, products]);

  return (
    <div className="lg:p-6 p-4 max-w-7xl mx-auto mt-16 lg:mt-0">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">حساب و کتاب</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedPeriod === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            امروز
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            هفته
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ماه
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedPeriod === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            سال
          </button>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* فروش */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-800">فروش کل</div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <i className="fas fa-dollar-sign text-green-600"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatPrice(summary.totalSales)}
          </div>
          <div className="text-sm text-gray-500">
            در {selectedPeriod === 'today' ? 'امروز' : 
              selectedPeriod === 'week' ? '۷ روز گذشته' :
              selectedPeriod === 'month' ? 'ماه جاری' : 'سال جاری'}
          </div>
        </div>

        {/* سود */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-800">سود خالص</div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="fas fa-chart-line text-blue-600"></i>
            </div>
          </div>
          <div className={`text-2xl font-bold mb-2 ${
            summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPrice(Math.abs(summary.totalProfit))}
          </div>
          <div className="text-sm text-gray-500">
            {summary.totalProfit >= 0 ? 'سود' : 'ضرر'}
          </div>
        </div>

        {/* تخفیف */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-800">تخفیف‌ها</div>
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <i className="fas fa-tags text-orange-600"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatPrice(summary.totalDiscounts)}
          </div>
          <div className="text-sm text-gray-500">
            در {selectedPeriod === 'today' ? 'امروز' : 
              selectedPeriod === 'week' ? '۷ روز گذشته' :
              selectedPeriod === 'month' ? 'ماه جاری' : 'سال جاری'}
          </div>
        </div>
      </div>

      {/* کارت‌های موجودی و هزینه */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* تعداد موجودی */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-800">موجودی کل انبار</div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <i className="fas fa-box text-purple-600"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {toPersianNumber(summary.totalStock)} عدد
          </div>
          <div className="text-sm text-gray-500">
            در تمام محصولات
          </div>
        </div>

        {/* ارزش موجودی */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-800">ارزش موجودی</div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <i className="fas fa-coins text-yellow-600"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatPrice(summary.stockValue)}
          </div>
          <div className="text-sm text-gray-500">
            بر اساس قیمت خرید
          </div>
        </div>

        {/* هزینه‌ها */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-800">هزینه‌ها</div>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <i className="fas fa-credit-card text-red-600"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatPrice(summary.totalExpenses)}
          </div>
          <div className="text-sm text-gray-500">
            در {selectedPeriod === 'today' ? 'امروز' : 
              selectedPeriod === 'week' ? '۷ روز گذشته' :
              selectedPeriod === 'month' ? 'ماه جاری' : 'سال جاری'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Accounting; 