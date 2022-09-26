var express = require('express');
var router = express.Router();

/* POST webhook listing. */
router.post('/', function(req, res, next) {
  console.log(req, res);
});
router.get('/', function(req, res, next) {
  res.render('index1');
});

module.exports = router;
