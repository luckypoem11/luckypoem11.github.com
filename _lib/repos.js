// Dependencies
// ------------

var
  fs    = require('fs'),
  https = require('https');

// Constants
// ---------

var
  ORIGIN_PATH       = 'http://neocotic.com',
  MENU_FILE         = 'ajax/repos.json',
  SITEMAP_HTML_FILE = '_includes/repos.html',
  SITEMAP_XML_FILE  = '_includes/repos.xml',
  USERNAME          = 'neocotic';

// Helper functions
// ----------------

// Apply left padding of zero characters to the given `value` to ensure
// consistent sizes.
function pad(value, size) {
  size  = size || 2;
  value = String(value);
  while (value.length < size) value = '0' + value;
  return value;
}

// Parse the timezone offset to appear consistently and with the correct prefix
// (plus/minus).
function parseTimezoneOffset(date) {
  var
    offset = date.getTimezoneOffset(),
    parsed = String(pad(Math.floor(Math.abs(offset) / 60) * 100 +
                        Math.abs(offset) % 60, 4));
  parsed = parsed.slice(0, 2) + ':' + parsed.slice(2);
  return ((offset > 0) ? '-' : '+') + parsed;
}

// Write repositories to files.
function writeRepos(repos) {
  writeReposForMenu(repos);
  writeReposForSitemaps(repos);
}

// Write repositories to file as JSON for projects menu.
function writeReposForMenu(repos) {
  fs.writeFile(MENU_FILE, JSON.stringify(repos), function (err) {
    if (err) throw err;
    console.log('Repositories menu updated!');
  });
}

// Write repositories to files for the sitemaps (HTML and XML).
function writeReposForSitemaps(repos) {
  var
    date    = new Date(),
    html    = '',
    isoDate = date.toISOString(),
    xml     = '';
  isoDate = isoDate.substring(0, 19) + parseTimezoneOffset(date);
  for (var i = 0; i < repos.length; i++) {
    // Build HTML for repository link.
    if (html) html += '\n';
    html += '<li>';
    html += '<a href="/' + repos[i] + '">' + repos[i] + '</a>';
    html += '</li>';
    // Build XML for repository entry.
    if (xml) xml += '\n';
    xml += '<url>';
    xml += '\n  <loc>' + ORIGIN_PATH + '/' + repos[i] + '</loc>';
    xml += '\n  <lastmod>' + isoDate + '</lastmod>';
    xml += '\n  <changefreq>weekly</changefreq>';
    xml += '\n  <priority>0.6</priority>';
    xml += '\n</url>';
  }
  fs.writeFile(SITEMAP_HTML_FILE, html, function (err) {
    if (err) throw err;
    console.log('Repositories HTML sitemap updated!');
  });
  fs.writeFile(SITEMAP_XML_FILE, xml, function (err) {
    if (err) throw err;
    console.log('Repositories XML sitemap updated!');
  });
}

// Process
// -------

// Request JSON for repos from GitHub's API
var req = https.request({
  host: 'api.github.com',
  path: '/users/' + USERNAME + '/repos'
}, function (res) {
  var
    data  = '',
    repos = [];
  res.on('data', function (pkg) {
    data += pkg;
    try {
      // Try to parse JSON, but more data packages may be required.
      data = JSON.parse(data.toString());
      // Ensure array was parsed.
      if (data && data.length) {
        // Sort repos alphabetically based on their names.
        data.sort(function (a, b) {
          a = a.name.toLowerCase();
          b = b.name.toLowerCase();
          if (a === b) return 0;
          return (a < b) ? -1 : 1;
        });
        for (var i = 0; i < data.length; i++) {
          // Filter repos to remove pages and forked repos.
          if (data[i].name !== USERNAME + '.github.com' &&
              data[i].name !== 'gh-pages' &&
             !data[i].fork) {
            repos.push(data[i].name);
          }
        }
      }
      writeRepos(repos);
    } catch (e) {}
  });
}).on('error', function () {
  writeRepos([]);
});
req.end();