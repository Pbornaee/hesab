import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db, auth } from './firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Sidebar from './components/Sidebar';
import NewStock from './pages/NewStock';
import Expenses from './pages/Expenses';
import Accounting from './pages/Accounting';
import Login from './pages/Login';
import Register from './pages/Register';
import Tutorial from './pages/Tutorial';
import People from './pages/People';
import Invoice from './pages/Invoice';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const [hasValidSubscription, setHasValidSubscription] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentUser?.id) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (!userDoc.exists()) return;

        const remainingDays = userDoc.data().remainingDays;
        setHasValidSubscription(remainingDays > 0);
      } catch (error) {
        console.error('خطا در بررسی اشتراک:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('خطا در خروج از حساب:', error);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (!hasValidSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">اشتراک شما به پایان رسیده است</h1>
          <p className="text-gray-600 mb-6">
            برای ادامه استفاده از برنامه، لطفاً با پشتیبانی تماس بگیرید تا اشتراک شما تمدید شود.
          </p>
          <div className="space-y-4">
            <a 
              href="tel:+989123456789"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <i className="fas fa-phone ml-2"></i>
              تماس با پشتیبانی
            </a>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              خروج از حساب
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 lg:mr-72">
        {children}
      </div>
    </div>
  );
}

// کامپوننت اصلی که state ها رو مدیریت می‌کنه
function AppContent({ products, setProducts, todaySales, setTodaySales, salesArchive, setSalesArchive, 
                     expenses, setExpenses, stockLogs, setStockLogs, people, setPeople, clearAllData }) {
  const { currentUser, setCurrentUser } = useAuth();

  // پاک کردن state ها در هر تغییر currentUser
  useEffect(() => {
    clearAllData();
  }, [currentUser?.id]); // فقط وقتی ID کاربر تغییر می‌کند اجرا می‌شود

  // لود اطلاعات از فایربیس
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.id) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          // پاک کردن state ها قبل از لود داده‌های جدید
          clearAllData();
          
          // لود داده‌های جدید
          if (Array.isArray(data.products)) setProducts(data.products);
          if (Array.isArray(data.todaySales)) setTodaySales(data.todaySales);
          if (Array.isArray(data.salesArchive)) setSalesArchive(data.salesArchive);
          if (Array.isArray(data.stockLogs)) setStockLogs(data.stockLogs);
          if (Array.isArray(data.expenses)) setExpenses(data.expenses);
          if (Array.isArray(data.people)) setPeople(data.people);
        }
      } catch (error) {
        console.error('خطا در بارگیری اطلاعات:', error);
        clearAllData();
      }
    };

    loadUserData();
  }, [currentUser?.id]); // فقط وقتی ID کاربر تغییر می‌کند اجرا می‌شود

  // ذخیره تغییرات در فایربیس
  const saveToFirebase = async (data) => {
    if (!currentUser || !currentUser.id) return;

    try {
      // ذخیره در کالکشن users
      await updateDoc(doc(db, 'users', currentUser.id), data);
    } catch (error) {
      console.error('خطا در ذخیره اطلاعات:', error);
    }
  };

  // آپدیت wrapper functions
  const updateProducts = async (newProducts) => {
    setProducts(newProducts);
    await saveToFirebase({ products: newProducts });
  };

  const updateTodaySales = async (newSales) => {
    setTodaySales(newSales);
    await saveToFirebase({ todaySales: newSales });
  };

  const updateSalesArchive = async (newArchive) => {
    setSalesArchive(newArchive);
    await saveToFirebase({ salesArchive: newArchive });
  };

  const updateStockLogs = async (newLogs) => {
    setStockLogs(newLogs);
    await saveToFirebase({ stockLogs: newLogs });
  };

  const updateExpenses = async (newExpenses) => {
    setExpenses(newExpenses);
    await saveToFirebase({ expenses: newExpenses });
  };

  const updatePeople = async (newPeople) => {
    setPeople(newPeople);
    await saveToFirebase({ people: newPeople });
  };

  // چک کردن و کم کردن اشتراک در نیمه شب
  useEffect(() => {
    if (!currentUser?.id) return;

    const checkSubscription = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const lastCheckDate = userData.lastSubscriptionCheck ? new Date(userData.lastSubscriptionCheck) : null;
        const now = new Date();

        // اگر آخرین چک در روز قبل بوده یا اصلا چک نشده
        if (!lastCheckDate || lastCheckDate.getDate() !== now.getDate()) {
          // کم کردن یک روز از اشتراک
          const remainingDays = userData.remainingDays > 0 ? userData.remainingDays - 1 : 0;

          await updateDoc(doc(db, 'users', currentUser.id), {
            remainingDays,
            lastSubscriptionCheck: now.toISOString()
          });
        }
      } catch (error) {
        console.error('خطا در بروزرسانی اشتراک:', error);
      }
    };

    // تنظیم تایمر برای چک کردن در نیمه شب
    const setMidnightCheck = () => {
      const now = new Date();
      const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // فردا
        0, // ساعت 00
        0, // دقیقه 00
        0 // ثانیه 00
      );
      
      const msUntilMidnight = night.getTime() - now.getTime();
      
      return setTimeout(() => {
        checkSubscription();
        // تنظیم مجدد تایمر برای شب بعد
        setMidnightCheck();
      }, msUntilMidnight);
    };

    // چک اولیه
    checkSubscription();
    
    // تنظیم تایمر
    const timer = setMidnightCheck();

    return () => clearTimeout(timer);
  }, [currentUser]);

  const handleLogout = () => {
    clearAllData();
    setCurrentUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* مسیرهای عمومی */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* مسیرهای خصوصی */}
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard 
                todaySales={todaySales}
                salesArchive={salesArchive}
              />
            </PrivateRoute>
          } />
          <Route path="/products" element={
            <PrivateRoute>
              <Products 
                products={products} 
                setProducts={updateProducts} 
              />
            </PrivateRoute>
          } />
          <Route path="/sales" element={
            <PrivateRoute>
              <Sales 
                products={products} 
                setProducts={updateProducts}
                todaySales={todaySales}
                setTodaySales={updateTodaySales}
                salesArchive={salesArchive}
                setSalesArchive={updateSalesArchive}
                people={people}
                setPeople={updatePeople}
              />
            </PrivateRoute>
          } />
          <Route path="/new-stock" element={
            <PrivateRoute>
              <NewStock 
                products={products} 
                setProducts={updateProducts}
                stockLogs={stockLogs}
                setStockLogs={updateStockLogs}
                people={people}
                setPeople={updatePeople}
              />
            </PrivateRoute>
          } />
          <Route path="/expenses" element={
            <PrivateRoute>
              <Expenses 
                expenses={expenses}
                setExpenses={updateExpenses}
                people={people}
                setPeople={updatePeople}
              />
            </PrivateRoute>
          } />
          <Route path="/accounting" element={
            <PrivateRoute>
              <Accounting 
                products={products}
                todaySales={todaySales}
                salesArchive={salesArchive}
                expenses={expenses}
                stockLogs={stockLogs}
              />
            </PrivateRoute>
          } />
          <Route path="/tutorial" element={
            <PrivateRoute>
              <Tutorial />
            </PrivateRoute>
          } />
          <Route path="/people" element={
            <PrivateRoute>
              <People 
                people={people}
                setPeople={updatePeople}
                stockLogs={stockLogs}
                setStockLogs={updateStockLogs}
                todaySales={todaySales}
                setTodaySales={updateTodaySales}
                salesArchive={salesArchive}
                setSalesArchive={updateSalesArchive}
              />
            </PrivateRoute>
          } />
          <Route path="/invoice" element={
            <PrivateRoute>
              <Invoice 
                products={products}
                people={people}
                setPeople={updatePeople}
              />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

// کامپوننت اصلی که AuthProvider رو wrap می‌کنه
function App() {
  const [products, setProducts] = useState([]);
  const [todaySales, setTodaySales] = useState([]);
  const [salesArchive, setSalesArchive] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [people, setPeople] = useState([]);

  // تابع پاکسازی همه state ها
  const clearAllData = () => {
    setProducts([]);
    setTodaySales([]);
    setSalesArchive([]);
    setExpenses([]);
    setStockLogs([]);
    setPeople([]);
  };

  return (
    <AuthProvider>
      <AppContent 
        products={products}
        setProducts={setProducts}
        todaySales={todaySales}
        setTodaySales={setTodaySales}
        salesArchive={salesArchive}
        setSalesArchive={setSalesArchive}
        expenses={expenses}
        setExpenses={setExpenses}
        stockLogs={stockLogs}
        setStockLogs={setStockLogs}
        people={people}
        setPeople={setPeople}
        clearAllData={clearAllData}  // پاس دادن تابع پاکسازی
      />
    </AuthProvider>
  );
}

export default App; 