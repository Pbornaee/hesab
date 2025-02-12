import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', icon: 'home', label: 'داشبورد' },
    { path: '/products', icon: 'shopping-bag', label: 'محصولات' },
    { path: '/sales', icon: 'dollar-sign', label: 'فروش روز' },
    { path: '/new-stock', icon: 'box', label: 'بار جدید' },
    { path: '/expenses', icon: 'credit-card', label: 'هزینه‌ها' },
    { path: '/accounting', icon: 'calculator', label: 'حساب و کتاب' },
    { path: '/tutorial', icon: 'question-circle', label: 'راهنما' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('خطا در خروج:', error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button - تغییر موقعیت و استایل */}
      <div className="lg:hidden fixed top-0 right-0 w-full h-16 bg-white shadow-sm z-10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <i className="fas fa-calculator text-white text-sm"></i>
          </div>
          <span className="text-sm font-medium text-gray-700">حسابداری فروشگاه</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors duration-200"
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-gray-600`}></i>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`bg-white w-72 h-screen shadow-xl fixed right-0 top-0 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 z-20`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <i className="fas fa-user text-white text-xl"></i>
            </div>
            <div>
              <h2 className="font-bold text-gray-800">خوش آمدید</h2>
              <p className="text-sm text-gray-500">مدیر سیستم</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-blue-600">
              <i className="fas fa-calculator text-lg"></i>
              <span className="font-medium">حسابداری فروشگاه</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                  ${isActiveLink(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <i className={`fas fa-${item.icon} w-6 ${isActiveLink(item.path) ? 'text-blue-600' : 'text-gray-400'}`}></i>
                <span className={`${isActiveLink(item.path) ? 'font-medium' : ''}`}>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* دکمه خروج */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 mt-4 text-right rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <i className="fas fa-sign-out-alt ml-2"></i>
            خروج از حساب
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar; 