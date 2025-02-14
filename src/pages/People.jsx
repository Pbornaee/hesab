import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

function People({ people, setPeople }) {
  const { currentUser } = useAuth();
  const [newPerson, setNewPerson] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPerson.trim()) return;

    try {
      const updatedPeople = [...people, {
        id: Date.now(),
        name: newPerson.trim()
      }];

      await updateDoc(doc(db, 'users', currentUser.id), {
        people: updatedPeople
      });

      setPeople(updatedPeople);
      setNewPerson('');
    } catch (error) {
      console.error('خطا در افزودن شخص:', error);
      setError('خطا در افزودن شخص');
    }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;

    try {
      const updatedPeople = people.map(person =>
        person.id === id ? { ...person, name: editName.trim() } : person
      );

      await updateDoc(doc(db, 'users', currentUser.id), {
        people: updatedPeople
      });

      setPeople(updatedPeople);
      setEditingId(null);
      setEditName('');
    } catch (error) {
      console.error('خطا در ویرایش شخص:', error);
      setError('خطا در ویرایش شخص');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این شخص اطمینان دارید؟')) return;

    try {
      const updatedPeople = people.filter(person => person.id !== id);

      await updateDoc(doc(db, 'users', currentUser.id), {
        people: updatedPeople
      });

      setPeople(updatedPeople);
    } catch (error) {
      console.error('خطا در حذف شخص:', error);
      setError('خطا در حذف شخص');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">مدیریت اشخاص</h1>

      {/* فرم افزودن شخص جدید */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={newPerson}
            onChange={e => setNewPerson(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="نام شخص جدید..."
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            افزودن
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* لیست اشخاص */}
      <div className="bg-white rounded-xl shadow-sm">
        {people.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            هنوز شخصی ثبت نشده است
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {people.map(person => (
              <div key={person.id} className="p-4 flex items-center justify-between">
                {editingId === person.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => handleEdit(person.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <i className="fas fa-check"></i>
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditName('');
                      }}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-900">{person.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(person.id);
                          setEditName(person.name);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default People; 