import React, { useState, useEffect } from 'react';
import './App.css';

type PasswordCard = {
  ID: string;
  URL: string;
  Name: string;
  Username: string;
  Password: string;
  ShowPassword?: boolean;
};

const Card: React.FC<{ card: PasswordCard, onEdit: (card: PasswordCard) => void, onDelete: (id: string) => void }> = ({ card, onEdit, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [updatedCard, setUpdatedCard] = useState<PasswordCard>(card);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(card.Password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(updatedCard);
    setEditing(false);
  };

  return (
    <div className="card">
      {editing ? (
        <form onSubmit={handleSubmit}>
          <input value={updatedCard.Name} onChange={e => setUpdatedCard({ ...updatedCard, Name: e.target.value })} placeholder="Name" />
          <input value={updatedCard.URL} onChange={e => setUpdatedCard({ ...updatedCard, URL: e.target.value })} placeholder="URL" />
          <input value={updatedCard.Username} onChange={e => setUpdatedCard({ ...updatedCard, Username: e.target.value })} placeholder="Username" />
          <input value={updatedCard.Password} onChange={e => setUpdatedCard({ ...updatedCard, Password: e.target.value })} type={showPassword ? "text" : "password"} placeholder="Password" />
          <button type="submit">Save</button>
        </form>
      ) : (
        <>
          <h2>{card.Name}</h2>
          <p>{card.URL}</p>
          <p>{card.Username}</p>
          <p>{showPassword ? card.Password : '••••••••'}</p>
          <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
          <button onClick={handleCopyPassword}>Copy Password</button>
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={() => onDelete(card.ID)}>Delete</button>
        </>
      )}
    </div>
  );
};

const NewCardForm: React.FC<{ onCreate: (card: Omit<PasswordCard, 'ID'>) => void }> = ({ onCreate }) => {
  const [card, setCard] = useState<Omit<PasswordCard, 'ID'>>({ URL: '', Name: '', Username: '', Password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(card);
    setCard({ URL: '', Name: '', Username: '', Password: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={card.Name} onChange={e => setCard({ ...card, Name: e.target.value })} placeholder="Name" />
      <input value={card.URL} onChange={e => setCard({ ...card, URL: e.target.value })} placeholder="URL" />
      <input value={card.Username} onChange={e => setCard({ ...card, Username: e.target.value })} placeholder="Username" />
      <input value={card.Password} onChange={e => setCard({ ...card, Password: e.target.value })} placeholder="Password" />
      <button type="submit">Add Card</button>
    </form>
  );
};

const App: React.FC = () => {
  const [cards, setCards] = useState<PasswordCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/password-cards')
      .then(res => res.json())
      .then(setCards);
  }, []);

  const handleCreate = (card: Omit<PasswordCard, 'ID'>) => {
    fetch('http://localhost:8080/password-cards', {
      method: 'POST',
      body: JSON.stringify(card),
      headers: { 'Content-Type': 'application/json' },
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(newCard => setCards(oldCards => [...oldCards, newCard]))
    .catch(error => console.log(error));
  };

  const handleEdit = (updatedCard: PasswordCard) => {
    fetch(`http://localhost:8080/password-cards/${updatedCard.ID}`, {
      method: 'PUT',
      body: JSON.stringify(updatedCard),
      headers: { 'Content-Type': 'application/json' },
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
      setCards(oldCards => oldCards.map(card => card.ID === updatedCard.ID ? updatedCard : card));
    })
    .catch(error => console.log(error));
  };

  const handleDelete = (id: string) => {
    fetch(`http://localhost:8080/password-cards/${id}`, {
      method: 'DELETE',
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
      setCards(oldCards => oldCards.filter(card => card.ID !== id));
    })
    .catch(error => console.log(error));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredCards = cards.filter(card => card.Name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="app">
      <input type="search" placeholder="Search" onChange={handleSearch} />
      <NewCardForm onCreate={handleCreate} />
      {filteredCards.map(card => (
        <Card key={card.ID} card={card} onEdit={handleEdit} onDelete={handleDelete} />
      ))}
    </div>
  );
};

export default App;
