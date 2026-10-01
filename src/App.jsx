import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'daily-expense-tracker-expenses-v1';
const CATEGORIES = ['খাবার', 'যাতায়াত', 'কেনাকাটা', 'বিল', 'অন্যান্য'];

// Small inline SVGs keep the app lightweight and avoid an extra icon package.
function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const paths = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 1 4 16.5z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h8M8 10h6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    plate: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /><path d="M3 4v6M5 4v6M4 10v10M20 4v16M20 4c-2 2-2 5 0 7" /></>,
    transit: <><rect x="5" y="3" width="14" height="17" rx="3" /><path d="M5 13h14M8 7h8M8 17h.01M16 17h.01M8 20v1M16 20v1" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0M8 12v.01M16 12v.01" /></>,
    bill: <><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" /></>,
    wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 8h16M15 13h2" /></>,
    note: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function readExpenses() {
  // LocalStorage can be unavailable in private or restricted browser contexts.
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat('bn-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

function categoryIcon(category) {
  if (category === 'খাবার') return 'plate';
  if (category === 'যাতায়াত') return 'transit';
  if (category === 'কেনাকাটা') return 'bag';
  if (category === 'বিল') return 'bill';
  return 'dots';
}

function categoryClass(category) {
  if (category === 'খাবার') return 'cat-food';
  if (category === 'যাতায়াত') return 'cat-transport';
  if (category === 'কেনাকাটা') return 'cat-shopping';
  if (category === 'বিল') return 'cat-bills';
  return 'cat-others';
}

function App() {
  const [expenses, setExpenses] = useState(readExpenses);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('সব');
  const [error, setError] = useState('');
  const [storageMessage, setStorageMessage] = useState('');

  // Keep every change available after a refresh without requiring an account.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      setStorageMessage('');
    } catch {
      setStorageMessage('এই ব্রাউজারে তথ্য সংরক্ষণ করা যাচ্ছে না।');
    }
  }, [expenses]);

  const shownExpenses = useMemo(() => {
    return [...expenses]
      .filter((expense) => filter === 'সব' || expense.category === filter)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [expenses, filter]);

  const total = shownExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  function handleSubmit(event) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('সঠিক পরিমাণ লিখুন—পরিমাণ শূন্যের বেশি হতে হবে।');
      return;
    }

    const expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount: numericAmount,
      category,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((current) => [expense, ...current]);
    setAmount('');
    setNote('');
    setCategory(CATEGORIES[0]);
    setError('');
  }

  function deleteExpense(id) {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
  }

  const today = new Intl.DateTimeFormat('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <main className="app-shell">
      <div className="app-wrap">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark"><Icon name="book" size={23} /></div>
            <div>
              <div className="brand-name">দৈনিক খরচ</div>
              <div className="brand-sub">আপনার টাকার ছোট্ট খাতা</div>
            </div>
          </div>
          <div className="date-chip"><Icon name="calendar" size={16} /><span>{today}</span></div>
        </header>

        <section className="welcome" aria-labelledby="page-title">
          <div>
            <div className="eyebrow">আজকের হিসাব</div>
            <h1 id="page-title">প্রতিদিনের খরচ, <span style={{ color: '#1765a8' }}>এক নজরে।</span></h1>
            <p>ছোট ছোট হিসাব লিখে রাখুন, মাস শেষে ছবিটা পরিষ্কার হবে।</p>
          </div>
          <div className="privacy-note"><Icon name="lock" size={15} /> আপনার হিসাব শুধু এই ডিভাইসেই থাকে</div>
        </section>

        <div className="workspace">
          <section className="panel form-panel" aria-labelledby="add-heading">
            <div className="panel-heading">
              <div className="heading-icon"><Icon name="plus" size={21} /></div>
              <div>
                <h2 id="add-heading">নতুন খরচ লিখুন</h2>
                <p>একটি খরচ যোগ করতে কয়েক সেকেন্ডই যথেষ্ট</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="expense-amount">কত টাকা খরচ হয়েছে?</label>
                <div className="amount-wrap">
                  <span className="currency" aria-hidden="true">৳</span>
                  <input
                    id="expense-amount"
                    data-testid="input-expense-amount"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="any"
                    placeholder="যেমন ১২০"
                    value={amount}
                    onChange={(event) => { setAmount(event.target.value); setError(''); }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'amount-error' : 'amount-hint'}
                  />
                </div>
                {error ? <p className="error-text" id="amount-error" role="alert">{error}</p> : <p className="field-hint" id="amount-hint">বাংলাদেশি টাকা (৳)</p>}
              </div>
              <div className="field">
                <label htmlFor="expense-category">কোন খাতে?</label>
                <select id="expense-category" data-testid="select-expense-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="expense-note">ছোট্ট নোট <span style={{ color: '#93a2aa', fontWeight: 400 }}>(ঐচ্ছিক)</span></label>
                <input id="expense-note" data-testid="input-expense-note" type="text" maxLength="80" placeholder="যেমন: সকালের নাস্তা" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
              <button className="submit-button" type="submit" data-testid="button-add-expense">
                <Icon name="plus" size={19} /> খরচ যোগ করুন
              </button>
            </form>
          </section>

          <section className="panel list-panel" aria-labelledby="list-heading">
            <div className="summary-band" aria-live="polite">
              <div>
                <div className="summary-label"><Icon name="wallet" size={17} />{filter === 'সব' ? 'মোট খরচ' : `${filter} খাতে মোট`}</div>
                <div className="summary-total"><span>৳</span>{formatMoney(total)}</div>
              </div>
              <div className="summary-count"><strong>{formatMoney(shownExpenses.length)}</strong>{shownExpenses.length === 1 ? 'টি খরচ' : 'টি খরচ'}</div>
            </div>
            <div className="list-toolbar">
              <h2 id="list-heading">খরচের তালিকা</h2>
              <div className="filter-control">
                <label htmlFor="expense-filter">খরচের খাত বেছে নিন</label>
                <select id="expense-filter" data-testid="select-expense-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
                  <option value="সব">সব খরচ</option>
                  {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
            {shownExpenses.length === 0 ? (
              <div className="empty-state" data-testid="empty-expenses">
                <div className="empty-illustration"><Icon name={filter === 'সব' ? 'note' : 'wallet'} size={29} /></div>
                <h3>{filter === 'সব' ? 'এখনো কোনো খরচ লেখা হয়নি' : 'এই খাতে এখনো কোনো খরচ নেই'}</h3>
                <p>{filter === 'সব' ? 'প্রথম খরচটি যোগ করলেই আপনার হিসাবের খাতা ভরে উঠবে। উপরের ফর্ম থেকে শুরু করুন।' : 'অন্য খাত বেছে দেখুন, অথবা এই খাতে নতুন খরচ যোগ করুন।'}</p>
              </div>
            ) : (
              <ul className="expense-list" aria-label="খরচের তালিকা">
                {shownExpenses.map((expense) => (
                  <li className="expense-row" key={expense.id} data-testid={`expense-row-${expense.id}`}>
                    <div className={`category-mark ${categoryClass(expense.category)}`}><Icon name={categoryIcon(expense.category)} size={20} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="expense-name">{expense.category}</div>
                      <div className="expense-date">{formatDate(expense.createdAt)}</div>
                      {expense.note && <div className="expense-note">{expense.note}</div>}
                    </div>
                    <div className="expense-amount">৳ {formatMoney(Number(expense.amount))}</div>
                    <button
                      type="button"
                      className="delete-button"
                      data-testid={`button-delete-expense-${expense.id}`}
                      aria-label={`${expense.category}, ${formatMoney(Number(expense.amount))} টাকা খরচ মুছুন`}
                      title="খরচ মুছুন"
                      onClick={() => deleteExpense(expense.id)}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <footer className="footer-note" aria-live="polite">
          {storageMessage || 'দিনের শেষে ছোট্ট একটি অভ্যাস—নিজের টাকার খোঁজ রাখা।'}
        </footer>
      </div>
    </main>
  );
}

export default App;