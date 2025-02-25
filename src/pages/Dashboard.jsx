import { useState, useEffect } from 'react';

function Dashboard({ todaySales = [], salesArchive = [] }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num) => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/[0-9]/g, (d) => persianNumbers[d]);
  };

  // فرمت کردن ساعت
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return toPersianNumber(`${hours}:${minutes}:${seconds}`);
  };

  // تبدیل تاریخ میلادی به شمسی
  const getPersianDate = () => {
    const options = { 
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      calendar: 'persian'
    };
    
    const persianDate = new Intl.DateTimeFormat('fa-IR', options).format(currentTime);
    const weekDay = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(currentTime);
    
    return {
      date: persianDate,
      weekDay: weekDay
    };
  };

  const { date, weekDay } = getPersianDate();

  // فرمت کردن قیمت
  const formatPrice = (price) => {
    return toPersianNumber(price.toLocaleString()) + ' تومان';
  };

  // محاسبه کل فروش
  const calculateTotalSales = () => {
    return [...todaySales, ...salesArchive].reduce((total, sale) => {
      if (!sale) return total;
      return total + (sale.salePrice * sale.quantity);
    }, 0);
  };

  // محاسبه سود - اختلاف قیمت فروش و قیمت خرید
  const calculateProfit = (sale) => {
    if (!sale) return 0;
    // سود = قیمت فروش - قیمت خرید
    return (sale.salePrice * sale.quantity) - sale.purchaseCost;
  };

  // محاسبه سود کل
  const calculateTotalProfit = () => {
    return [...todaySales, ...salesArchive].reduce((total, sale) => {
      if (!sale) return total;
      return total + calculateProfit(sale);
    }, 0);
  };

  // محاسبه فروش امروز
  const calculateTodaySales = () => {
    if (!todaySales?.length) return 0;
    return todaySales.reduce((total, sale) => {
      return total + (sale.salePrice * sale.quantity);
    }, 0);
  };

  // محاسبه فروش ماهانه
  const calculateMonthlySales = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const allSales = [...(todaySales || []), ...(salesArchive || [])];
    const monthlySales = allSales.filter(sale => 
      new Date(sale.timestamp) >= startOfMonth
    );

    return monthlySales.reduce((total, sale) => {
      return total + (sale.salePrice * sale.quantity);
    }, 0);
  };

  // محاسبه تعداد فروش امروز
  const calculateTodaySalesCount = () => {
    if (!todaySales?.length) return 0;
    return todaySales.reduce((total, sale) => total + sale.quantity, 0);
  };

  // محاسبه تعداد فروش ماهانه
  const calculateMonthlySalesCount = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const allSales = [...(todaySales || []), ...(salesArchive || [])];
    const monthlySales = allSales.filter(sale => 
      new Date(sale.timestamp) >= startOfMonth
    );

    return monthlySales.reduce((total, sale) => total + sale.quantity, 0);
  };

  // محاسبه درصد تغییرات روزانه
  const calculateDailyChange = (todayValue, yesterdayValue) => {
    if (yesterdayValue === 0) return 0;
    return ((todayValue - yesterdayValue) / yesterdayValue) * 100;
  };

  // محاسبه درصد تغییرات ماهانه
  const calculateMonthlyChange = (thisMonthValue, lastMonthValue) => {
    if (lastMonthValue === 0) return 0;
    return ((thisMonthValue - lastMonthValue) / lastMonthValue) * 100;
  };

  // محاسبه فروش دیروز
  const calculateYesterdaySales = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return salesArchive.reduce((total, sale) => {
      const saleDate = new Date(sale.timestamp);
      if (saleDate >= yesterday && saleDate < today) {
        return total + ((sale.salePrice * sale.quantity) - (sale.discount || 0));
      }
      return total;
    }, 0);
  };

  // محاسبه فروش ماه قبل
  const calculateLastMonthSales = () => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    return salesArchive.reduce((total, sale) => {
      const saleDate = new Date(sale.timestamp);
      if (saleDate >= startOfLastMonth && saleDate < startOfThisMonth) {
        return total + ((sale.salePrice * sale.quantity) - (sale.discount || 0));
      }
      return total;
    }, 0);
  };

  return (
    <div className="lg:p-6 p-4 max-w-7xl mx-auto mt-16 lg:mt-0">
      {/* هدر */}
      <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">
              {date}
            </div>
            <div className="text-blue-100 mt-1">{weekDay}</div>
          </div>
          <div className="text-2xl font-light text-blue-100">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* سود امروز */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="icon-wrapper">
              <i className="fas fa-chart-pie text-lg"></i>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const todaySalesValue = calculateTodaySales();
                const yesterdaySalesValue = calculateYesterdaySales();
                const changePercent = calculateDailyChange(todaySalesValue, yesterdaySalesValue);
                const isPositive = changePercent >= 0;

                return (
                  <>
                    <div className={`text-sm ${isPositive ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-3 py-1 rounded-full font-medium`}>
                      {toPersianNumber(Math.abs(changePercent).toFixed(1))}٪
                      <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-xs mr-1`}></i>
                    </div>
                    <div className="text-xs text-gray-400">نسبت به دیروز</div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">سود امروز</h3>
              <div className={`text-2xl font-bold mb-2 ${
                calculateTotalProfit() >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPrice(Math.abs(calculateTotalProfit()))}
              </div>
              <div className="text-sm text-gray-500">
                {calculateTotalProfit() >= 0 ? 'سود' : 'ضرر'}
              </div>
            </div>
            <div className="flex-1 mx-8">
              <div className="flex space-x-2 justify-end h-24 items-end">
                {[40, 60, 30, 70, 50, 80, 45].map((height, index) => (
                  <div
                    key={index}
                    className="chart-bar ml-2"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* تعداد فروش امروز */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="icon-wrapper">
              <i className="fas fa-shopping-cart text-lg"></i>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const todaySalesValue = calculateTodaySales();
                const yesterdaySalesValue = calculateYesterdaySales();
                const changePercent = calculateDailyChange(todaySalesValue, yesterdaySalesValue);
                const isPositive = changePercent >= 0;

                return (
                  <>
                    <div className={`text-sm ${isPositive ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-3 py-1 rounded-full font-medium`}>
                      {toPersianNumber(Math.abs(changePercent).toFixed(1))}٪
                      <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-xs mr-1`}></i>
                    </div>
                    <div className="text-xs text-gray-400">نسبت به دیروز</div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">تعداد فروش امروز</h3>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {toPersianNumber(calculateTodaySalesCount())} عدد
              </div>
            </div>
            <div className="flex-1 mx-8">
              <div className="flex space-x-2 justify-end h-24 items-end">
                {[40, 60, 30, 70, 50, 80, 45].map((height, index) => (
                  <div
                    key={index}
                    className="chart-bar ml-2"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* فروش امروز */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="icon-wrapper">
              <i className="fas fa-chart-line text-lg"></i>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const todaySalesValue = calculateTodaySales();
                const yesterdaySalesValue = calculateYesterdaySales();
                const changePercent = calculateDailyChange(todaySalesValue, yesterdaySalesValue);
                const isPositive = changePercent >= 0;

                return (
                  <>
                    <div className={`text-sm ${isPositive ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-3 py-1 rounded-full font-medium`}>
                      {toPersianNumber(Math.abs(changePercent).toFixed(1))}٪
                      <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-xs mr-1`}></i>
                    </div>
                    <div className="text-xs text-gray-400">نسبت به دیروز</div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">فروش امروز</h3>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatPrice(calculateTodaySales())}
              </div>
            </div>
            <div className="flex-1 mx-8">
              <div className="flex space-x-2 justify-end h-24 items-end">
                {[40, 60, 30, 70, 50, 80, 45].map((height, index) => (
                  <div
                    key={index}
                    className="chart-bar ml-2"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* سود ماهانه */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="icon-wrapper">
              <i className="fas fa-chart-pie text-lg"></i>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const thisMonthSalesValue = calculateMonthlySales();
                const lastMonthSalesValue = calculateLastMonthSales();
                const changePercent = calculateMonthlyChange(thisMonthSalesValue, lastMonthSalesValue);
                const isPositive = changePercent >= 0;

                return (
                  <>
                    <div className={`text-sm ${isPositive ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-3 py-1 rounded-full font-medium`}>
                      {toPersianNumber(Math.abs(changePercent).toFixed(1))}٪
                      <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-xs mr-1`}></i>
                    </div>
                    <div className="text-xs text-gray-400">نسبت به ماه قبل</div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">سود این ماه</h3>
              <div className={`text-2xl font-bold mb-2 ${
                calculateTotalProfit() >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPrice(Math.abs(calculateTotalProfit()))}
              </div>
              <div className="text-sm text-gray-500">
                {calculateTotalProfit() >= 0 ? 'سود' : 'ضرر'}
              </div>
            </div>
            <div className="flex-1 mx-8">
              <div className="flex space-x-2 justify-end h-24 items-end">
                {[45, 65, 35, 75, 55, 85, 50].map((height, index) => (
                  <div
                    key={index}
                    className="chart-bar ml-2"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* فروش ماهانه */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="icon-wrapper">
              <i className="fas fa-chart-bar text-lg"></i>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const thisMonthSalesValue = calculateMonthlySales();
                const lastMonthSalesValue = calculateLastMonthSales();
                const changePercent = calculateMonthlyChange(thisMonthSalesValue, lastMonthSalesValue);
                const isPositive = changePercent >= 0;

                return (
                  <>
                    <div className={`text-sm ${isPositive ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-3 py-1 rounded-full font-medium`}>
                      {toPersianNumber(Math.abs(changePercent).toFixed(1))}٪
                      <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-xs mr-1`}></i>
                    </div>
                    <div className="text-xs text-gray-400">نسبت به ماه قبل</div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">فروش این ماه</h3>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatPrice(calculateMonthlySales())}
              </div>
            </div>
            <div className="flex-1 mx-8">
              <div className="flex space-x-2 justify-end h-24 items-end">
                {[45, 65, 35, 75, 55, 85, 50].map((height, index) => (
                  <div
                    key={index}
                    className="chart-bar ml-2"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* تعداد فروش ماهانه */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="icon-wrapper">
              <i className="fas fa-shopping-cart text-lg"></i>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const thisMonthSalesValue = calculateMonthlySales();
                const lastMonthSalesValue = calculateLastMonthSales();
                const changePercent = calculateMonthlyChange(thisMonthSalesValue, lastMonthSalesValue);
                const isPositive = changePercent >= 0;

                return (
                  <>
                    <div className={`text-sm ${isPositive ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-3 py-1 rounded-full font-medium`}>
                      {toPersianNumber(Math.abs(changePercent).toFixed(1))}٪
                      <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-xs mr-1`}></i>
                    </div>
                    <div className="text-xs text-gray-400">نسبت به ماه قبل</div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">تعداد فروش ماهانه</h3>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {toPersianNumber(calculateMonthlySalesCount())} عدد
              </div>
            </div>
            <div className="flex-1 mx-8">
              <div className="flex space-x-2 justify-end h-24 items-end">
                {[45, 65, 35, 75, 55, 85, 50].map((height, index) => (
                  <div
                    key={index}
                    className="chart-bar ml-2"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 