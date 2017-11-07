# encoding: utf-8

require 'nokogiri'

class OutdatedContent < ::Nanoc::Filter
  identifier :outdated_content

  def run(content, params = {})
    doc = Nokogiri::HTML(content)
    # TODO(ts): We need to link to the same page or the first child without hardcoding /getting_started/.
    warning = %(<p>CAUTION: This page documents an old version of Prometheus.
      Check out the <a href="#{params[:outdated]}getting_started/">latest version</a>.</p>)

    body = doc.css('body')
    if first = body.children.first
      first.add_previous_sibling(warning)
    else
      body << Nokogiri::HTML::DocumentFragment.parse(warning)
    end

    doc.to_s
  end
end
