# encoding: utf-8

require 'nokogiri'

class NormalizeLinks < ::Nanoc::Filter
  identifier :normalize_links

  DOMAIN = 'https://prometheus.io'

  def run(content, config = {})
    doc = Nokogiri::HTML(content)
    links = doc.xpath('//a')

    links.each do |link|
      link['href'] =
        case
        when link['href'].start_with?(DOMAIN)
          link['href'][DOMAIN.size..-1]
        when link['href'].start_with?('/')
          link_to(link['href'], config)
        when link['href'].include?('.md')
          link['href'].gsub(/\.md($|#)/, '/\\1')
        else
          link['href']
        end
    end

    doc.to_s
  end

  # TODO(ts): It's not guaranteed that a repository is hosted on Github.
  def link_to(file, config)
    base = config[:repository]
    if base.end_with?('.git')
      base = base[0..-5]
    end
    File.join(base, 'blob', config[:refspec], file)
  end
end
