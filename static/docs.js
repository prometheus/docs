// Use CSS to hide elements without a delay during page load.
$('head').append('<style type="text/css"> \
  .side-nav ul { display: none; } \
  .side-nav ul.active { display: block; } \
</style>');

$(document).ready(function() {
  var navToggle = function(event) {
    event.preventDefault();

    var visible = $(this).closest('li').children('ul.nav').is(':visible');
    $(this).closest('ul').find('ul.nav').slideUp(200);
    if (!visible) {
      $(this).closest('li').children('ul.nav').slideDown(200);
    }
  };

  $('.nav-header span').each(function() {
    var link = $('<a href="#">').text($(this).text()).click(navToggle);
    $(this).replaceWith(link);
  });
});
