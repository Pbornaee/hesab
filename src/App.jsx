import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
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
function AppContent() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [todaySales, setTodaySales] = useState([]);
  const [salesArchive, setSalesArchive] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // لود اطلاعات از فایربیس
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser || !currentUser.id) {
        // اگر کاربر لاگین نیست، همه state ها رو خالی می‌کنیم
        setProducts([]);
        setTodaySales([]);
        setSalesArchive([]);
        setStockLogs([]);
        setExpenses([]);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // فقط اگر داده وجود داشت، ست می‌کنیم
          if (Array.isArray(data.products)) setProducts(data.products);
          if (Array.isArray(data.todaySales)) setTodaySales(data.todaySales);
          if (Array.isArray(data.salesArchive)) setSalesArchive(data.salesArchive);
          if (Array.isArray(data.stockLogs)) setStockLogs(data.stockLogs);
          if (Array.isArray(data.expenses)) setExpenses(data.expenses);
        }
      } catch (error) {
        console.error('خطا در بارگیری اطلاعات:', error);
        // در صورت خطا همه رو خالی می‌کنیم
        setProducts([]);
        setTodaySales([]);
        setSalesArchive([]);
        setStockLogs([]);
        setExpenses([]);
      }
    };

    loadUserData();
  }, [currentUser]);

  // ذخیره تغییرات در فایربیس
  const saveToFirebase = async (data) => {
    if (!currentUser || !currentUser.id) return;

    try {
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
              />
            </PrivateRoute>
          } />
          <Route path="/expenses" element={
            <PrivateRoute>
              <Expenses 
                expenses={expenses}
                setExpenses={updateExpenses}
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
        </Routes>
      </div>
    </Router>
  );
}

// کامپوننت اصلی که AuthProvider رو wrap می‌کنه
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 