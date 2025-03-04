import { useRef } from 'react';

function PersonSearchSelect({ 
  value,
  onChange,
  options = [], // مقدار پیش‌فرض برای options
  getOptionLabel,
  placeholder,
  searchQuery,
  setSearchQuery,
  isDropdownOpen,
  setIsDropdownOpen,
  selectedCategory,
  setSelectedCategory,
  isCategoryDropdownOpen,
  setIsCategoryDropdownOpen
}) {
  const dropdownRef = useRef(null);

  // فیلتر کردن محصولات بر اساس جستجو و دسته‌بندی
  const filteredOptions = options.filter(option => {
    const matchesSearch = getOptionLabel(option)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      (option.category && option.category === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // گرفتن لیست دسته‌بندی‌های منحصر به فرد
  const categories = ['all', ...new Set(options.map(option => option.category).filter(Boolean))];

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white"
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value ? getOptionLabel(value) : placeholder}
          </span>
          <i className={`fas fa-chevron-down text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </div>

      {isDropdownOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            {/* جستجو */}
            <div className="relative mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              />
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>

            {/* دسته‌بندی */}
            <div className="relative mb-2">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-right flex items-center justify-between"
              >
                <span className="text-sm text-gray-600">
                  {selectedCategory === 'all' ? 'همه دسته‌ها' : selectedCategory}
                </span>
                <i className={`fas fa-chevron-down text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-right hover:bg-gray-50 ${
                        selectedCategory === category ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      {category === 'all' ? 'همه دسته‌ها' : category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* لیست محصولات */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-right hover:bg-gray-50 ${
                    value?.id === option.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                  }`}
                >
                  {getOptionLabel(option)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonSearchSelect; 