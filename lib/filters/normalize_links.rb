# encoding: utf-8

require 'nokogiri'
require 'uri'

class NormalizeLinks < ::Nanoc::Filter
  identifier :normalize_links

  DOMAIN = 'https://prometheus.io'

  def run(content, config = {})
    doc = Nokogiri::HTML(content)

    doc.xpath('//a').each do |link|
      link['href'] =
        case
        when link['href'].start_with?(DOMAIN)
          link['href'][DOMAIN.size..-1]
        when link['href'].start_with?('/')
          # TODO(ts): It's not guaranteed that a repository is hosted on Github.
          github_link_to(link['href'], config)
        when link['href'].include?('.md') && !URI.parse(link['href']).absolute?
          relative_link_to(link['href'])
        else
          link['href']
        end
    end

    doc.xpath('//img').each do |img|
      next if img['src'].start_with?('/') || img['src'].start_with?('http')
      img['src'] = File.join("../", img['src'])
    end

    doc.to_s
  end

  def github_link_to(file, config)
    base = config[:repository_url].delete_suffix('.git')
    File.join(base, 'blob', config[:refspec], file)
  end

  def relative_link_to(link)
    # All nanoc pages end on a trailing slash.
    File.join("../", link.gsub(/\.md($|#)/, '/\\1'))
  end
end
