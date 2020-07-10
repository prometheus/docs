# encoding: utf-8

require 'nokogiri'

class Bootstrappify < ::Nanoc::Filter

  identifier :bootstrappify

  def run(content, params={})
    # `#dup` is necessary because `.fragment` modifies the incoming string. Ew!
    # See https://github.com/sparklemotion/nokogiri/issues/1077
    doc = Nokogiri::HTML::DocumentFragment.parse(content.dup)
    doc.css('h1').each do |h1|
      h1['class'] = 'page-header'
    end
    doc.css('table').each do |table_node|
      next if table_node['class'] && table_node['class'] =~ /table/
      table_node['class'] = (table_node['class'] || '') + ' table table-bordered'
    end
    doc.to_s
  end

end
