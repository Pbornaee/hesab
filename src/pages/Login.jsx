import { useState } from 'react';
import { db, normalizeUsername } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const normalizedUsername = normalizeUsername(username);

      // جستجوی کاربر در userAuth
      const authRef = collection(db, 'userAuth');
      const q = query(authRef, where('username', '==', normalizedUsername));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('نام کاربری یا رمز عبور اشتباه است');
        return;
      }

      const authDoc = querySnapshot.docs[0];
      const authData = authDoc.data();

      // چک کردن پسورد
      if (authData.password !== password) {
        setError('نام کاربری یا رمز عبور اشتباه است');
        return;
      }

      // دریافت اطلاعات کاربر از users
      const userDoc = await getDoc(doc(db, 'users', authDoc.id));
      const userData = userDoc.data();

      // ذخیره اطلاعات کاربر در context
      setCurrentUser({
        id: authDoc.id,
        ...userData
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      setError('خطا در ورود. لطفاً دوباره تلاش کنید.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ورود به حساب کاربری
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="نام کاربری"
                dir="ltr"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="رمز عبور"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ورود
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600">
            حساب کاربری ندارید؟{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              ثبت نام کنید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login; 