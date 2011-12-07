// Dependencies
// ------------

var
  fs    = require('fs'),
  https = require('https');

// Constants
// ---------

var
  JSON_FILE = process.argv[2] || 'ajax/repos.json',
  USERNAME  = 'neocotic';

// Helper functions
// ----------------

// Write repositories to file as JSON.
function writeRepos(repos) {
  fs.writeFile(JSON_FILE, JSON.stringify(repos), function (err) {
    if (err) throw err;
    console.log('Repositories updated!');
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
          if (data[i].name !== USERNAME + '.github.com' && !data[i].fork) {
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