function LogoutConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>

      {/* Dialog */}
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 relative z-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-sign-out-alt text-red-600 text-xl"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            خروج از حساب کاربری
          </h3>
          <p className="text-gray-500">
            آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            بله، خارج شوم
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirmDialog; 