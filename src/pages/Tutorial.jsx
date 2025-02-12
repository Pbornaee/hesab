import React from 'react';

function Tutorial() {
  return (
    <div className="lg:p-6 p-4 max-w-4xl mx-auto mt-16 lg:mt-0">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">راهنمای استفاده از سیستم</h1>
      
      <div className="space-y-8">
        {/* بخش محصولات */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-shopping-bag text-blue-600 ml-2"></i>
            مدیریت محصولات
          </h2>
          <div className="space-y-3 text-gray-600">
            <p>در این بخش می‌توانید:</p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>محصولات جدید را با نام، دسته‌بندی و قیمت اضافه کنید</li>
              <li>برای هر محصول چند نرخ مختلف تعریف کنید</li>
              <li>موجودی هر محصول را مدیریت کنید</li>
              <li>محصولات را ویرایش یا حذف کنید</li>
            </ul>
          </div>
        </div>

        {/* بخش فروش */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-dollar-sign text-green-600 ml-2"></i>
            ثبت فروش
          </h2>
          <div className="space-y-3 text-gray-600">
            <p>در این بخش می‌توانید:</p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>فروش‌های روزانه را ثبت کنید</li>
              <li>تخفیف اعمال کنید</li>
              <li>از موجودی به صورت خودکار کم می‌شود</li>
              <li>آرشیو فروش‌ها را مشاهده کنید</li>
            </ul>
          </div>
        </div>

        {/* بخش بار جدید */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-box text-purple-600 ml-2"></i>
            ثبت بار جدید
          </h2>
          <div className="space-y-3 text-gray-600">
            <p>در این بخش می‌توانید:</p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>ورود بار جدید را ثبت کنید</li>
              <li>قیمت خرید جدید را وارد کنید</li>
              <li>به موجودی اضافه می‌شود</li>
              <li>تاریخچه ورود بار را ببینید</li>
            </ul>
          </div>
        </div>

        {/* بخش هزینه‌ها */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-credit-card text-red-600 ml-2"></i>
            ثبت هزینه‌ها
          </h2>
          <div className="space-y-3 text-gray-600">
            <p>در این بخش می‌توانید:</p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>هزینه‌های مختلف را دسته‌بندی کنید</li>
              <li>هزینه‌های روزانه را ثبت کنید</li>
              <li>توضیحات اضافه کنید</li>
              <li>گزارش هزینه‌ها را ببینید</li>
            </ul>
          </div>
        </div>

        {/* بخش حساب و کتاب */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-calculator text-blue-600 ml-2"></i>
            حساب و کتاب
          </h2>
          <div className="space-y-3 text-gray-600">
            <p>در این بخش می‌توانید:</p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>گزارش کلی فروش را ببینید</li>
              <li>سود و زیان را محاسبه کنید</li>
              <li>آمار روزانه، هفتگی و ماهانه را مشاهده کنید</li>
              <li>وضعیت موجودی انبار را ببینید</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tutorial; 