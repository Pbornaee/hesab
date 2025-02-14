import { useState, useEffect, useRef } from 'react';

function PersonSearchSelect({ value, onChange, people, placeholder }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
    person.name.toLowerCase().includes(value.toLowerCase())
  );

  const handleSelect = (name) => {
    onChange(name);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        placeholder={placeholder}
      />
      
      {showDropdown && value && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredPeople.length > 0 ? (
            filteredPeople.map(person => (
              <div
                key={person.id}
                onClick={() => handleSelect(person.name)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              >
                <i className="fas fa-user text-gray-400"></i>
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

export default PersonSearchSelect; 