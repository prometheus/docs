# encoding: utf-8

require 'nokogiri'

class ConfigLinker < ::Nanoc::Filter
  identifier :config_linker

  def run(content, _params = {})
    doc = Nokogiri::HTML(content)
    definitions = types(doc.xpath('//code'))
    configs = doc.xpath('//pre//code')

    configs.each do |config|
      definitions.each do |anchor, html|
        config.inner_html = config.inner_html.gsub(html, %(<a href="##{anchor}">#{html}</a>))
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
      anchor = generate_anchor(e.text)

      if e.parent.attr('id') == anchor
        memo[anchor] = e.inner_html
      end
    end

    # Create anchors for the remaining placeholders.
    elements.each_with_object(dict) do |e, memo|
      anchor = generate_anchor(e.text)

      unless memo.include?(anchor)
        e['id'] = anchor
        memo[anchor] = e.inner_html
      end
    end

    dict
  end

  # Replace sequences of non-word characters with single dashes. Remove
  # extra dashes at the beginning or end.
  def generate_anchor(text)
    text.gsub(/\W+/, '-').gsub(/^-+|-+$/, '')
  end
end
