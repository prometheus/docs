# encoding: utf-8

require 'nokogiri'

class AddAnchorsFilter < ::Nanoc::Filter

  identifier :add_anchors

  def run(content, params={})
    anchors = {}
    # `#dup` is necessary because `.fragment` modifies the incoming string. Ew!
    # See https://github.com/sparklemotion/nokogiri/issues/1077
    doc = Nokogiri::HTML::DocumentFragment.parse(content.dup)
    doc.css('h1,h2,h3,h4,h5,h6').each do |h_node|
      next if h_node['id'].nil?
      node = Nokogiri::XML::DocumentFragment.parse("<a></a>").at_css("a").tap do |a|
        a.content = ''
        a['class'] = 'header-anchor'

        # Replace sequences of non-word characters with single dashes. Remove
        # extra dashes at the beginning or end.
        anchor = h_node['id'].gsub(/\W+/, '-').gsub(/^-+|-+$/, '')

        i = 0
        unique_anchor = anchor
        while anchors[unique_anchor] do
          unique_anchor = "#{anchor}-#{i}"
          i += 1
        end
        anchor = unique_anchor

        anchors[anchor] = true
        a['href'] = '#' + anchor
        a['name'] = anchor
      end
      h_node.add_child(node)
    end
    doc.to_s
  end

end
