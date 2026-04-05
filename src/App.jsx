import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  CirclePlus,
  Download,
  Edit3,
  Filter,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchTransactions } from './api/mockApi';

const trendData = [
  { month: 'Oct', balance: 7800 },
  { month: 'Nov', balance: 8350 },
  { month: 'Dec', balance: 8600 },
  { month: 'Jan', balance: 9100 },
  { month: 'Feb', balance: 9480 },
  { month: 'Mar', balance: 10220 },
];

const categoryColors = ['dodgerblue', 'mediumpurple', 'teal', 'darkorange', 'deeppink', 'seagreen'];

const storageKeys = {
  role: 'finance_role',
  theme: 'finance_theme',
  search: 'finance_search',
  category: 'finance_category',
  type: 'finance_type',
  groupBy: 'finance_group_by',
  transactions: 'finance_transactions',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

function App() {
  const [role, setRole] = useState(() => readStorage(storageKeys.role, 'Admin'));
  const [searchTerm, setSearchTerm] = useState(() => readStorage(storageKeys.search, ''));
  const [categoryFilter, setCategoryFilter] = useState(() => readStorage(storageKeys.category, 'All'));
  const [typeFilter, setTypeFilter] = useState(() => readStorage(storageKeys.type, 'All'));
  const [groupBy, setGroupBy] = useState(() => readStorage(storageKeys.groupBy, 'None'));
  const [isDarkMode, setIsDarkMode] = useState(() => readStorage(storageKeys.theme, 'light') === 'dark');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTransactions = async () => {
      const storedTransactions = readStorage(storageKeys.transactions, []);
      if (storedTransactions.length) {
        setTransactions(storedTransactions);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchTransactions();
        if (isMounted) {
          setTransactions(response);
        }
      } catch (error) {
        if (isMounted) {
          setTransactions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTransactions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
    writeStorage(storageKeys.theme, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => writeStorage(storageKeys.role, role), [role]);
  useEffect(() => writeStorage(storageKeys.search, searchTerm), [searchTerm]);
  useEffect(() => writeStorage(storageKeys.category, categoryFilter), [categoryFilter]);
  useEffect(() => writeStorage(storageKeys.type, typeFilter), [typeFilter]);
  useEffect(() => writeStorage(storageKeys.groupBy, groupBy), [groupBy]);
  useEffect(() => {
    if (!isLoading) {
      writeStorage(storageKeys.transactions, transactions);
    }
  }, [transactions, isLoading]);

  const categories = useMemo(() => ['All', ...new Set(transactions.map((item) => item.category))], [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        !query ||
        transaction.category.toLowerCase().includes(query) ||
        transaction.type.toLowerCase().includes(query) ||
        transaction.date.toLowerCase().includes(query) ||
        String(transaction.amount).includes(query);
      const matchesCategory = categoryFilter === 'All' || transaction.category === categoryFilter;
      const matchesType = typeFilter === 'All' || transaction.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, searchTerm, categoryFilter, typeFilter]);

  const groupedTransactions = useMemo(() => {
    if (groupBy === 'None') {
      return { All: filteredTransactions };
    }

    return filteredTransactions.reduce((accumulator, transaction) => {
      const key =
        groupBy === 'Category'
          ? transaction.category
          : groupBy === 'Type'
            ? transaction.type
            : formatMonth(transaction.date);
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(transaction);
      return accumulator;
    }, {});
  }, [filteredTransactions, groupBy]);

  const metrics = useMemo(() => {
    const income = transactions.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;

    const spendingByCategory = transactions
      .filter((item) => item.type === 'Expense')
      .reduce((accumulator, item) => {
        accumulator[item.category] = (accumulator[item.category] || 0) + item.amount;
        return accumulator;
      }, {});

    const highestSpendingCategory = Object.entries(spendingByCategory).sort((left, right) => right[1] - left[1])[0] || ['N/A', 0];

    const categoryChartData = Object.entries(spendingByCategory).map(([name, value]) => ({ name, value }));

    return { income, expenses, balance, savingsRate, highestSpendingCategory, categoryChartData };
  }, [transactions]);

  const totalTransactions = filteredTransactions.length;
  const isAdmin = role === 'Admin';

  const handleAddTransaction = () => {
    if (!isAdmin) {
      return;
    }

    const sampleCategories = ['Food', 'Transport', 'Entertainment', 'Freelance', 'Utilities'];
    const randomCategory = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
    const randomType = randomCategory === 'Freelance' ? 'Income' : 'Expense';
    const randomAmount = randomType === 'Income' ? 450 + Math.floor(Math.random() * 650) : 45 + Math.floor(Math.random() * 260);

    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      category: randomCategory,
      type: randomType,
      amount: randomAmount,
    };

    setTransactions((currentTransactions) => [newTransaction, ...currentTransactions]);
  };

  const handleExportJson = () => {
    const payload = JSON.stringify(filteredTransactions, null, 2);
    downloadFile(payload, 'transactions.json', 'application/json');
  };

  const handleExportCsv = () => {
    const header = ['Date', 'Category', 'Type', 'Amount'];
    const rows = filteredTransactions.map((transaction) => [
      transaction.date,
      transaction.category,
      transaction.type,
      transaction.amount,
    ]);
    const csvText = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    downloadFile(csvText, 'transactions.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white/90 px-4 py-5 shadow-sm backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/95 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
                <Wallet size={22} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Finance</p>
                <h1 className="text-lg font-extrabold tracking-tight">Dashboard</h1>
              </div>
            </div>
            <button className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden">
              <Menu size={20} />
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Role</p>
                <p className="text-lg font-semibold">{role}</p>
              </div>
              <button
                onClick={() => setRole((currentRole) => (currentRole === 'Admin' ? 'Viewer' : 'Admin'))}
                className={`relative inline-flex h-10 w-20 items-center rounded-full p-1 transition ${
                  isAdmin ? 'bg-brand-600' : 'bg-slate-300'
                }`}
                aria-label="Toggle role"
              >
                <span
                  className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 shadow transition ${
                    isAdmin ? 'translate-x-10' : 'translate-x-0'
                  }`}
                >
                  {role === 'Admin' ? 'A' : 'V'}
                </span>
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Admins can add and edit transactions. Viewers can explore insights and data without write actions.
            </p>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {[
              { label: 'Overview', icon: LayoutDashboard, active: true },
              { label: 'Analytics', icon: BarChart3 },
              { label: 'Savings', icon: Sparkles },
              { label: 'Settings', icon: Settings },
            ].map((item) => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  item.active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-white shadow-soft">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} />
              <div>
                <p className="text-sm font-semibold">Role-based access</p>
                <p className="text-xs text-slate-300">Actions update instantly</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Welcome back</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Financial Overview</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button
                  onClick={handleAddTransaction}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  <CirclePlus size={18} />
                  Add Transaction
                </button>
              )}
              <button
                onClick={() => setIsDarkMode((currentMode) => !currentMode)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <Download size={16} />
                CSV
              </button>
              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <Download size={16} />
                JSON
              </button>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-soft transition-colors dark:bg-slate-900">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{role}</p>
              </div>
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard title="Total Balance" value={formatCurrency(metrics.balance)} tone="brand" icon={Wallet} />
            <SummaryCard title="Income" value={formatCurrency(metrics.income)} tone="emerald" icon={ArrowUpRight} />
            <SummaryCard title="Expenses" value={formatCurrency(metrics.expenses)} tone="rose" icon={ArrowDownRight} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="animate-fade-in rounded-3xl bg-white p-5 shadow-soft transition-colors dark:bg-slate-900 xl:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Balance Trend</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Monthly net balance movement</p>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="dodgerblue" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="dodgerblue" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke={isDarkMode ? 'slategray' : 'lightgray'} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="balance" stroke="dodgerblue" strokeWidth={3} fill="url(#balanceFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="animate-fade-in rounded-3xl bg-white p-5 shadow-soft transition-colors dark:bg-slate-900">
              <div className="mb-5">
                <h3 className="text-lg font-semibold">Spending by Category</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Expense distribution</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.categoryChartData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                      {metrics.categoryChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" height={30} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-soft transition-colors dark:bg-slate-900 xl:col-span-2">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Transactions</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Showing {totalTransactions} matching records</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search transactions"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-800"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-800"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                  <div className="relative">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-800"
                    >
                      {['All', 'Income', 'Expense'].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                  <div className="relative">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      value={groupBy}
                      onChange={(event) => setGroupBy(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-800"
                    >
                      {['None', 'Category', 'Type', 'Month'].map((option) => (
                        <option key={option} value={option}>
                          Group: {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                  Loading transactions from mock API...
                </div>
              ) : totalTransactions === 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                  No transactions match your current filters.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {Object.entries(groupedTransactions).map(([groupName, transactionGroup]) => (
                    <div key={groupName} className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                      {groupBy !== 'None' && (
                        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {groupName}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Category</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">Amount</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white text-sm dark:divide-slate-800 dark:bg-slate-900">
                            {transactionGroup.map((transaction) => (
                              <tr key={transaction.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/70">
                                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(transaction.date)}</td>
                                <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{transaction.category}</td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                      transaction.type === 'Income' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                    }`}
                                  >
                                    {transaction.type}
                                  </span>
                                </td>
                                <td className={`px-4 py-4 font-semibold ${transaction.type === 'Income' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                                  {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <button
                                    disabled={!isAdmin}
                                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                                      isAdmin
                                        ? 'text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/20'
                                        : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                                    }`}
                                  >
                                    <Edit3 size={16} />
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-5 shadow-soft transition-colors dark:bg-slate-900">
                <h3 className="text-lg font-semibold">Insights</h3>
                <div className="mt-4 space-y-4">
                  <InsightItem
                    label="Highest Spending Category"
                    value={`${metrics.highestSpendingCategory[0]} (${formatCurrency(metrics.highestSpendingCategory[1])})`}
                  />
                  <InsightItem label="Monthly Savings Rate" value={`${metrics.savingsRate.toFixed(1)}%`} />
                </div>
              </div>

              <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-soft">
                <h3 className="text-lg font-semibold">Quick Snapshot</h3>
                <div className="mt-4 grid gap-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>Transactions</span>
                    <strong>{transactions.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>Visible Records</span>
                    <strong>{filteredTransactions.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>Mode</span>
                    <strong>{role}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, tone, icon: Icon }) {
  const tones = {
    brand: 'from-brand-50 to-white text-brand-700 dark:from-brand-600/20 dark:to-slate-900 dark:text-brand-200',
    emerald: 'from-emerald-50 to-white text-emerald-700 dark:from-emerald-900/20 dark:to-slate-900 dark:text-emerald-200',
    rose: 'from-rose-50 to-white text-rose-700 dark:from-rose-900/20 dark:to-slate-900 dark:text-rose-200',
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 dark:bg-slate-900">
      <div className={`rounded-2xl bg-gradient-to-br p-4 ${tones[tone]}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-slate-800">
            <Icon size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function readStorage(key, fallback) {
  try {
    if (typeof window === 'undefined') {
      return fallback;
    }
    const savedValue = window.localStorage.getItem(key);
    if (savedValue === null) {
      return fallback;
    }
    return JSON.parse(savedValue);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // no-op storage fallback
  }
}

function downloadFile(content, fileName, contentType) {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateValue));
}

function formatMonth(dateValue) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue));
}

export default App;
