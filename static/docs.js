// Use CSS to hide elements without a delay during page load.
$('head').append('<style type="text/css"> \
  .side-nav ul, .side-nav div { display: none; } \
  .side-nav ul.active, .side-nav div.active { display: block; } \
</style>');

$(document).ready(function() {
  var navToggle = function(event) {
    event.preventDefault();

    var visible = $(this).closest('li').children('ul.nav').is(':visible');
    $(this).closest('ul').find('ul.nav, div').slideUp(200);
    if (!visible) {
      $(this).closest('li').children('ul.nav, div').slideDown(200);
    }
  };

  $('.nav-header span,.nav-subheader').each(function() {
    var link = $('<a href="#">').text($(this).text()).click(navToggle);
    $(this).replaceWith(link);
  });

  $(".side-nav select").change(function() {
    window.location.href = $(this).val();
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
    var osGroup = $('.download-selection .os li:contains("' + os + '")').data("group");
    var arch = $('.download-selection .arch .caption').text();

    $('.downloads tbody tr').each(function() {
      var isPopularArch = arch === 'popular';
      var rowOS = $(this).data('os').toString();
      var rowArch = $(this).data('arch').toString();

      var osMatch = selected(rowOS, os, osGroup !== undefined ? osGroup.split(' ') : []);
      var archMatch = selected(rowArch, arch, []);

      if (osMatch && isPopularArch && (rowArch === 'amd64' || (rowOS === 'darwin' && rowArch === 'arm64'))) {
        $(this).show();
      } else if (osMatch && archMatch) {
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
