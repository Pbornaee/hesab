import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import SubscriptionStatus from './SubscriptionStatus';
import { useAuth } from '../contexts/AuthContext';
import LogoutConfirmDialog from './LogoutConfirmDialog';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', icon: 'home', title: 'داشبورد' },
    { path: '/products', icon: 'box', title: 'محصولات' },
    { path: '/sales', icon: 'shopping-cart', title: 'فروش' },
    { path: '/new-stock', icon: 'truck-loading', title: 'ورود بار' },
    { path: '/expenses', icon: 'money-bill', title: 'هزینه‌ها' },
    { path: '/accounting', icon: 'calculator', title: 'حسابداری' },
    { path: '/people', icon: 'users', title: 'اشخاص' },
    { path: '/invoice', icon: 'file-invoice', title: 'صورت حساب' },
    { path: '/tutorial', icon: 'question-circle', title: 'آموزش' }
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
      <div className={`fixed top-0 right-0 w-72 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* هدر */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <i className="fas fa-user text-white text-xl"></i>
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">خوش آمدید</h2>
                  <p className="text-sm text-gray-500">مدیر سیستم</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* بخش اسکرول */}
          <div className="flex-1 overflow-y-auto">
            {/* نمایش وضعیت اشتراک */}
            <div className="p-4">
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 text-blue-600">
                  <i className="fas fa-calculator text-lg"></i>
                  <span className="font-medium">حسابداری فروشگاه</span>
                </div>
              </div>
              <div className="mb-4">
                <SubscriptionStatus />
              </div>
            </div>

            {/* منو */}
            <nav className="px-4 space-y-2">
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
                  <span className={`${isActiveLink(item.path) ? 'font-medium' : ''}`}>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* فوتر */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full px-4 py-2 text-right rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <i className="fas fa-sign-out-alt ml-2"></i>
              خروج از حساب
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* دیالوگ تایید خروج */}
      {showLogoutConfirm && (
        <LogoutConfirmDialog
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}

export default Sidebar; 