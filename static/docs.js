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

  var selected = function(value, want, group) {
    switch(want) {
    case 'all':
      return true;
    default:
      if (group.length > 0) {
        return group.indexOf(value) > -1;
      }
      return value === want;
    }
  }
  var selectDownloads = function() {
    var os = $('.download-selection .os .caption').text();
    var osGroup = $('.download-selection .os li:contains("'+os+'")').data("group");
    var arch = $('.download-selection .arch .caption').text();

    $('.downloads tbody tr').each(function() {
      if (selected($(this).data('os').toString(), os, osGroup !== undefined ? osGroup.split(' ') : [])
          && selected($(this).data('arch').toString(), arch, [])) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  };

  selectDownloads();

  $('.download-selection a').on('click', function(event) {
    event.preventDefault();

    $(this).parents('.btn-group').find('button .caption').text($(this).text());
    selectDownloads();
  });
});
