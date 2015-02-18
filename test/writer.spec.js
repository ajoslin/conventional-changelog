describe('Writer', function() {
  var dateFormat = require('dateformat');
  var es = require('event-stream');
  var writer = require('../lib/writer');

  var log = '';

  function concat(str) {
    log += str;
  }

  function lines() {
    return log.split('\n').filter(function(line) {
      return line.length;
    });
  }

  function setup() {
    log = '';
    var stream = es.through(concat, concat.bind(null, 'END'));
    return new writer.Writer(stream, {
      subtitle: 'subby',
      repository: 'github.com/user/repo',
      issueLink: function(id) {
        return id;
      },
      commitLink: function(hash) {
        return hash;
      }
    });
  }

  describe('#header', function() {
    it('should contain major version', function() {
      var writer = setup();
      writer.header('1.1.0');
      expect(log).to.contain('## 1.1.0 subby');
    });
    it('should contain minor version', function() {
      var writer = setup();
      writer.header('0.1.0');
      expect(log).to.contain('## 0.1.0 subby');
    });
    it('should contain patch version', function() {
      var writer = setup();
      writer.header('0.0.3');
      expect(log).to.contain('### 0.0.3 subby');
    });
    it('should contain current date', function() {
      var now = new Date();
      var currentDate = dateFormat(now, 'yyyy-mm-dd');
      var writer = setup();
      writer.header('1.0.3');
      expect(log).to.contain(currentDate);
    });
  });

  describe('#section', function() {
    it('should do nothing if no components in section', function() {
      var writer = setup();
      writer.section('title', {});
      expect(log.length).to.equal(0);
    });
    it('should make a log out of components', function() {
      var writer = setup();
      var section = {
        foo: [{
          subject: 'added foo-ability',
          hash: '0',
          closes: ['1']
        }, {
          subject: 'made room for bam',
          hash: '2',
          closes: []
        }, ],
        bam: [{
          subject: 'removed bar and baz',
          hash: '3',
          closes: []
        }]
      };
      writer.section('Additions', section);
      expect(lines()[0]).to.equal('#### Additions');
      expect(lines()[1]).to.equal('* **bam:** removed bar and baz (3)');
      expect(lines()[2]).to.equal('* **foo:**');
      expect(lines()[3]).to.equal('  * added foo-ability (0, closes 1)');
      expect(lines()[4]).to.equal('  * made room for bam (2)');
    });
  });

  describe('#end', function() {
    it('should equal "END"', function() {
      var writer = setup();
      writer.end();
      expect(log).to.equal('END');
    });
  });
});
