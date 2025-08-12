

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

const ghClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
});


async function ghGet(path, params = {}) {
  const res = await ghClient.get(path, { params });
  return res.data;
}


app.get('/api/analyze', async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Please provide owner and repo query params.' });
  }

  try {
    
    const repoData = await ghGet(`/repos/${owner}/${repo}`);

    
    const languages = await ghGet(`/repos/${owner}/${repo}/languages`);

    
    const contributors = await ghGet(`/repos/${owner}/${repo}/contributors`, { per_page: 10 });

    
    const commits = await ghGet(`/repos/${owner}/${repo}/commits`, { per_page: 1, sha: repoData.default_branch });
    const lastCommit = commits[0] || null;

    
    const summary = {
      full_name: repoData.full_name,
      description: repoData.description,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      open_issues_count: repoData.open_issues_count,
      default_branch: repoData.default_branch,
      license: repoData.license ? repoData.license.spdx_id : null,
      created_at: repoData.created_at,
      pushed_at: repoData.pushed_at,
      html_url: repoData.html_url
    };

    
    const totalBytes = Object.values(languages).reduce((s, v) => s + v, 0);
    const languageBreakdown = Object.entries(languages).map(([name, bytes]) => ({
      name,
      bytes,
      percent: totalBytes ? Math.round((bytes / totalBytes) * 1000) / 10 : 0 
    }));

    
    const topContributors = contributors.map(c => ({
      login: c.login,
      contributions: c.contributions,
      avatar: c.avatar_url,
      html_url: c.html_url
    }));

    
    const weeksSincePush = Math.max(0, Math.floor((Date.now() - new Date(repoData.pushed_at)) / (1000 * 60 * 60 * 24)));
    const activity = weeksSincePush < 30 ? 'active' : weeksSincePush < 365 ? 'moderately active' : 'low activity';

    const result = {
      summary,
      languageBreakdown,
      topContributors,
      lastCommit: lastCommit ? {
        sha: lastCommit.sha,
        message: lastCommit.commit.message,
        author: lastCommit.commit.author,
        url: lastCommit.html_url,
        date: lastCommit.commit.author.date
      } : null,
      analysis: {
        totalLanguages: Object.keys(languages).length,
        totalContributorsFetched: topContributors.length,
        activity,
      }
    };

    return res.json(result);
  } catch (err) {
    console.error(err.response?.status, err.response?.data || err.message);
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to fetch data from GitHub';
    return res.status(status).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Repo Analyzer backend running on http://localhost:${PORT}`);
});
