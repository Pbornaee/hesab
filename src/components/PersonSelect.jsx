import { useState, useEffect, useRef } from 'react';

function PersonSelect({ value, onChange, people, placeholder }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // تنظیم مقدار اولیه query
    if (value) {
      const person = people.find(p => p.name === value);
      if (person) setQuery(person.name);
    } else {
      setQuery('');
    }
  }, [value, people]);

  useEffect(() => {
    // بستن دراپ‌داون با کلیک خارج از آن
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (name) => {
    setQuery(name);
    onChange(name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setShowDropdown(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        placeholder={placeholder}
      />
      
      {showDropdown && query && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredPeople.length > 0 ? (
            filteredPeople.map(person => (
              <div
                key={person.id}
                onClick={() => handleSelect(person.name)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {person.name}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">
              موردی یافت نشد
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PersonSelect; 