# encoding: utf-8

require 'nokogiri'

class ConfigLinker < ::Nanoc::Filter
  identifier :config_linker

  def run(content, _params = {})
    doc = Nokogiri::HTML(content)
    definitions = types(doc.xpath('//code'))
    configs = doc.xpath('//pre//code')

    configs.each do |config|
      definitions.each do |text, html|
        config.inner_html = config.inner_html.gsub(html, %(<a href="##{text}">#{html}</a>))
      end
    end

    doc.to_s
  end

  # types returns a dictionary of all type definitions and their HTML representation.
  def types(codes)
    # Select all placeholders.
    elements = codes.select do |code|
      code.children.size == 1 && code.text =~ /\A<[^>]+>\Z/
    end

    # Initialize dictionary with placeholders which are headers, as these are already linked.
    dict = elements.each_with_object({}) do |e, memo|
      if e.parent.attr('id') == e.text
        memo[e.text] = e.inner_html
      end
    end

    # Create anchors for the remaining placeholders.
    elements.each_with_object(dict) do |e, memo|
      unless memo.include?(e.text)
        e['id'] = e.text
        memo[e.text] = e.inner_html
      end
    end

    dict
  end
end
