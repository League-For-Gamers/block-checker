$(document).ready(function() {
  var nameInput = $('.js-name-input');
  var submitButton = $('.js-submit-btn');
  var results = $('.js-results');

  submitButton.click(function(e) {
    e.preventDefault();
    var name = nameInput.val().trim();
    if (name.length) {
      $.get('/user/' + name, function(data) {
        results.html(data);
      });
    }
  });
});