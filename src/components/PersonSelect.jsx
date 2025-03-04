import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function PersonSelect({ value, onChange, people, placeholder, onAddPerson }) {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleAddPerson = async (e) => {
    e?.preventDefault();
    if (!newPersonName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      const newPerson = {
        id: Date.now(),
        name: newPersonName.trim(),
        timestamp: new Date().toISOString()
      };

      // آپدیت در فایربیس
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        people: arrayUnion(newPerson)
      });

      // اضافه کردن به state
      onAddPerson(newPerson);
      
      // انتخاب فرد جدید
      handleSelect(newPerson.name);
      
      // بستن فرم
      setShowAddForm(false);
      setNewPersonName('');

    } catch (error) {
      console.error('خطا در افزودن فرد جدید:', error);
      alert('خطا در افزودن فرد جدید');
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="p-4">
              <div className="text-gray-500 mb-2">موردی یافت نشد</div>
              {onAddPerson && !showAddForm && (
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setNewPersonName(query);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <i className="fas fa-plus"></i>
                  افزودن {query} به لیست
                </button>
              )}
              {onAddPerson && showAddForm && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="نام کامل"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddPerson}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed !opacity-100"
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          در حال ثبت...
                        </>
                      ) : (
                        'ثبت'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 !opacity-100"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PersonSelect; 