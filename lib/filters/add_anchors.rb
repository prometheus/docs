# encoding: utf-8

require 'nokogiri'

class AddAnchorsFilter < ::Nanoc::Filter

  identifier :add_anchors

  def run(content, params={})
    # `#dup` is necessary because `.fragment` modifies the incoming string. Ew!
    # See https://github.com/sparklemotion/nokogiri/issues/1077
    doc = Nokogiri::HTML::DocumentFragment.parse(content.dup)
    doc.css('h1,h2,h3,h4,h5,h6').each do |h_node|
      next if h_node['id'].nil?
      node = Nokogiri::XML::Node.new('a', doc).tap do |a|
        a.content = ''
        a['class'] = 'header-anchor'
        a['href'] = '#' + h_node['id']
      end
      h_node.add_child(node)
    end
    doc.to_s
  end

end
