import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function SubscriptionStatus() {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentUser?.id) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (!userDoc.exists()) return;

        setSubscription({
          remainingDays: userDoc.data().remainingDays
        });
      } catch (error) {
        console.error('خطا در دریافت وضعیت اشتراک:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();

    // آپدیت هر یک دقیقه
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (loading) return null;

  if (!subscription || subscription.remainingDays <= 0) {
    return (
      <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg flex items-center">
        <i className="fas fa-exclamation-circle ml-2"></i>
        اشتراک شما به پایان رسیده است
      </div>
    );
  }

  return (
    <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg flex items-center">
      <i className="fas fa-clock ml-2"></i>
      {subscription.remainingDays} روز اشتراک فعال
    </div>
  );
}

export default SubscriptionStatus; 