# encoding: utf-8

require 'nokogiri'

class TocFilter < ::Nanoc::Filter
  identifier :toc

  # Number of items required to render a table of contents.
  TOC_MINIMUM = 2

  def run(content, params={})
    doc = Nokogiri::HTML(content)
    titles = doc.xpath('//h1')
    headers = doc.xpath('//h2|//h3')

    if titles.empty? || headers.length < TOC_MINIMUM
      return content
    end

    style = params[:style] || 'right'
    items = headers.map do |header|
      title = header.inner_html.sub(/^(.*)<a .*$/, '\1')
      { :level => header.name, :title => title, :id => header['id'] }
    end

    titles.first.after(%(<div class="toc toc-#{style}">#{toc(items)}</div>))
    doc.to_s
  end

  def toc(items)
    return '' if items.empty?

    level = ''
    table = []
    items.each do |item|
      if item[:level] > level
        table << '<ul>'
      elsif item[:level] < level
        table << '</ul>'
      end
      level = item[:level]

      table << %(<li><a href="##{item[:id]}">#{item[:title]}</a></li>)
    end
    table << '</ul>'

    table.join('')
  end
end
