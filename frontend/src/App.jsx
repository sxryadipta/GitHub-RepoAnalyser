import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';



function useInput(initial = '') {
  const [v, setV] = useState(initial);
  return { value: v, onChange: e => setV(e.target.value) }; 


function Badge({ children }) {
  return <span style={{
    display: 'inline-block',
    background: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: 12,
    marginRight: 8,
    fontSize: 12
  }}>{children}</span>;
}

export default function App() {
  const owner = useInput('');
  const repo = useInput('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

  async function analyze(e) {
    e?.preventDefault();
    setError(null);
    setData(null);

    if (!owner.value || !repo.value) return setError('enter owner and repo');

    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/analyze?owner=${encodeURIComponent(owner.value)}&repo=${encodeURIComponent(repo.value)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, Arial, sans-serif', padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>GitHub Repo Analyzer — MVP</h1>

      <form onSubmit={analyze} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="owner (e.g. facebook)" {...owner} style={{ padding: 8, flex: 1 }} />
        <input placeholder="repo (e.g. react)" {...repo} style={{ padding: 8, flex: 1 }} />
        <button type="submit" style={{ padding: '8px 12px' }} disabled={loading}>
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      <div style={{ color: 'red', minHeight: 18 }}>{error}</div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginTop: 16 }}>
          <div>
            <section style={{ padding: 12, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 8px' }}>{data.summary.full_name}</h2>
              <p style={{ marginTop: 0 }}>{data.summary.description}</p>
              <div style={{ marginTop: 8 }}>
                <Badge>⭐ {data.summary.stars}</Badge>
                <Badge>🍴 {data.summary.forks}</Badge>
                <Badge>👀 {data.summary.watchers}</Badge>
                <Badge>Issues: {data.summary.open_issues_count}</Badge>
              </div>
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <div>License: {data.summary.license || '—'}</div>
                <div>Default branch: {data.summary.default_branch}</div>
                <div>Last pushed: {new Date(data.summary.pushed_at).toLocaleString()}</div>
                <a href={data.summary.html_url} target="_blank" rel="noreferrer">Open on GitHub</a>
              </div>
            </section>

            <section style={{ marginTop: 12, padding: 12, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Language Breakdown</h3>
              {data.languageBreakdown.length === 0 ? <div>None</div> : (
                <ul>
                  {data.languageBreakdown.map(l => (
                    <li key={l.name}>
                      {l.name}: {l.percent}% ({l.bytes} bytes)
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ marginTop: 12, padding: 12, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Last Commit</h3>
              {data.lastCommit ? (
                <>
                  <div><strong>{data.lastCommit.commit.message}</strong></div>
                  <div style={{ fontSize: 13, color: '#555' }}>
                    by {data.lastCommit.commit.author.name} on {new Date(data.lastCommit.date).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <a href={data.lastCommit.url} target="_blank" rel="noreferrer">View commit</a>
                  </div>
                </>
              ) : <div>No commits found</div>}
            </section>
          </div>

          <aside>
            <section style={{ padding: 12, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Top Contributors (sample)</h3>
              {data.topContributors.length === 0 ? <div>None</div> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {data.topContributors.map(c => (
                    <li key={c.login} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <img src={c.avatar} alt={c.login} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                      <div>
                        <div><a href={c.html_url} target="_blank" rel="noreferrer">{c.login}</a></div>
                        <div style={{ fontSize: 12, color: '#666' }}>{c.contributions} contributions</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ marginTop: 12, padding: 12, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Quick Analysis</h3>
              <div>Total languages: {data.analysis.totalLanguages}</div>
              <div>Contributors fetched: {data.analysis.totalContributorsFetched}</div>
              <div>Activity: {data.analysis.activity}</div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
}


const container = document.getElementById('root');
createRoot(container).render(<App />);
