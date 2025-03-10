import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, normalizeUsername } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // چک کردن یکتا بودن نام کاربری
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('normalizedUsername', '==', normalizeUsername(username)));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError('این نام کاربری قبلاً استفاده شده است');
        return;
      }

      // ایجاد کاربر جدید
      const userDocRef = doc(db, 'users', username);
      await setDoc(userDocRef, {
        username,
        normalizedUsername: normalizeUsername(username),
        password,
        storeName,
        remainingDays: 7,
        lastSubscriptionCheck: new Date().toISOString()
      });

      // ریدایرکت به صفحه ورود
      navigate('/login');

    } catch (error) {
      console.error('خطا در ثبت نام:', error);
      setError('خطا در ثبت نام. لطفاً دوباره تلاش کنید');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ثبت نام
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
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="نام فروشگاه"
              />
            </div>
            <div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
              ثبت نام
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600">
            قبلاً ثبت نام کرده‌اید؟{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              وارد شوید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register; 