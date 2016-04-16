# All files in the 'lib' directory will be loaded
# before nanoc starts compiling.

require 'nanoc/cachebuster'

include Nanoc::Helpers::LinkTo
include Nanoc::Helpers::Rendering
include Nanoc3::Helpers::Blogging
include Nanoc3::Helpers::Tagging
include Nanoc::Helpers::CacheBusting

module BlogHelper
  def get_pretty_date(post)
    attribute_to_time(post[:created_at]).strftime('%B %-d, %Y')
  end

  def get_post_start(post)
    content = post.compiled_content
    if content =~ /\s<!-- more -->\s/
      content = content.partition('<!-- more -->').first +
      "<div class='read-more'><a class='btn btn-primary' href='#{post.path}'>Continue reading &raquo;</a></div>"
    end
    return content
  end
end
include BlogHelper

module DownloadHelper
  def format_bytes(bytes)
    '%.2f MiB' % (bytes.to_f / 1024 / 1024)
  end

  def dropdown(name, items)
    caption = %(<span class="caption">all</span> <span class="caret"></span>)
    button = %(<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">#{caption}</button>)
    default = %(<li><a href="#">all</a></li><li><a href="#">popular</a></li><li role="separator" class="divider"></li>)
    list = %(<ul class="dropdown-menu">#{default} #{items.map { |i| %(<li><a href="#">#{i}</a></li>) }.join('') }</ul>)

    %(<div class="btn-group #{name}">#{button} #{list}</div>)
  end
end
include DownloadHelper


