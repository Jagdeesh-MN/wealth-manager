import { useState } from 'react';
import './index.css';
import { Layout } from './components/Layout';
import { PasswordGate } from './components/PasswordGate';
import { USAccounts } from './pages/USAccounts';
import { IndiaInvestments } from './pages/IndiaInvestments';
import { Consolidated } from './pages/Consolidated';
import { IncomeExpenses } from './pages/IncomeExpenses';
import useStore from './hooks/useStore';
import { useDarkMode } from './hooks/useDarkMode';

type Page = 'us' | 'india' | 'consolidated' | 'income';

function App() {
  const [page, setPage] = useState<Page>('us');
  const { dark, toggle } = useDarkMode();
  const {
    state,
    activeSnapshot,
    updateSnapshot,
    createSnapshot,
    deleteSnapshot,
    setActiveSnapshot,
  } = useStore();

  if (state === null || activeSnapshot === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <PasswordGate>
      <Layout
        currentPage={page}
        onNavigate={setPage}
        snapshots={state.snapshots}
        activeSnapshot={activeSnapshot}
        onCreateSnapshot={createSnapshot}
        onDeleteSnapshot={deleteSnapshot}
        onSelectSnapshot={setActiveSnapshot}
        dark={dark}
        onToggleDark={toggle}
      >
        {page === 'us' && (
          <USAccounts
            snapshot={activeSnapshot}
            allSnapshots={state.snapshots}
            onUpdate={updateSnapshot}
          />
        )}
        {page === 'india' && (
          <IndiaInvestments
            snapshot={activeSnapshot}
            allSnapshots={state.snapshots}
            onUpdate={updateSnapshot}
          />
        )}
        {page === 'consolidated' && (
          <Consolidated
            snapshot={activeSnapshot}
            allSnapshots={state.snapshots}
            onUpdate={updateSnapshot}
          />
        )}
        {page === 'income' && (
          <IncomeExpenses
            snapshot={activeSnapshot}
            allSnapshots={state.snapshots}
            onUpdate={updateSnapshot}
          />
        )}
      </Layout>
    </PasswordGate>
  );
}

export default App;
