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

  var selected = function(value, want, popular) {
    switch(want) {
    case 'all':
      return true;
    case 'popular':
      return popular.indexOf(value) > -1;
    default:
      return value === want;
    }
  }
  var selectDownloads = function() {
    var os = $('.download-selection .os .caption').text();
    var arch = $('.download-selection .arch .caption').text();

    $('.downloads tbody tr').each(function() {
      if (selected($(this).data('os').toString(), os, ['darwin', 'linux'])
          && selected($(this).data('arch').toString(), arch, ['386', 'amd64'])) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  };

  $('.download-selection button .caption').text('popular');
  selectDownloads();

  $('.download-selection a').on('click', function() {
    event.preventDefault();

    $(this).parents('.btn-group').find('button .caption').text($(this).text());
    selectDownloads();
  });
});
