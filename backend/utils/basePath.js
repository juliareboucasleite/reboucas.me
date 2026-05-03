function getBasePath() {
  const raw = (process.env.BASE_PATH || '').trim();

  if (!raw || raw === '/') return '';

  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

function withBasePath(pathname = '/') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${getBasePath()}${normalizedPath}`;
}

module.exports = {
  getBasePath,
  withBasePath,
};
